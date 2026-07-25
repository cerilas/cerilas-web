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
import smsRoutes from './routes/sms.js';
import opportunitiesRoutes from './routes/opportunities.js';
import opportunityTrackingRoutes from './routes/opportunityTracking.js';
import pomodoroRoutes from './routes/pomodoro.js';
import analyticsRoutes from './routes/analytics.js';
import expensesRoutes from './routes/expenses.js';
import accountsRoutes from './routes/accounts.js';
import documentsRoutes from './routes/documents.js';
import pool from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const BRAND_NAME = 'CERİLAS Yüksek Teknoloji';
const DEFAULT_DESCRIPTION = 'Robotik, yapay zeka, sipariş Ar-Ge, TÜBİTAK, teknopark ve Avrupa Birliği projeleri için yüksek teknoloji Ar-Ge çözümleri.';
const SEO_KEYWORDS = [
  'CERİLAS Yüksek Teknoloji',
  'robotik arge',
  'yapay zeka çözümleri',
  'sipariş arge',
  'TÜBİTAK arge projesi',
  'teknopark teknoloji şirketi',
  'Avrupa Birliği projeleri',
  'Horizon Europe proje danışmanlığı',
  'robotics R&D',
  'AI R&D company',
  'EU funded technology projects',
  'technopark R&D company'
].join(', ');

