import pool from './db.js';

async function addAtsTool() {
  try {
    console.log('Registering ATS Resume Checker in PostgreSQL database...');

    const check = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'ats-resume-checker'");
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
        'ATS Resume Checker',
        'ats-resume-checker',
        'AI-powered ATS Resume Checker & Scanner. Match your resume against any job description, detect missing keywords, and get ATS formatting suggestions.',
        'FileCheck',
        '#/tool/ats-resume-checker',
        'Free ATS Resume Checker & Job Match Scanner (AI Powered) | Cerilas Tools',
        'Analyze your resume against any job description with our free AI ATS checker. Find missing keywords, fix formatting issues, and increase interview callbacks.',
        'Career & HR',
        5,
        true,
        0,
        0
      ]);
      console.log('ATS Resume Checker inserted successfully into PostgreSQL!');
    } else {
      console.log('ATS Resume Checker already exists in PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error adding ATS Resume Checker:', err);
  } finally {
    process.exit(0);
  }
}

addAtsTool();
