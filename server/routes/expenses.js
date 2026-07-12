import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const periods = new Set(['monthly', 'yearly']);

const normalize = (body) => {
  const amount = Number(body.amount);
  const period = periods.has(body.period) ? body.period : null;
  const dueDay = period === 'monthly' ? Number(body.due_day) : null;
  if (!String(body.title || '').trim()) throw Object.assign(new Error('Gider başlığı zorunludur'), { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error('Tutar sıfırdan büyük olmalıdır'), { status: 400 });
  if (!period) throw Object.assign(new Error('Geçerli bir gider türü seçin'), { status: 400 });
  if (period === 'monthly' && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
    throw Object.assign(new Error('Son ödeme günü 1–31 arasında olmalıdır'), { status: 400 });
  }
  return {
    title: String(body.title).trim(), note: String(body.note || '').trim(),
    category: String(body.category || 'Diğer').trim(), related_party: String(body.related_party || '').trim(),
    icon: String(body.icon || 'receipt').trim(), amount, period, due_day: dueDay,
  };
};

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Giderler alınamadı' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = normalize(req.body);
    const result = await pool.query(
      `INSERT INTO expenses (title, note, category, related_party, icon, amount, period, due_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item.title, item.note, item.category, item.related_party || null, item.icon, item.amount, item.period, item.due_day]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Gider eklenemedi' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const item = normalize(req.body);
    const result = await pool.query(
      `UPDATE expenses SET title=$1,note=$2,category=$3,related_party=$4,icon=$5,amount=$6,period=$7,due_day=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [item.title, item.note, item.category, item.related_party || null, item.icon, item.amount, item.period, item.due_day, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Gider bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Gider güncellenemedi' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Gider bulunamadı' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Gider silinemedi' });
  }
});

export default router;