const staticSeo = {
  '/': {
    title: `${BRAND_NAME} | Robotik, Yapay Zeka ve Sipariş Ar-Ge`,
    titleEn: `${BRAND_NAME} | Robotics, AI and Custom R&D`,
    description: DEFAULT_DESCRIPTION,
    descriptionEn: 'High-tech R&D solutions for robotics, artificial intelligence, custom R&D, technopark, TUBITAK and European Union projects.',
    priority: '1.0',
    changefreq: 'weekly'
  },
  '/about': {
    title: `Hakkımızda | ${BRAND_NAME}`,
    titleEn: `About | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji; robotik, yapay zeka, gömülü sistemler, teknopark ve TÜBİTAK destekli Ar-Ge projelerinde uzman teknoloji şirketidir.',
    descriptionEn: 'CERİLAS Yüksek Teknoloji is a technology company focused on robotics, artificial intelligence, embedded systems, technopark and TUBITAK-backed R&D projects.',
    priority: '0.8',
    changefreq: 'monthly'
  },
  '/capabilities': {
    title: `Faaliyet Alanları | Robotik, Yapay Zeka ve Ar-Ge | ${BRAND_NAME}`,
    titleEn: `Capabilities | Robotics, AI and R&D | ${BRAND_NAME}`,
    description: 'Robotik, yapay zeka, veri analitiği, IoT, gömülü sistemler ve prototipleme alanlarında uçtan uca yüksek teknoloji Ar-Ge yetkinlikleri.',
    descriptionEn: 'End-to-end high-tech R&D capabilities in robotics, artificial intelligence, data analytics, IoT, embedded systems and prototyping.',
    priority: '0.9',
    changefreq: 'monthly'
  },
  '/projects': {
    title: `Ar-Ge Projeleri | TÜBİTAK, Teknopark ve AB Projeleri | ${BRAND_NAME}`,
    titleEn: `R&D Projects | TUBITAK, Technopark and EU Projects | ${BRAND_NAME}`,
    description: 'TÜBİTAK, teknopark, Avrupa Birliği ve sipariş Ar-Ge kapsamındaki robotik, yapay zeka ve yüksek teknoloji proje portföyü.',
    descriptionEn: 'Robotics, artificial intelligence and high-tech project portfolio covering TUBITAK, technopark, European Union and custom R&D programs.',
    priority: '0.9',
    changefreq: 'weekly'
  },
  '/use-cases': {
    title: `Use Case'ler | Yapay Zeka, Robotik ve Teknoloji Çözümleri | ${BRAND_NAME}`,
    titleEn: `Use Cases | AI, Robotics and Technology Solutions | ${BRAND_NAME}`,
    description: 'Sektörlere göre yapay zeka, robotik, veri analitiği, IoT ve Ar-Ge kullanım senaryoları.',
    descriptionEn: 'Sector-specific artificial intelligence, robotics, data analytics, IoT and R&D use cases.',
    priority: '0.9',
    changefreq: 'weekly'
  },
  '/consultancy': {
    title: `Ar-Ge ve Teknoloji Danışmanlığı | ${BRAND_NAME}`,
    titleEn: `R&D and Technology Consultancy | ${BRAND_NAME}`,
    description: 'TÜBİTAK, Avrupa Birliği projeleri, teknopark süreçleri, sipariş Ar-Ge ve yüksek teknoloji ürün geliştirme danışmanlığı.',
    descriptionEn: 'Consultancy for TUBITAK, European Union projects, technopark processes, custom R&D and high-tech product development.',
    priority: '0.8',
    changefreq: 'monthly'
  },
  '/careers': {
    title: `Kariyer | ${BRAND_NAME}`,
    titleEn: `Careers | ${BRAND_NAME}`,
    description: 'Robotik, yapay zeka, yazılım, gömülü sistemler ve Ar-Ge projelerinde CERİLAS Yüksek Teknoloji kariyer fırsatları.',
    descriptionEn: 'Career opportunities at CERİLAS Yüksek Teknoloji in robotics, AI, software, embedded systems and R&D projects.',
    priority: '0.6',
    changefreq: 'weekly'
  },
  '/careers/apply': {
    title: `İş Başvurusu | ${BRAND_NAME}`,
    titleEn: `Job Application | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji açık pozisyonları ve genel iş başvuru formu.',
    descriptionEn: 'Open positions and general job application form for CERİLAS Yüksek Teknoloji.',
    priority: '0.5',
    changefreq: 'monthly'
  },
  '/contact': {
    title: `İletişim | ${BRAND_NAME}`,
    titleEn: `Contact | ${BRAND_NAME}`,
    description: 'Robotik, yapay zeka, teknoloji, teknopark, TÜBİTAK ve Avrupa Birliği projeleri için CERİLAS Yüksek Teknoloji ile iletişime geçin.',
    descriptionEn: 'Contact CERİLAS Yüksek Teknoloji for robotics, AI, technology, technopark, TUBITAK and European Union projects.',
    priority: '0.8',
    changefreq: 'monthly'
  },
  '/legal/terms': {
    title: `Kullanım Koşulları | ${BRAND_NAME}`,
    titleEn: `Terms and Conditions | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji web sitesi kullanım koşulları.',
    descriptionEn: 'Terms and conditions for the CERİLAS Yüksek Teknoloji website.',
    priority: '0.3',
    changefreq: 'yearly'
  },
  '/legal/privacy': {
    title: `Gizlilik Politikası | ${BRAND_NAME}`,
    titleEn: `Privacy Policy | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji gizlilik politikası ve KVKK bilgilendirmesi.',
    descriptionEn: 'Privacy policy and data protection information for CERİLAS Yüksek Teknoloji.',
    priority: '0.3',
    changefreq: 'yearly'
  },
  '/legal/refund': {
    title: `İade Politikası | ${BRAND_NAME}`,
    titleEn: `Refund Policy | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji hizmetleri için iade politikası.',
    descriptionEn: 'Refund policy for CERİLAS Yüksek Teknoloji services.',
    priority: '0.3',
    changefreq: 'yearly'
  },
  '/legal/accessibility': {
    title: `Erişilebilirlik | ${BRAND_NAME}`,
    titleEn: `Accessibility | ${BRAND_NAME}`,
    description: 'CERİLAS Yüksek Teknoloji dijital erişilebilirlik beyanı.',
    descriptionEn: 'Digital accessibility statement for CERİLAS Yüksek Teknoloji.',
    priority: '0.3',
    changefreq: 'yearly'
  }
};

const localePrefixes = ['tr', 'en'];

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const getBaseUrl = () => (process.env.PUBLIC_URL || 'https://www.cerilas.com').replace(/\/$/, '');

const stripLocalePrefix = (urlPath) => {
  const match = urlPath.match(/^\/(tr|en)(?=\/|$)/);
  if (!match) return { locale: 'tr', path: urlPath || '/' };
  const stripped = urlPath.slice(match[0].length) || '/';
  return { locale: match[1], path: stripped };
};

