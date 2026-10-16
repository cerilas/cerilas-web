import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authPool } from '../db.js';
import { getRequestOrigin } from '../utils/googleRedirect.js';
import { sendTransactionalMail, buildEmailTemplate } from '../utils/mailer.js';

const TOKEN_TTL_MINUTES = 60;
const MAX_REQUESTS_PER_USER_WINDOW = 3;
const USER_WINDOW_MINUTES = 15;
const IP_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP_WINDOW = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores bytes beyond 72
const DEFAULT_PUBLIC_URL = 'https://tools.cerilas.com';

(async () => {
  try {
    await authPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ');
    await authPool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        request_ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await authPool.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, created_at)');
  } catch (e) {
    console.error('[Password Reset] Migration failed:', e.message);
  }
})();

const MESSAGES = {
  invalidEmail: 'Please enter a valid email address.',
  rateLimited: 'Too many requests. Please wait a few minutes and try again.',
  requestAccepted: 'If an account exists for this email, a password reset link is on its way. Please check your inbox and spam folder.',
  invalidToken: 'This reset link is invalid or has expired. Please request a new one.',
  passwordLength: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
  serverError: 'Something went wrong. Please try again.',
  resetSuccess: 'Your password has been updated.',
  passwordSet: 'Your password has been set. You can now also sign in with your email address.',
  currentRequired: 'Please enter your current password.',
  currentWrong: 'Your current password is incorrect.',
  sameAsCurrent: 'Your new password must be different from your current password.',
  tooManyAttempts: 'Too many incorrect attempts. Please wait 15 minutes or reset your password by email.'
};

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin || '');

/**
 * The reset link must never be built from an attacker-controlled Host header,
 * otherwise a forged request could mail the victim a link to a foreign domain.
 */
function resolvePublicBaseUrl(req) {
  const allowed = [process.env.PUBLIC_APP_URL, DEFAULT_PUBLIC_URL]
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ''));
  const origin = getRequestOrigin(req);
  if (origin && allowed.includes(origin)) return origin;
  if (origin && isLocalOrigin(origin) && process.env.NODE_ENV !== 'production') return origin;
  return allowed[0];
}

const clientIp = (req) => String(req.get('x-forwarded-for') || '').split(',')[0].trim() || req.ip || 'unknown';

const ipHits = new Map();
function isIpRateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < IP_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) {
    for (const [key, list] of ipHits) {
      if (!list.some((t) => now - t < IP_WINDOW_MS)) ipHits.delete(key);
    }
  }
  return hits.length > MAX_REQUESTS_PER_IP_WINDOW;
}

function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return '';
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function buildResetEmail({ name, resetUrl, isGoogleOnly }) {
  return {
    subject: 'Reset your Cerilas password',
    html: buildEmailTemplate({
      title: 'Reset your password',
      paragraphs: [
        `Hi ${name},`,
        isGoogleOnly
          ? 'You currently sign in with Google. Use the button below to set a password so you can also sign in with your email address.'
          : 'We received a request to reset the password for your Cerilas account. Click the button below to choose a new one.',
        `This link expires in ${TOKEN_TTL_MINUTES} minutes and can only be used once.`
      ],
      buttonText: 'Set a new password',
      buttonUrl: resetUrl,
      preheader: `Your password reset link is valid for ${TOKEN_TTL_MINUTES} minutes.`,
      footnote: "If you didn't request this, you can safely ignore this email. Your password won't change."
    }),
    text: `Hi ${name},\n\nOpen this link to set a new password (valid for ${TOKEN_TTL_MINUTES} minutes):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`
  };
}

