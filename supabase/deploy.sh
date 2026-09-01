#!/usr/bin/env bash
#
# One-shot deploy for the mailing-list welcome email.
#
# Sets the Edge Function secrets, deploys the function, applies the migration,
# and stores the endpoint + shared secret in Vault. Safe to re-run: every step
# is idempotent, and the shared secret is only generated if one is not supplied.
#
#   ./supabase/deploy.sh
#   ./supabase/deploy.sh --test-email you@example.com   # also send a real email
#
# Prerequisite this script cannot do for you: verify vthepeople.org in Resend
# (Domains -> Add Domain, then add the DKIM/SPF/DMARC records at Cloudflare).
# Until that domain reads "Verified", Resend refuses to send from
# team@vthepeople.org and every welcome email fails with a 403.

set -euo pipefail

PROJECT_REF='dnkdbwxsygtptwbemydc'
FUNCTION_NAME='welcome-email'
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TEST_EMAIL=''
while [ $# -gt 0 ]; do
    case "$1" in
        --test-email) TEST_EMAIL="${2:-}"; shift 2 ;;
        -h|--help)    sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *)            echo "unknown argument: $1" >&2; exit 2 ;;
    esac
done

step()  { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
info()  { printf '    %s\n' "$1"; }
die()   { printf '\n\033[31merror: %s\033[0m\n' "$1" >&2; exit 1; }

cd "$REPO_ROOT"

# --- 0. preflight ------------------------------------------------------------

step 'Checking prerequisites'

command -v supabase >/dev/null 2>&1 || die \
    'the Supabase CLI is not installed. Install it with:
      npm install -g supabase        # or: brew install supabase/tap/supabase'

if ! supabase projects list >/dev/null 2>&1; then
    die 'not logged in to Supabase. Run:  supabase login'
fi
info "CLI: $(supabase --version 2>/dev/null | head -1)"

if [ ! -f supabase/.temp/project-ref ] || \
   [ "$(cat supabase/.temp/project-ref 2>/dev/null)" != "$PROJECT_REF" ]; then
    info "Linking project ${PROJECT_REF} (you will be asked for the database password)"
    supabase link --project-ref "$PROJECT_REF"
fi
info "Linked to ${PROJECT_REF}"

# --- 1. secrets --------------------------------------------------------------

step 'Collecting secrets'

if [ -z "${RESEND_API_KEY:-}" ]; then
    printf '    Resend API key (re_...): '
    read -rs RESEND_API_KEY || true
    printf '\n'
fi
[ -n "${RESEND_API_KEY:-}" ] || die 'a Resend API key is required'
case "$RESEND_API_KEY" in
    re_*) ;;
    *) die 'that does not look like a Resend API key (expected it to start with "re_")' ;;
esac

if [ -z "${WELCOME_EMAIL_WEBHOOK_SECRET:-}" ]; then
    WELCOME_EMAIL_WEBHOOK_SECRET="$(openssl rand -hex 32)"
    info 'Generated a new shared secret for the trigger <-> function handshake'
else
    info 'Using the shared secret from $WELCOME_EMAIL_WEBHOOK_SECRET'
fi

# --- 2. deploy the function --------------------------------------------------

step 'Setting Edge Function secrets'
supabase secrets set \
    "RESEND_API_KEY=${RESEND_API_KEY}" \
    "WELCOME_EMAIL_WEBHOOK_SECRET=${WELCOME_EMAIL_WEBHOOK_SECRET}" \
    >/dev/null
info 'RESEND_API_KEY, WELCOME_EMAIL_WEBHOOK_SECRET'

step "Deploying the ${FUNCTION_NAME} function"
supabase functions deploy "$FUNCTION_NAME"

# --- 3. migration ------------------------------------------------------------

step 'Applying the database migration'
info 'Adds welcome_sent_at / welcome_email_error, enables pg_net + vault,'
info 'and creates the AFTER INSERT trigger on mailing_list.'
supabase db push

# --- 4. vault ----------------------------------------------------------------
#
# The trigger reads the endpoint and the shared secret from Vault at run time,
# so that neither ever appears in a migration file or in pg_dump output.

step 'Storing the endpoint and shared secret in Vault'

