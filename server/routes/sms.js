import { Router } from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Get settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sms_settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Get sms settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { netgsm_usercode, netgsm_password, netgsm_header, is_active } = req.body;
    const result = await pool.query(
      `UPDATE sms_settings SET
        netgsm_usercode=$1, netgsm_password=$2, netgsm_header=$3, is_active=$4, updated_at=NOW()
       RETURNING *`,
      [netgsm_usercode, netgsm_password, netgsm_header, is_active]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update sms settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sms/send
 * 
 * Authentication:
 * Requires a valid JWT token in the Authorization header.
 * Header: `Authorization: Bearer <token>`
 * 
 * Body:
 * {
 *   "messages": [
 *       {
 *           "msg": "test mesajı",
 *           "no": "510xxxxxxx"
 *       }
 *   ]
 * }
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const settingsResult = await pool.query('SELECT * FROM sms_settings LIMIT 1');
    if (settingsResult.rows.length === 0) {
      return res.status(500).json({ error: 'SMS settings not configured' });
    }
    const settings = settingsResult.rows[0];

    if (!settings.is_active) {
      return res.status(400).json({ error: 'SMS sending is disabled in settings' });
    }

    if (!settings.netgsm_usercode || !settings.netgsm_password || !settings.netgsm_header) {
      return res.status(400).json({ error: 'Netgsm credentials are not fully configured' });
    }

    const authString = Buffer.from(`${settings.netgsm_usercode}:${settings.netgsm_password}`).toString('base64');

    const netgsmPayload = {
      msgheader: settings.netgsm_header,
      messages: messages.map(m => ({
        msg: m.msg,
        no: m.no.replace(/\D/g, '') // remove non-digits
      })),
      encoding: "TR",
      iysfilter: "0",
      appname: "cerilas"
    };

    const response = await fetch('https://api.netgsm.com.tr/sms/rest/v2/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(netgsmPayload)
    });

    const data = await response.json();
    
    // Netgsm responds with {"code": "00", "jobid": "...", "description": "queued"} on success
    if (data.code === "00") {
      return res.json({ success: true, netgsmResponse: data });
    } else {
      return res.status(400).json({ error: data.description || 'SMS sending failed', code: data.code });
    }

  } catch (err) {
    console.error('Send SMS error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
