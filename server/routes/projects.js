import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Public: get all active projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE status = $1 ORDER BY sort_order ASC, created_at DESC',
      ['active']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: get single project by slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all projects (including inactive)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    const result = await pool.query(
      `INSERT INTO projects (slug, title_tr, title_en, short_desc_tr, short_desc_en,
        challenge_tr, challenge_en, solution_tr, solution_en, impact_tr, impact_en,
        date_tr, date_en, tags_tr, tags_en, technologies, grant_info, university,
        academic_staff, partner, budget, image_url, sort_order, status,
        seo_title_tr, seo_title_en, seo_description_tr, seo_description_en)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
      RETURNING *`,
      [p.slug, p.title_tr, p.title_en, p.short_desc_tr, p.short_desc_en,
       p.challenge_tr, p.challenge_en, p.solution_tr, p.solution_en, p.impact_tr, p.impact_en,
       p.date_tr, p.date_en, p.tags_tr || [], p.tags_en || [], p.technologies || [],
       p.grant_info || null, p.university || null, p.academic_staff || null,
       p.partner || null, p.budget || null, p.image_url || null,
       p.sort_order || 0, p.status || 'active',
       p.seo_title_tr || null, p.seo_title_en || null, p.seo_description_tr || null, p.seo_description_en || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    const result = await pool.query(
      `UPDATE projects SET
        slug=$1, title_tr=$2, title_en=$3, short_desc_tr=$4, short_desc_en=$5,
        challenge_tr=$6, challenge_en=$7, solution_tr=$8, solution_en=$9,
        impact_tr=$10, impact_en=$11, date_tr=$12, date_en=$13,
        tags_tr=$14, tags_en=$15, technologies=$16, grant_info=$17,
        university=$18, academic_staff=$19, partner=$20, budget=$21,
        image_url=$22, sort_order=$23, status=$24, updated_at=NOW(),
        seo_title_tr=$25, seo_title_en=$26, seo_description_tr=$27, seo_description_en=$28
      WHERE id=$29 RETURNING *`,
      [p.slug, p.title_tr, p.title_en, p.short_desc_tr, p.short_desc_en,
       p.challenge_tr, p.challenge_en, p.solution_tr, p.solution_en,
       p.impact_tr, p.impact_en, p.date_tr, p.date_en,
       p.tags_tr || [], p.tags_en || [], p.technologies || [],
       p.grant_info || null, p.university || null, p.academic_staff || null,
       p.partner || null, p.budget || null, p.image_url || null,
       p.sort_order || 0, p.status || 'active',
       p.seo_title_tr || null, p.seo_title_en || null, p.seo_description_tr || null, p.seo_description_en || null,
       req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
