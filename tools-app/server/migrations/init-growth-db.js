import { authPool } from '../db.js';

export async function initGrowthDb() {
  try {
    const migrationQuery = `
      -- 1. Organizations (Team/Billing boundary)
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_by_user_id INT REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
      CREATE INDEX IF NOT EXISTS idx_organizations_user ON organizations(created_by_user_id);

      -- 2. Organization Members
      CREATE TABLE IF NOT EXISTS organization_members (
        id SERIAL PRIMARY KEY,
        organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'owner',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

      -- 3. Workspaces (Brands / Companies / Products being analyzed)
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'brand',
        primary_domain VARCHAR(255),
        canonical_url VARCHAR(500),
        industry VARCHAR(100),
        business_model VARCHAR(50),
        country VARCHAR(10) DEFAULT 'TR',
        language VARCHAR(10) DEFAULT 'tr',
        timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
        target_countries JSONB DEFAULT '["TR"]'::jsonb,
        logo_url TEXT,
        favicon_url TEXT,
        brand_description TEXT,
        target_audience TEXT,
        value_proposition TEXT,
        main_products JSONB DEFAULT '[]'::jsonb,
        main_services JSONB DEFAULT '[]'::jsonb,
        primary_keywords JSONB DEFAULT '[]'::jsonb,
        brand_aliases JSONB DEFAULT '[]'::jsonb,
        growth_score INT DEFAULT 0,
        subscores JSONB DEFAULT '{"search": 0, "technical": 0, "content": 0, "ai": 0, "authority": 0}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id);
      CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_org_normalized_domain ON workspaces (organization_id, LOWER(REGEXP_REPLACE(primary_domain, '^www\\.', '', 'i')));

      -- 4. Websites
      CREATE TABLE IF NOT EXISTS websites (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        hostname VARCHAR(255),
        type VARCHAR(50) DEFAULT 'primary',
        is_primary BOOLEAN DEFAULT true,
        verification_status VARCHAR(50) DEFAULT 'unverified',
        last_crawled_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_websites_workspace ON websites(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);

      -- 5. Generic Integration Connections (GSC, GA4, GBP, etc.)
      CREATE TABLE IF NOT EXISTS integration_connections (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        external_account_id VARCHAR(255),
        external_property_id VARCHAR(255),
        external_property_name VARCHAR(255),
        scopes JSONB DEFAULT '[]'::jsonb,
        encrypted_access_token TEXT,
        encrypted_refresh_token TEXT,
        expires_at BIGINT,
        connected_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        last_sync_status VARCHAR(50),
        last_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integration_connections(workspace_id);

      -- 6. Competitors
      CREATE TABLE IF NOT EXISTS growth_competitors (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'direct',
        country VARCHAR(10) DEFAULT 'TR',
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_growth_competitors_workspace ON growth_competitors(workspace_id);

      -- 7. Crawl Runs
      CREATE TABLE IF NOT EXISTS growth_crawl_runs (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        website_id INT REFERENCES websites(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        pages_requested INT DEFAULT 0,
        pages_crawled INT DEFAULT 0,
        technical_score INT DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        summary JSONB DEFAULT '{}'::jsonb
      );
      CREATE INDEX IF NOT EXISTS idx_crawl_runs_workspace ON growth_crawl_runs(workspace_id);

      -- 8. Crawled Pages
      CREATE TABLE IF NOT EXISTS growth_crawled_pages (
        id SERIAL PRIMARY KEY,
        crawl_run_id INT REFERENCES growth_crawl_runs(id) ON DELETE CASCADE,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        status_code INT,
        title TEXT,
        meta_description TEXT,
        h1 TEXT,
        canonical_url TEXT,
        is_indexable BOOLEAN DEFAULT true,
        word_count INT DEFAULT 0,
        internal_links_count INT DEFAULT 0,
        external_links_count INT DEFAULT 0,
        schema_types JSONB DEFAULT '[]'::jsonb,
        load_time_ms INT,
        crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crawled_pages_workspace ON growth_crawled_pages(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_crawled_pages_run ON growth_crawled_pages(crawl_run_id);

      -- 9. Audit Issues
      CREATE TABLE IF NOT EXISTS growth_audit_issues (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        crawl_run_id INT REFERENCES growth_crawl_runs(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'medium',
        page_url TEXT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        recommended_fix TEXT,
        is_resolved BOOLEAN DEFAULT false,
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_audit_issues_workspace ON growth_audit_issues(workspace_id);

      -- 10. Opportunities (Central Action Engine)
      CREATE TABLE IF NOT EXISTS growth_opportunities (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_url TEXT,
        target_keyword VARCHAR(255),
        impact_score INT DEFAULT 70,
        confidence_score INT DEFAULT 80,
        effort_score INT DEFAULT 30,
        priority_score INT DEFAULT 85,
        estimated_traffic_upside VARCHAR(100),
        evidence JSONB DEFAULT '{}'::jsonb,
        action_steps JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'open',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_growth_opps_workspace ON growth_opportunities(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_growth_opps_status ON growth_opportunities(status);

      -- 11. Tracked AI Prompts (GEO Engine)
      CREATE TABLE IF NOT EXISTS growth_tracked_prompts (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        topic VARCHAR(100),
        language VARCHAR(10) DEFAULT 'tr',
        country VARCHAR(10) DEFAULT 'TR',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tracked_prompts_workspace ON growth_tracked_prompts(workspace_id);

      -- 12. AI Visibility Runs
      CREATE TABLE IF NOT EXISTS growth_ai_visibility_runs (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        prompt_id INT REFERENCES growth_tracked_prompts(id) ON DELETE CASCADE,
        provider VARCHAR(50) DEFAULT 'gemini',
        model VARCHAR(100),
        response_text TEXT,
        brand_mentioned BOOLEAN DEFAULT false,
        mention_position INT,
        citations JSONB DEFAULT '[]'::jsonb,
        competitor_mentions JSONB DEFAULT '[]'::jsonb,
        sentiment VARCHAR(50) DEFAULT 'neutral',
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_vis_runs_workspace ON growth_ai_visibility_runs(workspace_id);

      -- 13. AI Citations
      CREATE TABLE IF NOT EXISTS growth_ai_citations (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        run_id INT REFERENCES growth_ai_visibility_runs(id) ON DELETE CASCADE,
        source_url TEXT NOT NULL,
        domain VARCHAR(255) NOT NULL,
        page_title TEXT,
        cited_brand VARCHAR(255),
        is_user_brand BOOLEAN DEFAULT false,
        discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_citations_workspace ON growth_ai_citations(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_ai_citations_domain ON growth_ai_citations(domain);

      -- 14. Background Jobs (Lightweight PostgreSQL queue)
      CREATE TABLE IF NOT EXISTS growth_background_jobs (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        progress INT DEFAULT 0,
        payload JSONB DEFAULT '{}'::jsonb,
        result JSONB DEFAULT '{}'::jsonb,
        error TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bg_jobs_status ON growth_background_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_bg_jobs_workspace ON growth_background_jobs(workspace_id);

      -- 15. Directories & Submissions
      CREATE TABLE IF NOT EXISTS growth_directories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        industries JSONB DEFAULT '[]'::jsonb,
        countries JSONB DEFAULT '["TR", "US", "GLOBAL"]'::jsonb,
        submission_url TEXT,
        is_free BOOLEAN DEFAULT true,
        authority_score INT DEFAULT 50,
        seo_potential VARCHAR(50) DEFAULT 'high',
        geo_potential VARCHAR(50) DEFAULT 'high'
      );

      CREATE TABLE IF NOT EXISTS growth_directory_submissions (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        directory_id INT REFERENCES growth_directories(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'not_started',
        submission_url TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(workspace_id, directory_id)
      );
      CREATE INDEX IF NOT EXISTS idx_dir_submissions_workspace ON growth_directory_submissions(workspace_id);

      -- 16. Reports
      CREATE TABLE IF NOT EXISTS growth_reports (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'weekly',
        content JSONB DEFAULT '{}'::jsonb,
        ai_summary TEXT,
        period_start DATE,
        period_end DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_growth_reports_workspace ON growth_reports(workspace_id);

      -- 17. Search Console Live Performance & Intelligence
      CREATE TABLE IF NOT EXISTS growth_search_performance (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        site_url VARCHAR(255) NOT NULL,
        date_range VARCHAR(50) DEFAULT '28d',
        start_date DATE,
        end_date DATE,
        total_clicks INT DEFAULT 0,
        total_impressions INT DEFAULT 0,
        average_ctr NUMERIC(5,2) DEFAULT 0,
        average_position NUMERIC(5,2) DEFAULT 0,
        top_queries JSONB DEFAULT '[]'::jsonb,
        striking_queries JSONB DEFAULT '[]'::jsonb,
        top_pages JSONB DEFAULT '[]'::jsonb,
        daily_trend JSONB DEFAULT '[]'::jsonb,
        devices JSONB DEFAULT '[]'::jsonb,
        countries JSONB DEFAULT '[]'::jsonb,
        cannibalization JSONB DEFAULT '[]'::jsonb,
        search_types JSONB DEFAULT '{}'::jsonb,
        brand_split JSONB DEFAULT '{}'::jsonb,
        url_inspection JSONB DEFAULT '{}'::jsonb,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(workspace_id, site_url, date_range)
      );
      CREATE INDEX IF NOT EXISTS idx_growth_search_perf_ws ON growth_search_performance(workspace_id, site_url);

      -- 18. Google Analytics 4 (GA4) Performance & Telemetry
      CREATE TABLE IF NOT EXISTS growth_analytics_performance (
        id SERIAL PRIMARY KEY,
        workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
        property_id VARCHAR(255) NOT NULL,
        date_range VARCHAR(50) DEFAULT '28d',
        start_date DATE,
        end_date DATE,
        total_users INT DEFAULT 0,
        active_users INT DEFAULT 0,
        new_users INT DEFAULT 0,
        sessions INT DEFAULT 0,
        screen_page_views INT DEFAULT 0,
        average_session_duration NUMERIC(10,2) DEFAULT 0,
        bounce_rate NUMERIC(5,2) DEFAULT 0,
        engagement_rate NUMERIC(5,2) DEFAULT 0,
        event_count INT DEFAULT 0,
        traffic_channels JSONB DEFAULT '[]'::jsonb,
        top_pages JSONB DEFAULT '[]'::jsonb,
        daily_trend JSONB DEFAULT '[]'::jsonb,
        devices JSONB DEFAULT '[]'::jsonb,
        browsers JSONB DEFAULT '[]'::jsonb,
        operating_systems JSONB DEFAULT '[]'::jsonb,
        countries JSONB DEFAULT '[]'::jsonb,
        events JSONB DEFAULT '[]'::jsonb,
        realtime JSONB DEFAULT '{}'::jsonb,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(workspace_id, property_id, date_range)
      );
      CREATE INDEX IF NOT EXISTS idx_growth_analytics_perf_ws ON growth_analytics_performance(workspace_id, property_id);
    `;

    await authPool.query(migrationQuery);
    console.log('[DB] Cerilas Growth tables verified and initialized successfully.');
  } catch (err) {
    console.error('[DB] Failed to initialize Cerilas Growth tables:', err);
  }
}