function buildChangedEmail({ name, isFirstPassword = false }) {
  if (isFirstPassword) {
    return {
      subject: 'A password was added to your Cerilas account',
      html: buildEmailTemplate({
        title: 'Password added to your account',
        paragraphs: [
          `Hi ${name},`,
          'A password was just set for your Cerilas account. You can now sign in with your email and password in addition to Google.'
        ],
        footnote: "If you didn't make this change, reset your password right away and contact us at info@cerilas.com."
      }),
      text: `Hi ${name},\n\nA password was just set for your Cerilas account. If this wasn't you, reset your password immediately and contact info@cerilas.com.`
    };
  }
  return {
    subject: 'Your Cerilas password was changed',
    html: buildEmailTemplate({
      title: 'Your password was changed',
      paragraphs: [
        `Hi ${name},`,
        'The password for your Cerilas account was just changed, and sessions on your other devices were signed out.'
      ],
      footnote: "If you didn't make this change, request a new password reset right away and contact us at info@cerilas.com."
    }),
    text: `Hi ${name},\n\nThe password for your Cerilas account was just changed. If this wasn't you, reset your password immediately and contact info@cerilas.com.`
  };
}

const displayName = (user) => user.first_name || (user.email ? user.email.split('@')[0] : 'there');

async function processResetRequest({ email, ip, baseUrl }) {
  const userRes = await authPool.query(
    'SELECT id, email, first_name, password_hash, google_id FROM users WHERE LOWER(email) = $1 LIMIT 1',
    [email]
  );
  const user = userRes.rows[0];
  if (!user) return;

  const recent = await authPool.query(
    `SELECT COUNT(*)::int AS count FROM password_reset_tokens
     WHERE user_id = $1 AND created_at > NOW() - ($2 || ' minutes')::interval`,
    [String(user.id), String(USER_WINDOW_MINUTES)]
  );
  if (recent.rows[0].count >= MAX_REQUESTS_PER_USER_WINDOW) {
    console.warn(`[Password Reset] Per-user limit reached for user ${user.id}`);
    return;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  await authPool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [String(user.id)]
  );
  await authPool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, request_ip)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, $4)`,
    [String(user.id), hashToken(token), String(TOKEN_TTL_MINUTES), ip || null]
  );

  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const mail = buildResetEmail({
    name: displayName(user),
    resetUrl,
    isGoogleOnly: !user.password_hash && !!user.google_id
  });
  await sendTransactionalMail({ to: user.email, ...mail });
  console.log(`[Password Reset] Reset email sent to user ${user.id}`);
}

// `language` is accepted for API compatibility; emails are always sent in English.
export async function sendPasswordResetEmail(req, email, language) {
  await processResetRequest({
    email: String(email || '').trim().toLowerCase(),
    ip: clientIp(req),
    baseUrl: resolvePublicBaseUrl(req)
  });
}

async function findActiveToken(token, client = authPool, { lock = false } = {}) {
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 200) return null;
  const res = await client.query(
    `SELECT t.id, t.user_id, u.email
     FROM password_reset_tokens t
     JOIN users u ON u.id::text = t.user_id
     WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > NOW()
     LIMIT 1${lock ? ' FOR UPDATE OF t' : ''}`,
    [hashToken(token)]
  );
  return res.rows[0] || null;
}

/**
 * Must run inside a transaction on `client`. Revokes existing sessions and pending reset links.
 */
async function storeNewPassword(client, userId, password) {
  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
  // App clock (not DB NOW()) so the JWT issued afterwards is never older than password_changed_at.
  const changedAt = new Date();
  const userRes = await client.query(
    'UPDATE users SET password_hash = $1, password_changed_at = $2 WHERE id::text = $3 RETURNING *',
    [passwordHash, changedAt, String(userId)]
  );
  await client.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [String(userId)]
  );
  return userRes.rows[0];
}

const isValidNewPassword = (password) =>
  password.length >= MIN_PASSWORD_LENGTH && Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_LENGTH;

const CHANGE_FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_CHANGE_FAILURES = 5;
const changeFailures = new Map();
function recentChangeFailures(userId) {
  const now = Date.now();
  const list = (changeFailures.get(userId) || []).filter((t) => now - t < CHANGE_FAIL_WINDOW_MS);
  changeFailures.set(userId, list);
  return list;
}

/**
 * @param {{ issueToken: (user: object) => string, formatUser: (row: object) => object, requireAuth: Function }} deps
 */
export function createPasswordResetRouter({ issueToken, formatUser, requireAuth }) {
  const router = Router();

  /**
   * Signed-in password change. Email/password accounts must confirm the current password;
   * Google-only accounts (no password yet) can set their first password.
   */
  router.post('/change', requireAuth, async (req, res) => {
    const t = MESSAGES;
    const currentPassword = typeof req.body?.current_password === 'string' ? req.body.current_password : '';
    const newPassword = typeof req.body?.new_password === 'string' ? req.body.new_password : '';
    const userKey = String(req.user.id);

    if (!isValidNewPassword(newPassword)) {
      return res.status(400).json({ error: t.passwordLength });
    }
    if (recentChangeFailures(userKey).length >= MAX_CHANGE_FAILURES) {
      return res.status(429).json({ error: t.tooManyAttempts });
    }

    const client = await authPool.connect();
    let updatedUser = null;
    let isFirstPassword = false;
    try {
      await client.query('BEGIN');
      const userRes = await client.query('SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
      const current = userRes.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: t.serverError });
      }

      isFirstPassword = !current.password_hash;
      if (!isFirstPassword) {
        if (!currentPassword) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: t.currentRequired });
        }
        if (!(await bcrypt.compare(currentPassword, current.password_hash))) {
          await client.query('ROLLBACK');
          recentChangeFailures(userKey).push(Date.now());
          return res.status(400).json({ error: t.currentWrong });
        }
        if (currentPassword === newPassword) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: t.sameAsCurrent });
        }
      }

      updatedUser = await storeNewPassword(client, current.id, newPassword);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Password Change] Error:', err.message);
      return res.status(500).json({ error: t.serverError });
    } finally {
      client.release();
    }

    changeFailures.delete(userKey);
    res.json({
      success: true,
      message: isFirstPassword ? t.passwordSet : t.resetSuccess,
      token: issueToken(updatedUser),
      user: formatUser(updatedUser)
    });

    sendTransactionalMail({
      to: updatedUser.email,
      ...buildChangedEmail({ name: displayName(updatedUser), isFirstPassword })
    }).catch((err) => console.error('[Password Change] Confirmation email failed:', err.message));
  });

  router.post('/forgot', async (req, res) => {
    const t = MESSAGES;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: t.invalidEmail });
    }
    const ip = clientIp(req);
    if (isIpRateLimited(ip)) {
      return res.status(429).json({ error: t.rateLimited });
    }

    // Respond before any lookup so response content and timing never reveal whether the email is registered.
    res.json({ success: true, message: t.requestAccepted });

    processResetRequest({ email, ip, baseUrl: resolvePublicBaseUrl(req) })
      .catch((err) => console.error('[Password Reset] Failed to process request:', err.message));
  });

  router.post('/validate', async (req, res) => {
    const t = MESSAGES;
    try {
      const row = await findActiveToken(req.body?.token);
      if (!row) return res.status(400).json({ valid: false, error: t.invalidToken });
      res.json({ valid: true, email: maskEmail(row.email) });
    } catch (err) {
      console.error('[Password Reset] Validate error:', err.message);
      res.status(500).json({ valid: false, error: t.serverError });
    }
  });

  router.post('/reset', async (req, res) => {
    const t = MESSAGES;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidNewPassword(password)) {
      return res.status(400).json({ error: t.passwordLength });
    }

    const client = await authPool.connect();
    let updatedUser = null;
    try {
      await client.query('BEGIN');
      const row = await findActiveToken(req.body?.token, client, { lock: true });
      if (!row) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: t.invalidToken });
      }

      updatedUser = await storeNewPassword(client, row.user_id, password);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Password Reset] Reset error:', err.message);
      return res.status(500).json({ error: t.serverError });
    } finally {
      client.release();
    }

    res.json({
      success: true,
      message: t.resetSuccess,
      token: issueToken(updatedUser),
      user: formatUser(updatedUser)
    });

    sendTransactionalMail({ to: updatedUser.email, ...buildChangedEmail({ name: displayName(updatedUser) }) })
      .catch((err) => console.error('[Password Reset] Confirmation email failed:', err.message));
  });

  return router;
}
