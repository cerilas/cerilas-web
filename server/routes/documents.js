import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const documentsDir = process.env.DOCUMENT_UPLOAD_DIR
  ? (path.isAbsolute(process.env.DOCUMENT_UPLOAD_DIR)
      ? process.env.DOCUMENT_UPLOAD_DIR
      : path.join(process.cwd(), process.env.DOCUMENT_UPLOAD_DIR))
  : path.join(__dirname, '..', 'document-uploads');

fs.mkdirSync(documentsDir, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.zip', '.rar', '.7z',
]);

const normalizeOriginalFilename = (value) => {
  const filename = String(value || '');
  if (!/[ÃÄÅÂ]/.test(filename)) return filename;
  const decoded = Buffer.from(filename, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? filename : decoded;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return callback(new Error('Bu dosya türü belge kasasına yüklenemez.'));
    }
    callback(null, true);
  },
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Dosya boyutu en fazla 100 MB olabilir.'
      : error.message;
    return res.status(400).json({ error: message });
  });
};

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_folders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('company', 'project')),
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES document_folders(id) ON DELETE RESTRICT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_document_folders_scope
      ON document_folders(scope_type, project_id);

    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      stored_filename VARCHAR(255) NOT NULL UNIQUE,
      mime_type VARCHAR(160),
      file_size BIGINT NOT NULL DEFAULT 0,
      scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('company', 'project')),
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      folder_id INTEGER REFERENCES document_folders(id) ON DELETE SET NULL,
      category VARCHAR(100) DEFAULT 'Diğer',
      tags TEXT[] DEFAULT '{}',
      note TEXT DEFAULT '',
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      deleted_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_documents_scope ON documents(scope_type, project_id);
    CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
    CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

    CREATE TABLE IF NOT EXISTS document_activity (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(40) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_document_activity_document
      ON document_activity(document_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS document_shares (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      token_hash CHAR(64) NOT NULL UNIQUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      revoked_at TIMESTAMP,
      access_count INTEGER NOT NULL DEFAULT 0,
      last_accessed_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_document_shares_document
      ON document_shares(document_id, revoked_at);
  `);
};

const parseNullableId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseTags = (value) => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
};

const validatePlacement = async ({ scopeType, projectId, folderId }) => {
  if (!['company', 'project'].includes(scopeType)) {
    throw new Error('Geçerli bir belge alanı seçin.');
  }
  if (scopeType === 'project' && !projectId) {
    throw new Error('Proje belgesi için proje seçimi zorunludur.');
  }
  if (scopeType === 'company' && projectId) {
    throw new Error('Şirket belgesine proje atanamaz.');
  }
  if (projectId) {
    const projectResult = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) throw new Error('Seçilen proje bulunamadı.');
  }
  if (folderId) {
    const folderResult = await pool.query(
      'SELECT scope_type, project_id FROM document_folders WHERE id = $1',
      [folderId]
    );
    const folder = folderResult.rows[0];
    if (!folder) throw new Error('Seçilen klasör bulunamadı.');
    if (folder.scope_type !== scopeType || Number(folder.project_id || 0) !== Number(projectId || 0)) {
      throw new Error('Klasör seçilen belge alanıyla eşleşmiyor.');
    }
  }
};

const logActivity = (documentId, userId, action, details = {}) => (
  pool.query(
    'INSERT INTO document_activity (document_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
    [documentId, userId, action, details]
  )
);

const documentSelect = `
  SELECT d.id, d.title, d.original_name, d.mime_type, d.file_size,
    d.scope_type, d.project_id, d.folder_id, d.category, d.tags, d.note,
    d.created_at, d.updated_at, d.deleted_at,
    p.title_tr AS project_name,
    f.name AS folder_name,
    u.email AS uploaded_by_email
  FROM documents d
  LEFT JOIN projects p ON p.id = d.project_id
  LEFT JOIN document_folders f ON f.id = d.folder_id
  LEFT JOIN users u ON u.id = d.uploaded_by
`;

const hashShareToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getSharedDocument = async (token) => {
  if (!token || token.length < 32 || token.length > 200) return null;
  const result = await pool.query(
    `SELECT d.id, d.title, d.original_name, d.stored_filename, d.mime_type,
      d.file_size, d.category, d.created_at, s.id AS share_id
     FROM document_shares s
     JOIN documents d ON d.id = s.document_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND d.deleted_at IS NULL`,
    [hashShareToken(token)]
  );
  return result.rows[0] || null;
};

const sendInvalidShare = (res) => res.status(410).json({
  code: 'SHARE_LINK_INVALID',
  error: 'Bu paylaşım bağlantısı artık geçerli değil. Belgeyi paylaşan Cerilas yetkilisinden yeni bir bağlantı göndermesini isteyin.',
});

router.get('/public/:token', async (req, res) => {
  try {
    await ensureTables();
    const document = await getSharedDocument(req.params.token);
    if (!document) return sendInvalidShare(res);
    res.json({
      id: document.id,
      title: document.title,
      original_name: document.original_name,
      mime_type: document.mime_type,
      file_size: document.file_size,
      category: document.category,
      created_at: document.created_at,
    });
  } catch (error) {
    console.error('Get public document share error:', error);
    res.status(500).json({ error: 'Paylaşılan belge açılamadı' });
  }
});

router.get('/public/:token/file', async (req, res) => {
  try {
    await ensureTables();
    const document = await getSharedDocument(req.params.token);
    if (!document) return sendInvalidShare(res);
    const filePath = path.join(documentsDir, path.basename(document.stored_filename));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Belge dosyası bulunamadı' });
    await pool.query(
      `UPDATE document_shares
       SET access_count = access_count + 1, last_accessed_at = NOW()
       WHERE id = $1`,
      [document.share_id]
    );
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(document.original_name)}`
    );
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Paylaşılan belge açılamadı' });
  }
});

