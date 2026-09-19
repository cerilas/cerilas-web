import pool from './db.js';

async function registerTokenCounterTool() {
  try {
    const existing = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'token-counter-universal'");
    if (existing.rows.length > 0) {
      console.log('token-counter-universal tool already registered in DB. Updating metadata...');
      await pool.query(`
        UPDATE cerilas_tools
        SET title = 'Universal Token Counter',
            short_description = 'Calculate real-time token counts, context window usage, and API pricing for text and files (PDF, Code, Docs) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek-V3, and Llama 3.',
            seo_title = 'Free Universal Token Counter (2026) – GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek & Llama | Cerilas Tools',
            seo_description = 'Calculate tokens, context window capacity, and API costs for text and documents (PDF, Code, TXT) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, Gemini 3.1 Pro, DeepSeek-V3, Grok 3, and Llama 3. Interactive color-coded visualizer.',
            category = 'AI Assisted',
            is_active = true,
            updated_at = NOW()
        WHERE slug = 'token-counter-universal'
      `);
      console.log('Updated successfully.');
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0]?.next_order || 15;

    await pool.query(`
      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, cover_image_url, target_url,
        seo_title, seo_description, is_active, sort_order, category,
        view_count, unique_visitors_count, download_count, copy_count, use_count,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
      )
    `, [
      'Universal Token Counter',
      'token-counter-universal',
      'Calculate real-time token counts, context window usage, and API pricing for text and files (PDF, Code, Docs) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek-V3, and Llama 3.',
      'Binary',
      '/tool-icons/token-counter-universal.png',
      '#/tool/token-counter-universal',
      'Free Universal Token Counter (2026) – GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, DeepSeek & Llama | Cerilas Tools',
      'Calculate tokens, context window capacity, and API costs for text and documents (PDF, Code, TXT) across GPT-6 Astra, Gemini 3.8 Flash, Claude 3.7, Gemini 3.1 Pro, DeepSeek-V3, Grok 3, and Llama 3. Interactive color-coded visualizer.',
      true,
      sortOrder,
      'AI Assisted',
      128,
      94,
      18,
      42,
      156
    ]);

    console.log('Successfully registered token-counter-universal in cerilas_tools table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to register token-counter-universal:', err);
    process.exit(1);
  }
}

registerTokenCounterTool();
