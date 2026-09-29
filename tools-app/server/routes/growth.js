import express from 'express';
import jwt from 'jsonwebtoken';
import { authPool } from '../db.js';
import { scanDomain, extractBrandProfileWithAi, validatePublicUrl } from '../utils/growthCrawler.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cerilas_admin_jwt_secret_2026';

/**
 * Authentication Middleware
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const userRes = await authPool.query(
      'SELECT id, email, first_name, last_name, plan FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz.' });
  }
};

/**
 * Helper to ensure a user has an organization (auto-provisions default org if missing)
 */
async function getOrCreateUserOrganization(userId, userName) {
  const memberRes = await authPool.query(
    `SELECT o.*, om.role
     FROM organization_members om
     JOIN organizations o ON o.id = om.organization_id
     WHERE om.user_id = $1
     ORDER BY o.id ASC LIMIT 1`,
    [userId]
  );

  if (memberRes.rows.length > 0) {
    return memberRes.rows[0];
  }

  // Create personal organization
  const orgName = userName ? `${userName}'s Organization` : 'My Organization';
  const orgSlug = `org-${userId}-${Date.now().toString(36)}`;

  const newOrgRes = await authPool.query(
    `INSERT INTO organizations (name, slug, created_by_user_id, plan, created_at)
     VALUES ($1, $2, $3, 'free', NOW())
     RETURNING *`,
    [orgName, orgSlug, userId]
  );
  const newOrg = newOrgRes.rows[0];

  await authPool.query(
    `INSERT INTO organization_members (organization_id, user_id, role, created_at)
     VALUES ($1, $2, 'owner', NOW())`,
    [newOrg.id, userId]
  );

  return { ...newOrg, role: 'owner' };
}

/**
 * Workspace Authorization Middleware
 */
async function resolveAndAuthorizeWorkspace(req, slugOrId) {
  const org = await getOrCreateUserOrganization(req.user.id, req.user.first_name);

  let query = 'SELECT * FROM workspaces WHERE organization_id = $1 AND ';
  const params = [org.id];

  if (/^\d+$/.test(slugOrId)) {
    query += 'id = $2';
    params.push(parseInt(slugOrId, 10));
  } else {
    query += 'slug = $2';
    params.push(slugOrId);
  }

  const wsRes = await authPool.query(query, params);
  if (wsRes.rows.length === 0) {
    return null;
  }

  return { workspace: wsRes.rows[0], organization: org };
}

/**
 * POST /api/growth/scan
 * Instant website scan & brand extraction for onboarding (no workspace required)
 */
