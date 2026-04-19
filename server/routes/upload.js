import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import authMiddleware from '../middleware/auth.js';

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
    res.json({
      url: `/uploads/${newFilename}`,
      filename: newFilename,
      size: stat.size,
    });
  } catch (err) {
    console.error('Crop error:', err);
    res.status(500).json({ error: err.message || 'Crop failed' });
  }
});

// List uploaded files (admin only)
router.get('/', authMiddleware, (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        const ext = path.extname(f).toLowerCase();
        let type = 'other';
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'].includes(ext)) type = 'image';
        else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) type = 'video';
        else if (ext === '.pdf') type = 'pdf';
        else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) type = 'document';
        return { filename: f, url: `/uploads/${f}`, size: stat.size, created: stat.birthtime, type, ext };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// Delete uploaded file (admin only)
router.delete('/:filename', authMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Dosya silinemedi' });
  }
});

export default router;
