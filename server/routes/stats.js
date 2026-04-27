import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // 1. Ar-Ge proje sayısı (active projects)
    const projectCountResult = await pool.query(
      "SELECT COUNT(*) FROM projects WHERE status = 'active'"
    );
    const projectCount = parseInt(projectCountResult.rows[0].count);

    // 2. Use-Case sayısı (published use cases)
    const useCaseCountResult = await pool.query(
      "SELECT COUNT(*) FROM use_cases WHERE status = 'published'"
    );
    const useCaseCount = parseInt(useCaseCountResult.rows[0].count);

    // 3. Unique tags count (Faaliyet dikeyleri)
    // We fetch unique tags from published use cases
    const uniqueTagsResult = await pool.query(`
      SELECT COUNT(DISTINCT tag) 
      FROM (
        SELECT unnest(tags_tr) as tag 
        FROM use_cases 
        WHERE status = 'published'
      ) as sub
    `);
    const uniqueTagCount = parseInt(uniqueTagsResult.rows[0].count);

    res.json({
      projects: projectCount,
      useCases: useCaseCount,
      uniqueTags: uniqueTagCount
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