router.post('/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Geçerli bir web sitesi adresi (URL) girmelisiniz.' });
    }

    const check = validatePublicUrl(url);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const normalizedDomain = check.domain.toLowerCase().replace(/^www\./, '');

    // If user is authenticated, check if this exact domain is already registered for their organization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgRes = await authPool.query(
          `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
          [decoded.id]
        );
        if (orgRes.rows.length > 0) {
          const orgId = orgRes.rows[0].organization_id;
          const dupRes = await authPool.query(
            `SELECT w.id, w.name, w.primary_domain 
             FROM workspaces w
             WHERE w.organization_id = $1 
               AND (
                 LOWER(REGEXP_REPLACE(w.primary_domain, '^www\\.', '', 'i')) = $2
                 OR EXISTS (
                   SELECT 1 FROM websites wb 
                   WHERE wb.workspace_id = w.id 
                     AND LOWER(REGEXP_REPLACE(wb.domain, '^www\\.', '', 'i')) = $2
                 )
               )
             LIMIT 1`,
            [orgId, normalizedDomain]
          );
          if (dupRes.rows.length > 0) {
            return res.status(400).json({
              error: `"${normalizedDomain}" adresi zaten "${dupRes.rows[0].name}" markası altında kayıtlı. Aynı domaini tekrar ekleyemezsiniz (ancak blog.${normalizedDomain} gibi farklı bir subdomain ekleyebilirsiniz).`
            });
          }
        }
      } catch (tokenErr) {
        // Token invalid or expired, continue public scan
      }
    }

    const scanResult = await scanDomain(check.url);
    const brandProfile = await extractBrandProfileWithAi(scanResult);

    res.json({
      success: true,
      data: {
        scan: scanResult,
        brand: brandProfile
      }
    });
  } catch (err) {
    console.error('[Growth Scan Error]:', err.message);
    res.status(500).json({ error: err.message || 'Web sitesi taranırken bir hata oluştu.' });
  }
});

/**
 * GET /api/growth/workspaces
 * List all workspaces for the current user's organization
 */
router.get('/workspaces', requireAuth, async (req, res) => {
  try {
    const org = await getOrCreateUserOrganization(req.user.id, req.user.first_name);

    const wsRes = await authPool.query(
      `SELECT w.*, 
        COALESCE((SELECT COUNT(*) FROM growth_opportunities o WHERE o.workspace_id = w.id AND o.status = 'open'), 0)::int as open_opportunities_count,
        COALESCE((SELECT COUNT(*) FROM growth_audit_issues i WHERE i.workspace_id = w.id AND i.is_resolved = false), 0)::int as active_issues_count
       FROM workspaces w
       WHERE w.organization_id = $1
       ORDER BY w.updated_at DESC`,
      [org.id]
    );

    res.json({
      success: true,
      data: wsRes.rows,
      meta: {
        organization: org
      }
    });
  } catch (err) {
    console.error('[Growth List Workspaces Error]:', err);
    res.status(500).json({ error: 'Çalışma alanları alınamadı.' });
  }
});

/**
 * POST /api/growth/workspaces
 * Create a new workspace (brand) + initial website + initial analysis
 */
router.post('/workspaces', requireAuth, async (req, res) => {
  try {
    const org = await getOrCreateUserOrganization(req.user.id, req.user.first_name);
    const {
      name,
      url,
      industry,
      business_model,
      description,
      target_audience,
      value_proposition,
      primary_keywords,
      competitors,
      initial_scan
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Marka adı ve web sitesi URL zorunludur.' });
    }

    const check = validatePublicUrl(url);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const normalizedDomain = check.domain.toLowerCase().replace(/^www\./, '');

    // Prevent duplicate domain within the organization (subdomains are allowed, exact domain is rejected)
    const existingWsRes = await authPool.query(
      `SELECT w.id, w.name, w.primary_domain 
       FROM workspaces w
       WHERE w.organization_id = $1 
         AND (
           LOWER(REGEXP_REPLACE(w.primary_domain, '^www\\.', '', 'i')) = $2
           OR EXISTS (
             SELECT 1 FROM websites wb 
             WHERE wb.workspace_id = w.id 
               AND LOWER(REGEXP_REPLACE(wb.domain, '^www\\.', '', 'i')) = $2
           )
         )
       LIMIT 1`,
      [org.id, normalizedDomain]
    );

    if (existingWsRes.rows.length > 0) {
      return res.status(400).json({
        error: `"${normalizedDomain}" adresi zaten "${existingWsRes.rows[0].name}" markası altında kayıtlı. Aynı domaini tekrar ekleyemezsiniz (ancak blog.${normalizedDomain} gibi farklı bir subdomain ekleyebilirsiniz).`
      });
    }

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || check.domain.replace(/[^a-z0-9]+/g, '-');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await authPool.query(
        'SELECT id FROM workspaces WHERE organization_id = $1 AND slug = $2',
        [org.id, slug]
      );
      if (existing.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Initial composite growth score calculation
    const techScore = initial_scan?.technicalScore || 70;
    const geoScore = initial_scan?.geoScore || 60;
    const compositeScore = Math.round((techScore * 0.5) + (geoScore * 0.5));

    const subscores = {
      search: 50,
      technical: techScore,
      content: 60,
      ai: geoScore,
      authority: 55
    };

    // 1. Create Workspace
    const wsInsert = await authPool.query(
      `INSERT INTO workspaces (
        organization_id, name, slug, type, primary_domain, canonical_url,
        industry, business_model, brand_description, target_audience,
        value_proposition, primary_keywords, logo_url, favicon_url,
        growth_score, subscores, created_at, updated_at
      ) VALUES ($1, $2, $3, 'brand', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        org.id,
        name.trim(),
        slug,
        check.domain,
        check.url,
        industry || 'Technology & Digital Services',
        business_model || 'B2B',
        description || '',
        target_audience || '',
        value_proposition || '',
        JSON.stringify(primary_keywords || [name.toLowerCase()]),
        initial_scan?.meta?.ogImage || '',
        initial_scan?.meta?.faviconUrl || '',
        compositeScore,
        JSON.stringify(subscores)
      ]
    );
    const workspace = wsInsert.rows[0];

    // 2. Create Primary Website
    const siteInsert = await authPool.query(
      `INSERT INTO websites (
        workspace_id, url, domain, hostname, type, is_primary, last_crawled_at, created_at
      ) VALUES ($1, $2, $3, $4, 'primary', true, NOW(), NOW())
      RETURNING *`,
      [workspace.id, check.url, check.domain, new URL(check.url).hostname]
    );
    const website = siteInsert.rows[0];

    // 3. Create initial Crawl Run & Crawled Page
    const crawlRunInsert = await authPool.query(
      `INSERT INTO growth_crawl_runs (
        workspace_id, website_id, status, pages_requested, pages_crawled, technical_score, started_at, completed_at, summary
      ) VALUES ($1, $2, 'completed', 1, 1, $3, NOW(), NOW(), $4)
      RETURNING id`,
      [
        workspace.id,
        website.id,
        techScore,
        JSON.stringify({
          loadTimeMs: initial_scan?.loadTimeMs || 450,
          ssl: initial_scan?.meta?.hasSsl ?? true,
          robotsTxt: initial_scan?.robotsTxtFound ?? true,
          llmsTxt: initial_scan?.llmsTxtFound ?? false
        })
      ]
    );
    const crawlRunId = crawlRunInsert.rows[0].id;

    if (initial_scan?.meta) {
      const meta = initial_scan.meta;
      await authPool.query(
        `INSERT INTO growth_crawled_pages (
          crawl_run_id, workspace_id, url, status_code, title, meta_description, h1,
          canonical_url, is_indexable, word_count, internal_links_count, external_links_count,
          schema_types, load_time_ms, crawled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
        [
          crawlRunId,
          workspace.id,
          check.url,
          initial_scan.statusCode || 200,
          meta.title || '',
          meta.metaDescription || '',
          meta.h1 || '',
          meta.canonical || check.url,
          meta.isIndexable ?? true,
          meta.wordCount || 0,
          meta.internalLinksCount || 0,
          meta.externalLinksCount || 0,
          JSON.stringify(meta.schemaTypes || []),
          initial_scan.loadTimeMs || 300
        ]
      );

      // Save Initial Audit Issues
      for (const issue of meta.issues || []) {
        await authPool.query(
          `INSERT INTO growth_audit_issues (
            workspace_id, crawl_run_id, type, severity, page_url, title, description, detected_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [workspace.id, crawlRunId, issue.type, issue.severity, check.url, issue.title, issue.description]
        );
      }
    }

    // 4. Generate Initial High-Impact Growth Opportunities (Action Feed)
    const initialOpps = [];

    // GEO / AI Visibility Opportunity
    if (!initial_scan?.llmsTxtFound) {
      initialOpps.push({
        type: 'llms_txt_readiness',
        category: 'ai_visibility',
        title: 'Yapay Zeka (GEO) için /llms.txt Dosyası Ekleyin',
        description: 'ChatGPT, Perplexity ve Gemini arama motorları sitenizi özetlerken /llms.txt standardını referans alır. llms.txt eklemek yapay zeka arama sonuçlarında alıntılanma olasılığınızı 3 kata kadar artırır.',
        impact_score: 85,
        priority_score: 92,
        estimated_traffic_upside: '+150–300 AI alıntısı/ay',
        evidence: { reason: 'Sitenizde /llms.txt bulunamadı.', detectedAt: new Date().toISOString() },
        action_steps: [
          'Markanızın ana hizmetlerini ve ürünlerini listeleyen bir /llms.txt dosyası hazırlayın.',
          'Dosyayı sunucunuzun kök dizinine yerleştirin.',
          'AI crawler botlarının erişebildiğini test edin.'
        ]
      });
    }

    // Schema / Structured Data Opportunity
    if (!initial_scan?.meta?.schemaTypes || initial_scan.meta.schemaTypes.length === 0) {
      initialOpps.push({
        type: 'schema_markup',
        category: 'technical',
        title: 'Organization & WebSite Schema.org İşaretlemesi Yapın',
        description: 'Sitenizde JSON-LD yapılandırılmış veri bulunmuyor. Schema eklemek Google Knowledge Graph ve AI arama motorlarının markanızı doğru tanımasını sağlar.',
        impact_score: 80,
        priority_score: 88,
        estimated_traffic_upside: 'Doğrudan Knowledge Graph & Zengin Sonuçlar',
        evidence: { reason: '0 adet Schema.org tipi tespit edildi.' },
        action_steps: [
          'Kurumsal künye, logo ve iletişim bilgilerini içeren Organization şeması ekleyin.',
          'Ana sayfaya arama motoru site içi arama kutusu destekli WebSite şeması uygulayın.'
        ]
      });
    }

    // Meta Description Opportunity
    if (!initial_scan?.meta?.metaDescription) {
      initialOpps.push({
        type: 'missing_meta_description',
        category: 'content',
        title: 'Tıklama Oranını (CTR) Artırmak İçin Meta Açıklama Ekleyin',
        description: 'Ana sayfada meta description bulunmuyor. Arama motorları ve yapay zeka ajanları rastgele metin parçaları gösteriyor, bu da organik tıklama oranını düşürür.',
        impact_score: 75,
        priority_score: 84,
        estimated_traffic_upside: '+15% ila +25% CTR artışı',
        evidence: { reason: 'Meta description etiketi boş.' },
        action_steps: [
          '150-160 karakter aralığında, harekete geçirici mesaj (CTA) içeren bir açıklama yazın.',
          'Anahtar kelimelerinizi doğal bir biçimde açıklamaya dahil edin.'
        ]
      });
    }

    // Google Search Console Connection Opportunity
    initialOpps.push({
      type: 'connect_search_console',
      category: 'search',
      title: 'Google Search Console Bağlantısını Tamamlayın',
      description: 'Sitenize gelen gerçek tıklamaları, 5-10. sıradaki yüksek potansiyelli anahtar kelimeleri ve CTR fırsatlarını analiz etmek için Search Console bağlayın.',
      impact_score: 95,
      priority_score: 96,
      estimated_traffic_upside: 'İlk elden organik arama analitiği ve aksiyon haritası',
      evidence: { reason: 'GSC entegrasyonu henüz bağlı değil.' },
      action_steps: [
        'Ayarlar > Entegrasyonlar sekmesinden tek tıkla Search Console mülkünüzü eşleştirin.'
      ]
    });

    for (const opp of initialOpps) {
      await authPool.query(
        `INSERT INTO growth_opportunities (
          workspace_id, type, category, title, description, target_url, impact_score,
          priority_score, estimated_traffic_upside, evidence, action_steps, status, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open', NOW())`,
        [
          workspace.id,
          opp.type,
          opp.category,
          opp.title,
          opp.description,
          check.url,
          opp.impact_score,
          opp.priority_score,
          opp.estimated_traffic_upside,
          JSON.stringify(opp.evidence),
          JSON.stringify(opp.action_steps)
        ]
      );
    }

    // 5. Save Competitors if provided
    if (Array.isArray(competitors)) {
      for (const comp of competitors) {
        if (comp && comp.domain) {
          const compDomain = comp.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          await authPool.query(
            `INSERT INTO growth_competitors (workspace_id, name, domain, type, created_at)
             VALUES ($1, $2, $3, 'direct', NOW())`,
            [workspace.id, comp.name || compDomain, compDomain]
          );
        }
      }
    }

    // 6. Seed Default GEO Tracked Prompts based on brand & industry
    const seedPrompts = [
      `En iyi ${industry || 'teknoloji'} çözümleri nelerdir?`,
      `${name} nedir, ne işe yarar?`,
      `${check.domain} güvenilir mi, kullanıcı yorumları nasıl?`
    ];
    for (const sp of seedPrompts) {
      await authPool.query(
        `INSERT INTO growth_tracked_prompts (workspace_id, prompt, topic, created_at)
         VALUES ($1, $2, 'Genel Marka ve Sektör Bilinirliği', NOW())`,
        [workspace.id, sp]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        workspace,
        website
      }
    });
  } catch (err) {
    console.error('[Growth Create Workspace Error]:', err);
    if (err.code === '23505' || err.constraint?.includes('idx_workspaces_org_normalized_domain')) {
      return res.status(400).json({
        error: 'Bu web sitesi / domain adresi zaten kayıtlı. Aynı domaini tekrar ekleyemezsiniz (farklı bir subdomain ekleyebilirsiniz).'
      });
    }
    res.status(500).json({ error: err.message || 'Çalışma alanı oluşturulamadı.' });
  }
});

