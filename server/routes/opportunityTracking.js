import { Router } from 'express';
import crypto from 'node:crypto';
import process from 'node:process';
import { setImmediate } from 'node:timers';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import {
  ensureOpportunityAutomationTables,
  getGeminiModels,
  normalizeAiSettings,
  prepareScanBatch,
  prepareSourceScanRun,
  runDueSourceScans,
  runSourceScan,
} from '../services/opportunityScanner.js';
import {
  createOpportunityEmail,
  createOpportunityPdf,
  createOpportunityWorkbook,
  createReportFilename,
  normalizeReportScope,
} from '../services/opportunityReports.js';

const router = Router();

const ensureTable = ensureOpportunityAutomationTables;
const isGeminiConfigured = () => Boolean(String(process.env.GEMINI_API_KEY || '').trim());

const clampScanInterval = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? Math.min(43_200, Math.max(15, parsed)) : 1440;
};

const clampMaxPages = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? Math.min(20, Math.max(1, parsed)) : 5;
};

const getRequestCronSecret = (req) => {
  const authorization = req.get('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  return String(req.get('x-cron-secret') || bearerToken || req.query.token || '');
};

const isValidCronSecret = (candidate) => {
  const configured = String(process.env.CRON_SECRET || '');
  if (!configured || !candidate) return false;
  const configuredHash = crypto.createHash('sha256').update(configured).digest();
  const candidateHash = crypto.createHash('sha256').update(String(candidate)).digest();
  return crypto.timingSafeEqual(configuredHash, candidateHash);
};

const launchScan = (work) => {
  setImmediate(() => {
    Promise.resolve(work()).catch((error) => console.error('Opportunity background scan error:', error));
  });
};

const normalizeUrl = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
};

const getUrlMeta = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return { linkUrl: '', domain: '', faviconUrl: '' };

  try {
    const url = new URL(normalized);
    const domain = url.hostname.replace(/^www\./, '');
    return {
      linkUrl: url.toString(),
      domain,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    };
  } catch {
    return { linkUrl: normalized, domain: '', faviconUrl: '' };
  }
};

const REPORT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getReportCandidates = async (scope) => {
  const normalizedScope = normalizeReportScope(scope);
  const params = [];
  const where = normalizedScope === 'shortlist' ? 'WHERE c.is_shortlisted=TRUE' : '';
  const result = await pool.query(
    `SELECT c.*, s.title AS source_title, s.domain AS source_domain
     FROM opportunity_candidates c
     LEFT JOIN tracked_opportunities s ON s.id=c.source_id
     ${where}
     ORDER BY c.is_shortlisted DESC, c.score DESC, c.last_seen_at DESC`,
    params
  );
  return result.rows;
};

const getOpportunityReportContext = async () => {
  const [settingsResult, sourcesResult] = await Promise.all([
    pool.query('SELECT company_profile, opportunity_types, target_regions FROM opportunity_ai_settings WHERE id=1'),
    pool.query('SELECT title, domain FROM tracked_opportunities WHERE is_active=TRUE ORDER BY title'),
  ]);
  const settings = settingsResult.rows[0] || {};
  return {
    organization: 'CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ',
    companyProfile: settings.company_profile,
    opportunityTypesText: settings.opportunity_types,
    targetRegions: settings.target_regions,
    sources: sourcesResult.rows,
  };
};

