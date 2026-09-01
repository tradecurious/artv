# Welcome email for mailing list signups

When someone submits the form on vthepeople.org, `js/main.js` inserts their
address into the `mailing_list` table. This directory adds the piece that sends
them a welcome email automatically.

```
form submit  ->  INSERT public.mailing_list
                        |
                        |  AFTER INSERT trigger (pg_net, async)
                        v
                 welcome-email Edge Function
                        |
                        |  POST https://api.resend.com/emails
                        v
                     Resend  ->  subscriber's inbox
                        |
                        `-> writes welcome_sent_at back to the row
```

Everything runs inside the Supabase project, so signups made from anywhere —
the website form, a manual insert, a future landing page — all get the email.
Nothing was added to the front end; `js/main.js` is untouched.

| File | Purpose |
| --- | --- |
| `migrations/20260901000000_welcome_email_webhook.sql` | Delivery columns, trigger function, trigger |
| `functions/welcome-email/index.ts` | Verifies the webhook, calls Resend, records the outcome |
| `functions/welcome-email/email.ts` | Subject line and the HTML / plain-text bodies |
| `config.toml` | Project ref, and `verify_jwt = false` for this function |
| `deploy.sh` | Runs the whole deploy in one command, locally |
| `vault-secrets.sql` | Stores the endpoint + shared secret in Vault |
| `../.github/workflows/deploy-welcome-email.yml` | Does the same deploy on push to `main` |

## Setup

### The short version

Supabase is a separate service from the Vercel site deploy, so merging to
`main` does not by itself put this code into the project. Two ways to get it
there. **Neither needs the Supabase CLI on your machine.**

**Automatic, via GitHub Actions (recommended).** Do step 1 below — the Resend
account and domain verification, which nobody can do for you — then add four
repository secrets under *Settings → Secrets and variables → Actions*:

| Secret | Where it comes from |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens |
| `SUPABASE_DB_PASSWORD` | the project's database password |
| `RESEND_API_KEY` | Resend → API Keys, *sending access* only |
| `WELCOME_EMAIL_WEBHOOK_SECRET` | `openssl rand -hex 32` — any value, it just has to be the same in both places |
| `SUPABASE_DB_URL` *(optional)* | Project Settings → Database → Connection string → URI. Adding it removes the last manual step |

`.github/workflows/deploy-welcome-email.yml` then deploys the function and
applies the migration on every change under `supabase/`. Until those secrets
exist the workflow skips cleanly with a notice rather than failing, and you can
re-run it any time from the Actions tab.

Without the optional `SUPABASE_DB_URL`, one manual step remains: the job log
prints two `vault.create_secret(...)` statements to run once in the dashboard
SQL Editor. GitHub masks secrets in logs, which is why the shared secret has to
be pasted in by hand there rather than printed.

**Or locally, if you prefer.** With the Supabase CLI installed and
`supabase login` done:

```bash
./supabase/deploy.sh                                  # add --test-email you@example.com
```

Same steps, same idempotence, plus an optional live test email.

### The long version

Steps 1–2 are account setup; 3–6 are the deploy.

### 1. Resend

1. Create an account at resend.com.
2. **Domains → Add Domain → `vthepeople.org`.** Resend gives you DKIM, SPF, and
   DMARC records; add them at Cloudflare, where the domain is hosted. Wait for
   the domain to show as **Verified**.

   This step is not optional. Until the domain verifies, Resend refuses to send
   from `team@vthepeople.org` — it only allows its own `onboarding@resend.dev`
   sender, to your own account address. Signups would silently get nothing.
3. **API Keys → Create API Key**, with *Sending access* only. Copy the
   `re_...` value; it is shown once.

### 2. A shared secret

The trigger and the Edge Function authenticate to each other with a secret you
generate:

```bash
openssl rand -hex 32
```

Keep it around for steps 4 and 5.

### 3. Link the CLI

```bash
npm install -g supabase          # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref dnkdbwxsygtptwbemydc
```

Run these from the repository root, where `supabase/` lives.

### 4. Deploy the function

```bash
supabase secrets set \
  RESEND_API_KEY='re_...' \
  WELCOME_EMAIL_WEBHOOK_SECRET='<the secret from step 2>'

supabase functions deploy welcome-email
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform —
do not set them yourself.

Optional overrides, if you would rather not edit `email.ts`:

| Secret | Default |
| --- | --- |
| `WELCOME_EMAIL_FROM` | `V the People <team@vthepeople.org>` |
| `WELCOME_EMAIL_REPLY_TO` | `team@vthepeople.org` |

### 5. Apply the migration

