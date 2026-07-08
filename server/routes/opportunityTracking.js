import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracked_opportunities (
      id SERIAL PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      description TEXT DEFAULT '',
      note TEXT DEFAULT '',
      link_url TEXT,
      scrap_url TEXT,
      domain VARCHAR(255),
      favicon_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tracked_opportunities_created ON tracked_opportunities(created_at DESC);
  `);
};

const normalizeUrl = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
};

const getUrlMeta = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return { linkUrl: '', domain: '', faviconUrl: '' };

  try {
    const url = new URL(normalized);
    const domain = url.hostname.replace(/^www\./, '');
    return {
      linkUrl: url.toString(),
      domain,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    };
  } catch {
    return { linkUrl: normalized, domain: '', faviconUrl: '' };
  }
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query('SELECT * FROM tracked_opportunities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get tracked opportunities error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const { title, description, note, link_url, scrap_url } = req.body;
    if (!String(title || '').trim()) {
      return res.status(400).json({ error: 'Başlık zorunludur' });
    }

    const { linkUrl, domain, faviconUrl } = getUrlMeta(link_url);
    const normalizedScrapUrl = normalizeUrl(scrap_url);

    const result = await pool.query(
      `INSERT INTO tracked_opportunities (
        title, description, note, link_url, scrap_url, domain, favicon_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title.trim(),
        description || '',
        note || '',
        linkUrl || null,
        normalizedScrapUrl || null,
        domain || null,
        faviconUrl || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { title, description, note, link_url, scrap_url } = req.body;
    if (!String(title || '').trim()) {
      return res.status(400).json({ error: 'Başlık zorunludur' });
    }

    const { linkUrl, domain, faviconUrl } = getUrlMeta(link_url);
    const normalizedScrapUrl = normalizeUrl(scrap_url);

    const result = await pool.query(
      `UPDATE tracked_opportunities SET
        title = $1,
        description = $2,
        note = $3,
        link_url = $4,
        scrap_url = $5,
        domain = $6,
        favicon_url = $7,
        updated_at = NOW()
      WHERE id = $8 RETURNING *`,
      [
        title.trim(),
        description || '',
        note || '',
        linkUrl || null,
        normalizedScrapUrl || null,
        domain || null,
        faviconUrl || null,
        id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    await pool.query('DELETE FROM tracked_opportunities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