VAULT_SQL=$(cat <<'SQL'
-- create if absent, then overwrite: idempotent across re-runs
select vault.create_secret(:'fn_url', 'welcome_email_function_url',
                           'Welcome email Edge Function endpoint')
where not exists (select 1 from vault.secrets
                  where name = 'welcome_email_function_url');
select vault.update_secret(id, :'fn_url', 'welcome_email_function_url',
                           'Welcome email Edge Function endpoint')
from vault.secrets where name = 'welcome_email_function_url';

select vault.create_secret(:'fn_secret', 'welcome_email_webhook_secret',
                           'Shared secret for the welcome email webhook')
where not exists (select 1 from vault.secrets
                  where name = 'welcome_email_webhook_secret');
select vault.update_secret(id, :'fn_secret', 'welcome_email_webhook_secret',
                           'Shared secret for the welcome email webhook')
from vault.secrets where name = 'welcome_email_webhook_secret';
SQL
)

vault_applied=0
if command -v psql >/dev/null 2>&1; then
    DB_URL="${SUPABASE_DB_URL:-}"
    if [ -z "$DB_URL" ]; then
        info 'Paste the connection string from Supabase -> Project Settings -> Database'
        info '(Connection string -> URI, with the password filled in).'
        info 'Press Enter alone to skip and get SQL you can paste into the SQL Editor.'
        printf '    Connection string: '
        read -rs DB_URL || true
        printf '\n'
    fi

    if [ -n "$DB_URL" ]; then
        if printf '%s\n' "$VAULT_SQL" | psql "$DB_URL" \
              -v ON_ERROR_STOP=1 \
              -v "fn_url=${FUNCTION_URL}" \
              -v "fn_secret=${WELCOME_EMAIL_WEBHOOK_SECRET}" \
              --quiet >/dev/null; then
            info 'Vault secrets stored'
            vault_applied=1
        else
            info 'psql could not apply the Vault secrets; falling back to manual SQL'
        fi
    fi
fi

if [ "$vault_applied" -eq 0 ]; then
    cat <<MANUAL

    Run this in the Supabase dashboard SQL Editor to finish:
    ------------------------------------------------------------------
    select vault.create_secret('${FUNCTION_URL}',
        'welcome_email_function_url', 'Welcome email Edge Function endpoint');

    select vault.create_secret('${WELCOME_EMAIL_WEBHOOK_SECRET}',
        'welcome_email_webhook_secret', 'Shared secret for the welcome email webhook');
    ------------------------------------------------------------------
    (If a secret already exists, use vault.update_secret(<id>, ...) instead.)

MANUAL
fi

# --- 5. smoke test -----------------------------------------------------------

step 'Smoke testing the deployed function'

reject=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$FUNCTION_URL" \
    -H 'Content-Type: application/json' \
    -H 'x-webhook-secret: definitely-not-the-secret' \
    -d '{"type":"INSERT","table":"mailing_list","record":{"email":"nobody@example.com"}}')
if [ "$reject" = '401' ]; then
    info 'Rejects a bad shared secret (401)'
else
    info "Expected 401 for a bad secret, got ${reject} — check the function logs"
fi

if [ -n "$TEST_EMAIL" ]; then
    info "Sending a live welcome email to ${TEST_EMAIL}"
    accept=$(curl -s -o /tmp/welcome-smoke.json -w '%{http_code}' -X POST "$FUNCTION_URL" \
        -H 'Content-Type: application/json' \
        -H "x-webhook-secret: ${WELCOME_EMAIL_WEBHOOK_SECRET}" \
        -d "{\"type\":\"INSERT\",\"table\":\"mailing_list\",\"record\":{\"email\":\"${TEST_EMAIL}\"}}")
    if [ "$accept" = '200' ]; then
        info "Accepted — check the ${TEST_EMAIL} inbox"
    else
        info "Send failed (HTTP ${accept}): $(cat /tmp/welcome-smoke.json 2>/dev/null)"
        info 'A 502 here almost always means the Resend domain is not verified yet.'
    fi
    rm -f /tmp/welcome-smoke.json
fi

# --- done --------------------------------------------------------------------

cat <<DONE

$(printf '\033[1m')Done.$(printf '\033[0m') New signups at vthepeople.org will now receive the welcome email.

  Verify with a real signup, then:
    select email, welcome_sent_at, welcome_email_error
    from public.mailing_list
    order by welcome_sent_at desc nulls first limit 5;

  Logs: Supabase dashboard -> Edge Functions -> ${FUNCTION_NAME} -> Logs
  Troubleshooting: supabase/README.md
DONE