```bash
supabase db push
```

This adds `welcome_sent_at` and `welcome_email_error` to `mailing_list`,
enables `pg_net` and `supabase_vault`, and creates the trigger. It does not
touch the existing rows or the `email` column.

### 6. Store the endpoint and secret in Vault

The trigger reads both at runtime from Supabase Vault, so that neither the
migration file nor a `pg_dump` ever contains a credential. In the dashboard,
**SQL Editor**, run:

```sql
select vault.create_secret(
    'https://dnkdbwxsygtptwbemydc.supabase.co/functions/v1/welcome-email',
    'welcome_email_function_url',
    'Welcome email Edge Function endpoint'
);

select vault.create_secret(
    '<the secret from step 2>',
    'welcome_email_webhook_secret',
    'Shared secret for the welcome email webhook'
);
```

Until these exist the trigger logs a warning and sends nothing — signups are
still recorded normally.

To rotate later, use `vault.update_secret(<id>, '<new value>', ...)` and re-run
`supabase secrets set WELCOME_EMAIL_WEBHOOK_SECRET=...`.

## Verify it works

Subscribe with a real address you control, on the live site or locally, then:

```sql
select email, welcome_sent_at, welcome_email_error
from public.mailing_list
order by welcome_sent_at desc nulls first
limit 5;
```

A successful signup has `welcome_sent_at` set within a few seconds and
`welcome_email_error` null. Also check **Edge Functions → welcome-email → Logs**
in the dashboard, and the Resend dashboard's email log.

To exercise the function without touching the table:

```bash
curl -i https://dnkdbwxsygtptwbemydc.supabase.co/functions/v1/welcome-email \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: <the secret from step 2>' \
  -d '{"type":"INSERT","table":"mailing_list","record":{"email":"you@example.com"}}'
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Row inserted, `welcome_sent_at` stays null, no function log | Vault secrets missing or misnamed (step 6). Check the Postgres logs for the `welcome email skipped` warning. |
| Function log shows `401 unauthorized` | The Vault `welcome_email_webhook_secret` and the `WELCOME_EMAIL_WEBHOOK_SECRET` function secret differ. |
| Function log shows `not_configured` | `RESEND_API_KEY` or `WELCOME_EMAIL_WEBHOOK_SECRET` was never set (step 4). |
| `welcome_email_error` mentions 403 / domain | The Resend domain is not verified yet (step 1.2). |
| `welcome_email_error` mentions 422 | The `from` address is not on a domain you have verified in Resend. |

pg_net is fire-and-forget: a request it fails to deliver is not retried. That
is what `welcome_sent_at` is for — any row still null after a few minutes was
missed, and can be re-sent with the backfill below.

## Sending to addresses that were missed

**This emails real people. Read the `where` clause before you run it.**

Everyone who signed up before this was deployed also has a null
`welcome_sent_at`, so an unfiltered backfill would mail the entire existing
list. Narrow it to the rows you actually mean — for example only recent ones:

```sql
select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'welcome_email_function_url'),
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets
                             where name = 'welcome_email_webhook_secret')
    ),
    body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'mailing_list',
        'schema', 'public',
        'record', to_jsonb(m),
        'old_record', null
    )
)
from public.mailing_list m
where m.welcome_sent_at is null
  and m.created_at > '2026-09-01';        -- adjust; do not remove
```

Run `select ... from public.mailing_list m where ...` on its own first to see
exactly whose addresses match.

If you would rather never mail the pre-existing list, take them out of range
once:

```sql
update public.mailing_list
set welcome_email_error = 'predates welcome automation'
where welcome_sent_at is null;
```

## Editing the email

The copy lives in `functions/welcome-email/email.ts` — `WELCOME_SUBJECT`, plus
`html()` and `text()`. Keep both bodies in sync; clients that refuse HTML fall
back to the plain-text one. Styles are inline by necessity, since email clients
discard `<style>` blocks.

After editing:

```bash
supabase functions deploy welcome-email
```

## Notes

- **Unsubscribes** are handled by asking people to reply or write to
  `team@vthepeople.org`, which satisfies CAN-SPAM but is manual. If the list
  grows, replace the footer line with a real unsubscribe link — a second Edge
  Function that sets an `unsubscribed_at` column — and add a
  `List-Unsubscribe` header to the Resend call.
- **The trigger never blocks a signup.** Its body is wrapped in an exception
  handler, so if the webhook cannot be queued the insert still commits and the
  visitor still sees the success message.
- **Duplicate signups do not re-send.** The trigger is `AFTER INSERT` only, and
  the function additionally skips any row that already has `welcome_sent_at`.