const localizedPath = (pathValue, locale) => {
  const normalized = pathValue === '/' ? '' : pathValue;
  return `/${locale}${normalized}`;
};

const addMetaTag = (html, selector, tagHtml) => (
  html.includes(selector) ? html : html.replace('</head>', `  ${tagHtml}\n  </head>`)
);

const getStaticMeta = (routePath, locale) => {
  const meta = staticSeo[routePath] || staticSeo['/'];
  if (locale === 'en') {
    return {
      ...meta,
      title: meta.titleEn || meta.title,
      description: meta.descriptionEn || meta.description
    };
  }
  return meta;
};

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
app.use('/api/sms', smsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/opportunity-tracking', opportunityTrackingRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/documents', documentsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, { index: false }));

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl();
    const projects = await pool.query("SELECT slug, updated_at FROM projects WHERE status = 'active'");
    const useCases = await pool.query("SELECT slug, updated_at FROM use_cases WHERE status = 'published'");

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    const addUrl = ({ path: routePath, lastmod, changefreq = 'monthly', priority = '0.7' }) => {
      localePrefixes.forEach(locale => {
        const loc = `${baseUrl}${localizedPath(routePath, locale)}`;
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(loc)}</loc>\n`;
        localePrefixes.forEach(altLocale => {
          xml += `    <xhtml:link rel="alternate" hreflang="${altLocale}" href="${escapeXml(`${baseUrl}${localizedPath(routePath, altLocale)}`)}" />\n`;
        });
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${baseUrl}${routePath}`)}" />\n`;
        if (lastmod) xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += '  </url>\n';
      });
    };

    Object.entries(staticSeo).forEach(([routePath, meta]) => {
      addUrl({ path: routePath, changefreq: meta.changefreq, priority: meta.priority });
    });

    projects.rows.forEach(p => {
      addUrl({ path: `/projects/${p.slug}`, lastmod: p.updated_at || Date.now(), changefreq: 'monthly', priority: '0.7' });
    });

    useCases.rows.forEach(u => {
      addUrl({ path: `/use-cases/${u.slug}`, lastmod: u.updated_at || Date.now(), changefreq: 'monthly', priority: '0.7' });
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
  const baseUrl = getBaseUrl();
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /server/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl.replace(/^https?:\/\//, '')}`,
    ''
  ].join('\n'));
});