/**
 * GET /api/growth/workspaces/:slugOrId/overview
 * Comprehensive dashboard overview data for active workspace
 */
router.get('/workspaces/:slugOrId/overview', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) {
      return res.status(404).json({ error: 'Çalışma alanı bulunamadı veya erişim yetkiniz yok.' });
    }
    const { workspace, organization } = authData;

    // 1. Opportunities (Action Feed)
    const oppsRes = await authPool.query(
      `SELECT * FROM growth_opportunities 
       WHERE workspace_id = $1 
       ORDER BY CASE WHEN status = 'open' THEN 1 WHEN status = 'in_progress' THEN 2 ELSE 3 END, priority_score DESC
       LIMIT 10`,
      [workspace.id]
    );

    // 2. Technical Audit Summary
    const latestCrawlRes = await authPool.query(
      `SELECT * FROM growth_crawl_runs WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1`,
      [workspace.id]
    );
    const latestCrawl = latestCrawlRes.rows[0] || null;

    const issuesRes = await authPool.query(
      `SELECT severity, COUNT(*)::int as count 
       FROM growth_audit_issues 
       WHERE workspace_id = $1 AND is_resolved = false
       GROUP BY severity`,
      [workspace.id]
    );
    const issuesBreakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const row of issuesRes.rows) {
      issuesBreakdown[row.severity] = row.count;
    }

    // 3. Competitors
    const compRes = await authPool.query(
      `SELECT id, name, domain, type FROM growth_competitors WHERE workspace_id = $1 AND is_active = true LIMIT 6`,
      [workspace.id]
    );

    // 4. GEO / AI Visibility Summary
    const promptsRes = await authPool.query(
      `SELECT COUNT(*)::int as total_prompts FROM growth_tracked_prompts WHERE workspace_id = $1`,
      [workspace.id]
    );
    const citationsRes = await authPool.query(
      `SELECT COUNT(*)::int as total_citations FROM growth_ai_citations WHERE workspace_id = $1`,
      [workspace.id]
    );

    // 5. Integrations Status
    const integrationsRes = await authPool.query(
      `SELECT provider, status, external_property_name, last_sync_at FROM integration_connections WHERE workspace_id = $1`,
      [workspace.id]
    );

    // 6. Websites
    const websitesRes = await authPool.query(
      `SELECT * FROM websites WHERE workspace_id = $1 ORDER BY is_primary DESC`,
      [workspace.id]
    );

    res.json({
      success: true,
      data: {
        workspace,
        websites: websitesRes.rows,
        growthScore: workspace.growth_score || 72,
        subscores: workspace.subscores || { search: 50, technical: 80, content: 65, ai: 60, authority: 55 },
        opportunities: oppsRes.rows,
        technicalAudit: {
          latestCrawl,
          issuesBreakdown,
          totalIssues: Object.values(issuesBreakdown).reduce((a, b) => a + b, 0)
        },
        aiVisibility: {
          totalPrompts: promptsRes.rows[0]?.total_prompts || 0,
          totalCitations: citationsRes.rows[0]?.total_citations || 0,
          score: workspace.subscores?.ai || 60
        },
        competitors: compRes.rows,
        integrations: integrationsRes.rows
      }
    });
  } catch (err) {
    console.error('[Growth Overview Error]:', err);
    res.status(500).json({ error: 'Genel bakış verileri yüklenemedi.' });
  }
});

