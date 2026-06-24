import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get today's total focus minutes
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM pomodoro_sessions
       WHERE user_id = $1 AND date_string = $2`,
      [userId, today]
    );

    res.json({ totalMinutes: parseInt(result.rows[0].total_minutes, 10) });
  } catch (error) {
    console.error('Error fetching today\'s pomodoro stats:', error);
    res.status(500).json({ error: 'Failed to fetch pomodoro stats' });
  }
});

// Get overall stats (total minutes, streak)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalRes = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM pomodoro_sessions
       WHERE user_id = $1`,
      [userId]
    );
    const totalMinutes = parseInt(totalRes.rows[0].total_minutes, 10);

    const datesRes = await pool.query(
      `SELECT DISTINCT date_string 
       FROM pomodoro_sessions 
       WHERE user_id = $1 
       ORDER BY date_string DESC`,
      [userId]
    );
    
    const dates = datesRes.rows.map(r => r.date_string);
    
    let currentStreak = 0;
    
    // Create Date objects in local time equivalent using UTC strings to avoid timezone shift
    const today = new Date();
    // Use manual string split based on timezone offset for safety, or just standard string
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset*60*1000));
    const todayStr = todayLocal.toISOString().split('T')[0];
    
    const yesterdayLocal = new Date(todayLocal.getTime() - 24*60*60*1000);
    const yesterdayStr = yesterdayLocal.toISOString().split('T')[0];

    if (dates.length > 0) {
      if (dates[0] === todayStr || dates[0] === yesterdayStr) {
        let expectedDate = new Date(dates[0]);
        for (const dateStr of dates) {
          if (dateStr === expectedDate.toISOString().split('T')[0]) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    res.json({ totalMinutes, currentStreak });
  } catch (error) {
    console.error('Error fetching pomodoro overall stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get history of focus minutes grouped by date
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    
    // Fetch sessions created within the last 'days' and group by date_string
    const result = await pool.query(
      `SELECT date_string as date, SUM(duration_minutes) as total_minutes
       FROM pomodoro_sessions
       WHERE user_id = $1 
         AND created_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY date_string
       ORDER BY date_string ASC`,
      [userId, days]
    );

    res.json(result.rows.map(r => ({
      date: r.date,
      totalMinutes: parseInt(r.total_minutes, 10)
    })));
  } catch (error) {
    console.error('Error fetching pomodoro history:', error);
    res.status(500).json({ error: 'Failed to fetch pomodoro history' });
  }
});

// Get detailed sessions for a specific date
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query; // Expecting YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const result = await pool.query(
      `SELECT id, duration_minutes, task_label, created_at
       FROM pomodoro_sessions
       WHERE user_id = $1 AND date_string = $2
       ORDER BY created_at DESC`,
      [userId, date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pomodoro sessions for date:', error);
    res.status(500).json({ error: 'Failed to fetch pomodoro sessions' });
  }
});

// Delete a session
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const result = await pool.query(
      `DELETE FROM pomodoro_sessions 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }

    res.json({ success: true, deleted_id: sessionId });
  } catch (error) {
    console.error('Error deleting pomodoro session:', error);
    res.status(500).json({ error: 'Failed to delete pomodoro session' });
  }
});

// Save a completed session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { duration_minutes, task_label } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!duration_minutes || typeof duration_minutes !== 'number' || duration_minutes <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    const result = await pool.query(
      `INSERT INTO pomodoro_sessions (user_id, duration_minutes, date_string, task_label)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, duration_minutes, today, task_label || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving pomodoro session:', error);
    res.status(500).json({ error: 'Failed to save pomodoro session' });
  }
});

export default router;
