import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Helper to get current date in TRT (Europe/Istanbul) timezone as YYYY-MM-DD
const getTodayTRT = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

// Check if a YYYY-MM-DD string falls on a weekend (Sat=6, Sun=0)
const isWeekend = (dateStr) => {
  // new Date('YYYY-MM-DD') parses as UTC midnight; getUTCDay is safe here
  const dow = new Date(dateStr).getUTCDay();
  return dow === 0 || dow === 6;
};

const decrementDateString = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
};

// Decrement, skipping over weekends (going backwards)
const decrementSkippingWeekends = (dateStr) => {
  let d = decrementDateString(dateStr);
  while (isWeekend(d)) {
    d = decrementDateString(d);
  }
  return d;
};

// Get today's total focus minutes
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = getTodayTRT();
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
// Weekend logic: weekends are optional. Missing a weekend doesn't break streak.
// Only missing a WEEKDAY breaks the streak.
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

    // Get all worked weekdays (exclude weekend sessions from streak counting, but keep them in total)
    const datesRes = await pool.query(
      `SELECT DISTINCT date_string 
       FROM pomodoro_sessions 
       WHERE user_id = $1 
       ORDER BY date_string DESC`,
      [userId]
    );
    
    // Build a Set of all dates with sessions for O(1) lookup
    const workedDatesSet = new Set(datesRes.rows.map(r => r.date_string));
    
    // Filter to only weekday dates (weekends don't count toward/against streak)
    const weekdayDates = datesRes.rows
      .map(r => r.date_string)
      .filter(d => !isWeekend(d));
    
    let currentStreak = 0;
    
    const todayStr = getTodayTRT();

    // Find the most recent weekday on or before today
    let latestRequiredWeekday = isWeekend(todayStr)
      ? decrementSkippingWeekends(decrementDateString(todayStr))
      : todayStr;
    const prevWeekday = decrementSkippingWeekends(latestRequiredWeekday);

    // Streak is alive if user worked today (weekday) OR worked the most recent previous weekday
    const streakAlive = workedDatesSet.has(latestRequiredWeekday) || workedDatesSet.has(prevWeekday);

    if (weekdayDates.length > 0 && streakAlive) {
      // Walk backwards from the most recent worked weekday
      let expectedDateStr = weekdayDates[0];
      for (const dateStr of weekdayDates) {
        if (dateStr === expectedDateStr) {
          currentStreak++;
          expectedDateStr = decrementSkippingWeekends(expectedDateStr);
        } else {
          break;
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
    const { duration_minutes, task_label, date_string } = req.body;
    const userId = req.user.id;
    // Client strictly knows its local date. Fallback to server calculation just in case.
    const today = date_string || getTodayTRT();

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
