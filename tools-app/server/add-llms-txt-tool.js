import pool from './db.js';

async function addLlmsTxtTool() {
  try {
    console.log('Registering LLMs.txt Tools in PostgreSQL database...');

    const check = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'llms-txt'");
    if (check.rows.length === 0) {
      const maxOrderRes = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools");
      const nextOrder = parseInt(maxOrderRes.rows[0]?.next_order || '17', 10);

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
        'LLMs.txt Tools',
        'llms-txt',
        'Create, check, and validate your llms.txt site guide under the latest v2 specification. Scan website resources, audit markdown link health, and test agent discoverability.',
        'FileText',
        '#/tool/llms-txt',
        'LLMs.txt Generator, Checker & Validator – v2 Specification Suite | Cerilas Tools',
        'Free online LLMs.txt Generator, Checker, and Validator. Create structured llms.txt guides for AI agents, audit link health, and validate formatting under the latest specification.',
        'AI Assisted',
        nextOrder,
        true,
        0,
        0
      ]);
      console.log(`LLMs.txt Tools inserted successfully into PostgreSQL with sort_order ${nextOrder}!`);
    } else {
      console.log('LLMs.txt Tools already exists in PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error adding LLMs.txt Tools:', err);
  } finally {
    process.exit(0);
  }
}

addLlmsTxtTool();
