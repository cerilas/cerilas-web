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
    res.status(500).json({ error: err.message });
  }
});

// --- PLATFORM MAIL SETTINGS ---

// Get settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mail_settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Get mail settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { 
      sender_id, 
      newsletter_active, newsletter_recipients,
      contact_active, contact_recipients,
      job_active, job_recipients,
      opp_digest_active, opp_digest_recipients
    } = req.body;

    const result = await pool.query(
      `UPDATE mail_settings SET
        sender_id=$1, newsletter_active=$2, newsletter_recipients=$3,
        contact_active=$4, contact_recipients=$5,
        job_active=$6, job_recipients=$7,
        opp_digest_active=$8, opp_digest_recipients=$9, updated_at=NOW()
       RETURNING *`,
      [sender_id, newsletter_active, newsletter_recipients, contact_active, contact_recipients, job_active, job_recipients, opp_digest_active, opp_digest_recipients]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update mail settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- EMAIL SENDING API ---

/**
 * POST /api/mail/send
 * 
 * Authentication:
 * Requires a valid JWT token in the Authorization header.
 * Header: `Authorization: Bearer <token>`
 * 
 * To get a token:
 * POST /api/auth/login
 * Body: { "email": "admin_email", "password": "admin_password" }
 * Returns: { "token": "...", "user": { ... } }
 * 
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

// --- INTERNAL NOTIFICATION UTILITY ---

const getEmailTemplate = (title, content, buttonText, buttonUrl) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 16px; overflow: hidden; border: 1px solid #eee;">
    <div style="background-color: #0891b2; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">CERİLAS</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Yüksek Teknoloji</p>
    </div>
    <div style="padding: 40px; background-color: white;">
      <h2 style="color: #111; margin-top: 0; font-size: 20px;">${title}</h2>
      <div style="color: #444; line-height: 1.6; font-size: 15px; margin-bottom: 30px;">
        ${content}
      </div>
      <a href="${buttonUrl}" style="display: inline-block; background-color: #0891b2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(8,145,178,0.2);">
        ${buttonText}
      </a>
      <p style="margin-top: 30px; font-size: 12px; color: #999;">Bu email www.cerilas.com üzerinden otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
`;

export async function sendNotificationMail(type, data) {
  try {
    const settingsResult = await pool.query('SELECT * FROM mail_settings LIMIT 1');
    if (settingsResult.rows.length === 0) return;
    const s = settingsResult.rows[0];

    let active = false;
    let recipients = '';
    let subject = '';
    let html = '';
    let title = '';
    let content = '';
    let btnText = 'Paneli Görüntüle';
    let btnUrl = `${process.env.FRONTEND_URL || 'https://www.cerilas.com'}/admin`;

    if (type === 'newsletter') {
      active = s.newsletter_active;
      recipients = s.newsletter_recipients;
      subject = 'Yeni Newsletter Kaydı! 📬';
      title = 'Yeni Bir Aboneniz Var!';
      content = `Web siteniz üzerinden yeni bir kullanıcı newsletter bültenine kayıt oldu:<br><br><b>Email:</b> ${data.email}`;
      btnUrl += '/newsletter';
    } else if (type === 'contact') {
      active = s.contact_active;
      recipients = s.contact_recipients;
      subject = 'Yeni İletişim Formu Mesajı! ✉️';
      title = 'Yeni İletişim Formu Bildirimi';
      content = `
        Siteniz üzerinden yeni bir mesaj aldınız:<br><br>
        <b>Ad Soyad:</b> ${data.name}<br>
        <b>Email:</b> ${data.email}<br>
        <b>Kategori:</b> ${data.subject || 'Genel'}<br>
        <b>Mesaj:</b><br>${data.message}
      `;
      btnUrl += '/contacts';
    } else if (type === 'job') {
      active = s.job_active;
      recipients = s.job_recipients;
      subject = 'Yeni İş Başvurusu! 💼';
      title = 'Yeni Kariyer Başvurusu';
      content = `
        Kariyer sayfanız üzerinden yeni bir başvuru yapıldı:<br><br>
        <b>Aday:</b> ${data.firstName} ${data.lastName}<br>
        <b>Email:</b> ${data.email}<br>
        <b>Pozisyon:</b> ${data.position}
      `;
      btnUrl += '/applications';
    }

    if (!active || !recipients || !s.sender_id) return;

    html = getEmailTemplate(title, content, btnText, btnUrl);

    const senderResult = await pool.query('SELECT * FROM email_senders WHERE id = $1', [s.sender_id]);
    if (senderResult.rows.length === 0) return;
    const sender = senderResult.rows[0];

    const transporter = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      auth: { user: sender.auth_user, pass: sender.auth_pass }
    });

    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: recipients,
      subject,
      html
    });

    console.log(`Notification mail sent for ${type}`);
  } catch (err) {
    console.error('sendNotificationMail error:', err);
  }
}

// --- CRON ENDPOINTS ---

router.get('/cron/opportunities-digest', async (req, res) => {
  try {
    const token = req.query.token;
    if (token !== 'cerilas-cron-secret-123') {
      return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }

    const settingsResult = await pool.query('SELECT * FROM mail_settings LIMIT 1');
    if (settingsResult.rows.length === 0) return res.status(404).json({ error: 'No settings' });
    const s = settingsResult.rows[0];

    if (!s.opp_digest_active || !s.opp_digest_recipients || !s.sender_id) {
      return res.json({ message: 'Digest not active or missing configuration' });
    }

    const senderResult = await pool.query('SELECT * FROM email_senders WHERE id = $1', [s.sender_id]);
    if (senderResult.rows.length === 0) return res.status(404).json({ error: 'Sender not found' });
    const sender = senderResult.rows[0];

    // Fetch data
    const oppResult = await pool.query("SELECT * FROM opportunities");
    const payResult = await pool.query("SELECT * FROM opportunity_payments");
    
    // Top 5 urgent tasks
    const todosResult = await pool.query(`
      SELECT t.*, o.name as opp_name 
      FROM opportunity_todos t
      JOIN opportunities o ON t.opportunity_id = o.id
      WHERE t.is_completed = false
      ORDER BY t.deadline ASC NULLS LAST
      LIMIT 5
    `);
    const allTodosCountResult = await pool.query("SELECT count(*) as total FROM opportunity_todos WHERE is_completed = false");

    const opps = oppResult.rows;
    const payments = payResult.rows;
    const topTodos = todosResult.rows;
    const totalTodosCount = parseInt(allTodosCountResult.rows[0].total);

    // Stats
    const activeCount = opps.filter(o => o.status === 'Aktif').length;
    const completedCount = opps.filter(o => o.status === 'Tamamlandı').length;
    const certainCount = opps.filter(o => o.probability === 'Kesinleşti' && o.status === 'Aktif').length;
    const highCount = opps.filter(o => o.probability === 'Yüksek' && o.status === 'Aktif').length;
    const passiveCount = opps.filter(o => o.status === 'Pasif').length;

    const groupedReceived = {};
    payments.forEach(p => {
      groupedReceived[p.currency] = (groupedReceived[p.currency] || 0) + parseFloat(p.amount);
    });

    const groupedExpected = {};
    const groupedAllTimeExpected = {};
    opps.forEach(o => {
      const val = parseFloat(o.total_income || 0);
      groupedAllTimeExpected[o.currency] = (groupedAllTimeExpected[o.currency] || 0) + val;
      
      if (o.status !== 'Pasif' && o.status !== 'Arşiv') {
         groupedExpected[o.currency] = (groupedExpected[o.currency] || 0) + val;
      }
    });

    const formatCurr = (obj) => {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '0 TRY';
      return keys.map(k => `<div style="margin-bottom: 4px;">${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(obj[k])} <span style="font-size: 13px; color: #9ca3af;">${k}</span></div>`).join('');
    };

    const formatCurrInline = (obj) => {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '0 TRY';
      return keys.map(k => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(obj[k])} ${k}`).join(' | ');
    };

    const title = 'Genel İhtimal ve Proje Özeti';
    
    let todosHtml = '';
    if (topTodos.length > 0) {
      todosHtml = topTodos.map(t => `
        <div style="background: #1f2937; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
          <div style="font-size: 13px; color: #9ca3af; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span style="vertical-align: middle;">${t.opp_name}</span>
            ${t.deadline ? `<span style="margin-left: auto; color: #ef4444; font-size: 11px;">Son: ${new Date(t.deadline).toLocaleDateString('tr-TR')}</span>` : ''}
          </div>
          <div style="color: #e5e7eb; font-size: 14px; font-weight: 500;">
            ${t.text}
          </div>
        </div>
      `).join('');
    } else {
      todosHtml = `<div style="color: #9ca3af; font-size: 14px; padding: 10px;">Harika! Bekleyen görev bulunmuyor.</div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media screen and (max-width: 600px) {
      .stack-column {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .stack-table {
        display: block !important;
        width: 100% !important;
      }
      .stack-margin {
        margin-bottom: 12px !important;
      }
      .stats-container {
        border-spacing: 0 !important;
        margin-left: 0 !important;
      }
      .stats-td {
        display: block !important;
        width: 100% !important;
        margin-bottom: 15px !important;
      }
      .fin-border {
        border-right: none !important;
        border-bottom: 1px solid #374151 !important;
        border-radius: 8px 8px 0 0 !important;
      }
      .fin-radius {
        border-radius: 0 0 8px 8px !important;
      }
      .padding-mobile {
        padding: 20px 15px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="background-color: #030712; padding: 40px 15px; width: 100%; box-sizing: border-box;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; font-family: 'Inter', sans-serif;">CERİLAS</h1>
        <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 14px; font-family: 'Inter', sans-serif;">Yüksek Teknoloji</p>
      </div>
      
      <div class="padding-mobile" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; background-color: #111827; padding: 30px; border-radius: 12px;">
        <!-- Header text -->
        <p style="font-size: 15px; color: #9ca3af; margin-top: 0; margin-bottom: 30px; line-height: 1.5;">
          Merhaba, sistemde kayıtlı olan projelerin ve ihtimallerin tüm zamanlara ait (All Time) istatistikleri ve acil bekleyen görevleriniz aşağıdadır.
        </p>

        <!-- Top 5 Tasks -->
        <div style="margin-bottom: 35px;">
          <h3 style="margin-top: 0; color: #22d3ee; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #374151; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <span style="vertical-align: middle;">Öncelikli Görevler (İlk 5)</span>
          </h3>
          ${todosHtml}
          <div style="text-align: right; margin-top: 10px; font-size: 12px; color: #6b7280;">Toplam ${totalTodosCount} aktif görev bekliyor.</div>
        </div>

        <!-- Quick Stats Grid -->
        <table class="stack-table stats-container" style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 30px; margin-left: -12px;">
          <tr>
            <td class="stats-td" style="padding: 20px; background: #1f2937; border-radius: 12px; width: 33%; border-top: 3px solid #10b981; text-align: center; box-sizing: border-box;">
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Aktif Projeler</div>
              <div style="font-size: 28px; color: #f3f4f6; font-weight: 800;">${activeCount}</div>
            </td>
            <td class="stats-td" style="padding: 20px; background: #1f2937; border-radius: 12px; width: 33%; border-top: 3px solid #3b82f6; text-align: center; box-sizing: border-box;">
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Tamamlanan</div>
              <div style="font-size: 28px; color: #f3f4f6; font-weight: 800;">${completedCount}</div>
            </td>
            <td class="stats-td" style="padding: 20px; background: #1f2937; border-radius: 12px; width: 33%; border-top: 3px solid #ef4444; text-align: center; box-sizing: border-box;">
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pasif (İptal)</div>
              <div style="font-size: 28px; color: #f3f4f6; font-weight: 800;">${passiveCount}</div>
            </td>
          </tr>
        </table>

        <!-- Financial Summary -->
        <div class="padding-mobile" style="background: #1f2937; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #374151;">
          <h3 style="margin-top: 0; color: #10b981; font-size: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            <span style="vertical-align: middle;">Tüm Zamanlar Finansal Özet</span>
          </h3>
          <table class="stack-table" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td class="stack-column fin-border" style="padding: 15px; background: #111827; border-radius: 8px 0 0 8px; width: 50%; border-right: 1px solid #374151; vertical-align: top;">
                <div style="color: #9ca3af; font-size: 12px; margin-bottom: 8px;">Gerçekleşen Tahsilat (Ödenen)</div>
                <div style="color: #10b981; font-size: 16px; font-weight: 700;">${formatCurr(groupedReceived)}</div>
              </td>
              <td class="stack-column fin-radius" style="padding: 15px; background: #111827; border-radius: 0 8px 8px 0; width: 50%; vertical-align: top;">
                <div style="color: #9ca3af; font-size: 12px; margin-bottom: 8px;">Bekleyen Tahsilat Hacmi (Aktif)</div>
                <div style="color: #22d3ee; font-size: 16px; font-weight: 700;">${formatCurr(groupedExpected)}</div>
              </td>
            </tr>
          </table>
          <div style="margin-top: 15px; font-size: 11px; color: #4b5563; text-align: right;">
            Sisteme girilmiş tüm projelerin (arşiv ve pasifler dahil) brüt bütçe hacmi: ${formatCurrInline(groupedAllTimeExpected)}
          </div>
        </div>

        <!-- Detail Stats -->
        <div class="padding-mobile" style="background: #1f2937; border-radius: 12px; padding: 25px; border: 1px solid #374151;">
          <h3 style="margin-top: 0; color: #e5e7eb; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #374151; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <span style="vertical-align: middle;">Aktivite Detayları</span>
          </h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #9ca3af;">Kesinleşen Aktif Projeler:</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #10b981;">${certainCount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #9ca3af; border-top: 1px solid #374151;">Yüksek İhtimalli Projeler:</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #3b82f6; border-top: 1px solid #374151;">${highCount}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; font-family: 'Inter', sans-serif;">
        <a href="${process.env.FRONTEND_URL || 'https://www.cerilas.com'}/admin" style="display: inline-block; background-color: #0891b2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Sisteme Giriş Yap
        </a>
        <p style="margin-top: 20px; font-size: 12px; color: #4b5563;">Bu otomatik bir sistem bilgilendirmesidir.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const transporter = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      auth: { user: sender.auth_user, pass: sender.auth_pass }
    });

    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: s.opp_digest_recipients,
      subject: 'Genel Proje ve İhtimal Özeti',
      html
    });

    res.json({ success: true, message: 'Digest email sent successfully' });
  } catch (err) {
    console.error('Cron Digest Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
