import { Router } from 'express';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_name VARCHAR(240) NOT NULL,
      login_url TEXT,
      domain VARCHAR(255),
      favicon_url TEXT,
      password_encrypted TEXT,
      email VARCHAR(320),
      phone VARCHAR(50),
      note TEXT DEFAULT '',
      login_type VARCHAR(80) NOT NULL DEFAULT 'Şifre',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_saved_accounts_user
      ON saved_accounts(user_id, updated_at DESC);
  `);
};

const getEncryptionKey = () => {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error('Vault encryption key is not configured');
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptPassword = (password, userId) => {
  if (!password) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(`saved-account:${userId}`));
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64')).join('.');
};

const decryptPassword = (payload, userId) => {
  if (!payload) return '';
  const [ivValue, tagValue, encryptedValue] = payload.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted password');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64')
  );
  decipher.setAAD(Buffer.from(`saved-account:${userId}`));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

const normalizeUrl = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
};

const getUrlMeta = (value) => {
  const loginUrl = normalizeUrl(value);
  if (!loginUrl) return { loginUrl: '', domain: '', faviconUrl: '' };
  try {
    const url = new URL(loginUrl);
    const domain = url.hostname.replace(/^www\./, '');
    return {
      loginUrl: url.toString(),
      domain,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    };
  } catch {
    return { loginUrl, domain: '', faviconUrl: '' };
  }
};

const serializeAccount = (row) => ({
  id: row.id,
  account_name: row.account_name,
  login_url: row.login_url,
  domain: row.domain,
  favicon_url: row.favicon_url,
  email: row.email,
  phone: row.phone,
  note: row.note,
  login_type: row.login_type,
  has_password: Boolean(row.password_encrypted),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT *
       FROM saved_accounts
       WHERE user_id = $1
       ORDER BY updated_at DESC, id DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(serializeAccount));
  } catch (err) {
    console.error('Get saved accounts error:', err);
    res.status(500).json({ error: 'Hesaplar yüklenemedi' });
  }
});

router.get('/:id/password', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      'SELECT password_encrypted FROM saved_accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hesap bulunamadı' });
    res.json({ password: decryptPassword(result.rows[0].password_encrypted, req.user.id) });
  } catch (err) {
    console.error('Reveal saved account password error:', err);
    res.status(500).json({ error: 'Şifre çözülemedi' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const {
      account_name,
      login_url,
      password,
      email,
      phone,
      note,
      login_type,
    } = req.body;
    if (!String(account_name || '').trim()) {
      return res.status(400).json({ error: 'Hesap adı zorunludur' });
    }

    const { loginUrl, domain, faviconUrl } = getUrlMeta(login_url);
    const result = await pool.query(
      `INSERT INTO saved_accounts (
        user_id, account_name, login_url, domain, favicon_url,
        password_encrypted, email, phone, note, login_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.id,
        String(account_name).trim(),
        loginUrl || null,
        domain || null,
        faviconUrl || null,
        encryptPassword(String(password || ''), req.user.id),
        String(email || '').trim() || null,
        String(phone || '').trim() || null,
        String(note || '').trim(),
        String(login_type || 'Şifre').trim() || 'Şifre',
      ]
    );
    res.status(201).json(serializeAccount(result.rows[0]));
  } catch (err) {
    console.error('Create saved account error:', err);
    res.status(500).json({ error: 'Hesap kaydedilemedi' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const {
      account_name,
      login_url,
      password,
      email,
      phone,
      note,
      login_type,
    } = req.body;
    if (!String(account_name || '').trim()) {
      return res.status(400).json({ error: 'Hesap adı zorunludur' });
    }

    const { loginUrl, domain, faviconUrl } = getUrlMeta(login_url);
    const passwordEncrypted = password
      ? encryptPassword(String(password), req.user.id)
      : null;
    const result = await pool.query(
      `UPDATE saved_accounts SET
        account_name = $1,
        login_url = $2,
        domain = $3,
        favicon_url = $4,
        password_encrypted = CASE WHEN $5::text IS NULL THEN password_encrypted ELSE $5 END,
        email = $6,
        phone = $7,
        note = $8,
        login_type = $9,
        updated_at = NOW()
      WHERE id = $10 AND user_id = $11
      RETURNING *`,
      [
        String(account_name).trim(),
        loginUrl || null,
        domain || null,
        faviconUrl || null,
        passwordEncrypted,
        String(email || '').trim() || null,
        String(phone || '').trim() || null,
        String(note || '').trim(),
        String(login_type || 'Şifre').trim() || 'Şifre',
        req.params.id,
        req.user.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hesap bulunamadı' });
    res.json(serializeAccount(result.rows[0]));
  } catch (err) {
    console.error('Update saved account error:', err);
    res.status(500).json({ error: 'Hesap güncellenemedi' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      'DELETE FROM saved_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hesap bulunamadı' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete saved account error:', err);
    res.status(500).json({ error: 'Hesap silinemedi' });
  }
});

export default router;
