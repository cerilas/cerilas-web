import process from 'node:process';
import pool from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      title_tr TEXT NOT NULL,
      title_en TEXT NOT NULL,
      short_desc_tr TEXT,
      short_desc_en TEXT,
      challenge_tr TEXT,
      challenge_en TEXT,
      solution_tr TEXT,
      solution_en TEXT,
      impact_tr TEXT,
      impact_en TEXT,
      date_tr VARCHAR(255),
      date_en VARCHAR(255),
      tags_tr TEXT[] DEFAULT '{}',
      tags_en TEXT[] DEFAULT '{}',
      technologies TEXT[] DEFAULT '{}',
      grant_info TEXT,
      university TEXT,
      academic_staff TEXT,
      partner TEXT,
      budget TEXT,
      image_url TEXT,
      sort_order INT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_content (
      id SERIAL PRIMARY KEY,
      section VARCHAR(100) NOT NULL,
      field_key VARCHAR(255) NOT NULL,
      value_tr TEXT,
      value_en TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(section, field_key)
    );

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
  `);

  // Seed admin user
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['deniz@cerilas.com']);
  if (existingUser.rows.length === 0) {
    const hash = await bcrypt.hash('24232423', 12);
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', ['deniz@cerilas.com', hash]);
    console.log('Admin user created');
  }

  const sampleMedia = [
    {
      filename: '1776621026540-zzlv4a.png',
      original_name: 'use-case-healthcare-dashboard.png',
      url: '/uploads/1776621026540-zzlv4a.png',
      mimetype: 'image/png',
      type: 'image',
      ext: 'png',
    },
    {
      filename: '1776621456098-fyphzn.webp',
      original_name: 'use-case-manufacturing-vision.webp',
      url: '/uploads/1776621456098-fyphzn.webp',
      mimetype: 'image/webp',
      type: 'image',
      ext: 'webp',
    },
    {
      filename: '1776629124600-knq23z.webp',
      original_name: 'use-case-operations-analytics.webp',
      url: '/uploads/1776629124600-knq23z.webp',
      mimetype: 'image/webp',
      type: 'image',
      ext: 'webp',
    },
  ];

  for (const media of sampleMedia) {
    await pool.query(
      `INSERT INTO media (filename, original_name, url, mimetype, type, ext)
       SELECT $1::varchar, $2::varchar, $3::text, $4::varchar, $5::varchar, $6::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM media WHERE filename = $1::varchar
       )`,
      [media.filename, media.original_name, media.url, media.mimetype, media.type, media.ext]
    );
  }

  // Seed projects from existing translations
  const existingProjects = await pool.query('SELECT id FROM projects LIMIT 1');
  if (existingProjects.rows.length === 0) {
    const projects = [
      {
        slug: 'mobilap',
        title_tr: 'MOBILAP',
        title_en: 'MOBILAP',
        short_desc_tr: 'Otonom mobil robotlar için yapay zeka tabanlı algılama ve navigasyon sistemi.',
        short_desc_en: 'AI-based perception and navigation system for autonomous mobile robots.',
        challenge_tr: 'Endüstriyel ortamlarda otonom navigasyon ve engelden kaçınma problemlerinin çözülmesi.',
        challenge_en: 'Solving autonomous navigation and obstacle avoidance problems in industrial environments.',
        solution_tr: 'Derin öğrenme tabanlı algılama, SLAM ve yol planlama algoritmalarının entegrasyonu.',
        solution_en: 'Integration of deep learning-based perception, SLAM, and path planning algorithms.',
        impact_tr: 'Endüstriyel lojistik operasyonlarında %40 verimlilik artışı.',
        impact_en: '40% efficiency increase in industrial logistics operations.',
        date_tr: '1 Mar 2023',
        date_en: '1 Mar 2023',
        tags_tr: ['Yapay Zeka', 'Robotik', 'Bilgisayarlı Görü'],
        tags_en: ['AI', 'Robotics', 'Computer Vision'],
        technologies: ['Python', 'PyTorch', 'ROS2', 'OpenCV', 'CUDA'],
        sort_order: 1
      },
      {
        slug: 'gimbo',
        title_tr: 'GIMBO',
        title_en: 'GIMBO',
        short_desc_tr: 'Endüstriyel IoT platformu ile gerçek zamanlı veri toplama ve analiz sistemi.',
        short_desc_en: 'Real-time data collection and analysis system with industrial IoT platform.',
        challenge_tr: 'Farklı endüstriyel sensör ve cihazlardan gelen verilerin birleştirilmesi ve analiz edilmesi.',
        challenge_en: 'Consolidating and analyzing data from different industrial sensors and devices.',
        solution_tr: 'Modüler IoT gateway mimarisi ve edge computing tabanlı gerçek zamanlı analiz.',
        solution_en: 'Modular IoT gateway architecture and edge computing-based real-time analysis.',
        impact_tr: 'Kestirimci bakım ile plansız duruş sürelerinde %60 azalma.',
        impact_en: '60% reduction in unplanned downtime with predictive maintenance.',
        date_tr: '15 Eki 2023 – 1 Haz 2025',
        date_en: '15 Oct 2023 – 1 Jun 2025',
        tags_tr: ['IoT', 'Veri Analitiği', 'Edge Computing'],
        tags_en: ['IoT', 'Data Analytics', 'Edge Computing'],
        technologies: ['Node.js', 'MQTT', 'InfluxDB', 'Grafana', 'Docker'],
        sort_order: 2
      },
      {
        slug: 'gismo',
        title_tr: 'GISMO',
        title_en: 'GISMO',
        short_desc_tr: 'TÜBİTAK destekli akıllı üretim ve kalite kontrol sistemi.',
        short_desc_en: 'TÜBİTAK-funded smart manufacturing and quality control system.',
        challenge_tr: 'Üretim hatlarında gerçek zamanlı kalite kontrol ve hata tespiti.',
        challenge_en: 'Real-time quality control and defect detection on production lines.',
        solution_tr: 'Bilgisayarlı görü ve derin öğrenme tabanlı otomatik kalite kontrol sistemi.',
        solution_en: 'Computer vision and deep learning-based automatic quality control system.',
        impact_tr: 'Hata tespit oranında %95 doğruluk, üretim maliyetlerinde %25 düşüş.',
        impact_en: '95% accuracy in defect detection, 25% reduction in production costs.',
        date_tr: '1 Oca 2025 – 15 Mar 2026',
        date_en: '1 Jan 2025 – 15 Mar 2026',
        tags_tr: ['Yapay Zeka', 'Üretim', 'Kalite Kontrol'],
        tags_en: ['AI', 'Manufacturing', 'Quality Control'],
        technologies: ['Python', 'TensorFlow', 'OpenCV', 'FastAPI', 'PostgreSQL'],
        grant_info: 'TÜBİTAK 1501',
        university: 'Gaziantep Üniversitesi',
        academic_staff: 'Prof. Dr. Ahmet Yılmaz',
        partner: 'Cerilas Yüksek Teknolojiler A.Ş.',
        budget: '2.500.000 TL',
        sort_order: 3
      }
    ];

    for (const p of projects) {
      await pool.query(
        `INSERT INTO projects (slug, title_tr, title_en, short_desc_tr, short_desc_en,
          challenge_tr, challenge_en, solution_tr, solution_en, impact_tr, impact_en,
          date_tr, date_en, tags_tr, tags_en, technologies, grant_info, university,
          academic_staff, partner, budget, sort_order)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [p.slug, p.title_tr, p.title_en, p.short_desc_tr, p.short_desc_en,
         p.challenge_tr, p.challenge_en, p.solution_tr, p.solution_en, p.impact_tr, p.impact_en,
         p.date_tr, p.date_en, p.tags_tr, p.tags_en, p.technologies, p.grant_info || null,
         p.university || null, p.academic_staff || null, p.partner || null, p.budget || null, p.sort_order]
      );
    }
    console.log('Projects seeded');
  }

  // Seed site content from key sections
  const existingContent = await pool.query('SELECT id FROM site_content LIMIT 1');
  if (existingContent.rows.length === 0) {
    const content = [
      { section: 'home', field_key: 'heroTitle', value_tr: 'Geleceği İnşa Eden', value_en: 'Building the' },
      { section: 'home', field_key: 'heroHighlight', value_tr: 'Teknoloji', value_en: 'Future of Technology' },
      { section: 'home', field_key: 'heroDesc', value_tr: 'Yapay zeka, robotik ve ileri veri analitiği alanlarında yenilikçi Ar-Ge çözümleri sunuyoruz.', value_en: 'We deliver innovative R&D solutions in artificial intelligence, robotics, and advanced data analytics.' },
      { section: 'home', field_key: 'tubitakTitle', value_tr: 'TÜBİTAK Onaylı Ar-Ge Merkezi', value_en: 'TÜBİTAK Certified R&D Center' },
      { section: 'home', field_key: 'tubitakDesc', value_tr: 'Cerilas, TÜBİTAK tarafından onaylanmış bir Ar-Ge merkezi olarak Türkiye\'nin teknoloji ekosistemine katkı sağlamaktadır.', value_en: 'As a TÜBİTAK-certified R&D center, Cerilas contributes to Turkey\'s technology ecosystem.' },
      { section: 'about', field_key: 'title', value_tr: 'Hakkımızda', value_en: 'About Us' },
      { section: 'about', field_key: 'subtitle', value_tr: 'Derin teknoloji alanında Ar-Ge odaklı çalışan, TÜBİTAK onaylı yüksek teknoloji şirketi.', value_en: 'A TÜBİTAK-certified deep-tech company focused on R&D.' },
      { section: 'about', field_key: 'whoTitle', value_tr: 'Biz Kimiz?', value_en: 'Who We Are' },
      { section: 'about', field_key: 'whoText', value_tr: 'Cerilas Yüksek Teknolojiler, yapay zeka, robotik, IoT ve veri analitiği alanlarında uçtan uca Ar-Ge çözümleri sunan bir teknoloji şirketidir.', value_en: 'Cerilas High Technologies is a technology company providing end-to-end R&D solutions in AI, robotics, IoT, and data analytics.' },
    ];

    for (const c of content) {
      await pool.query(
        'INSERT INTO site_content (section, field_key, value_tr, value_en) VALUES ($1, $2, $3, $4)',
        [c.section, c.field_key, c.value_tr, c.value_en]
      );
    }
    console.log('Site content seeded');
  }

  const useCases = [
      {
        slug: 'fizyoterapi-klinikleri-icin-dijital-hasta-takip',
        title_tr: 'Fizyoterapi klinikleri için dijital hasta takip sistemi',
        title_en: 'Digital patient tracking system for physiotherapy clinics',
        problem_tr: 'Birden fazla terapist ile çalışan fizyoterapi kliniklerinde randevu, seans notu, egzersiz planı ve ilerleme takibi çoğu zaman dağınık araçlarla yürütülür. Bu durum hasta memnuniyetini düşürür, operasyonel görünürlüğü azaltır ve yönetimin ölçeklenmesini zorlaştırır.',
        problem_en: 'In physiotherapy clinics operating with multiple therapists, appointment handling, session notes, exercise plans, and progress tracking are often managed across fragmented tools. This reduces patient satisfaction, weakens operational visibility, and makes scaling difficult.',
        solution_tr: 'Cerilas, klinik akışlarını tek bir dijital çatı altında toplayan bir çözüm kurgular. Randevu yönetimi, terapist ekranları, hasta egzersiz geçmişi, otomatik hatırlatmalar ve yönetici raporları aynı platformda birleşir. Böylece klinik ekipleri daha az operasyonel yükle daha yüksek hasta deneyimi sunar.',
        solution_en: 'Cerilas designs a unified digital workflow for clinics. Appointment management, therapist dashboards, patient exercise history, automated reminders, and management reports are consolidated on one platform. This helps clinic teams deliver a better patient experience with less operational overhead.',
        seo_title_tr: 'Fizyoterapi klinikleri için dijital hasta takip çözümü | Cerilas',
        seo_title_en: 'Digital patient tracking solution for physiotherapy clinics | Cerilas',
        seo_description_tr: 'Cerilas ile fizyoterapi kliniklerinde dijital hasta takibi, terapist verimliliği ve operasyonel görünürlük sağlayan use-case örneği.',
        seo_description_en: 'A Cerilas use case showing how physiotherapy clinics can improve patient tracking, therapist efficiency, and operational visibility.',
        cover_image_url: '/uploads/1776621026540-zzlv4a.png',
        tags_tr: ['Sağlık Teknolojileri', 'Klinik Operasyonları', 'Hasta Takibi'],
        tags_en: ['Health Tech', 'Clinic Operations', 'Patient Tracking'],
        keywords_tr: ['fizyoterapi yazılımı', 'hasta takip sistemi', 'klinik dijitalleşme'],
        keywords_en: ['physiotherapy software', 'patient tracking system', 'clinic digitization'],
        published_at: '2026-04-01T10:00:00Z',
      },
      {
        slug: 'uretim-hatlarinda-goruntu-isleme-ile-hata-tespiti',
        title_tr: 'Üretim hatlarında görüntü işleme ile hata tespiti',
        title_en: 'Defect detection with computer vision on production lines',
        problem_tr: 'Manuel kalite kontrol ekipleri yoğun üretim hatlarında her ürünü aynı doğrulukla inceleyemez. Gözden kaçan kusurlar iade oranlarını artırırken, gereksiz hatalı alarm üretimi de operasyonel verimi düşürür.',
        problem_en: 'Manual quality control teams cannot inspect every product with consistent accuracy on high-volume lines. Missed defects increase returns, while excessive false positives reduce operational efficiency.',
        solution_tr: 'Cerilas, kamera altyapısı ve derin öğrenme modelleri ile gerçek zamanlı kusur tespit hattı kurar. Sistem üretimden gelen görüntüleri anlık işler, kusur sınıflandırması yapar ve MES ya da ERP sistemlerine uyarı akışı sağlar.',
        solution_en: 'Cerilas deploys a real-time defect detection line using industrial cameras and deep learning models. The system processes imagery instantly, classifies defects, and routes alerts into MES or ERP systems.',
        seo_title_tr: 'Üretim hatlarında görüntü işleme ile kalite kontrol use-case | Cerilas',
        seo_title_en: 'Production line quality control use case with computer vision | Cerilas',
        seo_description_tr: 'Bilgisayarlı görü ile üretim hatlarında kusur tespiti, kalite kontrol otomasyonu ve iade azaltımı için Cerilas örnek use-case içeriği.',
        seo_description_en: 'A Cerilas use case for defect detection, quality control automation, and return reduction on production lines with computer vision.',
        cover_image_url: '/uploads/1776621456098-fyphzn.webp',
        tags_tr: ['Üretim', 'Kalite Kontrol', 'Bilgisayarlı Görü'],
        tags_en: ['Manufacturing', 'Quality Control', 'Computer Vision'],
        keywords_tr: ['görüntü işleme kalite kontrol', 'kusur tespiti', 'üretim hattı yapay zeka'],
        keywords_en: ['computer vision quality control', 'defect detection', 'AI for production lines'],
        published_at: '2026-04-03T09:30:00Z',
      },
      {
        slug: 'lojistik-operasyonlarinda-rotalama-ve-saha-ekibi-optimizasyonu',
        title_tr: 'Lojistik operasyonlarında rotalama ve saha ekibi optimizasyonu',
        title_en: 'Route planning and field team optimization in logistics operations',
        problem_tr: 'Günlük teslimat ve saha görevleri Excel dosyaları veya bireysel planlama alışkanlıklarıyla yönetildiğinde rota çakışmaları, gecikmeler ve atıl ekip süreleri artar. Müşteri tarafında ise öngörülemeyen teslimat saatleri memnuniyetsizlik yaratır.',
        problem_en: 'When daily deliveries and field tasks are managed with spreadsheets or individual planning habits, route conflicts, delays, and idle team time increase. On the customer side, unpredictable delivery windows create dissatisfaction.',
        solution_tr: 'Cerilas, sipariş yoğunluğu, bölgesel dağılım ve ekip kapasitesini aynı modelde ele alan bir karar destek katmanı geliştirir. Böylece rota önerileri, görev atamaları ve operasyon panelleri tek ekranda yönetilir; yöneticiler anlık darboğazları görebilir.',
        solution_en: 'Cerilas builds a decision-support layer that combines order density, geographic distribution, and team capacity in one model. Route suggestions, task assignments, and operations dashboards are managed from a single interface, giving managers live visibility into bottlenecks.',
        seo_title_tr: 'Lojistikte rota optimizasyonu ve saha planlama use-case | Cerilas',
        seo_title_en: 'Logistics route optimization and field planning use case | Cerilas',
        seo_description_tr: 'Teslimat planlama, saha ekibi yönetimi ve rota optimizasyonu için Cerilas tarafından hazırlanmış lojistik use-case örneği.',
        seo_description_en: 'A Cerilas logistics use case focused on delivery planning, field team management, and route optimization.',
        cover_image_url: '/uploads/1776629124600-knq23z.webp',
        tags_tr: ['Lojistik', 'Operasyon Optimizasyonu', 'Karar Destek'],
        tags_en: ['Logistics', 'Operations Optimization', 'Decision Support'],
        keywords_tr: ['rota optimizasyonu', 'lojistik yazılımı', 'saha ekibi planlama'],
        keywords_en: ['route optimization', 'logistics software', 'field team planning'],
        published_at: '2026-04-05T11:15:00Z',
      },
      {
        slug: 'perakende-zincirleri-icin-talep-tahmini-ve-stok-gorunurlugu',
        title_tr: 'Perakende zincirleri için talep tahmini ve stok görünürlüğü',
        title_en: 'Demand forecasting and inventory visibility for retail chains',
        problem_tr: 'Mağaza bazlı talep farklılaşmaları doğru tahmin edilemediğinde bazı şubelerde stok tükenmesi yaşanırken bazı şubelerde fazla stok maliyeti oluşur. Pazarlama kampanyaları ile tedarik planı arasındaki kopukluk bu sorunu büyütür.',
        problem_en: 'When store-level demand variability is not forecast accurately, some branches face stockouts while others accumulate excess inventory. A weak link between marketing campaigns and supply planning makes the issue worse.',
        solution_tr: 'Cerilas, satış geçmişi, kampanya etkisi, sezon etkisi ve lokasyon davranışı verilerini aynı tahminleme motorunda birleştirir. Sonuç olarak kategori bazlı talep tahmini, stok uyarıları ve satın alma önerileri merkezi panellerde sunulur.',
        solution_en: 'Cerilas combines sales history, campaign impact, seasonality, and location behavior in one forecasting engine. The result is category-level demand forecasting, stock alerts, and purchasing recommendations surfaced through centralized dashboards.',
        seo_title_tr: 'Perakendede talep tahmini ve stok yönetimi use-case | Cerilas',
        seo_title_en: 'Retail demand forecasting and inventory management use case | Cerilas',
        seo_description_tr: 'Perakende zincirleri için talep tahmini, stok görünürlüğü ve satın alma planlaması konusunda Cerilas use-case içeriği.',
        seo_description_en: 'A Cerilas use case for retail demand forecasting, inventory visibility, and purchase planning.',
        cover_image_url: '/uploads/1776621026540-zzlv4a.png',
        tags_tr: ['Perakende', 'Talep Tahmini', 'Stok Yönetimi'],
        tags_en: ['Retail', 'Demand Forecasting', 'Inventory Management'],
        keywords_tr: ['talep tahmini yazılımı', 'stok yönetimi', 'perakende analitiği'],
        keywords_en: ['demand forecasting software', 'inventory management', 'retail analytics'],
        published_at: '2026-04-07T08:45:00Z',
      },
      {
        slug: 'enerji-sirketleri-icin-saha-bakim-onceliklendirme-platformu',
        title_tr: 'Enerji şirketleri için saha bakım önceliklendirme platformu',
        title_en: 'Field maintenance prioritization platform for energy companies',
        problem_tr: 'Dağıtık enerji altyapılarında bakım ekiplerinin hangi saha noktasına önce gitmesi gerektiği çoğu zaman geçmiş tecrübeye dayalı belirlenir. Bu yaklaşım arıza riskini artırır ve bakım bütçesinin verimsiz kullanılmasına neden olur.',
        problem_en: 'In distributed energy infrastructures, deciding which field point maintenance teams should prioritize is often based on experience alone. That approach increases failure risk and leads to inefficient maintenance spending.',
        solution_tr: 'Cerilas, sensör verileri, geçmiş arıza kayıtları ve kritik ekipman skorlarını tek bir önceliklendirme modeli altında toplar. Ekipler risk bazlı bakım önerileri ile yönlendirilir, yöneticiler ise bakım yatırımlarını veriyle savunabilir hale gelir.',
        solution_en: 'Cerilas brings sensor telemetry, historical failure records, and critical equipment scores into a unified prioritization model. Teams are guided by risk-based maintenance recommendations, and managers gain defensible, data-backed investment visibility.',
        seo_title_tr: 'Enerji şirketleri için kestirimci bakım use-case | Cerilas',
        seo_title_en: 'Predictive maintenance use case for energy companies | Cerilas',
        seo_description_tr: 'Enerji altyapılarında saha bakım önceliklendirme, risk bazlı planlama ve kestirimci bakım için Cerilas örnek use-case.',
        seo_description_en: 'A Cerilas use case for field maintenance prioritization, risk-based planning, and predictive maintenance in energy infrastructure.',
        cover_image_url: '/uploads/1776621456098-fyphzn.webp',
        tags_tr: ['Enerji', 'Kestirimci Bakım', 'Saha Operasyonları'],
        tags_en: ['Energy', 'Predictive Maintenance', 'Field Operations'],
        keywords_tr: ['kestirimci bakım', 'enerji bakım yazılımı', 'saha operasyon yönetimi'],
        keywords_en: ['predictive maintenance', 'energy maintenance software', 'field operations management'],
        published_at: '2026-04-09T13:20:00Z',
      },
    ];

  for (const item of useCases) {
    await pool.query(
      `INSERT INTO use_cases (
        slug, title_tr, title_en, problem_tr, problem_en, solution_tr, solution_en,
        seo_title_tr, seo_title_en, seo_description_tr, seo_description_en,
        cover_image_url, tags_tr, tags_en, keywords_tr, keywords_en,
        status, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18
      )
      ON CONFLICT (slug) DO UPDATE SET
        title_tr = EXCLUDED.title_tr,
        title_en = EXCLUDED.title_en,
        problem_tr = EXCLUDED.problem_tr,
        problem_en = EXCLUDED.problem_en,
        solution_tr = EXCLUDED.solution_tr,
        solution_en = EXCLUDED.solution_en,
        seo_title_tr = EXCLUDED.seo_title_tr,
        seo_title_en = EXCLUDED.seo_title_en,
        seo_description_tr = EXCLUDED.seo_description_tr,
        seo_description_en = EXCLUDED.seo_description_en,
        cover_image_url = EXCLUDED.cover_image_url,
        tags_tr = EXCLUDED.tags_tr,
        tags_en = EXCLUDED.tags_en,
        keywords_tr = EXCLUDED.keywords_tr,
        keywords_en = EXCLUDED.keywords_en,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        updated_at = NOW()`,
      [
        item.slug,
        item.title_tr,
        item.title_en,
        item.problem_tr,
        item.problem_en,
        item.solution_tr,
        item.solution_en,
        item.seo_title_tr,
        item.seo_title_en,
        item.seo_description_tr,
        item.seo_description_en,
        item.cover_image_url,
        item.tags_tr,
        item.tags_en,
        item.keywords_tr,
        item.keywords_en,
        'published',
        item.published_at,
      ]
    );
  }
  console.log('Use cases seeded');

  console.log('Seed complete!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
