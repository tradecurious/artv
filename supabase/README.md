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
| `functions/welcome-email/test.mjs` | Tests the handler against a stubbed runtime and a fake Resend |
| `config.toml` | Project ref, and `verify_jwt = false` for this function |
| `deploy.sh` | Runs the whole deploy locally, in one command |
| `vault-secrets.sql` | Stores the endpoint + shared secret in Vault |
| `scripts/mgmt-query.py` | Runs SQL via the Management API (no database password needed) |
| `../.github/workflows/deploy-welcome-email.yml` | Does the same deploy on every push to `main` |

## Setup

### What you need

Two credentials, and one thing only you can do.

**Do this first, because it has a waiting period:** create a Resend account,
then **Domains → Add Domain → `vthepeople.org`**. Resend gives you DKIM, SPF,
and DMARC records; add them at Cloudflare, where the domain is hosted, and wait
for the domain to read **Verified**.

This step is not optional. Until the domain verifies, Resend refuses to send
from `team@vthepeople.org` — it only allows its own `onboarding@resend.dev`
sender, to your own account address. Signups would silently get nothing.

Then, from **Resend → API Keys**, create a key with *Sending access* only.

### Deploying

Add two repository secrets under *Settings → Secrets and variables → Actions*:

| Secret | Where it comes from |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens |
| `RESEND_API_KEY` | Resend → API Keys, *sending access* only |

That is the whole configuration. `.github/workflows/deploy-welcome-email.yml`
deploys the function and applies the migration on every change under
`supabase/`, and can be re-run any time from the Actions tab. Until both
secrets exist the workflow skips cleanly with a notice rather than failing.

Three things it deliberately does not ask for:

- **The database password.** A Supabase password cannot be read back after the
  project is created, and rotating it breaks anything already connecting with
  it. Migrations and Vault writes go through the Management API instead, which
  the access token alone authorises.
- **The trigger/function shared secret.** The workflow generates one on each
  run and writes it to both places that need it — the function's environment
  and Vault — so there is nothing to store or keep in sync. It is masked in the
  job log.
- **Any manual SQL.** `supabase/scripts/mgmt-query.py` applies the migration
  and the Vault writes over the Management API.

### Running it locally instead

`./supabase/deploy.sh` does exactly the same thing from your own machine, given
the Supabase CLI and the same two credentials. Add
`--test-email you@example.com` to send yourself a real welcome email at the
end. You do not need this if the workflow is configured — it is here for a
first deploy, or to check a copy edit without pushing.

### A note on redeploys

Because the shared secret is regenerated per deploy, there is a window of a few
seconds during a deploy where the function has the new secret and the database
still has the old one. A signup landing in that window is still recorded, but
its welcome email is rejected and shows up as a null `welcome_sent_at` — see
[Sending to addresses that were missed](#sending-to-addresses-that-were-missed).

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

To exercise the function without touching the table, you need the shared
secret. It is generated at deploy time and never printed, but it is readable
from Vault:

```sql
select decrypted_secret from vault.decrypted_secrets
where name = 'welcome_email_webhook_secret';
```

```bash
curl -i https://dnkdbwxsygtptwbemydc.supabase.co/functions/v1/welcome-email \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: <that value>' \
  -d '{"type":"INSERT","table":"mailing_list","record":{"email":"you@example.com"}}'
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Row inserted, `welcome_sent_at` stays null, no function log | Vault secrets missing or misnamed — re-run the deploy. Check the Postgres logs for the `welcome email skipped` warning. |
| Function log shows `401 unauthorized` | The Vault `welcome_email_webhook_secret` and the function's `WELCOME_EMAIL_WEBHOOK_SECRET` have drifted apart, usually a deploy that failed partway. Re-running the deploy rewrites both. |
| Function log shows `not_configured` | `RESEND_API_KEY` or `WELCOME_EMAIL_WEBHOOK_SECRET` was never set on the function — re-run the deploy. |
| `welcome_email_error` mentions 403 / domain | The Resend domain is not verified yet — see *What you need*. |
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

Check an edit before it reaches anyone:

```bash
node --experimental-strip-types supabase/functions/welcome-email/test.mjs
```

The same suite runs in CI ahead of the deploy, so a broken template fails the
workflow instead of a subscriber's inbox.

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
