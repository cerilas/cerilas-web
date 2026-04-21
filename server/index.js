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
import applicationRoutes from './routes/applications.js';
import jobListingRoutes from './routes/jobListings.js';
import useCaseRoutes from './routes/useCases.js';
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
app.use('/api/applications', applicationRoutes);
app.use('/api/job-listings', jobListingRoutes);
app.use('/api/use-cases', useCaseRoutes);

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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_listings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL DEFAULT '',
        type VARCHAR(100) NOT NULL DEFAULT '',
        location VARCHAR(200) NOT NULL DEFAULT '',
        description TEXT,
        title_tr VARCHAR(200) NOT NULL DEFAULT '',
        title_en VARCHAR(200) NOT NULL DEFAULT '',
        type_tr VARCHAR(100) NOT NULL DEFAULT '',
        type_en VARCHAR(100) NOT NULL DEFAULT '',
        location_tr VARCHAR(200) NOT NULL DEFAULT '',
        location_en VARCHAR(200) NOT NULL DEFAULT '',
        description_tr TEXT,
        description_en TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Migrate existing single-language columns to _tr/_en
    await pool.query(`
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS title_tr VARCHAR(200) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS title_en VARCHAR(200) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS type_tr VARCHAR(100) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS type_en VARCHAR(100) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS location_tr VARCHAR(200) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS location_en VARCHAR(200) NOT NULL DEFAULT '';
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS description_tr TEXT;
      ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS description_en TEXT;
    `);
    // Backfill: copy old single-lang data into _tr if empty
    await pool.query(`
      UPDATE job_listings SET
        title_tr = title, title_en = title,
        type_tr = type, type_en = type,
        location_tr = location, location_en = location,
        description_tr = description, description_en = description
      WHERE title_tr = '' OR title_en = '';
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        position VARCHAR(200) NOT NULL,
        cover_letter TEXT,
        cv_filename VARCHAR(500),
        cv_original_name VARCHAR(500),
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS use_cases (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(220) NOT NULL UNIQUE,
        title_tr VARCHAR(300) NOT NULL,
        title_en VARCHAR(300) NOT NULL,
        problem_tr TEXT NOT NULL,
        problem_en TEXT NOT NULL,
        solution_tr TEXT NOT NULL,
        solution_en TEXT NOT NULL,
        seo_title_tr VARCHAR(320),
        seo_title_en VARCHAR(320),
        seo_description_tr TEXT,
        seo_description_en TEXT,
        cover_image_url TEXT,
        tags_tr TEXT[] DEFAULT '{}',
        tags_en TEXT[] DEFAULT '{}',
        keywords_tr TEXT[] DEFAULT '{}',
        keywords_en TEXT[] DEFAULT '{}',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_use_cases_status ON use_cases(status);
      CREATE INDEX IF NOT EXISTS idx_use_cases_published_at ON use_cases(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_use_cases_updated_at ON use_cases(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_use_cases_tags_tr_gin ON use_cases USING GIN(tags_tr);
      CREATE INDEX IF NOT EXISTS idx_use_cases_tags_en_gin ON use_cases USING GIN(tags_en);
      CREATE INDEX IF NOT EXISTS idx_use_cases_keywords_tr_gin ON use_cases USING GIN(keywords_tr);
      CREATE INDEX IF NOT EXISTS idx_use_cases_keywords_en_gin ON use_cases USING GIN(keywords_en);
    `);
  } catch (err) {
    console.error('Table init error:', err.message);
  }
  console.log(`API server running on http://localhost:${PORT}`);
});