router.get('/folders', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(`
      SELECT f.*, p.title_tr AS project_name,
        COUNT(d.id) FILTER (WHERE d.deleted_at IS NULL)::int AS document_count
      FROM document_folders f
      LEFT JOIN projects p ON p.id = f.project_id
      LEFT JOIN documents d ON d.folder_id = f.id
      GROUP BY f.id, p.title_tr
      ORDER BY f.scope_type, p.title_tr NULLS FIRST, f.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('List document folders error:', error);
    res.status(500).json({ error: 'Klasörler yüklenemedi' });
  }
});

router.post('/folders', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const name = String(req.body.name || '').trim();
    const scopeType = req.body.scope_type;
    const projectId = scopeType === 'project' ? parseNullableId(req.body.project_id) : null;
    const parentId = parseNullableId(req.body.parent_id);
    if (!name) return res.status(400).json({ error: 'Klasör adı zorunludur' });
    await validatePlacement({ scopeType, projectId, folderId: parentId });
    const result = await pool.query(
      `INSERT INTO document_folders (name, scope_type, project_id, parent_id, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, scopeType, projectId, parentId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Klasör oluşturulamadı' });
  }
});

router.put('/folders/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Klasör adı zorunludur' });
    const result = await pool.query(
      'UPDATE document_folders SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Klasör bulunamadı' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Klasör güncellenemedi' });
  }
});

