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

/**
 * Branded transactional template, visually aligned with cerilas.com notification mails.
 */
export function buildEmailTemplate({ title, paragraphs = [], buttonText, buttonUrl, footnote }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(p)}</p>`)
    .join('');
  const button = buttonText && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td style="border-radius:10px;background:#0891b2;">
        <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:10px;">${escapeHtml(buttonText)}</a>
      </td></tr></table>
      <p style="margin:0 0 16px;color:#64748b;font-size:12px;line-height:1.6;word-break:break-all;">${escapeHtml(buttonUrl)}</p>`
    : '';
  const note = footnote
    ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;line-height:1.6;">${escapeHtml(footnote)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:#0891b2;padding:24px 32px;">
          <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:2px;">CERİLAS</div>
          <div style="color:#cffafe;font-size:12px;margin-top:4px;">Tools &amp; GrowthControl</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
          ${body}${button}${note}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center;">
          © ${new Date().getFullYear()} Cerilas · <a href="https://tools.cerilas.com" style="color:#0891b2;text-decoration:none;">tools.cerilas.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
