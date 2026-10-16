import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import authMiddleware, { signAdminToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, is_admin FROM users WHERE LOWER(email) = LOWER($1)',
      [String(email).trim()]
    );
    const user = result.rows[0];

    const valid = user?.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !valid || user.is_admin !== true) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signAdminToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

export default router;