router.delete('/folders/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const usage = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM documents WHERE folder_id = $1) AS document_count,
        (SELECT COUNT(*) FROM document_folders WHERE parent_id = $1) AS child_count`,
      [req.params.id]
    );
    if (Number(usage.rows[0].document_count) > 0 || Number(usage.rows[0].child_count) > 0) {
      return res.status(409).json({ error: 'Dolu klasör silinemez. Önce içeriğini taşıyın.' });
    }
    const result = await pool.query('DELETE FROM document_folders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Klasör bulunamadı' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Klasör silinemedi' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const deleted = req.query.deleted === 'true';
    const conditions = [deleted ? 'd.deleted_at IS NOT NULL' : 'd.deleted_at IS NULL'];
    const params = [];
    const addCondition = (sql, value) => {
      params.push(value);
      conditions.push(sql.replace('?', `$${params.length}`));
    };

    if (req.query.scope_type && req.query.scope_type !== 'all') {
      addCondition('d.scope_type = ?', req.query.scope_type);
    }
    if (parseNullableId(req.query.project_id)) addCondition('d.project_id = ?', parseNullableId(req.query.project_id));
    if (parseNullableId(req.query.folder_id)) addCondition('d.folder_id = ?', parseNullableId(req.query.folder_id));
    if (req.query.category && req.query.category !== 'all') addCondition('d.category = ?', req.query.category);
    if (String(req.query.search || '').trim()) {
      addCondition(
        `(d.title ILIKE ? OR d.original_name ILIKE $${params.length + 1} OR d.note ILIKE $${params.length + 1} OR array_to_string(d.tags, ' ') ILIKE $${params.length + 1})`,
        `%${String(req.query.search).trim()}%`
      );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await pool.query(`SELECT COUNT(*) FROM documents d ${where}`, params);
    params.push(limit, (page - 1) * limit);
    const result = await pool.query(
      `${documentSelect} ${where}
       ORDER BY COALESCE(d.deleted_at, d.updated_at) DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = Number.parseInt(countResult.rows[0].count, 10);
    res.json({
      documents: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Belgeler yüklenemedi' });
  }
});

router.post('/', authMiddleware, uploadSingle, async (req, res) => {
  let writtenPath = null;
  try {
    await ensureTables();
    if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi' });
    const scopeType = req.body.scope_type;
    const projectId = scopeType === 'project' ? parseNullableId(req.body.project_id) : null;
    const folderId = parseNullableId(req.body.folder_id);
    await validatePlacement({ scopeType, projectId, folderId });

    const decodedOriginalName = normalizeOriginalFilename(req.file.originalname);
    const extension = path.extname(decodedOriginalName).toLowerCase();
    const storedFilename = `${crypto.randomUUID()}${extension}`;
    writtenPath = path.join(documentsDir, storedFilename);
    await fs.promises.writeFile(writtenPath, req.file.buffer, { flag: 'wx' });

    const originalName = path.basename(decodedOriginalName);
    const defaultTitle = path.basename(originalName, extension);
    const result = await pool.query(
      `INSERT INTO documents (
        title, original_name, stored_filename, mime_type, file_size,
        scope_type, project_id, folder_id, category, tags, note, uploaded_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id`,
      [
        String(req.body.title || '').trim() || defaultTitle,
        originalName,
        storedFilename,
        req.file.mimetype || 'application/octet-stream',
        req.file.size,
        scopeType,
        projectId,
        folderId,
        String(req.body.category || 'Diğer').trim() || 'Diğer',
        parseTags(req.body.tags),
        String(req.body.note || '').trim(),
        req.user.id,
      ]
    );
    await logActivity(result.rows[0].id, req.user.id, 'uploaded', { originalName });
    const documentResult = await pool.query(`${documentSelect} WHERE d.id = $1`, [result.rows[0].id]);
    res.status(201).json(documentResult.rows[0]);
  } catch (error) {
    if (writtenPath) await fs.promises.unlink(writtenPath).catch(() => {});
    console.error('Upload document error:', error);
    res.status(400).json({ error: error.message || 'Belge yüklenemedi' });
  }
});

router.get('/:id/file', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(
      'SELECT original_name, stored_filename, mime_type FROM documents WHERE id = $1',
      [req.params.id]
    );
    const document = result.rows[0];
    if (!document) return res.status(404).json({ error: 'Belge bulunamadı' });
    const filePath = path.join(documentsDir, path.basename(document.stored_filename));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Belge dosyası bulunamadı' });
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(document.original_name)}`
    );
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Belge açılamadı' });
  }
});

router.get('/:id/share', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const documentResult = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (documentResult.rows.length === 0) return res.status(404).json({ error: 'Belge bulunamadı' });
    const shareResult = await pool.query(
      `SELECT id, created_at, access_count, last_accessed_at
       FROM document_shares
       WHERE document_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json({
      active: shareResult.rows.length > 0,
      share: shareResult.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Paylaşım durumu alınamadı' });
  }
});