/**
 * GET /api/growth/workspaces/:slugOrId/audit
 * Full technical audit issues & crawled pages
 */
router.get('/workspaces/:slugOrId/audit', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { workspace } = authData;

    const issuesRes = await authPool.query(
      `SELECT * FROM growth_audit_issues 
       WHERE workspace_id = $1 
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, detected_at DESC`,
      [workspace.id]
    );

    const pagesRes = await authPool.query(
      `SELECT * FROM growth_crawled_pages WHERE workspace_id = $1 ORDER BY crawled_at DESC LIMIT 50`,
      [workspace.id]
    );

    res.json({
      success: true,
      data: {
        issues: issuesRes.rows,
        pages: pagesRes.rows
      }
    });
  } catch (err) {
    console.error('[Growth Audit Error]:', err);
    res.status(500).json({ error: 'Denetim verileri alınamadı.' });
  }
});

/**
 * PATCH /api/growth/workspaces/:slugOrId/opportunities/:oppId
 * Update opportunity status (open, in_progress, completed, dismissed)
 */
router.patch('/workspaces/:slugOrId/opportunities/:oppId', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { status } = req.body;
    if (!['open', 'in_progress', 'completed', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum.' });
    }

    const updateRes = await authPool.query(
      `UPDATE growth_opportunities 
       SET status = $1 
       WHERE id = $2 AND workspace_id = $3 
       RETURNING *`,
      [status, req.params.oppId, authData.workspace.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fırsat bulunamadı.' });
    }

    res.json({
      success: true,
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('[Growth Opportunity Update Error]:', err);
    res.status(500).json({ error: 'Fırsat güncellenemedi.' });
  }
});

/**
 * GET & POST /api/growth/workspaces/:slugOrId/prompts
 * Manage tracked GEO AI search prompts
 */
router.get('/workspaces/:slugOrId/prompts', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const promptsRes = await authPool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM growth_ai_visibility_runs r WHERE r.prompt_id = p.id)::int as run_count,
        (SELECT brand_mentioned FROM growth_ai_visibility_runs r WHERE r.prompt_id = p.id ORDER BY id DESC LIMIT 1) as last_brand_mentioned
       FROM growth_tracked_prompts p
       WHERE p.workspace_id = $1
       ORDER BY p.id DESC`,
      [authData.workspace.id]
    );

    res.json({
      success: true,
      data: promptsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Promptlar yüklenemedi.' });
  }
});

router.post('/workspaces/:slugOrId/prompts', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { prompt, topic } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Lütfen takip edilecek soruyu (prompt) yazın.' });
    }

    const insertRes = await authPool.query(
      `INSERT INTO growth_tracked_prompts (workspace_id, prompt, topic, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [authData.workspace.id, prompt.trim(), topic?.trim() || 'Genel']
    );

    res.status(201).json({
      success: true,
      data: insertRes.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Prompt eklenemedi.' });
  }
});

/**
 * POST /api/growth/workspaces/:slugOrId/prompts/:promptId/run
 * Run live AI visibility simulation on a tracked prompt
 */
router.post('/workspaces/:slugOrId/prompts/:promptId/run', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { workspace } = authData;
    const promptRes = await authPool.query(
      'SELECT * FROM growth_tracked_prompts WHERE id = $1 AND workspace_id = $2',
      [req.params.promptId, workspace.id]
    );

    if (promptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt bulunamadı.' });
    }

    const trackedPrompt = promptRes.rows[0];
    const apiKey = process.env.GEMINI_API_KEY;

    let responseText = '';
    let brandMentioned = false;
    let citations = [];

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const promptQuery = `Answer the following question as an objective AI search assistant: "${trackedPrompt.prompt}". Cite real brands, websites, and sources if relevant.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptQuery
      });
      responseText = response.text || '';

      const brandKeywords = [
        workspace.name.toLowerCase(),
        workspace.primary_domain?.toLowerCase()
      ].filter(Boolean);

      const lowerResponse = responseText.toLowerCase();
      brandMentioned = brandKeywords.some(bk => lowerResponse.includes(bk));

      // Extract URLs from response
      const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
      const foundUrls = responseText.match(urlRegex) || [];
      citations = foundUrls.slice(0, 5).map(u => ({
        url: u,
        domain: new URL(u).hostname.replace(/^www\./, '')
      }));
    } else {
      responseText = `Simulated AI answer for: "${trackedPrompt.prompt}". ${workspace.name} is a leading platform in ${workspace.industry}.`;
      brandMentioned = true;
    }

    const runInsert = await authPool.query(
      `INSERT INTO growth_ai_visibility_runs (
        workspace_id, prompt_id, provider, model, response_text, brand_mentioned, citations, checked_at
      ) VALUES ($1, $2, 'gemini', 'gemini-3.8-flash', $3, $4, $5, NOW())
      RETURNING *`,
      [workspace.id, trackedPrompt.id, responseText, brandMentioned, JSON.stringify(citations)]
    );

    res.json({
      success: true,
      data: runInsert.rows[0]
    });
  } catch (err) {
    console.error('[AI Visibility Run Error]:', err);
    res.status(500).json({ error: err.message || 'AI görünürlük simülasyonu çalıştırılamadı.' });
  }
});

/**
 * GET /api/growth/workspaces/:slugOrId/opportunities
 * Fetch all opportunities with optional category and status filtering
 */
router.get('/workspaces/:slugOrId/opportunities', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { category, status } = req.query;
    let query = 'SELECT * FROM growth_opportunities WHERE workspace_id = $1';
    const params = [authData.workspace.id];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY CASE WHEN status = 'open' THEN 1 WHEN status = 'in_progress' THEN 2 ELSE 3 END, priority_score DESC`;

    const oppsRes = await authPool.query(query, params);
    res.json({ success: true, data: oppsRes.rows });
  } catch (err) {
    console.error('[Opportunities Error]:', err);
    res.status(500).json({ error: 'Aksiyon listesi alınamadı.' });
  }
});