app.get('{*path}', async (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    let html = await fs.promises.readFile(indexPath, 'utf-8');
    const url = req.path;
    const baseUrl = getBaseUrl();
    const { locale, path: canonicalPath } = stripLocalePrefix(url);
    const canonicalUrl = `${baseUrl}${localizedPath(canonicalPath, locale)}`;
    const staticMeta = getStaticMeta(canonicalPath, locale);
    let ogTitle = staticMeta.title || BRAND_NAME;
    let ogDesc = staticMeta.description || DEFAULT_DESCRIPTION;
    let ogImage = '/favicon.png';

    if (canonicalPath.includes('/projects/') || canonicalPath.includes('/projeler/')) {
      const slug = canonicalPath.split('/').pop();
      const proj = await pool.query("SELECT * FROM projects WHERE slug = $1", [slug]);
      if (proj.rows.length > 0) {
        const p = proj.rows[0];
        ogTitle = locale === 'en' ? (p.seo_title_en || p.title_en || ogTitle) : (p.seo_title_tr || p.title_tr || ogTitle);
        ogDesc = locale === 'en' ? (p.seo_description_en || p.short_desc_en || ogDesc) : (p.seo_description_tr || p.short_desc_tr || ogDesc);
        if (p.image_url) ogImage = p.image_url;
      }
    } else if (canonicalPath.includes('/use-cases/')) {
      const slug = canonicalPath.split('/').pop();
      const uc = await pool.query("SELECT * FROM use_cases WHERE slug = $1", [slug]);
      if (uc.rows.length > 0) {
        const u = uc.rows[0];
        ogTitle = locale === 'en' ? (u.seo_title_en || u.title_en || ogTitle) : (u.seo_title_tr || u.title_tr || ogTitle);
        ogDesc = locale === 'en' ? (u.seo_description_en || u.problem_en || ogDesc) : (u.seo_description_tr || u.problem_tr || ogDesc);
        if (u.cover_image_url) ogImage = u.cover_image_url;
      }
    } else if (canonicalPath.includes('/careers/')) {
      const id = canonicalPath.split('/').pop();
      if (!isNaN(id)) {
        const job = await pool.query("SELECT * FROM job_listings WHERE id = $1", [id]);
        if (job.rows.length > 0) {
          const j = job.rows[0];
          ogTitle = locale === 'en' ? (j.title_en || j.title || ogTitle) : (j.title_tr || j.title || ogTitle);
          const jobDesc = locale === 'en' ? (j.description_en || j.description) : (j.description_tr || j.description);
          ogDesc = jobDesc ? jobDesc.substring(0, 150) + '...' : ogDesc;
        }
      }
    }

    const title = ogTitle.includes(BRAND_NAME) ? ogTitle : `${ogTitle} | ${BRAND_NAME}`;
    const imageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND_NAME,
      alternateName: ['CERİLAS', 'Cerilas High Tech'],
      url: baseUrl,
      logo: `${baseUrl}/favicon.png`,
      description: DEFAULT_DESCRIPTION,
      areaServed: ['TR', 'EU'],
      knowsAbout: [
        'Robotik',
        'Yapay zeka',
        'Sipariş Ar-Ge',
        'TÜBİTAK projeleri',
        'Teknopark',
        'Avrupa Birliği projeleri',
        'Horizon Europe',
        'Robotics R&D',
        'Artificial intelligence R&D'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'business inquiries',
        email: 'info@cerilas.com',
        availableLanguage: ['tr', 'en']
      }
    };

    html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);
    html = html.replace(/<title>.*<\/title>/, `<title>${title.replace(/</g, '&lt;')}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${ogDesc.replace(/"/g, '&quot;')}"`);
    html = html.replace(/<meta name="keywords" content="[^"]*"/, `<meta name="keywords" content="${SEO_KEYWORDS.replace(/"/g, '&quot;')}"`);
    
    if (html.includes('<meta property="og:title"')) {
      html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />\n  </head>`);
    }

    if (html.includes('<meta property="og:description"')) {
      html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}" />\n  </head>`);
    }

    if (html.includes('<meta property="og:image"')) {
      html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${imageUrl}"`);
    } else {
      html = html.replace('</head>', `  <meta property="og:image" content="${imageUrl}" />\n  </head>`);
    }

    html = html
      .replace(/\s*<link rel="canonical"[^>]*>\n?/g, '')
      .replace(/\s*<link rel="alternate"[^>]*>\n?/g, '')
      .replace(/\s*<meta property="og:url"[^>]*>\n?/g, '')
      .replace(/\s*<meta property="og:site_name"[^>]*>\n?/g, '')
      .replace(/\s*<meta name="twitter:card"[^>]*>\n?/g, '')
      .replace(/\s*<meta name="twitter:title"[^>]*>\n?/g, '')
      .replace(/\s*<meta name="twitter:description"[^>]*>\n?/g, '')
      .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');

    html = html.replace(/<meta property="og:locale" content="[^"]*"/, `<meta property="og:locale" content="${locale === 'en' ? 'en_US' : 'tr_TR'}"`);
    const localeAlternates = localePrefixes.map(altLocale => 
      `<link rel="alternate" hreflang="${altLocale}" href="${baseUrl}${localizedPath(canonicalPath, altLocale)}" />`
    ).join('\n  ');

    html = addMetaTag(html, 'rel="canonical"', `<link rel="canonical" href="${canonicalUrl}" />`);
    html = addMetaTag(html, 'hreflang="x-default"', `${localeAlternates}\n  <link rel="alternate" hreflang="x-default" href="${baseUrl}${canonicalPath}" />`);
    html = addMetaTag(html, 'name="robots"', '<meta name="robots" content="index, follow, max-image-preview:large" />');
    html = addMetaTag(html, 'property="og:url"', `<meta property="og:url" content="${canonicalUrl}" />`);
    html = addMetaTag(html, 'property="og:site_name"', `<meta property="og:site_name" content="${BRAND_NAME}" />`);
    html = addMetaTag(html, 'name="twitter:card"', '<meta name="twitter:card" content="summary_large_image" />');
    html = addMetaTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`);
    html = addMetaTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}" />`);
    html = addMetaTag(html, 'application/ld+json', `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`);

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
      
      CREATE TABLE IF NOT EXISTS sms_settings (
        id SERIAL PRIMARY KEY,
        netgsm_usercode VARCHAR(100),
        netgsm_password VARCHAR(100),
        netgsm_header VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      INSERT INTO sms_settings (netgsm_usercode, netgsm_password, netgsm_header, is_active)
      SELECT 'deniz@cerilas.com', 'Dnz.24232423', 'CERILAS AS', true
      WHERE NOT EXISTS (SELECT 1 FROM sms_settings);

      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(300) NOT NULL,
        description TEXT,
        application_url TEXT,
        drive_url TEXT,
        focus_rating INTEGER DEFAULT 0,
        probability_rating INTEGER DEFAULT 0,
        institution VARCHAR(100),
        application_point VARCHAR(100),
        application_point_other VARCHAR(100),
        total_income NUMERIC(15, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'TRY',
        status VARCHAR(50) DEFAULT 'Aktif',
        application_date DATE,
        expected_end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS opportunity_payments (
        id SERIAL PRIMARY KEY,
        opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
        amount NUMERIC(15, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'TRY',
        payment_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS opportunity_todos (
        id SERIAL PRIMARY KEY,
        opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        deadline DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE opportunity_todos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
      ALTER TABLE opportunity_payments ADD COLUMN IF NOT EXISTS exchange_rates JSONB;
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Aktif';
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS institution VARCHAR(100);
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS application_point VARCHAR(100);
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS application_point_other VARCHAR(100);

      CREATE TABLE IF NOT EXISTS tracked_opportunities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        description TEXT DEFAULT '',
        note TEXT DEFAULT '',
        link_url TEXT,
        scrap_url TEXT,
        domain VARCHAR(255),
        favicon_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tracked_opportunities_created ON tracked_opportunities(created_at DESC);

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(240) NOT NULL,
        note TEXT DEFAULT '',
        category VARCHAR(100) NOT NULL DEFAULT 'Diğer',
        related_party VARCHAR(240),
        icon VARCHAR(40) NOT NULL DEFAULT 'receipt',
        amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
        period VARCHAR(10) NOT NULL CHECK (period IN ('monthly', 'yearly')),
        due_day INTEGER CHECK (due_day IS NULL OR (due_day BETWEEN 1 AND 31)),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses(created_at DESC);

      CREATE TABLE IF NOT EXISTS saved_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_name VARCHAR(240) NOT NULL,
        login_url TEXT,
        domain VARCHAR(255),
        favicon_url TEXT,
        password_encrypted TEXT,
        email VARCHAR(320),
        phone VARCHAR(50),
        note TEXT DEFAULT '',
        login_type VARCHAR(80) NOT NULL DEFAULT 'Şifre',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_saved_accounts_user
        ON saved_accounts(user_id, updated_at DESC);

      CREATE TABLE IF NOT EXISTS site_analytics_events (
        id SERIAL PRIMARY KEY,
        visitor_id VARCHAR(100),
        session_id VARCHAR(100),
        event_type VARCHAR(40) NOT NULL,
        path TEXT,
        page_title TEXT,
        referrer TEXT,
        element_tag VARCHAR(80),
        element_text TEXT,
        element_href TEXT,
        duration_seconds INTEGER,
        country VARCHAR(8),
        user_agent TEXT,
        ip_hash VARCHAR(128),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_site_analytics_created ON site_analytics_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON site_analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_session ON site_analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_path ON site_analytics_events(path);
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        duration_minutes INTEGER NOT NULL,
        date_string VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date ON pomodoro_sessions(user_id, date_string);
      
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pomodoro_sound VARCHAR(50) DEFAULT 'beep1';
      ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS task_label VARCHAR(255);
    `);
  } catch (err) {
    console.error('Table init error:', err.message);
  }
  console.log(`API server running on http://localhost:${PORT}`);
});