const getDefaultMailSender = async () => {
  const result = await pool.query(
    `SELECT es.*
     FROM email_senders es
     LEFT JOIN mail_settings ms ON ms.sender_id=es.id
     WHERE es.is_active=TRUE
     ORDER BY (ms.sender_id=es.id) DESC, es.created_at ASC
     LIMIT 1`
  );
  return result.rows[0] || null;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query('SELECT * FROM tracked_opportunities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get tracked opportunities error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai-settings', authMiddleware, async (_req, res) => {
  try {
    await ensureTable();
    const result = await pool.query('SELECT * FROM opportunity_ai_settings WHERE id = 1');
    res.json({
      ...result.rows[0],
      gemini_configured: isGeminiConfigured(),
    });
  } catch (err) {
    console.error('Get opportunity AI settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/ai-settings', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const settings = normalizeAiSettings(req.body);
    const result = await pool.query(
      `UPDATE opportunity_ai_settings SET
        provider=$1, extraction_model=$2, scoring_model=$3, fallback_model=$4,
        company_profile=$5, personal_profile=$6, opportunity_types=$7,
        excluded_opportunities=$8, target_regions=$9, eligibility_preferences=$10,
        custom_instructions=$11, shortlist_threshold=$12,
        max_candidates_per_source=$13, temperature=$14, score_weights=$15,
        updated_by=$16, updated_at=NOW()
       WHERE id=1 RETURNING *`,
      [
        settings.provider,
        settings.extraction_model,
        settings.scoring_model,
        settings.fallback_model,
        settings.company_profile,
        settings.personal_profile,
        settings.opportunity_types,
        settings.excluded_opportunities,
        settings.target_regions,
        settings.eligibility_preferences,
        settings.custom_instructions,
        settings.shortlist_threshold,
        settings.max_candidates_per_source,
        settings.temperature,
        JSON.stringify(settings.score_weights),
        req.user.id,
      ]
    );
    res.json({
      ...result.rows[0],
      gemini_configured: isGeminiConfigured(),
    });
  } catch (err) {
    console.error('Update opportunity AI settings error:', err);
    res.status(400).json({ error: err.message || 'Yapay zekâ ayarları kaydedilemedi.' });
  }
});

router.get('/ai-models', authMiddleware, async (_req, res) => {
  try {
    res.json(await getGeminiModels());
  } catch (err) {
    console.error('Get Gemini models error:', err);
    res.status(502).json({ error: err.message || 'Gemini model listesi alınamadı.' });
  }
});

router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const conditions = [];
    const params = [];
    if (req.query.shortlisted === 'true') conditions.push('c.is_shortlisted=TRUE');
    if (req.query.shortlisted === 'false') conditions.push('c.is_shortlisted=FALSE');
    if (req.query.source_id) {
      params.push(Number.parseInt(req.query.source_id, 10));
      conditions.push(`c.source_id=$${params.length}`);
    }
    const limit = Math.min(250, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    params.push(limit);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT c.*, s.title AS source_title, s.domain AS source_domain
       FROM opportunity_candidates c
       LEFT JOIN tracked_opportunities s ON s.id=c.source_id
       ${where}
       ORDER BY c.is_shortlisted DESC, c.score DESC, c.last_seen_at DESC
       LIMIT $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get opportunity candidates error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:format', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const scope = normalizeReportScope(req.query.scope);
    const format = String(req.params.format || '').toLowerCase();
    if (!['pdf', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: 'Desteklenmeyen rapor biçimi.' });
    }
    const [items, reportContext] = await Promise.all([
      getReportCandidates(scope),
      getOpportunityReportContext(),
    ]);
    const generatedAt = new Date();
    const buffer = format === 'pdf'
      ? await createOpportunityPdf(items, { scope, generatedAt, reportContext })
      : await createOpportunityWorkbook(items, { scope, generatedAt, reportContext });
    const filename = createReportFilename(scope, format, generatedAt);
    res.set({
      'Content-Type': format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, no-store',
    });
    return res.send(buffer);
  } catch (err) {
    console.error('Create opportunity report error:', err);
    return res.status(500).json({ error: err.message || 'Fırsat raporu oluşturulamadı.' });
  }
});

router.post('/reports/email', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const scope = normalizeReportScope(req.body.scope);
    const rawRecipients = Array.isArray(req.body.recipients)
      ? req.body.recipients
      : String(req.body.recipients || '').split(/[\s,;]+/);
    const recipients = [...new Set(rawRecipients.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))];
    if (!recipients.length) return res.status(400).json({ error: 'En az bir alıcı e-posta adresi girin.' });
    if (recipients.length > 25) return res.status(400).json({ error: 'Tek gönderimde en fazla 25 ayrı alıcı kullanılabilir.' });
    const invalidRecipients = recipients.filter((email) => !REPORT_EMAIL_PATTERN.test(email) || email.length > 320);
    if (invalidRecipients.length) {
      return res.status(400).json({ error: `Geçersiz e-posta adresi: ${invalidRecipients.join(', ')}` });
    }

    const sender = await getDefaultMailSender();
    if (!sender) return res.status(503).json({ error: 'Aktif e-posta göndericisi bulunamadı. Mail ayarlarını kontrol edin.' });

    const [items, reportContext] = await Promise.all([
      getReportCandidates(scope),
      getOpportunityReportContext(),
    ]);
    const generatedAt = new Date();
    const [pdf, workbook] = await Promise.all([
      createOpportunityPdf(items, { scope, generatedAt, reportContext }),
      createOpportunityWorkbook(items, { scope, generatedAt, reportContext }),
    ]);
    const message = createOpportunityEmail(items, { scope, generatedAt, reportContext });
    const transporter = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      auth: { user: sender.auth_user, pass: sender.auth_pass },
    });
    const attachments = [
      { filename: createReportFilename(scope, 'pdf', generatedAt), content: pdf, contentType: 'application/pdf' },
      { filename: createReportFilename(scope, 'xlsx', generatedAt), content: workbook, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    ];

    const results = [];
    for (const recipient of recipients) {
      try {
        const info = await transporter.sendMail({
          from: `"${sender.name}" <${sender.email}>`,
          to: recipient,
          replyTo: sender.email,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments,
        });
        results.push({ recipient, success: true, message_id: info.messageId });
      } catch (error) {
        console.error(`Opportunity report mail failed for ${recipient}:`, error);
        results.push({ recipient, success: false, error: String(error.message || error).slice(0, 500) });
      }
    }

    const sent = results.filter((item) => item.success).length;
    const failed = results.length - sent;
    return res.status(failed ? 207 : 200).json({ success: failed === 0, sent, failed, results });
  } catch (err) {
    console.error('Send opportunity report error:', err);
    return res.status(500).json({ error: err.message || 'Fırsat raporu e-postası gönderilemedi.' });
  }
});

