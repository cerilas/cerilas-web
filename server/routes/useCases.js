import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function buildPublicFilters({ locale, q, tag }) {
  const conditions = ['status = $1'];
  const values = ['published'];
  let index = values.length + 1;

  if (q) {
    const titleField = locale === 'en' ? 'title_en' : 'title_tr';
    const problemField = locale === 'en' ? 'problem_en' : 'problem_tr';
    const solutionField = locale === 'en' ? 'solution_en' : 'solution_tr';
    const seoField = locale === 'en' ? 'seo_description_en' : 'seo_description_tr';

    conditions.push(`(
      ${titleField} ILIKE $${index}
      OR ${problemField} ILIKE $${index}
      OR ${solutionField} ILIKE $${index}
      OR COALESCE(${seoField}, '') ILIKE $${index}
    )`);
    values.push(`%${q}%`);
    index += 1;
  }

  if (tag) {
    conditions.push(`($${index} = ANY(tags_tr) OR $${index} = ANY(tags_en))`);
    values.push(tag);
  }

  return { conditions, values };
}

function buildAdminFilters({ status, q }) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (status && status !== 'all') {
    conditions.push(`status = $${index}`);
    values.push(status);
    index += 1;
  }

  if (q) {
    conditions.push(`(
      title_tr ILIKE $${index}
      OR title_en ILIKE $${index}
      OR slug ILIKE $${index}
      OR problem_tr ILIKE $${index}
      OR problem_en ILIKE $${index}
    )`);
    values.push(`%${q}%`);
  }

  return { conditions, values };
}

function parsePaging(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Public: paginated published use cases
router.get('/', async (req, res) => {
  try {
    console.log('=== GET /api/use-cases HIT ===', { locale: req.query.locale, q: req.query.q, tag: req.query.tag });
    const locale = req.query.locale === 'en' ? 'en' : 'tr';
    const q = String(req.query.q || '').trim();
    const tag = String(req.query.tag || '').trim();
    const { page, limit, offset } = parsePaging(req.query);
    const { conditions, values } = buildPublicFilters({ locale, q, tag });
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM use_cases ${whereClause}`,
      values
    );
    console.log('=== Count Result ===', countResult.rows[0]);

    const dataValues = [...values, limit, offset];
    const rowsResult = await pool.query(
      `SELECT * FROM use_cases
       ${whereClause}
       ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues
    );

    const total = countResult.rows[0]?.total || 0;
    res.json({
      items: rowsResult.rows,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error('Get use cases error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: get all available tags from published use cases
router.get('/tags', async (req, res) => {
  console.log('=== TAGS ENDPOINT HIT ===');
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'tr';
    const tagsField = locale === 'en' ? 'tags_en' : 'tags_tr';

    const result = await pool.query(
      `SELECT DISTINCT unnest(${tagsField}) AS tag
       FROM use_cases
       WHERE status = $1 AND ${tagsField} IS NOT NULL AND array_length(${tagsField}, 1) > 0
       ORDER BY tag`,
      ['published']
    );

    res.json({ tags: result.rows.map(row => row.tag) });
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: paginated all use cases
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const status = String(req.query.status || 'all').trim();
    const q = String(req.query.q || '').trim();
    const { page, limit, offset } = parsePaging(req.query);
    const { conditions, values } = buildAdminFilters({ status, q });
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM use_cases ${whereClause}`,
      values
    );

    const rowsResult = await pool.query(
      `SELECT * FROM use_cases
       ${whereClause}
       ORDER BY updated_at DESC, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const total = countResult.rows[0]?.total || 0;
    res.json({
      items: rowsResult.rows,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error('Admin get use cases error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get single use case by id
router.get('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM use_cases WHERE id = $1 LIMIT 1',
      [Number(req.params.id)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get use case error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: get published use case by slug
router.get('/:slug', async (req, res) => {
  console.log('=== SLUG ENDPOINT HIT ===', req.params.slug);
  try {
    const result = await pool.query(
      'SELECT * FROM use_cases WHERE slug = $1 AND status = $2 LIMIT 1',
      [req.params.slug, 'published']
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get use case error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create use case
router.post('/', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    if (!p.slug || !p.title_tr || !p.title_en || !p.problem_tr || !p.problem_en || !p.solution_tr || !p.solution_en) {
      return res.status(400).json({ error: 'Slug, title, problem and solution fields are required in both languages' });
    }

    const result = await pool.query(
      `INSERT INTO use_cases (
        slug, title_tr, title_en, problem_tr, problem_en, solution_tr, solution_en,
        seo_title_tr, seo_title_en, seo_description_tr, seo_description_en,
        cover_image_url, tags_tr, tags_en, keywords_tr, keywords_en,
        status, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18
      ) RETURNING *`,
      [
        p.slug,
        p.title_tr,
        p.title_en,
        p.problem_tr,
        p.problem_en,
        p.solution_tr,
        p.solution_en,
        p.seo_title_tr || null,
        p.seo_title_en || null,
        p.seo_description_tr || null,
        p.seo_description_en || null,
        p.cover_image_url || null,
        normalizeArray(p.tags_tr),
        normalizeArray(p.tags_en),
        normalizeArray(p.keywords_tr),
        normalizeArray(p.keywords_en),
        p.status === 'published' ? 'published' : 'draft',
        p.status === 'published' ? (p.published_at || new Date()) : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create use case error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update use case
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    if (!p.slug || !p.title_tr || !p.title_en || !p.problem_tr || !p.problem_en || !p.solution_tr || !p.solution_en) {
      return res.status(400).json({ error: 'Slug, title, problem and solution fields are required in both languages' });
    }

    const result = await pool.query(
      `UPDATE use_cases SET
        slug = $1,
        title_tr = $2,
        title_en = $3,
        problem_tr = $4,
        problem_en = $5,
        solution_tr = $6,
        solution_en = $7,
        seo_title_tr = $8,
        seo_title_en = $9,
        seo_description_tr = $10,
        seo_description_en = $11,
        cover_image_url = $12,
        tags_tr = $13,
        tags_en = $14,
        keywords_tr = $15,
        keywords_en = $16,
        status = $17::text,
        published_at = CASE
          WHEN $17::text = 'published' AND published_at IS NULL THEN COALESCE($18::timestamptz, NOW())
          WHEN $17::text = 'published' THEN COALESCE($18::timestamptz, published_at)
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $19
      RETURNING *`,
      [
        p.slug,
        p.title_tr,
        p.title_en,
        p.problem_tr,
        p.problem_en,
        p.solution_tr,
        p.solution_en,
        p.seo_title_tr || null,
        p.seo_title_en || null,
        p.seo_description_tr || null,
        p.seo_description_en || null,
        p.cover_image_url || null,
        normalizeArray(p.tags_tr),
        normalizeArray(p.tags_en),
        normalizeArray(p.keywords_tr),
        normalizeArray(p.keywords_en),
        p.status === 'published' ? 'published' : 'draft',
        p.published_at || null,
        Number(req.params.id),
      ]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update use case error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete use case
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM use_cases WHERE id = $1 RETURNING id', [Number(req.params.id)]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete use case error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;