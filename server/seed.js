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
  `);

  // Seed admin user
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['deniz@cerilas.com']);
  if (existingUser.rows.length === 0) {
    const hash = await bcrypt.hash('24232423', 12);
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', ['deniz@cerilas.com', hash]);
    console.log('Admin user created');
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

  console.log('Seed complete!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
