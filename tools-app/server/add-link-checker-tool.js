import pool from './db.js';

async function addLinkCheckerTool() {
  try {
    console.log('Registering AI Link Hallucination Checker in PostgreSQL database...');

    const check = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'ai-link-hallucination-checker'");
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
        'AI Link Hallucination Checker',
        'ai-link-hallucination-checker',
        'Detect hallucinated URLs, fake domain names, 404 broken links, and slopsquatting vulnerabilities in AI-generated text, articles, and research with instant verification.',
        'Link2',
        '#/tool/ai-link-hallucination-checker',
        'Free AI Link Hallucination Checker (2026) – Detect Fake & 404 URLs in AI Text | Cerilas Tools',
        'Scan ChatGPT, Claude, and Gemini text for hallucinated URLs, dead 404 links, and fabricated domains. Instant DNS and HTTP verification, hallucination score, and 1-click text sanitizer.',
        'AI Assisted',
        15,
        true,
        0,
        0
      ]);
      console.log('AI Link Hallucination Checker inserted successfully into PostgreSQL!');
    } else {
      console.log('AI Link Hallucination Checker already exists in PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error adding AI Link Hallucination Checker:', err);
  } finally {
    process.exit(0);
  }
}

addLinkCheckerTool();
