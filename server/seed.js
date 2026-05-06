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
  await pool.query('DELETE FROM projects');
  const existingProjects = { rows: [] };
  if (existingProjects.rows.length === 0) {
    const projects = [
      {
        slug: 'agi-robot-kiti',
        title_tr: 'Akıllı Telefonları AGI Robotlarına Dönüştüren Donanım Kiti',
        title_en: 'Hardware Kit Transforming Smartphones into AGI Robots',
        short_desc_tr: 'Akıllı telefonların işlem gücünü kullanarak genel yapay zeka (AGI) destekli robotik asistanlar oluşturmayı sağlayan donanım kiti.',
        short_desc_en: 'A hardware kit that leverages smartphone processing power to create artificial general intelligence (AGI) powered robotic assistants.',
        challenge_tr: 'Günümüzde gelişmiş robotik sistemlerin geliştirilmesi ve son kullanıcıya ulaştırılması yüksek donanım maliyetleri gerektirmektedir. Özellikle otonom hareket edebilen, karmaşık algoritmaları çalıştırabilen ve çevreyle etkileşime girebilen robotik platformlar, yüksek işlem gücüne ve pahalı sensörlere ihtiyaç duyar. Bu durum, Ar-Ge süreçlerini yavaşlatmakta ve yenilikçi robotik teknolojilerinin eğitim kurumları, araştırmacılar ve bireysel kullanıcılar için erişilebilir olmasını engellemektedir.',
        challenge_en: 'Today, developing and delivering advanced robotic systems to end users requires high hardware costs. Robotic platforms that can move autonomously, run complex algorithms, and interact with the environment specifically need high processing power and expensive sensors. This slows down R&D processes and prevents innovative robotic technologies from being accessible to educational institutions, researchers, and individual users.',
        solution_tr: 'Kullanıcıların halihazırda sahip olduğu akıllı telefonların yüksek işlem gücünü, gelişmiş kamera ve sensör altyapısını sistemin "ana beyni" olarak kullanan yenilikçi bir donanım kiti geliştirilmiştir. Bu sayede pahalı bilgisayar ve sensör modüllerine ihtiyaç duyulmadan, telefonun donanıma entegre edilmesiyle yapay zeka destekli otonom bir robot elde edilir. Modüler tasarımı sayesinde farklı kullanım senaryolarına kolayca uyarlanabilen bu sistem, robotik geliştirmeyi ekonomik ve herkes için erişilebilir hale getirir.',
        solution_en: 'An innovative hardware kit has been developed that uses the high processing power, advanced camera, and sensor infrastructure of smartphones already owned by users as the "main brain" of the system. In this way, without the need for expensive computer and sensor modules, an AI-supported autonomous robot is obtained by integrating the phone into the hardware. Thanks to its modular design, this system can be easily adapted to different use cases, making robotics development economical and accessible to everyone.',
        impact_tr: 'Robotik teknolojilere erişimi demokratikleştirerek Ar-Ge maliyetlerinde önemli düşüş.',
        impact_en: 'Significant drop in R&D costs by democratizing access to robotic technologies.',
        date_tr: 'Ara 2024 - Mar 2026',
        date_en: 'Dec 2024 - Mar 2026',
        tags_tr: ['Robotik', 'Yapay Zeka', 'Donanım'],
        tags_en: ['Robotics', 'AI', 'Hardware'],
        technologies: ['C++', 'Python', 'Mobile AI', 'Embedded Systems'],
        sort_order: 1
      },
      {
        slug: 'mobil-donusum-kiti',
        title_tr: 'Akıllı Telefonları Taşınabilir Bilgisayara Dönüştürme Sistemi',
        title_en: 'Smartphone to Portable Computer Conversion System',
        short_desc_tr: 'Mobil cihazları tam donanımlı bir dizüstü bilgisayar deneyimine dönüştüren yenilikçi donanım çözümü.',
        short_desc_en: 'An innovative hardware solution converting mobile devices into a fully equipped laptop experience.',
        challenge_tr: 'Güncel mobil cihazlar, birçok ofis ve günlük kullanım senaryosu için yeterli hatta fazlasıyla yüksek işlem kapasitesine sahiptir. Ancak, küçük ekran boyutları, fiziksel klavye eksikliği ve kısıtlı arayüzleri nedeniyle profesyonel iş akışlarında veya içerik üretimi süreçlerinde verimli bir şekilde kullanılamamaktadırlar. Kullanıcılar, aslında ceplerinde taşıdıkları güçlü bilgisayarları tam anlamıyla kullanamadıkları için ek olarak dizüstü bilgisayar satın almak zorunda kalmakta, bu da hem maliyeti hem de elektronik atık miktarını artırmaktadır.',
        challenge_en: 'Current mobile devices have sufficient, if not excessively high, processing capacity for many office and daily use scenarios. However, due to small screen sizes, lack of a physical keyboard, and limited interfaces, they cannot be used efficiently in professional workflows or content creation processes. Users are forced to buy additional laptops because they cannot fully utilize the powerful computers they actually carry in their pockets, increasing both costs and the amount of electronic waste.',
        solution_tr: 'İçerisinde kendi işlemcisi veya işletim sistemi bulunmayan, sadece yüksek çözünürlüklü bir ekran, tam boyutlu ergonomik klavye, geniş bir touchpad ve uzun ömürlü batarya barındıran ince bir terminal cihazı tasarlandı. Kullanıcı, akıllı telefonunu tek bir kablo ile bu terminale bağladığında, telefonun işlem gücü kullanılarak anında tam donanımlı bir dizüstü bilgisayar deneyimi elde edilir. Bu çözüm, kullanıcıların tek bir ana cihazla tüm ihtiyaçlarını karşılamasını sağlar.',
        solution_en: "A thin terminal device was designed that contains no processor or operating system of its own, featuring only a high-resolution screen, a full-size ergonomic keyboard, a large touchpad, and a long-lasting battery. When the user connects their smartphone to this terminal with a single cable, a fully equipped laptop experience is instantly achieved using the phone's processing power. This solution enables users to meet all their computing needs with a single primary device.",
        impact_tr: 'Elektronik atık miktarını azaltma ve donanım maliyetlerinde tasarruf sağlama.',
        impact_en: 'Reducing electronic waste and providing savings in hardware costs.',
        date_tr: '2023 - 2024',
        date_en: '2023 - 2024',
        tags_tr: ['Tüketici Elektroniği', 'Mobil', 'Donanım'],
        tags_en: ['Consumer Electronics', 'Mobile', 'Hardware'],
        technologies: ['Embedded Systems', 'Type-C Protocols', 'Hardware Design'],
        sort_order: 2
      },
      {
        slug: 'egitim-yapay-zeka-platformu',
        title_tr: 'Çocuklar İçin Doğal Dil Destekli Teknoloji Eğitimi Platformu',
        title_en: 'Natural Language Supported Tech Education Platform for Children',
        short_desc_tr: 'Çocukların doğal dil ifadelerini kodlamaya dönüştürerek donanım programlamasını sağlayan yapay zeka platformu.',
        short_desc_en: "An AI platform that converts children's natural language expressions into code, enabling hardware programming.",
        challenge_tr: 'Erken yaş gruplarına yönelik kodlama ve robotik eğitimleri, genellikle karmaşık sözdizimleri (syntax), ekran bağımlılığı ve soyut kavramlar nedeniyle çocukların ilgisini çabuk kaybetmesine yol açmaktadır. Çocukların hayal güçlerindeki projeleri fiziksel donanımlara aktarabilmeleri için yüksek teknik bilgi gereksinimi, öğrenme sürecinde büyük bir bariyer oluşturmaktadır. Ayrıca geleneksel eğitim setlerinin kısıtlı etkileşim imkanı sunması, yaratıcı düşünmeyi ve problem çözme yeteneklerini yeterince desteklememektedir.',
        challenge_en: 'Coding and robotics education for early age groups often causes children to quickly lose interest due to complex syntaxes, screen dependency, and abstract concepts. The high technical knowledge required for children to transfer the projects in their imagination into physical hardware creates a major barrier in the learning process. Additionally, the limited interaction possibilities offered by traditional educational kits do not sufficiently support creative thinking and problem-solving skills.',
        solution_tr: 'Çocukların sadece konuşarak veya kendi kelimeleriyle yazarak elektronik bileşenleri programlayabilmesini sağlayan, doğal dil işleme odaklı bir yapay zeka platformu ve entegre donanım kiti geliştirilmiştir. Sistem, çocuğun "Işıkları kırmızı yak ve hareket et" gibi doğal ifadelerini anında çalıştırılabilir kodlara dönüştürerek donanıma kablosuz olarak aktarır. Ekran bağımlılığını azaltan bu interaktif yaklaşım, çocukların kodlama mantığını teknik detaylarda boğulmadan, doğrudan deneyimleyerek öğrenmesini sağlar.',
        solution_en: 'A natural language processing-focused AI platform and integrated hardware kit have been developed, enabling children to program electronic components simply by speaking or writing in their own words. The system instantly converts a child\'s natural expressions, such as "turn the lights red and move," into executable code and transfers it wirelessly to the hardware. This interactive approach, which reduces screen dependency, allows children to learn coding logic through direct experience without getting bogged down in technical details.',
        impact_tr: 'Öğrenme sürecini hızlandırma ve teknik bariyerleri ortadan kaldırarak teknoloji okuryazarlığını artırma.',
        impact_en: 'Accelerating the learning process and increasing tech literacy by removing technical barriers.',
        date_tr: 'Oca 2026 - Ara 2026',
        date_en: 'Jan 2026 - Dec 2026',
        tags_tr: ['Eğitim Teknolojileri', 'Yapay Zeka', 'IoT'],
        tags_en: ['EdTech', 'AI', 'IoT'],
        technologies: ['NLP', 'Machine Learning', 'Cloud Computing', 'Embedded Systems'],
        sort_order: 3
      },
      {
        slug: 'ai-gimbal-asistan',
        title_tr: 'Yapay Zeka Destekli Medya Asistanı Donanımı',
        title_en: 'AI-Supported Media Assistant Hardware',
        short_desc_tr: 'Akıllı telefonları içerik üreticileri için otonom bir kameramana dönüştüren robotik donanım.',
        short_desc_en: 'Robotic hardware that turns smartphones into an autonomous cameraman for content creators.',
        challenge_tr: 'Bireysel içerik üreticileri, vloggerlar ve profesyonel medya ekipleri için dinamik ve hareketli çekimler yapmak ciddi zorluklar barındırır. Kameranın nesneyi pürüzsüz bir şekilde takip edebilmesi, doğru kadrajı koruyabilmesi ve sinematik hareketler sergileyebilmesi genellikle profesyonel bir kameramanın varlığını veya kurulumu zor, yüksek maliyetli takip sistemlerini gerektirir. Bu durum, özellikle tek başına çalışan içerik üreticilerinin kaliteli ve hareketli videolar üretmesinin önünde hem maliyet hem de operasyonel bir engeldir.',
        challenge_en: 'Capturing dynamic and moving shots presents significant challenges for individual content creators, vloggers, and professional media teams. For a camera to smoothly track a subject, maintain proper framing, and perform cinematic movements, it usually requires the presence of a professional cameraman or difficult-to-setup, costly tracking systems. This is both a financial and operational obstacle, particularly for solo content creators aiming to produce high-quality, dynamic videos.',
        solution_tr: 'Akıllı telefonları otonom bir kameramana dönüştüren, ileri seviye bilgisayarlı görü algoritmalarıyla donatılmış akıllı bir mekanik donanım tasarlanmıştır. Kullanıcının belirlediği nesneyi veya kişiyi 360 derece kesintisiz ve akıcı bir şekilde takip edebilen bu sistem, yapay zeka destekli gerçek zamanlı görüntü işleme yeteneği sayesinde kadrajı her zaman mükemmel tutar. Yüz tanıma, jest kontrolü ve otomatik sahne optimizasyonu gibi özelliklerle tek kişilik profesyonel çekimleri zahmetsiz hale getirir.',
        solution_en: 'A smart mechanical hardware equipped with advanced computer vision algorithms has been designed to turn smartphones into an autonomous cameraman. This system, capable of seamlessly and smoothly tracking a user-specified object or person in 360 degrees, always maintains perfect framing thanks to its AI-supported real-time image processing capabilities. With features like face recognition, gesture control, and automatic scene optimization, it makes single-person professional shoots effortless.',
        impact_tr: 'İçerik üreticileri için tek kişilik profesyonel çekim imkanı ve prodüksiyon sürelerinde azalma.',
        impact_en: 'Enabling single-person professional shoots for content creators and reducing production times.',
        date_tr: '2024 - 2025',
        date_en: '2024 - 2025',
        tags_tr: ['Medya', 'Bilgisayarlı Görü', 'Robotik'],
        tags_en: ['Media', 'Computer Vision', 'Robotics'],
        technologies: ['Computer Vision', 'Real-time Processing', 'Motor Control', 'Mobile AI'],
        sort_order: 4
      },
      {
        slug: 'ai-kisisellestirilmis-uretim',
        title_tr: 'Yapay Zeka Destekli Kişiselleştirilmiş Üretim Platformu',
        title_en: 'AI-Powered Customized Production Platform',
        short_desc_tr: 'Kullanıcıların metin girdilerini ve ortam görsellerini analiz ederek onlara özel tasarımlar üreten akıllı platform.',
        short_desc_en: 'An intelligent platform that analyzes text inputs and environment images to generate personalized designs.',
        challenge_tr: 'Standart platformlarda kullanıcıların kendi zevklerine ve mekanlarının dekoratif uyumuna (renk, doku vb.) tam uyan ürünler bulmakta zorlanması ve kişiye özel üretim süreçlerinin karmaşık ve yüksek maliyetli olması. Özel tasarım taleplerinin manuel yönetilmesinin operasyonel verimsizliğe yol açması.',
        challenge_en: 'Users struggle to find products that perfectly match their personal tastes and the decorative harmony of their spaces. Custom production processes are complex and costly, and managing custom design requests manually leads to operational inefficiency.',
        solution_tr: 'Gelişmiş üretken yapay zeka ve görüntü işleme algoritmaları kullanılarak, kullanıcının girdiği doğal dil metinlerini ve yüklediği mekan fotoğraflarını analiz eden bir sistem geliştirildi. Bu sistem, mekana tam uyum sağlayan eşsiz ve kişiye özel tasarımları saniyeler içinde oluşturarak anında üretime ve siparişe hazır hale getirir. Uçtan uca otomasyon sayesinde süreç standartlaştırılmıştır.',
        solution_en: 'A system was developed using advanced generative AI and image processing algorithms to analyze natural language text inputs and space photos uploaded by the user. This system creates unique, personalized designs that perfectly match the space in seconds, making them instantly ready for production. Through end-to-end automation, the process has been standardized.',
        impact_tr: 'Kişiye özel ürün tasarım sürecini saniyelere indirgeyerek müşteri memnuniyetinde artış ve operasyonel maliyetlerde büyük oranda düşüş.',
        impact_en: 'Reducing the custom product design process to seconds, resulting in increased customer satisfaction and a massive decrease in operational costs.',
        date_tr: '2024 - 2025',
        date_en: '2024 - 2025',
        tags_tr: ['E-Ticaret', 'Üretken Yapay Zeka', 'Görüntü İşleme'],
        tags_en: ['E-Commerce', 'Generative AI', 'Computer Vision'],
        technologies: ['Generative AI', 'NLP', 'Computer Vision', 'Next.js', 'Node.js', 'Cloud Infrastructure'],
        sort_order: 5
      },
      {
        slug: 'akilli-rehabilitasyon-platformu',
        title_tr: 'Yapay Zeka Destekli Akıllı Rehabilitasyon Platformu',
        title_en: 'AI-Powered Smart Rehabilitation Platform',
        short_desc_tr: 'Klinik tedavilerini yapay zeka asistanı, veri analitiği ve akıllı cihaz entegrasyonuyla dijitalleştiren yenilikçi sağlık platformu.',
        short_desc_en: 'An innovative healthcare platform that digitizes clinical treatments with AI assistants, data analytics, and smart device integration.',
        challenge_tr: 'Geleneksel rehabilitasyon süreçlerinde hasta takibinin seanslarla sınırlı kalması, klinik kararların anlık verilere dayanmaması ve hastaların seans dışında doğru egzersizleri yaparken yönlendirme eksikliği yaşaması iyileşme sürecini uzatmaktadır.',
        challenge_en: 'In traditional rehabilitation processes, limiting patient tracking to sessions, basing clinical decisions on non-real-time data, and the lack of guidance for patients during exercises outside sessions prolong the recovery process.',
        solution_tr: 'Büyük veri ve üretken yapay zeka modelleri kullanılarak, hastaların klinik seansları ile günlük aktivitelerini birleştiren akıllı bir sistem geliştirilmiştir. Platform, tıbbi tedavi cihazlarıyla entegre çalışarak verileri anlık analiz eder, 7/24 hizmet veren yapay zeka asistanıyla hastalara kişiselleştirilmiş egzersiz yönlendirmeleri sunar ve hekimlere klinik karar destek altyapısı sağlar.',
        solution_en: 'Using big data and generative AI models, a smart system has been developed that bridges patients\' clinical sessions with their daily activities. Integrating with medical treatment devices, the platform analyzes data in real-time, provides personalized exercise guidance to patients through a 24/7 AI assistant, and offers clinical decision support infrastructure to physicians.',
        impact_tr: 'İyileşme süreçlerinde gözle görülür hızlanma, hasta memnuniyetinde artış ve kliniklerde tedavi standartlarının yükselmesi.',
        impact_en: 'Visible acceleration in recovery processes, increased patient satisfaction, and elevation of treatment standards in clinics.',
        date_tr: '2025 - 2026',
        date_en: '2025 - 2026',
        tags_tr: ['Sağlık Teknolojileri', 'Yapay Zeka', 'Veri Analitiği'],
        tags_en: ['Health Tech', 'AI', 'Data Analytics'],
        technologies: ['Machine Learning', 'Data Analytics', 'IoT', 'Mobile App', 'Cloud Computing'],
        sort_order: 6
      },
      {
        slug: 'tasinabilir-solunum-rehabilitasyon-cihazi',
        title_tr: 'Taşınabilir Akıllı Solunum Rehabilitasyon Cihazı',
        title_en: 'Portable Smart Respiratory Rehabilitation Device',
        short_desc_tr: 'Kronik ve akut solunum rahatsızlıkları için elektriksel kas stimülasyonu (EMS) teknolojisini kullanan taşınabilir rehabilitasyon cihazı.',
        short_desc_en: 'A portable rehabilitation device using electrical muscle stimulation (EMS) technology for chronic and acute respiratory conditions.',
        challenge_tr: 'Kronik solunum yolu hastalıkları ve akut solunum yetmezliği yaşayan hastaların, hastane dışında solunum kaslarını güçlendirecek ve rehabilitasyonlarını destekleyecek taşınabilir, non-invaziv (girişimsel olmayan) çözümlere erişiminin kısıtlı olması. Mevcut cihazların genellikle büyük, pahalı ve hastane ortamına bağımlı olması hastaların günlük yaşam kalitesini düşürmektedir.',
        challenge_en: 'Patients with chronic respiratory diseases and acute respiratory failure have limited access to portable, non-invasive solutions to strengthen their respiratory muscles outside the hospital. Current devices are often large, expensive, and dependent on hospital environments, which reduces patients\' daily quality of life.',
        solution_tr: 'Solunum kaslarını güçlendirmek amacıyla elektriksel kas stimülasyonu (EMS) teknolojisini kullanan, giyilebilir ve taşınabilir bir medikal donanım geliştirilmiştir. Bu cihaz, hastaların günlük yaşamlarını kesintiye uğratmadan, ev ortamında veya hareket halindeyken solunum kapasitelerini artırmalarına yardımcı olur. Akıllı yazılım entegrasyonu, kişiye özel stimülasyon seviyeleri belirleyerek güvenli bir süreç sunar.',
        solution_en: 'A wearable and portable medical hardware device using electrical muscle stimulation (EMS) technology has been developed to strengthen respiratory muscles. This device helps patients increase their respiratory capacity at home or on the go without interrupting their daily lives. Smart software integration sets personalized stimulation levels, providing a safe rehabilitation process.',
        impact_tr: 'Solunum kas güçsüzlüğünü gidererek hastaların hastaneye yatış oranlarını azaltmak ve günlük yaşam kalitelerini artırmak.',
        impact_en: 'Reducing hospital admission rates and improving the daily quality of life of patients by overcoming respiratory muscle weakness.',
        date_tr: '2025 - 2026',
        date_en: '2025 - 2026',
        tags_tr: ['Sağlık Teknolojileri', 'Biyomedikal', 'Rehabilitasyon'],
        tags_en: ['Health Tech', 'Biomedical', 'Rehabilitation'],
        technologies: ['EMS', 'Wearable Tech', 'Biomedical Engineering', 'Embedded Systems'],
        sort_order: 7
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
