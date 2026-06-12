import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Get exchange rates (TCMB)
router.get('/rates', authMiddleware, async (req, res) => {
  try {
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
    const xml = await response.text();
    
    const extractRate = (currencyCode) => {
      const regex = new RegExp(`<Currency[^>]*CurrencyCode="${currencyCode}"[^>]*>[\\s\\S]*?<BanknoteSelling>([\\d.]+)</BanknoteSelling>`);
      const match = xml.match(regex);
      return match ? parseFloat(match[1]) : null;
    };

    const usd = extractRate('USD');
    const eur = extractRate('EUR');

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

// Get all opportunities
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM opportunities ORDER BY created_at DESC');
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
    const todosResult = await pool.query('SELECT * FROM opportunity_todos WHERE opportunity_id = $1 ORDER BY is_completed ASC, deadline ASC', [id]);

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
      focus_rating, probability_rating, total_income, currency,
      application_date, expected_end_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO opportunities (
        name, description, application_url, drive_url,
        focus_rating, probability_rating, total_income, currency,
        application_date, expected_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name, description, application_url, drive_url,
        focus_rating || 0, probability_rating || 0, total_income || 0, currency || 'TRY',
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
      focus_rating, probability_rating, total_income, currency,
      application_date, expected_end_date
    } = req.body;

    const result = await pool.query(
      `UPDATE opportunities SET
        name = $1, description = $2, application_url = $3, drive_url = $4,
        focus_rating = $5, probability_rating = $6, total_income = $7, currency = $8,
        application_date = $9, expected_end_date = $10, updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [
        name, description, application_url, drive_url,
        focus_rating, probability_rating, total_income, currency,
        application_date || null, expected_end_date || null, id
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

    const result = await pool.query(
      `INSERT INTO opportunity_payments (opportunity_id, amount, currency, payment_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, amount, currency || 'TRY', payment_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add payment error:', err);
    res.status(500).json({ error: err.message });
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
