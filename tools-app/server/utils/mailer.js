import nodemailer from 'nodemailer';
import { authPool } from '../db.js';

const SENDER_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSender = null;
let cachedAt = 0;

/**
 * Resolves the SMTP sender configured in the cerilas.com admin panel.
 * Preference: TRANSACTIONAL_SENDER_ID env → mail_settings.sender_id → first active sender.
 */
async function resolveSender() {
  if (cachedSender && Date.now() - cachedAt < SENDER_CACHE_TTL_MS) return cachedSender;

  let senderId = Number(process.env.TRANSACTIONAL_SENDER_ID) || null;
  if (!senderId) {
    try {
      const settings = await authPool.query('SELECT sender_id FROM mail_settings WHERE sender_id IS NOT NULL LIMIT 1');
      senderId = settings.rows[0]?.sender_id || null;
    } catch {
      senderId = null;
    }
  }

  let sender = null;
  if (senderId) {
    const res = await authPool.query('SELECT * FROM email_senders WHERE id = $1 AND is_active = true', [senderId]);
    sender = res.rows[0] || null;
  }
  if (!sender) {
    const res = await authPool.query('SELECT * FROM email_senders WHERE is_active = true ORDER BY id ASC LIMIT 1');
    sender = res.rows[0] || null;
  }
  if (!sender) throw new Error('No active email sender (email_senders) found in database.');

  cachedSender = sender;
  cachedAt = Date.now();
  return sender;
}

export async function sendTransactionalMail({ to, subject, html, text, fromName = 'Cerilas' }) {
  const sender = await resolveSender();
  const port = Number(sender.port) || 587;
  const transporter = nodemailer.createTransport({
    host: sender.host,
    port,
    secure: sender.secure === null || sender.secure === undefined ? port === 465 : Boolean(sender.secure),
    auth: { user: sender.auth_user, pass: sender.auth_pass }
  });

  return transporter.sendMail({
    from: `"${fromName}" <${sender.email}>`,
    to,
    subject,
    html,
    text
  });
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const FONT_STACK = "'Dosis',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Transactional template matching the tools.cerilas.com auth modal (Dosis, monochrome card, contrast button).
 * Inline styles are the light theme; the prefers-color-scheme block switches clients that support it
 * (Apple Mail, iOS, Outlook.com, Thunderbird) to the site's dark theme.
 */
export function buildEmailTemplate({
  title,
  paragraphs = [],
  buttonText,
  buttonUrl,
  footnote,
  preheader = '',
  linkHint = "If the button doesn't work, copy this link into your browser:"
}) {
  const baseUrl = (process.env.PUBLIC_APP_URL || 'https://tools.cerilas.com').replace(/\/+$/, '');
  const body = paragraphs
    .map((p) => `<p class="em-text" style="margin:0 0 14px;color:#3f3f46;font-size:15px;line-height:1.65;font-family:${FONT_STACK};">${escapeHtml(p)}</p>`)
    .join('');
  const button = buttonText && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:26px 0 18px;"><tr>
        <td class="em-btn" align="center" bgcolor="#09090b" style="border-radius:11px;background:#09090b;">
          <a class="em-btn-link" href="${escapeHtml(buttonUrl)}" target="_blank" style="display:block;padding:14px 24px;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;letter-spacing:0.2px;text-decoration:none;border-radius:11px;">${escapeHtml(buttonText)} &rarr;</a>
        </td></tr></table>
      <p class="em-muted" style="margin:0 0 6px;color:#71717a;font-size:12px;line-height:1.6;font-family:${FONT_STACK};">${escapeHtml(linkHint)}</p>
      <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;font-family:${FONT_STACK};"><a class="em-link" href="${escapeHtml(buttonUrl)}" style="color:#52525b;text-decoration:underline;">${escapeHtml(buttonUrl)}</a></p>`
    : '';
  const note = footnote
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:26px;"><tr>
        <td class="em-divider" style="border-top:1px solid #e4e4e7;padding-top:18px;">
          <p class="em-muted" style="margin:0;color:#71717a;font-size:13px;line-height:1.6;font-family:${FONT_STACK};">${escapeHtml(footnote)}</p>
        </td></tr></table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  a { text-decoration:none; }
  @media (prefers-color-scheme: dark) {
    .em-bg { background:#000000 !important; }
    .em-card { background:#0f0f11 !important; border-color:rgba(255,255,255,0.12) !important; }
    .em-logo-wrap { background:#1c1c1e !important; border-color:rgba(255,255,255,0.12) !important; }
    .em-title { color:#f5f5f7 !important; }
    .em-text { color:#d4d4d8 !important; }
    .em-muted { color:#a1a1aa !important; }
    .em-link { color:#a1a1aa !important; }
    .em-btn { background:#f5f5f7 !important; }
    .em-btn-link { color:#09090b !important; }
    .em-divider { border-color:rgba(255,255,255,0.08) !important; }
    .em-footer-link { color:#d4d4d8 !important; }
  }
  [data-ogsc] .em-bg { background:#000000 !important; }
  [data-ogsc] .em-card { background:#0f0f11 !important; }
  [data-ogsc] .em-title { color:#f5f5f7 !important; }
  [data-ogsc] .em-text { color:#d4d4d8 !important; }
  [data-ogsc] .em-btn { background:#f5f5f7 !important; }
  [data-ogsc] .em-btn-link { color:#09090b !important; }
  @media (max-width:600px) { .em-pad { padding:28px 22px !important; } }
</style>
</head>
<body class="em-bg" style="margin:0;padding:0;background:#f4f4f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader || title)}</div>
  <table class="em-bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f4f5" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 16px;">
      <table class="em-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;">
        <tr><td class="em-pad" style="padding:36px 36px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 22px;"><tr>
            <td class="em-logo-wrap" align="center" valign="middle" width="56" height="56" style="width:56px;height:56px;border-radius:16px;background:#f4f4f5;border:1px solid #e4e4e7;">
              <img src="${baseUrl}/platform-logo.png" width="32" height="32" alt="Cerilas" style="display:block;width:32px;height:32px;border:0;outline:none;margin:0 auto;">
            </td></tr></table>
          <h1 class="em-title" style="margin:0 0 22px;color:#1d1d1f;font-family:${FONT_STACK};font-size:24px;font-weight:700;line-height:1.3;text-align:center;letter-spacing:-0.2px;">${escapeHtml(title)}</h1>
          ${body}${button}${note}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">
        <tr><td align="center" style="padding:22px 16px 0;">
          <p class="em-muted" style="margin:0;color:#71717a;font-family:${FONT_STACK};font-size:12px;line-height:1.7;">
            <a class="em-footer-link" href="${baseUrl}" style="color:#3f3f46;font-weight:600;text-decoration:none;">Cerilas' Tools</a>
            &nbsp;·&nbsp;
            <a class="em-footer-link" href="${baseUrl}/growth" style="color:#3f3f46;font-weight:600;text-decoration:none;">GrowthControl</a>
            <br>© ${new Date().getFullYear()} Cerilas. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
