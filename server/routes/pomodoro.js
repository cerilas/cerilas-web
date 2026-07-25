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
    
    let currentStreak = 0;
    let streakBreakDate = null;

    const todayStr = getTodayTRT();

    // Build a set for fast lookup
    const workedDatesSet = new Set(datesRes.rows.map(r => r.date_string));

    // Find the most recent weekday (today if weekday, or last Friday if weekend)
    let latestRequiredWeekday = isWeekend(todayStr)
      ? decrementSkippingWeekends(decrementDateString(todayStr))
      : todayStr;
    const prevWeekday = decrementSkippingWeekends(latestRequiredWeekday);

    // Streak is alive if worked today (weekday) OR the most recent previous weekday
    const streakAlive = workedDatesSet.has(latestRequiredWeekday) || workedDatesSet.has(prevWeekday);

    if (workedDatesSet.size > 0 && streakAlive) {
      // Walk backwards day by day starting from the most recent worked date
      // - If it's a weekday and worked: streak++
      // - If it's a weekday and NOT worked: BREAK (streak ends)
      // - If it's a weekend and worked: streak++ (bonus)
      // - If it's a weekend and NOT worked: skip (no penalty)
      const allWorked = datesRes.rows.map(r => r.date_string);
      const mostRecentWorked = allWorked[0]; // already DESC sorted

      let cursor = mostRecentWorked;

      while (true) {
        const weekend = isWeekend(cursor);
        const worked = workedDatesSet.has(cursor);

        if (weekend) {
          if (worked) {
            currentStreak++; // bonus
          }
          // weekend not worked = skip, no penalty
        } else {
          // weekday
          if (worked) {
            currentStreak++;
          } else {
            // Missing weekday = streak breaks
            streakBreakDate = cursor;
            break;
          }
        }

        cursor = decrementDateString(cursor);

        // Safety: stop going too far back (e.g. more than 2 years)
        const cursorYear = parseInt(cursor.split('-')[0]);
        if (cursorYear < 2024) break;
      }
    }

    res.json({ totalMinutes, currentStreak, streakBreakDate });

  } catch (error) {
    console.error('Error fetching pomodoro overall stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get history of focus minutes grouped by date
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedDays = parseInt(req.query.days, 10) || 7;
    const days = Math.min(Math.max(requestedDays, 1), 365);
    const today = getTodayTRT();
    
    // Use the user-facing TRT date recorded with each session. This keeps the
    // selected range exact and includes today as one of the requested days.
    const result = await pool.query(
      `SELECT date_string as date, SUM(duration_minutes) as total_minutes
       FROM pomodoro_sessions
       WHERE user_id = $1 
         AND date_string::date BETWEEN ($2::date - ($3::int - 1)) AND $2::date
       GROUP BY date_string
       ORDER BY date_string ASC`,
      [userId, today, days]
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