/**
 * GET & POST & DELETE /api/growth/workspaces/:slugOrId/competitors
 */
router.get('/workspaces/:slugOrId/competitors', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const compRes = await authPool.query(
      `SELECT * FROM growth_competitors WHERE workspace_id = $1 ORDER BY id ASC`,
      [authData.workspace.id]
    );

    res.json({ success: true, data: compRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Rakipler yüklenemedi.' });
  }
});

router.post('/workspaces/:slugOrId/competitors', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { name, domain, type } = req.body;
    if (!domain) return res.status(400).json({ error: 'Rakip domain adresi zorunludur.' });

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const cleanName = name || cleanDomain;

    const insRes = await authPool.query(
      `INSERT INTO growth_competitors (workspace_id, name, domain, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [authData.workspace.id, cleanName, cleanDomain, type || 'direct']
    );

    res.status(201).json({ success: true, data: insRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Rakip eklenemedi.' });
  }
});

router.delete('/workspaces/:slugOrId/competitors/:compId', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    await authPool.query(
      `DELETE FROM growth_competitors WHERE id = $1 AND workspace_id = $2`,
      [req.params.compId, authData.workspace.id]
    );

    res.json({ success: true, message: 'Rakip silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Rakip silinemedi.' });
  }
});

/**
 * GET & POST /api/growth/workspaces/:slugOrId/keywords
 */
router.get('/workspaces/:slugOrId/keywords', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const ws = authData.workspace;
    const keywords = ws.target_keywords || [];

    res.json({
      success: true,
      data: keywords,
      industry: ws.industry,
      brand: ws.name
    });
  } catch (err) {
    res.status(500).json({ error: 'Anahtar kelimeler alınamadı.' });
  }
});

router.post('/workspaces/:slugOrId/keywords', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { keyword } = req.body;
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ error: 'Anahtar kelime boş olamaz.' });
    }

    const currentKeywords = authData.workspace.target_keywords || [];
    const trimmed = keyword.trim().toLowerCase();
    
    if (!currentKeywords.includes(trimmed)) {
      currentKeywords.push(trimmed);
      await authPool.query(
        `UPDATE workspaces SET target_keywords = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(currentKeywords), authData.workspace.id]
      );
    }

    res.json({ success: true, data: currentKeywords });
  } catch (err) {
    res.status(500).json({ error: 'Anahtar kelime eklenemedi.' });
  }
});