router.patch('/candidates/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      `UPDATE opportunity_candidates SET is_shortlisted=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [Boolean(req.body.is_shortlisted), req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Fırsat adayı bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scan-runs', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const params = [];
    const conditions = [];
    const sourceId = Number.parseInt(req.query.source_id, 10);
    if (Number.isInteger(sourceId)) conditions.push(`r.source_id=$${params.push(sourceId)}`);
    if (req.query.batch_id) conditions.push(`r.batch_id=$${params.push(String(req.query.batch_id))}`);
    if (req.query.active === 'true') conditions.push("r.status IN ('queued','running')");
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    const result = await pool.query(
      `SELECT r.*, s.title AS source_title, s.domain AS source_domain
       FROM opportunity_scan_runs r
       LEFT JOIN tracked_opportunities s ON s.id=r.source_id
       ${where}
       ORDER BY r.started_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scan-batches', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const conditions = req.query.active === 'true' ? "WHERE b.status IN ('queued','running')" : '';
    const result = await pool.query(
      `SELECT b.*, s.title AS current_source_title
       FROM opportunity_scan_batches b
       LEFT JOIN tracked_opportunities s ON s.id=b.current_source_id
       ${conditions}
       ORDER BY b.started_at DESC LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scan-summary', authMiddleware, async (_req, res) => {
  try {
    await ensureTable();
    const [sourceResult, batchResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_sources,
          COUNT(*) FILTER (WHERE is_active=TRUE)::int AS active_sources,
          COUNT(*) FILTER (WHERE is_active=TRUE AND scrap_url IS NOT NULL AND scrap_url <> '')::int AS scannable_sources
         FROM tracked_opportunities`
      ),
      pool.query(
        `SELECT b.*,
          COALESCE(SUM(r.discovered_count),0)::int AS discovered_count,
          COALESCE(SUM(r.analyzed_count),0)::int AS analyzed_count,
          COALESCE(SUM(r.shortlisted_count),0)::int AS shortlisted_count
         FROM opportunity_scan_batches b
         LEFT JOIN opportunity_scan_runs r ON r.batch_id=b.id
         WHERE b.force_all=TRUE
         GROUP BY b.id
         ORDER BY b.started_at DESC
         LIMIT 1`
      ),
    ]);
    res.json({
      ...sourceResult.rows[0],
      last_full_scan: batchResult.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scan/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    if (!isGeminiConfigured()) {
      return res.status(503).json({ code: 'GEMINI_API_KEY_NOT_CONFIGURED', error: 'Gemini erişim anahtarı sunucu ortamında tanımlanmamış.' });
    }
    const sourceResult = await pool.query(
      `SELECT id, scrap_url, is_active FROM tracked_opportunities WHERE id=$1`,
      [req.params.id]
    );
    if (!sourceResult.rows[0]) return res.status(404).json({ error: 'Tarama kaynağı bulunamadı.' });
    if (sourceResult.rows[0].is_active === false) return res.status(409).json({ error: 'Bu kaynak taramaya dahil değil. Önce kaynağı etkinleştirin.' });
    if (!sourceResult.rows[0].scrap_url) return res.status(400).json({ error: 'Kaynakta tarama bağlantısı tanımlanmamış.' });
    const run = await prepareSourceScanRun(req.params.id, { triggerType: 'manual' });
    launchScan(() => runSourceScan(req.params.id, { triggerType: 'manual', runId: run.id }));
    res.status(202).json({ accepted: true, run_id: run.id, message: 'Tarama başlatıldı.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scan-due', authMiddleware, async (req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(503).json({ code: 'GEMINI_API_KEY_NOT_CONFIGURED', error: 'Gemini erişim anahtarı sunucu ortamında tanımlanmamış.' });
  }
  try {
    const batch = await prepareScanBatch({ forceAll: Boolean(req.body.force_all), triggerType: 'manual_batch' });
    launchScan(() => runDueSourceScans({ triggerType: 'manual_batch', batchId: batch.batchId }));
    return res.status(202).json({ accepted: true, batch_id: batch.batchId, total_sources: batch.totalSources, message: 'Toplu tarama başlatıldı.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/cron/scan', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!String(process.env.CRON_SECRET || '')) {
    return res.status(503).json({ code: 'CRON_SECRET_NOT_CONFIGURED', error: 'Cron güvenlik anahtarı tanımlanmamış.' });
  }
  if (!isValidCronSecret(getRequestCronSecret(req))) {
    return res.status(401).json({ code: 'CRON_SECRET_INVALID', error: 'Yetkisiz istek. Güvenlik anahtarı geçersiz.' });
  }
  if (!isGeminiConfigured()) {
    return res.status(503).json({ code: 'GEMINI_API_KEY_NOT_CONFIGURED', error: 'Gemini erişim anahtarı tanımlanmamış.' });
  }
  const batch = await prepareScanBatch({ triggerType: 'cron' });
  launchScan(() => runDueSourceScans({ triggerType: 'cron', batchId: batch.batchId }));
  return res.status(202).json({ accepted: true, batch_id: batch.batchId, total_sources: batch.totalSources, message: 'Periyodik fırsat taraması başlatıldı.' });
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const {
      title, description, note, link_url, scrap_url, is_active, scan_interval_minutes,
      pagination_enabled, max_pages,
    } = req.body;
    if (!String(title || '').trim()) {
      return res.status(400).json({ error: 'Başlık zorunludur' });
    }

    const { domain, faviconUrl } = getUrlMeta(link_url || scrap_url);
    const normalizedScrapUrl = normalizeUrl(scrap_url);

    const result = await pool.query(
      `INSERT INTO tracked_opportunities (
        title, description, note, link_url, scrap_url, domain, favicon_url,
        is_active, scan_interval_minutes, pagination_enabled, max_pages, next_scan_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
      [
        title.trim(),
        description || '',
        note || '',
        normalizeUrl(link_url) || null,
        normalizedScrapUrl || null,
        domain || null,
        faviconUrl || null,
        is_active !== false,
        clampScanInterval(scan_interval_minutes),
        pagination_enabled !== false,
        clampMaxPages(max_pages),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const {
      title, description, note, link_url, scrap_url, is_active, scan_interval_minutes,
      pagination_enabled, max_pages,
    } = req.body;
    if (!String(title || '').trim()) {
      return res.status(400).json({ error: 'Başlık zorunludur' });
    }

    const { domain, faviconUrl } = getUrlMeta(link_url || scrap_url);
    const normalizedScrapUrl = normalizeUrl(scrap_url);

    const result = await pool.query(
      `UPDATE tracked_opportunities SET
        title = $1,
        description = $2,
        note = $3,
        link_url = $4,
        scrap_url = $5,
        domain = $6,
        favicon_url = $7,
        is_active = $8,
        scan_interval_minutes = $9,
        pagination_enabled = $10,
        max_pages = $11,
        next_scan_at = CASE
          WHEN scrap_url IS DISTINCT FROM $5
            OR is_active IS DISTINCT FROM $8
            OR scan_interval_minutes IS DISTINCT FROM $9
            OR pagination_enabled IS DISTINCT FROM $10
            OR max_pages IS DISTINCT FROM $11 THEN NOW()
          ELSE next_scan_at
        END,
        last_scan_status = CASE
          WHEN scrap_url IS DISTINCT FROM $5 THEN 'never'
          ELSE last_scan_status
        END,
        last_scan_error = CASE
          WHEN scrap_url IS DISTINCT FROM $5 THEN NULL
          ELSE last_scan_error
        END,
        updated_at = NOW()
      WHERE id = $12 RETURNING *`,
      [
        title.trim(),
        description || '',
        note || '',
        normalizeUrl(link_url) || null,
        normalizedScrapUrl || null,
        domain || null,
        faviconUrl || null,
        is_active !== false,
        clampScanInterval(scan_interval_minutes),
        pagination_enabled !== false,
        clampMaxPages(max_pages),
        id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Fırsat kaynağı bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    await pool.query('DELETE FROM tracked_opportunities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete tracked opportunity error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