router.post('/:id/share', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureTables();
    const documentResult = await client.query(
      'SELECT id FROM documents WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Belge bulunamadı' });
    }
    const token = crypto.randomBytes(32).toString('base64url');
    await client.query('BEGIN');
    await client.query(
      'UPDATE document_shares SET revoked_at = NOW() WHERE document_id = $1 AND revoked_at IS NULL',
      [req.params.id]
    );
    const result = await client.query(
      `INSERT INTO document_shares (document_id, token_hash, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, created_at, access_count, last_accessed_at`,
      [req.params.id, hashShareToken(token), req.user.id]
    );
    await client.query('COMMIT');
    await logActivity(req.params.id, req.user.id, 'share_created', { shareId: result.rows[0].id });
    res.status(201).json({
      active: true,
      token,
      sharePath: `/shared/document/${token}`,
      share: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create document share error:', error);
    res.status(500).json({ error: 'Paylaşım bağlantısı oluşturulamadı' });
  } finally {
    client.release();
  }
});

router.delete('/:id/share', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(
      `UPDATE document_shares
       SET revoked_at = NOW()
       WHERE document_id = $1 AND revoked_at IS NULL
       RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length > 0) {
      await logActivity(req.params.id, req.user.id, 'share_revoked', { shareIds: result.rows.map((row) => row.id) });
    }
    res.json({ success: true, revoked: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Paylaşım bağlantısı iptal edilemedi' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const scopeType = req.body.scope_type;
    const projectId = scopeType === 'project' ? parseNullableId(req.body.project_id) : null;
    const folderId = parseNullableId(req.body.folder_id);
    await validatePlacement({ scopeType, projectId, folderId });
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Belge adı zorunludur' });
    const result = await pool.query(
      `UPDATE documents SET
        title=$1, scope_type=$2, project_id=$3, folder_id=$4,
        category=$5, tags=$6, note=$7, updated_at=NOW()
       WHERE id=$8 AND deleted_at IS NULL RETURNING id`,
      [
        title,
        scopeType,
        projectId,
        folderId,
        String(req.body.category || 'Diğer').trim() || 'Diğer',
        parseTags(req.body.tags),
        String(req.body.note || '').trim(),
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Belge bulunamadı' });
    await logActivity(req.params.id, req.user.id, 'updated');
    const documentResult = await pool.query(`${documentSelect} WHERE d.id = $1`, [req.params.id]);
    res.json(documentResult.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Belge güncellenemedi' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(
      'UPDATE documents SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Belge bulunamadı' });
    await pool.query(
      'UPDATE document_shares SET revoked_at=NOW() WHERE document_id=$1 AND revoked_at IS NULL',
      [req.params.id]
    );
    await logActivity(req.params.id, req.user.id, 'trashed');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Belge silinemedi' });
  }
});

router.post('/:id/restore', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(
      'UPDATE documents SET deleted_at=NULL, updated_at=NOW() WHERE id=$1 AND deleted_at IS NOT NULL RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Belge bulunamadı' });
    await logActivity(req.params.id, req.user.id, 'restored');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Belge geri yüklenemedi' });
  }
});

router.delete('/:id/permanent', authMiddleware, async (req, res) => {
  try {
    await ensureTables();
    const result = await pool.query(
      'SELECT stored_filename FROM documents WHERE id=$1 AND deleted_at IS NOT NULL',
      [req.params.id]
    );
    const document = result.rows[0];
    if (!document) return res.status(404).json({ error: 'Çöp kutusunda belge bulunamadı' });
    await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id]);
    const filePath = path.join(documentsDir, path.basename(document.stored_filename));
    await fs.promises.unlink(filePath).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Belge kalıcı olarak silinemedi' });
  }
});

export default router;
