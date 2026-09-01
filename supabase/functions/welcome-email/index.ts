// Sends the welcome email to each new mailing_list signup.
//
// Invoked by the AFTER INSERT trigger on public.mailing_list (see
// supabase/migrations/20260901000000_welcome_email_webhook.sql), which posts
// the standard Supabase webhook payload:
//
//   { type: "INSERT", table, schema, record: {...}, old_record: null }
//
// JWT verification is off for this function (supabase/config.toml) because the
// caller is pg_net, not a signed-in user; the shared secret below authenticates
// it instead. Deployment steps are in supabase/README.md.

import { renderWelcomeEmail, WELCOME_SUBJECT } from './email.ts';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const WEBHOOK_SECRET = Deno.env.get('WELCOME_EMAIL_WEBHOOK_SECRET');
const MAIL_FROM = Deno.env.get('WELCOME_EMAIL_FROM') ?? 'V the People <team@vthepeople.org>';
const MAIL_REPLY_TO = Deno.env.get('WELCOME_EMAIL_REPLY_TO') ?? 'team@vthepeople.org';

// Injected into every Edge Function by the platform.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const TABLE = 'mailing_list';

interface WebhookPayload {
    type?: string;
    table?: string;
    schema?: string;
    record?: Record<string, unknown> | null;
    old_record?: Record<string, unknown> | null;
}

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
        return json(405, { error: 'method_not_allowed' });
    }

    if (!WEBHOOK_SECRET || !RESEND_API_KEY) {
        // Misconfiguration, not a caller error — 500 so it surfaces in the logs.
        console.error('missing required secret: WELCOME_EMAIL_WEBHOOK_SECRET and/or RESEND_API_KEY');
        return json(500, { error: 'not_configured' });
    }

    if (!timingSafeEqual(req.headers.get('x-webhook-secret') ?? '', WEBHOOK_SECRET)) {
        return json(401, { error: 'unauthorized' });
    }

    let payload: WebhookPayload;
    try {
        payload = await req.json();
    } catch {
        return json(400, { error: 'invalid_json' });
    }

    // Anything other than a fresh mailing_list row is a no-op. 200 keeps these
    // out of the Edge Function error rate — they are expected, not failures.
    if (payload.type !== 'INSERT' || (payload.table && payload.table !== TABLE)) {
        return json(200, { skipped: 'not_a_mailing_list_insert' });
    }

    const record = payload.record ?? {};
    const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';

    if (!isEmailAddress(email)) {
        console.warn('skipping row with unusable email address');
        return json(200, { skipped: 'invalid_email' });
    }

    // Guards against a replayed or manually re-fired webhook.
    if (record.welcome_sent_at) {
        return json(200, { skipped: 'already_sent' });
    }

    const { html, text } = renderWelcomeEmail();

    let result: SendResult;
    try {
        result = await sendViaResend({ to: email, subject: WELCOME_SUBJECT, html, text });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`resend request failed for ${email}: ${message}`);
        await recordOutcome(record, email, { welcome_email_error: truncate(message) });
        return json(502, { error: 'send_failed' });
    }

    if (!result.ok) {
        console.error(`resend rejected ${email}: ${result.status} ${result.body}`);
        await recordOutcome(record, email, {
            welcome_email_error: truncate(`${result.status} ${result.body}`),
        });
        return json(502, { error: 'send_rejected', status: result.status });
    }

    await recordOutcome(record, email, {
        welcome_sent_at: new Date().toISOString(),
        welcome_email_error: null,
    });

    console.log(`welcome email sent to ${email} (resend id ${result.id ?? 'unknown'})`);
    return json(200, { sent: true, id: result.id });
});

interface SendResult {
    ok: boolean;
    status: number;
    body: string;
    id?: string;
}

async function sendViaResend(
    msg: { to: string; subject: string; html: string; text: string },
): Promise<SendResult> {
    // Resend rate-limits per team; a lone retry covers an unlucky burst of
    // simultaneous signups without turning a hard failure into a retry storm.
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: MAIL_FROM,
                to: [msg.to],
                reply_to: [MAIL_REPLY_TO],
                subject: msg.subject,
                html: msg.html,
                text: msg.text,
                tags: [{ name: 'category', value: 'welcome' }],
            }),
        });

        const body = await res.text();

        if (res.ok) {
            let id: string | undefined;
            try {
                id = JSON.parse(body)?.id;
            } catch { /* body is not JSON; the send still succeeded */ }
            return { ok: true, status: res.status, body, id };
        }

        if (res.status === 429 && attempt === 0) {
            const retryAfter = Number(res.headers.get('retry-after'));
            const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
                ? Math.min(retryAfter * 1000, 5000)
                : 1100;
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
        }

        return { ok: false, status: res.status, body };
    }

    return { ok: false, status: 429, body: 'rate limited after retry' };
}

// Writes the send outcome back to the row so misses are auditable and a
// backfill can find them. Best-effort: a failure here must not mask the send.
async function recordOutcome(
    record: Record<string, unknown>,
    email: string,
    patch: Record<string, unknown>,
): Promise<void> {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unavailable; skipping row update');
        return;
    }

    // Prefer the primary key; fall back to the (unique) email address.
    const filter = record.id !== undefined && record.id !== null
        ? `id=eq.${encodeURIComponent(String(record.id))}`
        : `email=eq.${encodeURIComponent(email)}`;

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${filter}`, {
            method: 'PATCH',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(patch),
        });

        if (!res.ok) {
            console.warn(`could not update ${TABLE} row: ${res.status} ${await res.text()}`);
        }
    } catch (err) {
        console.warn(`could not update ${TABLE} row: ${err instanceof Error ? err.message : err}`);
    }
}

function isEmailAddress(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function truncate(value: string, max = 500): string {
    return value.length > max ? `${value.slice(0, max)}…` : value;
}

function timingSafeEqual(a: string, b: string): boolean {
    const encoder = new TextEncoder();
    const left = encoder.encode(a);
    const right = encoder.encode(b);
    if (left.length !== right.length) return false;
    let diff = 0;
    for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
    return diff === 0;
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
