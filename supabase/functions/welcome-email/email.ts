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

export const WELCOME_SUBJECT = 'Welcome to V the People';

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
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Updates on the Article V convention and the October 2&ndash;3 conference at Harvard Law School.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f2;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${RULE};">

<tr>
<td style="background-color:${BLUE};padding:28px 32px;text-align:center;">
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#ffffff;letter-spacing:0.5px;"><em>V</em> the People</p>
<p style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.4;color:#c8d2e4;">Amending the Constitution through an Article&nbsp;V Convention</p>
</td>
</tr>

<tr>
<td style="height:4px;background-color:${RED};font-size:0;line-height:0;">&nbsp;</td>
</tr>

<tr>
<td style="padding:36px 32px 8px;">
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:${INK};font-weight:normal;">Thank you for joining our mailing list.</h1>

<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${INK};">You will receive updates on the Constitutional Convention Conference and on our continuing work covering the Article&nbsp;V convention process.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-left:3px solid ${RED};">
<tr>
<td style="padding:4px 0 4px 16px;">
<p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;color:${INK};font-weight:bold;">October 2&ndash;3, 2026</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:${MUTED};">Wasserstein Hall, Harvard Law School<br>Cambridge, Massachusetts</p>
</td>
</tr>
</table>

<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${INK};">The Constitution can be amended two ways: by Congress, or by a convention called by the states. We have never tried the second. Over two days at Harvard Law School, this conference convenes scholars, legislators, and advocates &mdash; supporters and skeptics alike, from across the political spectrum &mdash; to examine the questions that path raises.</p>

<p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${INK};">Our goal is to advance understanding through rigorous, good-faith dialogue among those who hold deeply different views about the promise and peril of this constitutional mechanism.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
<tr>
<td style="background-color:${RED};">
<a href="${SITE_URL}/schedule.html" style="display:inline-block;padding:13px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1;color:#ffffff;text-decoration:none;">View the Schedule</a>
</td>
</tr>
</table>

<p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;color:${INK};">
<a href="${SITE_URL}/panels.html" style="color:${BLUE};text-decoration:underline;">Panelists and Speakers</a><br>
<a href="${SITE_URL}/faq.html" style="color:${BLUE};text-decoration:underline;">Frequently Asked Questions</a><br>
<a href="${SITE_URL}/glossary.html" style="color:${BLUE};text-decoration:underline;">Glossary of Article&nbsp;V Terms</a>
</p>
</td>
</tr>

<tr>
<td style="padding:20px 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${RULE};padding-top:20px;">
<p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:${MUTED};">Questions, or interested in attending? Reply to this message or write to <a href="mailto:${CONTACT_EMAIL}" style="color:${BLUE};text-decoration:underline;">${CONTACT_EMAIL}</a>.</p>
<p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${MUTED};">VthePeople is an independent, nonpartisan resource on the Article&nbsp;V Convention for proposing constitutional amendments.</p>
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
Amending the Constitution through an Article V Convention

Thank you for joining our mailing list.

You will receive updates on the Constitutional Convention Conference and on
our continuing work covering the Article V convention process.

  October 2-3, 2026
  Wasserstein Hall, Harvard Law School
  Cambridge, Massachusetts

The Constitution can be amended two ways: by Congress, or by a convention
called by the states. We have never tried the second. Over two days at
Harvard Law School, this conference convenes scholars, legislators, and
advocates -- supporters and skeptics alike, from across the political
spectrum -- to examine the questions that path raises.

Our goal is to advance understanding through rigorous, good-faith dialogue
among those who hold deeply different views about the promise and peril of
this constitutional mechanism.

Schedule
  ${SITE_URL}/schedule.html

Panelists and Speakers
  ${SITE_URL}/panels.html

Frequently Asked Questions
  ${SITE_URL}/faq.html

Glossary of Article V Terms
  ${SITE_URL}/glossary.html

Questions, or interested in attending? Reply to this message or write to
${CONTACT_EMAIL}.

VthePeople is an independent, nonpartisan resource on the Article V
Convention for proposing constitutional amendments.

--
You are receiving this message because you subscribed at ${SITE_URL}.
To stop receiving these emails, reply with "unsubscribe" or email
${CONTACT_EMAIL}.`;
}
