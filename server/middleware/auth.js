import jwt from 'jsonwebtoken';
import pool from '../db.js';

// JWT_SECRET and the users table are shared with tools.cerilas.com, so admin tokens carry their
// own audience and every request re-checks users.is_admin.
export const ADMIN_TOKEN_AUDIENCE = 'cerilas-admin';

export function signAdminToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d', audience: ADMIN_TOKEN_AUDIENCE }
  );
}

export async function resolveAdminFromToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: ADMIN_TOKEN_AUDIENCE });
  } catch {
    return null;
  }

  const result = await pool.query(
    'SELECT id, email, is_admin, password_changed_at FROM users WHERE id = $1',
    [decoded.id]
  );
  const user = result.rows[0];
  if (!user || user.is_admin !== true) return null;

  if (user.password_changed_at && decoded.iat) {
    const changedAtSec = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
    if (decoded.iat < changedAtSec) return null;
  }

  return { id: user.id, email: user.email };
}

export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const admin = await resolveAdminFromToken(header.split(' ')[1]);
    if (!admin) return res.status(401).json({ error: 'Invalid token' });
    req.user = admin;
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
