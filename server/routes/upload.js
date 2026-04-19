import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import authMiddleware from '../middleware/auth.js';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage so we can process with sharp before saving
const memStorage = multer.memoryStorage();

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'image/avif', 'image/bmp',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-rar-compressed',
];

const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp'];

const upload = multer({
  storage: memStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü.'));
    }
  },
});

const router = Router();

function generateFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

// Upload with optional compression & crop (admin only)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    const isCompressible = COMPRESSIBLE_TYPES.includes(req.file.mimetype);
    let buffer = req.file.buffer;
    let finalExt = path.extname(req.file.originalname).toLowerCase();

    if (isCompressible) {
      const quality = Math.min(100, Math.max(1, parseInt(req.body.quality) || 80));
      const maxWidth = parseInt(req.body.maxWidth) || 0;
      const maxHeight = parseInt(req.body.maxHeight) || 0;
      const format = req.body.format || ''; // 'webp', 'jpeg', 'png', or '' for original
      const cropX = parseInt(req.body.cropX);
      const cropY = parseInt(req.body.cropY);
      const cropW = parseInt(req.body.cropWidth);
      const cropH = parseInt(req.body.cropHeight);

      let pipeline = sharp(buffer);

      // Crop if provided
      if (!isNaN(cropX) && !isNaN(cropY) && !isNaN(cropW) && !isNaN(cropH) && cropW > 0 && cropH > 0) {
        pipeline = pipeline.extract({ left: cropX, top: cropY, width: cropW, height: cropH });
      }

      // Resize if provided
      if (maxWidth > 0 || maxHeight > 0) {
        pipeline = pipeline.resize({
          width: maxWidth || undefined,
          height: maxHeight || undefined,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Format & compress
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
        finalExt = '.webp';
      } else if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        finalExt = '.jpg';
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
        finalExt = '.png';
      } else if (format === 'avif') {
        pipeline = pipeline.avif({ quality });
        finalExt = '.avif';
      } else {
        // Keep original format but compress
        const mime = req.file.mimetype;
        if (mime === 'image/jpeg') pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        else if (mime === 'image/png') pipeline = pipeline.png({ quality });
        else if (mime === 'image/webp') pipeline = pipeline.webp({ quality });
        else if (mime === 'image/avif') pipeline = pipeline.avif({ quality });
      }

      buffer = await pipeline.toBuffer();
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${finalExt}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const stat = fs.statSync(filePath);
    const url = `/uploads/${filename}`;

    // Determine file type
    const ext = finalExt.toLowerCase();
    let type = 'other';
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'].includes(ext)) type = 'image';
    else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) type = 'video';
    else if (ext === '.pdf') type = 'pdf';
    else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) type = 'document';

    // Save metadata to DB
    await pool.query(
      `INSERT INTO media (filename, original_name, url, mimetype, size, original_size, type, ext, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [filename, req.file.originalname, url, req.file.mimetype, stat.size, req.file.size, type, ext, req.user.id]
    );

    res.json({
      url,
      filename,
      originalName: req.file.originalname,
      size: stat.size,
      originalSize: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Crop an already-uploaded image (admin only)
router.post('/crop', authMiddleware, async (req, res) => {
  try {
    const { filename, cropX, cropY, cropWidth, cropHeight, quality, format } = req.body;
    const safeName = path.basename(filename);
    const srcPath = path.join(uploadsDir, safeName);

    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    let pipeline = sharp(srcPath);

    if (cropWidth > 0 && cropHeight > 0) {
      pipeline = pipeline.extract({
        left: Math.round(cropX),
        top: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      });
    }

    const q = Math.min(100, Math.max(1, parseInt(quality) || 80));
    let ext = path.extname(safeName).toLowerCase();

    if (format === 'webp') { pipeline = pipeline.webp({ quality: q }); ext = '.webp'; }
    else if (format === 'jpeg' || format === 'jpg') { pipeline = pipeline.jpeg({ quality: q, mozjpeg: true }); ext = '.jpg'; }
    else if (format === 'png') { pipeline = pipeline.png({ quality: q }); ext = '.png'; }
    else {
      if (ext === '.jpg' || ext === '.jpeg') pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
      else if (ext === '.png') pipeline = pipeline.png({ quality: q });
      else if (ext === '.webp') pipeline = pipeline.webp({ quality: q });
    }

    const newFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const destPath = path.join(uploadsDir, newFilename);
    await pipeline.toFile(destPath);

    const stat = fs.statSync(destPath);
    const url = `/uploads/${newFilename}`;

    // Determine type from ext
    let type = 'image';

    // Save cropped file metadata to DB
    await pool.query(
      `INSERT INTO media (filename, original_name, url, mimetype, size, original_size, type, ext, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newFilename, `cropped-${safeName}`, url, `image/${ext.replace('.', '')}`, stat.size, 0, type, ext, req.user.id]
    );

    res.json({
      url,
      filename: newFilename,
      size: stat.size,
    });
  } catch (err) {
    console.error('Crop error:', err);
    res.status(500).json({ error: err.message || 'Crop failed' });
  }
});

// List uploaded files (admin only) — with pagination from DB
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const typeFilter = req.query.type || '';
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM media';
    let listQuery = 'SELECT id, filename, original_name, url, mimetype, size, original_size, type, ext, created_at FROM media';
    const params = [];

    if (typeFilter && typeFilter !== 'all') {
      countQuery += ' WHERE type = $1';
      listQuery += ' WHERE type = $1';
      params.push(typeFilter);
    }

    listQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, listResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(listQuery, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const files = listResult.rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      originalName: r.original_name,
      url: r.url,
      size: r.size,
      originalSize: r.original_size,
      created: r.created_at,
      type: r.type,
      ext: r.ext,
    }));

    res.json({ files, total, page, totalPages, limit });
  } catch (err) {
    console.error('List error:', err);
    res.json({ files: [], total: 0, page: 1, totalPages: 0, limit: 30 });
  }
});

// Delete uploaded file (admin only)
router.delete('/:filename', authMiddleware, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);
  try {
    // Delete from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    // Delete from DB
    await pool.query('DELETE FROM media WHERE filename = $1', [filename]);
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Dosya silinemedi' });
  }
});

export default router;
