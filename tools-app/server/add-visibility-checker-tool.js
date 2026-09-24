import pool from './db.js';

async function addVisibilityCheckerTool() {
  try {
    console.log('Registering AI Visibility Checker in PostgreSQL database...');

    const check = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'ai-visibility-checker'");
    if (check.rows.length === 0) {
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
        'AI Visibility Checker',
        'ai-visibility-checker',
        'Audit your brand and website visibility across AI search engines, Gemini, ChatGPT, and Perplexity. Extract top 10 real queries and test live AI citation rates.',
        'Eye',
        '#/tool/ai-visibility-checker',
        'Free AI Visibility Checker (2026) – Test Gemini & ChatGPT Search Citations | Cerilas Tools',
        'Free AI Search Visibility Checker. Audit if your website and brand are cited by AI models (Gemini, ChatGPT, Perplexity). Automatically extracts top 10 search queries and tests live grounding citations.',
        'AI Assisted',
        16,
        true,
        0,
        0
      ]);
      console.log('AI Visibility Checker inserted successfully into PostgreSQL!');
    } else {
      console.log('AI Visibility Checker already exists in PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error adding AI Visibility Checker:', err);
  } finally {
    process.exit(0);
  }
}

addVisibilityCheckerTool();
