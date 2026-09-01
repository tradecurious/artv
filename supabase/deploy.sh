#!/usr/bin/env bash
#
# Deploys the mailing-list welcome email from your own machine.
#
# The GitHub Actions workflow does exactly this on every push to main, so you
# normally do not need to run it. It is here for a first deploy, or to test a
# copy edit without pushing.
#
#   ./supabase/deploy.sh
#   ./supabase/deploy.sh --test-email you@example.com   # also send a real email
#
# Needs only a Supabase personal access token and a Resend API key. It does NOT
# need the project's database password: a Supabase password cannot be read back
# after the project is created, and rotating it breaks anything already
# connecting with it, so migrations and Vault writes go through the Management
# API instead.
#
# Prerequisite this script cannot do for you: verify vthepeople.org in Resend
# (Domains -> Add Domain, then add the DKIM/SPF/DMARC records at Cloudflare).
# Until that domain reads "Verified", Resend refuses to send from
# team@vthepeople.org and every welcome email fails.

set -euo pipefail

PROJECT_REF='dnkdbwxsygtptwbemydc'
FUNCTION_NAME='welcome-email'
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MGMT="${REPO_ROOT}/supabase/scripts/mgmt-query.py"

TEST_EMAIL=''
while [ $# -gt 0 ]; do
    case "$1" in
        --test-email) TEST_EMAIL="${2:-}"; shift 2 ;;
        -h|--help)    sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *)            echo "unknown argument: $1" >&2; exit 2 ;;
    esac
done

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
info() { printf '    %s\n' "$1"; }
die()  { printf '\n\033[31merror: %s\033[0m\n' "$1" >&2; exit 1; }

cd "$REPO_ROOT"

# --- 0. preflight ------------------------------------------------------------

step 'Checking prerequisites'

command -v supabase >/dev/null 2>&1 || die \
    'the Supabase CLI is not installed. Install it with:
      npm install -g supabase        # or: brew install supabase/tap/supabase'
command -v python3 >/dev/null 2>&1 || die 'python3 is required'
info "CLI: $(supabase --version 2>/dev/null | head -1)"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    info 'Personal access token from supabase.com/dashboard/account/tokens'
    printf '    Supabase access token (sbp_...): '
    read -rs SUPABASE_ACCESS_TOKEN || true
    printf '\n'
fi
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] || die 'a Supabase access token is required'
export SUPABASE_ACCESS_TOKEN

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

# Generated fresh and written to both places that need it, so it never has to
# be stored anywhere or kept in sync by hand.
WEBHOOK_SECRET="${WELCOME_EMAIL_WEBHOOK_SECRET:-$(openssl rand -hex 32)}"

# --- 1. deploy the function --------------------------------------------------

step 'Setting Edge Function secrets'
supabase secrets set --project-ref "$PROJECT_REF" \
    "RESEND_API_KEY=${RESEND_API_KEY}" \
    "WELCOME_EMAIL_WEBHOOK_SECRET=${WEBHOOK_SECRET}" >/dev/null
info 'RESEND_API_KEY, WELCOME_EMAIL_WEBHOOK_SECRET'

step "Deploying the ${FUNCTION_NAME} function"
supabase functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_REF"

# --- 2. migrations -----------------------------------------------------------

step 'Applying database migrations'
info 'Adds welcome_sent_at / welcome_email_error, enables pg_net + vault,'
info 'and creates the AFTER INSERT trigger on mailing_list.'
for file in supabase/migrations/*.sql; do
    # Each migration is written to be idempotent, so replaying one the project
    # already has is a no-op.
    python3 "$MGMT" --project-ref "$PROJECT_REF" --file "$file"
done

# --- 3. vault ----------------------------------------------------------------

step 'Storing the endpoint and shared secret in Vault'
python3 "$MGMT" --project-ref "$PROJECT_REF" \
    --file supabase/vault-secrets.sql \
    --var "fn_url=${FUNCTION_URL}" \
    --var "fn_secret=${WEBHOOK_SECRET}"

# --- 4. verify ---------------------------------------------------------------

step 'Verifying'

reject=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$FUNCTION_URL" \
    -H 'Content-Type: application/json' \
    -H 'x-webhook-secret: definitely-not-the-secret' \
    -d '{"type":"INSERT","table":"mailing_list","record":{"email":"nobody@example.com"}}')
if [ "$reject" = '401' ]; then
    info 'Function is live and rejects a bad shared secret'
else
    info "Expected 401 for a bad secret, got ${reject} — check the function logs"
fi

python3 "$MGMT" --project-ref "$PROJECT_REF" \
    --expect-rows 1 \
    --sql "select tgname from pg_trigger
           where tgrelid = 'public.mailing_list'::regclass
             and tgname = 'on_mailing_list_insert_send_welcome';"

if [ -n "$TEST_EMAIL" ]; then
    info "Sending a live welcome email to ${TEST_EMAIL}"
    accept=$(curl -s -o /tmp/welcome-smoke.json -w '%{http_code}' -X POST "$FUNCTION_URL" \
        -H 'Content-Type: application/json' \
        -H "x-webhook-secret: ${WEBHOOK_SECRET}" \
        -d "{\"type\":\"INSERT\",\"table\":\"mailing_list\",\"record\":{\"email\":\"${TEST_EMAIL}\"}}")
    if [ "$accept" = '200' ]; then
        info "Accepted — check the ${TEST_EMAIL} inbox"
    else
        info "Send failed (HTTP ${accept}): $(cat /tmp/welcome-smoke.json 2>/dev/null)"
        info 'A 502 here almost always means the Resend domain is not verified yet.'
    fi
    rm -f /tmp/welcome-smoke.json
fi

cat <<DONE

$(printf '\033[1m')Done.$(printf '\033[0m') New signups at vthepeople.org will now receive the welcome email.

  Check delivery with:
    select email, welcome_sent_at, welcome_email_error
    from public.mailing_list
    order by welcome_sent_at desc nulls first limit 5;

  Logs: Supabase dashboard -> Edge Functions -> ${FUNCTION_NAME} -> Logs
  Troubleshooting: supabase/README.md
DONE
