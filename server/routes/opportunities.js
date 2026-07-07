import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

const extractTcmbRate = (xml, currencyCode) => {
  const regex = new RegExp(`<Currency[^>]*CurrencyCode="${currencyCode}"[^>]*>[\\s\\S]*?<BanknoteSelling>([\\d.]+)</BanknoteSelling>`);
  const match = xml.match(regex);
  return match ? parseFloat(match[1]) : null;
};

const parsePaymentDate = (dateString) => {
  if (typeof dateString !== 'string') return null;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
};

// Get exchange rates (TCMB)
router.get('/rates', authMiddleware, async (req, res) => {
  try {
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
    const xml = await response.text();

    const usd = extractTcmbRate(xml, 'USD');
    const eur = extractTcmbRate(xml, 'EUR');

    res.json({
      TRY: 1,
      USD: usd || 35, // fallback if parse fails
      EUR: eur || 38
    });
  } catch (err) {
    console.error('Rates fetch error:', err);
    res.status(500).json({ error: 'Kurlar alınamadı' });
  }
});

const fetchHistoricalRates = async (dateString) => {
  const dateObj = parsePaymentDate(dateString);
  if (!dateObj) {
    const err = new Error('Geçerli bir ödeme tarihi seçin');
    err.statusCode = 400;
    throw err;
  }

  for (let i = 0; i < 15; i++) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const sourceDate = `${year}-${month}-${day}`;

    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
    const isToday = todayKey === sourceDate;
    const url = isToday
      ? 'https://www.tcmb.gov.tr/kurlar/today.xml'
      : `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const xml = await res.text();
        const usd = extractTcmbRate(xml, 'USD');
        const eur = extractTcmbRate(xml, 'EUR');
        if (usd || eur) {
          return { TRY: 1, USD: usd, EUR: eur, source: 'TCMB', source_date: sourceDate };
        }
      }
    } catch (err) {
      console.error(`Historical rates fetch error for ${sourceDate}:`, err);
    }
    dateObj.setDate(dateObj.getDate() - 1);
  }

  const err = new Error('Seçilen tarih için TCMB kuru bulunamadı. Lütfen daha sonra tekrar deneyin.');
  err.statusCode = 502;
  throw err;
};

// Get all opportunities
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT o.*, 
        COALESCE(
          (SELECT json_agg(json_build_object('id', op.id, 'amount', op.amount, 'currency', op.currency, 'payment_date', op.payment_date, 'exchange_rates', op.exchange_rates)) 
           FROM opportunity_payments op WHERE op.opportunity_id = o.id), 
          '[]'::json
        ) as payments,
        (SELECT COUNT(*)::int FROM opportunity_todos ot WHERE ot.opportunity_id = o.id AND ot.is_completed = false) as active_todos
      FROM opportunities o 
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Get opportunities error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single opportunity with details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const oppResult = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (oppResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const paymentsResult = await pool.query('SELECT * FROM opportunity_payments WHERE opportunity_id = $1 ORDER BY payment_date DESC', [id]);
    const todosResult = await pool.query('SELECT * FROM opportunity_todos WHERE opportunity_id = $1 ORDER BY sort_order ASC, created_at ASC', [id]);

    const opportunity = oppResult.rows[0];
    opportunity.payments = paymentsResult.rows;
    opportunity.todos = todosResult.rows;

    res.json(opportunity);
  } catch (err) {
    console.error('Get opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create opportunity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, description, application_url, drive_url,
      focus_rating, probability_rating, institution, application_point, application_point_other, total_income, currency, status,
      application_date, expected_end_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO opportunities (
        name, description, application_url, drive_url,
        focus_rating, probability_rating, institution, application_point, application_point_other, total_income, currency, status,
        application_date, expected_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        name, description, application_url, drive_url,
        focus_rating || 0, probability_rating || 0, institution || null, application_point || null, application_point_other || null, total_income || 0, currency || 'TRY', status || 'Aktif',
        application_date || null, expected_end_date || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update opportunity
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, application_url, drive_url,
      focus_rating, probability_rating, institution, application_point, application_point_other, total_income, currency, status,
      application_date, expected_end_date
    } = req.body;

    const result = await pool.query(
      `UPDATE opportunities SET
        name = $1, description = $2, application_url = $3, drive_url = $4,
        focus_rating = $5, probability_rating = $6, institution = $7, application_point = $8, application_point_other = $9, total_income = $10, currency = $11, status = $12,
        application_date = $13, expected_end_date = $14, updated_at = NOW()
      WHERE id = $15 RETURNING *`,
      [
        name, description, application_url, drive_url,
        focus_rating || 0, probability_rating || 0, institution || null, application_point || null, application_point_other || null, total_income || 0, currency || 'TRY', status || 'Aktif',
        application_date || null, expected_end_date || null,
        id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete opportunity
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM opportunities WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Payment
router.post('/:id/payments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, payment_date } = req.body;
    
    if (!amount || !payment_date) return res.status(400).json({ error: 'Amount and payment_date required' });

    const exchangeRates = await fetchHistoricalRates(payment_date);

    const result = await pool.query(
      `INSERT INTO opportunity_payments (opportunity_id, amount, currency, payment_date, exchange_rates)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, amount, currency || 'TRY', payment_date, JSON.stringify(exchangeRates)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add payment error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Delete Payment
router.delete('/:id/payments/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    await pool.query('DELETE FROM opportunity_payments WHERE id = $1', [paymentId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Todo
router.post('/:id/todos', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, deadline } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Text required' });

    const result = await pool.query(
      `INSERT INTO opportunity_todos (opportunity_id, text, deadline)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, text, deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle Todo
router.patch('/:id/todos/:todoId', authMiddleware, async (req, res) => {
  try {
    const { todoId } = req.params;
    const { is_completed } = req.body;
    
    const result = await pool.query(
      `UPDATE opportunity_todos SET is_completed = $1 WHERE id = $2 RETURNING *`,
      [is_completed, todoId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reorder Todos
router.patch('/:id/todos/reorder/bulk', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { id: todo_id, sort_order: index }
    
    // Begin transaction
    await pool.query('BEGIN');
    for (const item of items) {
      await pool.query(
        'UPDATE opportunity_todos SET sort_order = $1 WHERE id = $2 AND opportunity_id = $3',
        [item.sort_order, item.id, id]
      );
    }
    await pool.query('COMMIT');
    
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Reorder todos error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Todo
router.delete('/:id/todos/:todoId', authMiddleware, async (req, res) => {
  try {
    const { todoId } = req.params;
    await pool.query('DELETE FROM opportunity_todos WHERE id = $1', [todoId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
