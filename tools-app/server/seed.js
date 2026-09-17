import pool from './db.js';

const seedTools = async () => {
  try {
    console.log('Running database schema updates...');

    // 1. Ensure cerilas_tools table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cerilas_tools (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        short_description TEXT,
        icon_name VARCHAR(100),
        cover_image_url TEXT,
        target_url TEXT,
        seo_title VARCHAR(255),
        seo_description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        category VARCHAR(100) DEFAULT 'General',
        view_count INTEGER DEFAULT 0,
        use_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Add columns if not existing
    await pool.query(`
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP DEFAULT NOW();
    `);

    // 3. Ensure tool_usage_events table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_usage_events (
        id SERIAL PRIMARY KEY,
        tool_slug VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tool_events_slug ON tool_usage_events(tool_slug);
      CREATE INDEX IF NOT EXISTS idx_tool_events_created_at ON tool_usage_events(created_at);
    `);

    console.log('Clearing non-working / placeholder tools...');
    await pool.query('DELETE FROM tool_usage_events');
    await pool.query('DELETE FROM cerilas_tools');

    console.log('Inserting QR Code Generator as the first active tool...');
    await pool.query(`
      INSERT INTO cerilas_tools (
        title, 
        slug, 
        short_description, 
        icon_name, 
        target_url, 
        seo_title, 
        seo_description, 
        category,
        sort_order,
        is_active,
        view_count,
        use_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      'QR Code Generator',
      'qr-code-generator',
      'Generate high-resolution custom QR codes for URLs, text, Wi-Fi, vCard, and email with sleek Apple styling.',
      'QrCode',
      '#/tool/qr-code-generator',
      'Free QR Code Generator (No Sign-Up, Never Expires) | Cerilas Tools',
      '100% free dynamic and static QR code generator with zero sign-up required, unlimited scans, and no expiration date. Create high-resolution print-ready SVG and PNG codes for URLs, Wi-Fi, vCard, Google reviews, and AI art.',
      'Generator',
      1,
      true,
      0,
      0
    ]);

    console.log('Inserting Image Compressor as second active tool...');
    await pool.query(`
      INSERT INTO cerilas_tools (
        title, 
        slug, 
        short_description, 
        icon_name, 
        target_url, 
        seo_title, 
        seo_description, 
        category,
        sort_order,
        is_active,
        view_count,
        use_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      'Image Compressor',
      'image-compressor',
      'Lossless & high-efficiency in-browser image compression with zero server uploads. Supports JPG, PNG, WebP, AVIF, and SVG with instant batch export.',
      'Minimize2',
      '#/tool/image-compressor',
      'Free Image Compressor Without Quality Loss (No Upload Limit) | Cerilas Tools',
      '100% free client-side image compressor. Compress JPG, PNG, WebP, AVIF, and SVG without quality loss or server storage. Batch compress and download as ZIP.',
      'Optimizer',
      2,
      true,
      0,
      0
    ]);

    console.log('Inserting Pomodoro Timer as third active tool...');
    await pool.query(`
      INSERT INTO cerilas_tools (
        title, 
        slug, 
        short_description, 
        icon_name, 
        target_url, 
        seo_title, 
        seo_description, 
        category,
        sort_order,
        is_active,
        view_count,
        use_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      'Pomodoro Timer',
      'pomodoro-timer',
      'Minimalist in-browser Pomodoro timer with fluid wave animation, acoustic alert sounds, and customizable focus & break intervals.',
      'Clock',
      '#/tool/pomodoro-timer',
      'Free Online Pomodoro Timer with Fluid Wave & Sound Alerts | Cerilas Tools',
      'Free aesthetic in-browser Pomodoro timer with dynamic fluid wave physics, acoustic Web Audio chime alerts, and customizable focus/break intervals. 100% free with zero sign-up.',
      'Productivity',
      3,
      true,
      0,
      0
    ]);

    console.log('Inserting PDF Compressor as fourth active tool...');
    await pool.query(`
      INSERT INTO cerilas_tools (
        title, 
        slug, 
        short_description, 
        icon_name, 
        target_url, 
        seo_title, 
        seo_description, 
        category,
        sort_order,
        is_active,
        view_count,
        use_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      'PDF Compressor',
      'pdf-compressor',
      'Compress PDF documents locally in your browser with zero server uploads. Multi-level compression presets, visual page 1 thumbnails, and batch ZIP export.',
      'FileText',
      '#/tool/pdf-compressor',
      'Free Online PDF Compressor (100% In-Browser Privacy, No Upload Limit) | Cerilas Tools',
      'Compress PDF files directly in your web browser with zero server uploads and total privacy. Reduce PDF size up to 90% for email, job portals, and web publishing with zero file limits and batch download.',
      'Document Utility',
      4,
      true,
      0,
      0
    ]);

    console.log('Seed completed successfully! Active tools seeded.');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    process.exit(0);
  }
};

seedTools();
