import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import contactRoutes from './routes/contacts.js';
import newsletterRoutes from './routes/newsletter.js';
import uploadRoutes from './routes/upload.js';
import applicationRoutes from './routes/applications.js';
import jobListingRoutes from './routes/jobListings.js';
import useCaseRoutes from './routes/useCases.js';
import usersRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import mailRoutes from './routes/mail.js';
import pool from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
const uploadsDir = process.env.UPLOAD_DIR 
  ? (path.isAbsolute(process.env.UPLOAD_DIR) ? process.env.UPLOAD_DIR : path.join(process.cwd(), process.env.UPLOAD_DIR))
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/job-listings', jobListingRoutes);
app.use('/api/use-cases', useCaseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/mail', mailRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, { index: false }));

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.PUBLIC_URL || 'https://www.cerilas.com';
    const projects = await pool.query("SELECT slug, updated_at FROM projects WHERE status = 'active'");
    const useCases = await pool.query("SELECT slug, updated_at FROM use_cases WHERE status = 'published'");
    const jobs = await pool.query("SELECT id, updated_at FROM job_listings WHERE is_active = true");

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const staticRoutes = ['/', '/tr/about', '/tr/contact', '/tr/projects', '/tr/use-cases', '/tr/careers'];
    staticRoutes.forEach(route => {
      xml += `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    projects.rows.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}/tr/projects/${p.slug}</loc>\n    <lastmod>${new Date(p.updated_at || Date.now()).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    useCases.rows.forEach(u => {
      xml += `  <url>\n    <loc>${baseUrl}/tr/use-cases/${u.slug}</loc>\n    <lastmod>${new Date(u.updated_at || Date.now()).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    jobs.rows.forEach(j => {
      xml += `  <url>\n    <loc>${baseUrl}/tr/careers/${j.id}</loc>\n    <lastmod>${new Date(j.updated_at || Date.now()).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).end();
  }
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cerilas.com';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('{*path}', async (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    let html = await fs.promises.readFile(indexPath, 'utf-8');
    const url = req.path;
    let ogTitle = 'Cerilas Yüksek Teknolojiler';
    let ogDesc = 'Yapay Zeka, Robotik, Veri Analitiği ve IoT alanlarında Ar-Ge ve danışmanlık hizmetleri sunan TÜBİTAK onaylı teknoloji şirketi.';
    let ogImage = '/favicon.png';

    if (url.includes('/projects/') || url.includes('/projeler/')) {
      const slug = url.split('/').pop();
      const proj = await pool.query("SELECT * FROM projects WHERE slug = $1", [slug]);
      if (proj.rows.length > 0) {
        const p = proj.rows[0];
        ogTitle = p.seo_title_tr || p.title_tr || ogTitle;
        ogDesc = p.seo_description_tr || p.short_desc_tr || ogDesc;
        if (p.image_url) ogImage = p.image_url;
      }
    } else if (url.includes('/use-cases/')) {
      const slug = url.split('/').pop();
      const uc = await pool.query("SELECT * FROM use_cases WHERE slug = $1", [slug]);
      if (uc.rows.length > 0) {
        const u = uc.rows[0];
        ogTitle = u.seo_title_tr || u.title_tr || ogTitle;
        ogDesc = u.seo_description_tr || u.problem_tr || ogDesc;
        if (u.cover_image_url) ogImage = u.cover_image_url;
      }
    } else if (url.includes('/careers/')) {
      const id = url.split('/').pop();
      if (!isNaN(id)) {
        const job = await pool.query("SELECT * FROM job_listings WHERE id = $1", [id]);
        if (job.rows.length > 0) {
          const j = job.rows[0];
          ogTitle = j.title_tr || ogTitle;
          ogDesc = j.description_tr ? j.description_tr.substring(0, 150) + '...' : ogDesc;
        }
      }
    }

    html = html.replace(/<title>.*<\/title>/, `<title>${ogTitle} | Cerilas</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${ogDesc.replace(/"/g, '&quot;')}"`);
    
    if (html.includes('<meta property="og:title"')) {
      html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />\n  </head>`);
    }

    if (html.includes('<meta property="og:description"')) {
      html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}" />\n  </head>`);
    }

    if (html.includes('<meta property="og:image"')) {
      html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${ogImage}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:image" content="${ogImage}" />\n  </head>`);
    }

    res.send(html);
  } catch (err) {
    console.error('SSR error:', err);
    res.sendFile(indexPath);
  }
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
    
    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_title_tr VARCHAR(320);
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(320);
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_description_tr TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_description_en TEXT;
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
