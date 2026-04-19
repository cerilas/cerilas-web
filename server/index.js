import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import contactRoutes from './routes/contacts.js';
import newsletterRoutes from './routes/newsletter.js';
import uploadRoutes from './routes/upload.js';
import pool from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, async () => {
  // Auto-create media table if not exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(500),
        url TEXT NOT NULL,
        mimetype VARCHAR(100),
        size INTEGER DEFAULT 0,
        original_size INTEGER DEFAULT 0,
        type VARCHAR(20) DEFAULT 'other',
        ext VARCHAR(20),
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
      CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
    `);
  } catch (err) {
    console.error('Media table init error:', err.message);
  }
  console.log(`API server running on http://localhost:${PORT}`);
});
