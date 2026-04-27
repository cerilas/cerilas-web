import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { sendNotificationMail } from './mail.js';

const router = Router();

// Public: submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, category, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message required' });
    }
    const result = await pool.query(
      'INSERT INTO contact_submissions (name, email, category, message) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, category || null, message]
    );

    // Send notification mail
    sendNotificationMail('contact', { name, email, subject: category, message });

    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all submissions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: mark as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE contact_submissions SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM contact_submissions WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
