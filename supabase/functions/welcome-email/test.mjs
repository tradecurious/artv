// Tests for the welcome-email function.
//
//   node --experimental-strip-types supabase/functions/welcome-email/test.mjs
//
// Runs the real handler against a stubbed Deno runtime and a fake Resend, so
// the whole path — webhook auth, payload handling, the Resend call, the row
// write-back — is exercised without deploying or sending anything.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const ENV = {
    RESEND_API_KEY: 're_test_key',
    WELCOME_EMAIL_WEBHOOK_SECRET: 'correct-horse-battery-staple',
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service_role_test',
};
const SECRET = ENV.WELCOME_EMAIL_WEBHOOK_SECRET;

let handler;
globalThis.Deno = { env: { get: (key) => ENV[key] }, serve: (fn) => { handler = fn; } };

let calls = [];
let resend = { status: 200, body: JSON.stringify({ id: 'e1b2c3' }), headers: {} };

globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init?.method, headers: init?.headers, body: init?.body });
    if (String(url).includes('api.resend.com')) {
        return new Response(resend.body, { status: resend.status, headers: resend.headers });
    }
    return new Response('', { status: 200 });
};

const { WELCOME_SUBJECT } = await import(join(HERE, 'email.ts'));
await import(join(HERE, 'index.ts'));

const post = (body, secret = SECRET) =>
    handler(new Request('https://fn.local/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
        body: JSON.stringify(body),
    }));

const INSERT = {
    type: 'INSERT', table: 'mailing_list', schema: 'public',
    record: { id: 7, email: '  New.Person@Example.COM ' }, old_record: null,
};

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  ok    ${name}`); }
    else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
};
const group = (name) => console.log(`\n${name}:`);

// --- delivers -----------------------------------------------------------

group('delivers');
calls = [];
let res = await post(INSERT);
let body = await res.json();
check('returns 200', res.status === 200, `got ${res.status}`);
check('reports sent, with the Resend id', body.sent === true && body.id === 'e1b2c3');

const send = calls.find((c) => c.url.includes('api.resend.com'));
const sent = JSON.parse(send.body);
check('normalizes the address', sent.to[0] === 'new.person@example.com', sent.to[0]);
check('authenticates to Resend', send.headers.Authorization === 'Bearer re_test_key');
check('sends both html and text', Boolean(sent.html) && Boolean(sent.text));
check('subject matches the template', sent.subject === WELCOME_SUBJECT, sent.subject);
check('from and reply_to are set', sent.from.includes('@') && sent.reply_to[0].includes('@'));

// Guards the copy itself: both bodies must carry the message, and the
// unsubscribe line is a deliverability requirement, not decoration.
check('html carries the message', /Thanks for signing up/i.test(sent.html));
check('text carries the message', /Thanks for signing up/i.test(sent.text));
check('html offers an unsubscribe', /unsubscribe/i.test(sent.html));
check('text offers an unsubscribe', /unsubscribe/i.test(sent.text));
check('html is a complete document', sent.html.trimStart().startsWith('<!DOCTYPE html>'));

// The ticket link is the point of the email; losing it in an edit should fail
// loudly. The href must carry &amp; — a bare & is invalid in an attribute and
// some clients strip the whole link rather than repairing it.
const TICKETS = 'secure.touchnet.net/C20832_ustores/web/store_main.jsp';
check('html links to tickets', sent.html.includes(TICKETS));
check('the link is anchored on "here"', />here<\/a>/.test(sent.html));
check('href escapes its ampersands', sent.html.includes('STOREID=42&amp;SINGLESTORE=true'));
check('href has no raw ampersand', !/href="[^"]*&(?!amp;)/.test(sent.html));
check('text gives the ticket url in full', sent.text.includes('STOREID=42&SINGLESTORE=true'));
check('html stays under the Gmail clip limit', sent.html.length < 102000, `${sent.html.length} bytes`);

const patch = calls.find((c) => c.method === 'PATCH');
check('patches the row by id', patch?.url.includes('/rest/v1/mailing_list?id=eq.7'), patch?.url);
check('stamps welcome_sent_at', Boolean(JSON.parse(patch.body).welcome_sent_at));
check('uses the service role to do it', patch.headers.apikey === 'service_role_test');

// --- authenticates ------------------------------------------------------

group('authenticates');
check('rejects a wrong secret', (await post(INSERT, 'wrong')).status === 401);
check('rejects an empty secret', (await post(INSERT, '')).status === 401);
check('rejects a GET', (await handler(new Request('https://fn.local/x', { method: 'GET' }))).status === 405);

// --- ignores what it should ---------------------------------------------

group('ignores what it should');
calls = [];
res = await post({ ...INSERT, type: 'UPDATE' });
check('skips a non-INSERT, sending nothing', res.status === 200 && calls.length === 0);
calls = [];
res = await post({ ...INSERT, table: 'other_table' });
check('skips another table', res.status === 200 && calls.length === 0);
calls = [];
res = await post({ ...INSERT, record: { id: 8, email: 'not-an-email' } });
check('skips an unusable address', (await res.json()).skipped === 'invalid_email' && calls.length === 0);
calls = [];
res = await post({ ...INSERT, record: { id: 9, email: 'a@b.com', welcome_sent_at: '2026-08-01T00:00:00Z' } });
check('never sends twice to one row', (await res.json()).skipped === 'already_sent' && calls.length === 0);
calls = [];
await post({ ...INSERT, record: { email: 'nokey@example.com' } });
check('falls back to the email filter with no id',
    calls.find((c) => c.method === 'PATCH')?.url.includes('email=eq.nokey%40example.com'));

// --- fails safely -------------------------------------------------------

group('fails safely');
resend = { status: 422, body: JSON.stringify({ message: 'domain not verified' }), headers: {} };
calls = [];
res = await post(INSERT);
check('surfaces a Resend rejection as 502', res.status === 502, `got ${res.status}`);
const errored = calls.find((c) => c.method === 'PATCH');
check('records the error on the row', JSON.parse(errored.body).welcome_email_error.includes('422'));
check('leaves welcome_sent_at unset', !('welcome_sent_at' in JSON.parse(errored.body)));

group('retries a rate limit');
let attempts = 0;
globalThis.fetch = async (url) => {
    if (String(url).includes('api.resend.com')) {
        attempts++;
        return attempts === 1
            ? new Response('rate limited', { status: 429, headers: { 'retry-after': '1' } })
            : new Response(JSON.stringify({ id: 'retry-ok' }), { status: 200 });
    }
    return new Response('', { status: 200 });
};
const startedAt = Date.now();
res = await post(INSERT);
check('succeeds on the second attempt', res.status === 200, `got ${res.status}`);
check('retries exactly once', attempts === 2, `${attempts} attempts`);
check('waits before retrying', Date.now() - startedAt >= 900, `${Date.now() - startedAt}ms`);

console.log(`\n${failed === 0 ? 'PASS' : 'FAIL'} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
