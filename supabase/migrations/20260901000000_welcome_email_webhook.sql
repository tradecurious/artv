-- Send a welcome email whenever a new address lands in public.mailing_list.
--
-- An AFTER INSERT trigger posts the row to the welcome-email Edge Function via
-- pg_net, which sends the message through Resend and writes the outcome back to
-- welcome_sent_at / welcome_email_error.
--
-- The function URL and the shared secret are read from Supabase Vault rather
-- than being written into the trigger definition, so neither this file nor
-- pg_dump output carries a credential. supabase/README.md has the setup steps.

create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Delivery bookkeeping. Nullable and unconstrained: these record what happened,
-- they never gate a signup.
alter table public.mailing_list
    add column if not exists welcome_sent_at timestamptz,
    add column if not exists welcome_email_error text;

comment on column public.mailing_list.welcome_sent_at is
    'When the welcome email was accepted by Resend. Null means it has not been sent.';
comment on column public.mailing_list.welcome_email_error is
    'Last delivery error, if any. Null once a send succeeds.';

create or replace function public.send_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_url    text;
    v_secret text;
begin
    select decrypted_secret into v_url
        from vault.decrypted_secrets
        where name = 'welcome_email_function_url';

    select decrypted_secret into v_secret
        from vault.decrypted_secrets
        where name = 'welcome_email_webhook_secret';

    if v_url is null or v_secret is null then
        raise warning 'welcome email skipped: vault secrets welcome_email_function_url / welcome_email_webhook_secret are not set';
        return null;
    end if;

    -- Queued by pg_net and delivered by its background worker, so the insert
    -- does not wait on the HTTP round trip.
    perform net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', v_secret
        ),
        body := jsonb_build_object(
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'record', to_jsonb(new),
            'old_record', null
        ),
        timeout_milliseconds := 5000
    );

    return null;
exception
    when others then
        -- A broken email pipeline must never cost us the signup itself.
        raise warning 'welcome email webhook failed for mailing_list row: %', sqlerrm;
        return null;
end;
$$;

comment on function public.send_welcome_email() is
    'AFTER INSERT trigger on mailing_list: posts the new row to the welcome-email Edge Function.';

drop trigger if exists on_mailing_list_insert_send_welcome on public.mailing_list;

create trigger on_mailing_list_insert_send_welcome
    after insert on public.mailing_list
    for each row
    execute function public.send_welcome_email();
