import { Router } from 'express';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// --- SENDER MANAGEMENT (Admin only) ---

// Get all senders
router.get('/senders', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM email_senders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get senders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create sender
router.post('/senders', authMiddleware, async (req, res) => {
  try {
    const { name, email, host, port, auth_user, auth_pass, secure, provider } = req.body;
    const result = await pool.query(
      `INSERT INTO email_senders (name, email, host, port, auth_user, auth_pass, secure, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, host, port, auth_user, auth_pass, secure ?? true, provider || 'smtp']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create sender error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update sender
router.put('/senders/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, host, port, auth_user, auth_pass, secure, provider, is_active } = req.body;
    const result = await pool.query(
      `UPDATE email_senders SET
        name=$1, email=$2, host=$3, port=$4, auth_user=$5, auth_pass=$6, secure=$7, provider=$8, is_active=$9
       WHERE id=$10 RETURNING *`,
      [name, email, host, port, auth_user, auth_pass, secure, provider, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update sender error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete sender
router.delete('/senders/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM email_senders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete sender error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- EMAIL SENDING API ---

/**
 * POST /api/mail/send
 * Body:
 * {
 *   senderId: number,
 *   to: string | string[],
 *   subject: string,
 *   text: string,
 *   html: string,
 *   cc: string | string[],
 *   bcc: string | string[],
 *   attachments: [{ filename: string, content: string (base64) | Buffer }]
 * }
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { senderId, to, subject, text, html, cc, bcc, attachments } = req.body;

    if (!senderId || !to || !subject) {
      return res.status(400).json({ error: 'senderId, to, and subject are required' });
    }

    // Fetch sender info
    const senderResult = await pool.query('SELECT * FROM email_senders WHERE id = $1 AND is_active = true', [senderId]);
    if (senderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sender not found or inactive' });
    }
    const sender = senderResult.rows[0];

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure, // true for 465, false for other ports
      auth: {
        user: sender.auth_user,
        pass: sender.auth_pass,
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        encoding: a.encoding || 'base64'
      }))
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Send mail error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