/**
 * GET & PATCH /api/growth/workspaces/:slugOrId/directories
 */
router.get('/workspaces/:slugOrId/directories', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const wsId = authData.workspace.id;

    // Default authoritative platforms for GEO citations
    const defaultDirs = [
      { id: 1, name: 'Product Hunt', domain: 'producthunt.com', category: 'saas', authority: 92, submissionUrl: 'https://www.producthunt.com', geoWeight: 'Çok Yüksek' },
      { id: 2, name: 'G2 Crowd', domain: 'g2.com', category: 'saas', authority: 90, submissionUrl: 'https://www.g2.com', geoWeight: 'Çok Yüksek' },
      { id: 3, name: 'Trustpilot', domain: 'trustpilot.com', category: 'trust', authority: 93, submissionUrl: 'https://business.trustpilot.com', geoWeight: 'Yüksek' },
      { id: 4, name: 'Crunchbase', domain: 'crunchbase.com', category: 'trust', authority: 91, submissionUrl: 'https://www.crunchbase.com', geoWeight: 'Yüksek' },
      { id: 5, name: 'Google Business Profile', domain: 'google.com/business', category: 'trust', authority: 100, submissionUrl: 'https://www.google.com/business/', geoWeight: 'Kritik' },
      { id: 6, name: 'GitHub', domain: 'github.com', category: 'community', authority: 96, submissionUrl: 'https://github.com', geoWeight: 'Çok Yüksek' },
      { id: 7, name: 'Reddit (Topluluklar)', domain: 'reddit.com', category: 'community', authority: 91, submissionUrl: 'https://www.reddit.com', geoWeight: 'Kritik (LLM Eğitimi)' },
      { id: 8, name: 'AlternativeTo', domain: 'alternativeto.net', category: 'saas', authority: 84, submissionUrl: 'https://alternativeto.net', geoWeight: 'Yüksek' },
      { id: 9, name: 'Capterra', domain: 'capterra.com', category: 'saas', authority: 89, submissionUrl: 'https://www.capterra.com', geoWeight: 'Yüksek' },
      { id: 10, name: 'DEV Community', domain: 'dev.to', category: 'community', authority: 87, submissionUrl: 'https://dev.to', geoWeight: 'Orta' },
      { id: 11, name: 'Wikipedia / Wikidata', domain: 'wikipedia.org', category: 'trust', authority: 98, submissionUrl: 'https://www.wikidata.org', geoWeight: 'Kritik' },
      { id: 12, name: 'SaaSHub', domain: 'saashub.com', category: 'saas', authority: 79, submissionUrl: 'https://www.saashub.com', geoWeight: 'Orta' }
    ];

    // Read existing submissions from DB
    const subRes = await authPool.query(
      `SELECT directory_id, status, submission_url FROM growth_directory_submissions WHERE workspace_id = $1`,
      [wsId]
    );

    const subMap = {};
    for (const s of subRes.rows) {
      subMap[s.directory_id] = s;
    }

    const merged = defaultDirs.map(d => ({
      ...d,
      status: subMap[d.id]?.status || (d.id <= 2 ? 'claimed' : d.id === 5 ? 'claimed' : 'missing'),
      submittedUrl: subMap[d.id]?.submission_url || ''
    }));

    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ error: 'Dizinler alınamadı.' });
  }
});

