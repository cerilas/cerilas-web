import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Apply middleware to all routes below
router.use(authMiddleware);

// GET admin users (tools.cerilas.com customers share this table but are not listed here)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE is_admin = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user settings
router.get('/settings/me', async (req, res) => {
  try {
    const result = await pool.query('SELECT pomodoro_sound FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch user settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT update user settings
router.put('/settings/me', async (req, res) => {
  try {
    const { pomodoro_sound } = req.body;
    if (!pomodoro_sound) return res.status(400).json({ error: 'Sound is required' });

    const result = await pool.query(
      'UPDATE users SET pomodoro_sound = $1 WHERE id = $2 RETURNING pomodoro_sound',
      [pomodoro_sound, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const check = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, true) RETURNING id, email, created_at',
      [email, hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    let query = 'UPDATE users SET email = $1';
    let params = [email, id];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash = $3, password_changed_at = NOW()';
      params.push(hash);
    }

    query += ' WHERE id = $2 AND is_admin = true RETURNING id, email, created_at';

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });
    }

    // Prevent deleting the last remaining admin
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
    const userCount = parseInt(countResult.rows[0].count);
    
    if (userCount <= 1) {
      return res.status(400).json({ error: 'Sistemdeki son kullanıcıyı silemezsiniz.' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 AND is_admin = true RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
