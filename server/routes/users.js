import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to protect routes and ensure requester is an admin (in users table)
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply middleware to all routes below
router.use(authMiddleware);

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
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
      query += ', password_hash = $3';
      params.push(hash);
    }

    query += ' WHERE id = $2 RETURNING id, email, created_at';

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
    
    // Prevent self-deletion if needed, but for now allow with caution
    if (parseInt(id) === req.user.id) {
       // Optional: block self deletion if you want
       // return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
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
