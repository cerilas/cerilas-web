import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Public: get active job listings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM job_listings WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get job listings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all job listings (including inactive)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_listings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get all job listings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create job listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, type, location, description, is_active } = req.body;
    if (!title || !type || !location) {
      return res.status(400).json({ error: 'Title, type and location are required' });
    }
    const result = await pool.query(
      `INSERT INTO job_listings (title, type, location, description, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, type, location, description || null, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create job listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update job listing
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, type, location, description, is_active } = req.body;
    if (!title || !type || !location) {
      return res.status(400).json({ error: 'Title, type and location are required' });
    }
    const result = await pool.query(
      `UPDATE job_listings SET title=$1, type=$2, location=$3, description=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, type, location, description || null, is_active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update job listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: toggle active status
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE job_listings SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete job listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM job_listings WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