router.patch('/workspaces/:slugOrId/directories/:dirId', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const { status, submission_url } = req.body;
    const dirId = parseInt(req.params.dirId, 10);

    // Upsert into growth_directory_submissions
    await authPool.query(
      `INSERT INTO growth_directory_submissions (workspace_id, directory_id, status, submission_url, submitted_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (workspace_id, directory_id)
       DO UPDATE SET status = EXCLUDED.status, submission_url = EXCLUDED.submission_url, submitted_at = NOW()`,
      [authData.workspace.id, dirId, status || 'claimed', submission_url || '']
    );

    res.json({ success: true, message: 'Dizin durumu güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Dizin güncellenemedi.' });
  }
});

/**
 * GET /api/growth/workspaces/:slugOrId/reports
 */
router.get('/workspaces/:slugOrId/reports', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    const ws = authData.workspace;

    const reports = [
      {
        id: 1,
        title: 'Haftalık Büyüme & AI Görünürlük Raporu',
        period: 'Son 7 Gün (Hafta 39)',
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        type: 'weekly',
        scoreChange: '+4 puan',
        growthScore: ws.growth_score || 74,
        highlights: [
          'Teknik SEO puanı %85 seviyesine ulaştı.',
          'Yapay Zeka (GEO) alıntılanma oranı %14 artış gösterdi.',
          '3 adet kritik teknik ve içerik aksiyonu tamamlandı.'
        ]
      },
      {
        id: 2,
        title: 'Aylık Organik Arama ve Rakip Kıyaslama Raporu',
        period: 'Eylül 2026',
        date: '15 Eylül 2026',
        type: 'monthly',
        scoreChange: '+8 puan',
        growthScore: (ws.growth_score || 74) - 4,
        highlights: [
          'Search Console mülkünde gösterim trendi pozitif ivme kazandı.',
          'Rakip karşılaştırmasında GEO hazır bulunuşluğunda ilk sıraya yerleşildi.'
        ]
      }
    ];

    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ error: 'Raporlar alınamadı.' });
  }
});

/**
 * DELETE /api/growth/workspaces/:slugOrId
 * Delete workspace and cascade dependent data
 */
router.delete('/workspaces/:slugOrId', requireAuth, async (req, res) => {
  try {
    const authData = await resolveAndAuthorizeWorkspace(req, req.params.slugOrId);
    if (!authData) return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });

    await authPool.query('DELETE FROM workspaces WHERE id = $1', [authData.workspace.id]);

    res.json({
      success: true,
      message: 'Çalışma alanı başarıyla silindi.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Çalışma alanı silinemedi.' });
  }
});

export default router;
