// Welcome email content for new mailing-list signups.
//
// Kept free of dependencies and framework code so the template can be edited
// without a build step. Styles are inline because email clients discard
// <style> blocks and external stylesheets.

const SITE_URL = 'https://vthepeople.org';
const CONTACT_EMAIL = 'team@vthepeople.org';

const RED = '#B22234';
const BLUE = '#002868';
const INK = '#1a1a1a';
const MUTED = '#5b5b5b';
const RULE = '#e2e2e2';

export const WELCOME_SUBJECT = 'Welcome!';

export function renderWelcomeEmail(): { html: string; text: string } {
    return { html: html(), text: text() };
}

function html(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${WELCOME_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">We'll see you in Cambridge in October.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f2;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${RULE};">

<tr>
<td style="background-color:${BLUE};padding:28px 32px;text-align:center;">
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#ffffff;letter-spacing:0.5px;"><em>V</em> the People</p>
</td>
</tr>

<tr>
<td style="height:4px;background-color:${RED};font-size:0;line-height:0;">&nbsp;</td>
</tr>

<tr>
<td style="padding:40px 32px 36px;">
<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:${INK};">Thanks for signing up.</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:${INK};">We'll see you in Cambridge in October&hellip;</p>
</td>
</tr>

<tr>
<td style="padding:0 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${RULE};padding-top:20px;">
<p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${MUTED};">Questions? Reply to this message or write to <a href="mailto:${CONTACT_EMAIL}" style="color:${BLUE};text-decoration:underline;">${CONTACT_EMAIL}</a>.</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.6;color:#8a8a8a;">You are receiving this message because you subscribed at <a href="${SITE_URL}" style="color:#8a8a8a;text-decoration:underline;">vthepeople.org</a>. To stop receiving these emails, reply with &ldquo;unsubscribe&rdquo; or email <a href="mailto:${CONTACT_EMAIL}?subject=Unsubscribe" style="color:#8a8a8a;text-decoration:underline;">${CONTACT_EMAIL}</a>.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function text(): string {
    return `V THE PEOPLE

Thanks for signing up.

We'll see you in Cambridge in October...

Questions? Reply to this message or write to ${CONTACT_EMAIL}.

--
You are receiving this message because you subscribed at ${SITE_URL}.
To stop receiving these emails, reply with "unsubscribe" or email
${CONTACT_EMAIL}.`;
}
