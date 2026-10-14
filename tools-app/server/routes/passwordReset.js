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
  en: {
    invalidEmail: 'Please enter a valid email address.',
    rateLimited: 'Too many requests. Please wait a few minutes and try again.',
    requestAccepted: 'If an account exists for this email, a password reset link is on its way. Please check your inbox and spam folder.',
    invalidToken: 'This reset link is invalid or has expired. Please request a new one.',
    passwordLength: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    serverError: 'Something went wrong. Please try again.',
    resetSuccess: 'Your password has been updated.'
  },
  tr: {
    invalidEmail: 'Lütfen geçerli bir e-posta adresi girin.',
    rateLimited: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
    requestAccepted: 'Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.',
    invalidToken: 'Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin.',
    passwordLength: `Şifre ${MIN_PASSWORD_LENGTH} ile ${MAX_PASSWORD_LENGTH} karakter arasında olmalıdır.`,
    serverError: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    resetSuccess: 'Şifreniz güncellendi.'
  }
};

const pickLang = (value) => (String(value || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');
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

function buildResetEmail({ lang, name, resetUrl, isGoogleOnly }) {
  if (lang === 'tr') {
    return {
      subject: 'Cerilas şifre sıfırlama bağlantınız',
      html: buildEmailTemplate({
        title: 'Şifrenizi sıfırlayın',
        paragraphs: [
          `Merhaba ${name},`,
          isGoogleOnly
            ? 'Hesabınıza şu an Google ile giriş yapıyorsunuz. Aşağıdaki bağlantıyla bir şifre belirleyerek e-posta ve şifreyle de giriş yapabilirsiniz.'
            : 'Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.',
          `Bu bağlantı ${TOKEN_TTL_MINUTES} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`
        ],
        buttonText: 'Yeni şifre belirle',
        buttonUrl: resetUrl,
        preheader: `Şifre sıfırlama bağlantınız ${TOKEN_TTL_MINUTES} dakika geçerlidir.`,
        linkHint: 'Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:',
        footnote: 'Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmeyecektir.'
      }),
      text: `Merhaba ${name},\n\nYeni şifrenizi belirlemek için bu bağlantıyı açın (${TOKEN_TTL_MINUTES} dakika geçerli):\n${resetUrl}\n\nBu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`
    };
  }
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

function buildChangedEmail({ lang, name }) {
  if (lang === 'tr') {
    return {
      subject: 'Cerilas şifreniz değiştirildi',
      html: buildEmailTemplate({
        title: 'Şifreniz değiştirildi',
        paragraphs: [
          `Merhaba ${name},`,
          'Cerilas hesabınızın şifresi az önce değiştirildi ve diğer cihazlardaki oturumlarınız kapatıldı.'
        ],
        footnote: 'Bu değişikliği siz yapmadıysanız hemen yeni bir şifre sıfırlama isteyin ve bize info@cerilas.com adresinden ulaşın.'
      }),
      text: `Merhaba ${name},\n\nCerilas hesabınızın şifresi az önce değiştirildi. Bu siz değilseniz hemen şifrenizi sıfırlayın ve info@cerilas.com adresine yazın.`
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

const displayName = (user, lang) => user.first_name || (user.email ? user.email.split('@')[0] : (lang === 'tr' ? 'kullanıcı' : 'there'));

async function processResetRequest({ email, lang, ip, baseUrl }) {
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
    lang,
    name: displayName(user, lang),
    resetUrl,
    isGoogleOnly: !user.password_hash && !!user.google_id
  });
  await sendTransactionalMail({ to: user.email, ...mail });
  console.log(`[Password Reset] Reset email sent to user ${user.id}`);
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
 * @param {{ issueToken: (user: object) => string, formatUser: (row: object) => object }} deps
 */
export function createPasswordResetRouter({ issueToken, formatUser }) {
  const router = Router();

  router.post('/forgot', async (req, res) => {
    const lang = pickLang(req.body?.language);
    const t = MESSAGES[lang];
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

    processResetRequest({ email, lang, ip, baseUrl: resolvePublicBaseUrl(req) })
      .catch((err) => console.error('[Password Reset] Failed to process request:', err.message));
  });

  router.post('/validate', async (req, res) => {
    const t = MESSAGES[pickLang(req.body?.language)];
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
    const lang = pickLang(req.body?.language);
    const t = MESSAGES[lang];
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_LENGTH) {
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

      const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
      // App clock (not DB NOW()) so the JWT issued below is never older than password_changed_at.
      const changedAt = new Date();
      const userRes = await client.query(
        'UPDATE users SET password_hash = $1, password_changed_at = $2 WHERE id::text = $3 RETURNING *',
        [passwordHash, changedAt, row.user_id]
      );
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [row.user_id]
      );
      await client.query('COMMIT');
      updatedUser = userRes.rows[0];
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

    sendTransactionalMail({ to: updatedUser.email, ...buildChangedEmail({ lang, name: displayName(updatedUser, lang) }) })
      .catch((err) => console.error('[Password Reset] Confirmation email failed:', err.message));
  });

  return router;
}
