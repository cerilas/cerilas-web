import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { sendNotificationMail } from './mail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cvDir = path.join(__dirname, '..', 'uploads', 'cv');
if (!fs.existsSync(cvDir)) fs.mkdirSync(cvDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cvDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    cb(null, `${Date.now()}-${safe}`);
  },
});

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and Word files are allowed'));
  },
});

const router = Router();

// Public: submit job application
router.post('/', upload.single('cv'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, coverLetter } = req.body;

    if (!firstName || !lastName || !email || !position) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'First name, last name, email and position are required' });
    }

    const cvFilename = req.file ? req.file.filename : null;
    const cvOriginalName = req.file ? req.file.originalname : null;

    const result = await pool.query(
      `INSERT INTO job_applications (first_name, last_name, email, phone, position, cover_letter, cv_filename, cv_original_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [firstName, lastName, email, phone || null, position, coverLetter || null, cvFilename, cvOriginalName]
    );

    // Send notification
    sendNotificationMail('job', { firstName, lastName, email, position });

    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Application submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all applications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: mark as reviewed
router.patch('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'reviewed', 'shortlisted', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await pool.query(
      'UPDATE job_applications SET status = $1 WHERE id = $2',
      [status || 'reviewed', req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: download CV
router.get('/:id/cv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT cv_filename, cv_original_name FROM job_applications WHERE id = $1', [req.params.id]);
    if (!result.rows.length || !result.rows[0].cv_filename) {
      return res.status(404).json({ error: 'CV not found' });
    }
    const { cv_filename, cv_original_name } = result.rows[0];
    const filePath = path.join(cvDir, cv_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.download(filePath, cv_original_name || cv_filename);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete application
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT cv_filename FROM job_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length && result.rows[0].cv_filename) {
      const filePath = path.join(cvDir, result.rows[0].cv_filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM job_applications WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
