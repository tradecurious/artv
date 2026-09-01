-- Stores the welcome-email endpoint and shared secret in Supabase Vault.
--
-- The AFTER INSERT trigger on mailing_list reads both of these at run time, so
-- that no credential is written into a migration file or into pg_dump output.
--
-- Run with psql, supplying both values:
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 \
--     -v fn_url='https://<ref>.supabase.co/functions/v1/welcome-email' \
--     -v fn_secret='<the shared secret>' \
--     -f supabase/vault-secrets.sql
--
-- Idempotent: creates each secret if absent, then overwrites it either way, so
-- re-running is how you rotate the secret.

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
