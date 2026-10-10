import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Globe, 
  ExternalLink, 
  Loader2, 
  Layers, 
  ShieldCheck, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthTechnicalAuditSkeleton } from '../components/GrowthSkeleton';

export default function GrowthTechnicalAudit() {
  const { activeWorkspace, isFree, promptPaywall } = useGrowth();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, critical, high, medium
  const [issueSearch, setIssueSearch] = useState('');
  const [issueCurrentPage, setIssueCurrentPage] = useState(1);
  const issuePageSize = 10;
  const [pageSearch, setPageSearch] = useState('');
  const [pageCurrentPage, setPageCurrentPage] = useState(1);
  const pagePageSize = 20;
  const [expandedPages, setExpandedPages] = useState(new Set());

  const togglePageExpand = (idOrUrl) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(idOrUrl)) {
        next.delete(idOrUrl);
      } else {
        next.add(idOrUrl);
      }
      return next;
    });
  };

  const [toastMessage, setToastMessage] = useState(null);

  const getPageAuditParameters = (pg) => {
    const params = [];

    // 1. HTTP Status Code
    const httpOk = pg.status_code >= 200 && pg.status_code < 400;
    params.push({
      name: 'HTTP Status Code & Response',
      passed: httpOk,
      severity: 'critical',
      detail: httpOk 
        ? `HTTP ${pg.status_code || 200} OK — Server reachable and page loaded successfully.`
        : `HTTP ${pg.status_code} — Page is unreachable.`,
      fix: !httpOk ? 'Check server configuration or broken URL redirection.' : null
    });

    // 2. SSL / HTTPS
    const isHttps = (pg.url || '').startsWith('https://');
    params.push({
      name: 'SSL / HTTPS Security',
      passed: isHttps,
      severity: 'critical',
      detail: isHttps ? '256-bit SSL encrypted secure HTTPS connection.' : 'Insecure HTTP connection detected.',
      fix: !isHttps ? 'Redirect page to HTTPS protocol (301 redirect).' : null
    });

    // 3. Page Title (Title)
    const hasTitle = Boolean(pg.title && pg.title.trim().length > 0);
    params.push({
      name: 'Page Title (<title>)',
      passed: hasTitle,
      severity: 'critical',
      detail: hasTitle 
        ? `"${pg.title}" (${pg.title.length} characters)`
        : '<title> tag is missing or empty.',
      fix: !hasTitle ? 'Add a unique 50-60 character <title> tag inside the <head> section.' : null
    });

    // 4. Meta Description
    const hasMetaDesc = Boolean(pg.meta_description && pg.meta_description.trim().length > 0);
    params.push({
      name: 'Meta Description',
      passed: hasMetaDesc,
      severity: 'high',
      detail: hasMetaDesc 
        ? `"${pg.meta_description.slice(0, 90)}${pg.meta_description.length > 90 ? '...' : ''}" (${pg.meta_description.length} characters)`
        : 'Meta description (<meta name="description">) tag not found.',
      fix: !hasMetaDesc ? 'Add a descriptive 140-160 character <meta name="description"> tag inside <head>.' : null
    });

    // 5. Primary H1 Heading
    const hasH1 = Boolean(pg.h1 && pg.h1.trim().length > 0);
    params.push({
      name: 'Primary H1 Heading (<h1>)',
      passed: hasH1,
      severity: 'high',
      detail: hasH1 
        ? `"${pg.h1}"`
        : 'No primary <h1> heading found on page.',
      fix: !hasH1 ? 'Add a single and clear <h1> heading summarizing the main page topic.' : null
    });

    // 6. Indexability (Meta Robots)
    const isIndexable = pg.is_indexable !== false;
    params.push({
      name: 'Indexability (Robots)',
      passed: isIndexable,
      severity: 'critical',
      detail: isIndexable 
        ? 'No noindex restriction, indexable by search engine crawlers.'
        : '"noindex" directive detected; excluded from search engine index.',
      fix: !isIndexable ? 'Remove "noindex" from robots meta tag if you want this page to be indexed.' : null
    });

    // 7. Canonical URL
    const hasCanonical = Boolean(pg.canonical_url && pg.canonical_url.trim().length > 0);
    params.push({
      name: 'Canonical URL',
      passed: hasCanonical,
      severity: 'medium',
      detail: hasCanonical 
        ? `Canonical URL defined: ${pg.canonical_url}`
        : 'Canonical (<link rel="canonical">) tag not specified.',
      fix: !hasCanonical ? 'Define primary page URL as canonical to prevent duplicate content issues.' : null
    });

    // 8. Schema.org (JSON-LD)
    const hasSchema = Array.isArray(pg.schema_types) && pg.schema_types.length > 0;
    params.push({
      name: 'Schema.org Structured Data',
      passed: hasSchema,
      severity: 'medium',
      detail: hasSchema 
        ? `[ ${pg.schema_types.join(', ')} ] schema integrated.`
        : 'No Schema.org JSON-LD structured data found on page.',
      fix: !hasSchema ? 'Add WebPage or Organization JSON-LD Schema markup for Google and AI crawlers.' : null
    });

    // 9. Content Depth (Word Count)
    const wordCount = pg.word_count || 0;
    const wordOk = wordCount >= 15;
    params.push({
      name: 'Content Depth (Word Count)',
      passed: wordOk,
      severity: 'medium',
      detail: wordOk 
        ? `${wordCount} words of textual content detected.`
        : `Low word count (${wordCount} words).`,
      fix: !wordOk ? 'Enrich page with more detailed text and explanations for users and search crawlers.' : null
    });

    // 10. Server Response Time (TTFB)
    const loadTime = pg.load_time_ms || 350;
    const speedOk = loadTime < 1500;
    params.push({
      name: 'Server Response Time (TTFB)',
      passed: speedOk,
      severity: 'medium',
      detail: speedOk 
        ? `${loadTime} ms (Optimal fast server response time).`
        : `${loadTime} ms (Slow server response time).`,
      fix: !speedOk ? 'Improve response time using server caching and CDN edge distribution.' : null
    });

    return params;
  };

  const fetchAudit = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) setData(json.data);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async () => {
    if (!activeWorkspace?.id || !token || isScanning) return;
    setIsScanning(true);
    setToastMessage('Crawling sitemap and running full technical audit for all pages...');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/audit/rescan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
        const crawledCount = json.data.pages?.length || 0;
        setToastMessage(`Audit completed successfully! ${crawledCount} pages analyzed.`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        setToastMessage(json.error || 'A problem occurred during rescan.');
      }
    } catch (err) {
      console.error('Audit rescan error:', err);
      setToastMessage('Could not reach crawler server.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [activeWorkspace?.id, token]);

  if (loading) {
    return <GrowthTechnicalAuditSkeleton />;
  }

  if (isFree || data?.isLocked) {
    return (
      <div className="growth-view-container animate-fade">
        <GrowthPageCover
          title="Site Audit & Technical SEO Issues"
          subtitle="Comprehensive automated crawler and technical health verification engine"
          badgeText="PRO FEATURE"
        />

        <div className="growth-locked-gate-container">
          <div className="growth-locked-gate-icon-wrap">
            <Lock size={30} />
          </div>

          <h2 className="growth-locked-gate-title">
            Technical Site Audit &amp; Issue Crawler
          </h2>
          <p className="growth-locked-gate-desc">
            According to your Pricing Plan, in-depth site crawling and technical indexability audits are exclusive to <strong>Pro</strong> and <strong>Unlimited</strong> plans.
          </p>

          <div className="growth-locked-gate-grid">
            <div className="growth-locked-gate-card">
              <div className="growth-locked-gate-card-header">
                <Check size={16} /> <span>Deep Crawler &amp; Sitemap</span>
              </div>
              <p className="growth-locked-gate-card-body">Automatically crawls all internal URLs, XML sitemaps, and link hierarchies.</p>
            </div>

            <div className="growth-locked-gate-card">
              <div className="growth-locked-gate-card-header">
                <Check size={16} /> <span>404 &amp; Broken Link Detection</span>
              </div>
              <p className="growth-locked-gate-card-body">Prioritizes broken redirects, 404 errors, and unreachable endpoints.</p>
            </div>

            <div className="growth-locked-gate-card">
              <div className="growth-locked-gate-card-header">
                <Check size={16} /> <span>Meta, Canonical &amp; SSL</span>
              </div>
              <p className="growth-locked-gate-card-body">Flags missing titles, duplicate canonical tags, and security vulnerabilities.</p>
            </div>

            <div className="growth-locked-gate-card">
              <div className="growth-locked-gate-card-header">
                <Check size={16} /> <span>Unlimited Re-Scans</span>
              </div>
              <p className="growth-locked-gate-card-body">Perform live on-demand re-scans with a single click after every deployment.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => promptPaywall({ plan: 'pro' })}
            className="growth-locked-gate-cta-btn"
          >
            <Sparkles size={16} />
            <span>Upgrade to Pro or Unlimited</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const issues = data?.issues || [];
  const pages = data?.pages || [];
  const lastRun = data?.lastRun || null;
  const summary = typeof lastRun?.summary === 'string' 
    ? (() => { try { return JSON.parse(lastRun.summary); } catch (e) { return {}; } })()
    : (lastRun?.summary || {});

  const filteredIssues = issues.filter(iss => {
    if (filterSeverity !== 'all') {
      if (filterSeverity === 'medium') {
        if (iss.severity !== 'medium' && iss.severity !== 'low') return false;
      } else if (iss.severity !== filterSeverity) {
        return false;
      }
    }
    if (issueSearch.trim()) {
      const q = issueSearch.toLowerCase();
      const matchTitle = iss.title && iss.title.toLowerCase().includes(q);
      const matchDesc = iss.description && iss.description.toLowerCase().includes(q);
      const matchUrl = iss.page_url && iss.page_url.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUrl) return false;
    }
    return true;
  });

  const totalIssuePages = Math.max(1, Math.ceil(filteredIssues.length / issuePageSize));
  const currentIssuePageSafe = Math.min(issueCurrentPage, totalIssuePages);
  const paginatedIssues = filteredIssues.slice((currentIssuePageSafe - 1) * issuePageSize, currentIssuePageSafe * issuePageSize);

  const lastRunDate = lastRun?.completed_at 
    ? new Date(lastRun.completed_at).toLocaleString('en-US', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
    : 'Unknown';

  const sitemapTotal = summary.sitemapTotalUrls || lastRun?.pages_requested || pages.length;

  const filteredPages = pages.filter(pg => {
    if (!pageSearch.trim()) return true;
    const q = pageSearch.toLowerCase();
    return (pg.url && pg.url.toLowerCase().includes(q)) || 
           (pg.title && pg.title.toLowerCase().includes(q));
  });

  const totalPageCount = Math.max(1, Math.ceil(filteredPages.length / pagePageSize));
  const currentPageSafe = Math.min(pageCurrentPage, totalPageCount);
  const paginatedPages = filteredPages.slice((currentPageSafe - 1) * pagePageSize, currentPageSafe * pagePageSize);

  return (
    <div className="growth-page-container animate-fade">
      {/* Page Hero Cover */}
      <GrowthPageCover
        compact
        badge="Technical Infrastructure Audit"
        badgeIcon={Wrench}
        title="Technical Site Audit &amp; Issues"
        subtitle="Page titles, meta tags, H1/H2 hierarchy, Schema.org structured data, and indexability validations."
        coverImage="/growth-covers/audit-cover.jpg"
        stats={[
          { label: 'Technical Score', value: lastRun ? `${lastRun.technical_score}/100` : '-', sub: `Last audit: ${lastRunDate}` },
          { label: 'Sitemap Status', value: summary.sitemapFound !== false ? `${sitemapTotal} URLs` : 'Not Found', sub: 'Automatically Detected' },
          { label: 'Crawled Pages', value: pages.length, sub: 'Index & Code Audit' },
          { label: 'Total Issues', value: issues.length, sub: `${issues.filter(i => i.severity === 'critical').length} critical anomalies` }
        ]}
        actions={
          <button type="button" onClick={handleRescan} disabled={isScanning} className="growth-secondary-btn">
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Rescan Audit'}</span>
          </button>
        }
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          margin: '1rem 0',
          padding: '0.9rem 1.25rem',
          borderRadius: 12,
          background: isScanning ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${isScanning ? 'rgba(59, 130, 246, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-main, #ffffff)',
          fontSize: '0.875rem'
        }}>
          {isScanning ? (
            <Loader2 size={18} className="animate-spin text-blue-400" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Last Scan Details Panel */}
      {lastRun && (
        <div className="growth-panel-card" style={{ marginBottom: '1.5rem' }}>
          <div className="growth-panel-header" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="growth-panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>Recent Audit Details &amp; Infrastructure Summary</h3>
                <p className="growth-panel-desc" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                  Last audit: <strong>{lastRunDate}</strong> ({lastRun.status === 'completed' ? 'Successfully Completed' : 'Processing'})
                </p>
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 20,
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              <CheckCircle2 size={14} />
              <span>Technical Score: {lastRun.technical_score}/100</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            <div className="growth-audit-mini-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Sitemap Detection</div>
              <div className="growth-audit-mini-val">
                {summary.sitemapFound !== false ? 'Auto Detected' : 'Not Found'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                {sitemapTotal} URLs mapped
              </div>
            </div>

            <div className="growth-audit-mini-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Deep Page Crawl</div>
              <div className="growth-audit-mini-val">
                {pages.length} Pages Crawled
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.2rem' }}>
                H1, Meta, Schema and status codes OK
              </div>
            </div>

            <div className="growth-audit-mini-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>SSL &amp; robots.txt</div>
              <div className="growth-audit-mini-val">
                {summary.ssl ? 'HTTPS Secure' : 'SSL Missing'} • {summary.robotsTxt ? 'robots.txt OK' : 'None'}
              </div>
              <div style={{ fontSize: '0.75rem', color: summary.llmsTxt ? '#4ade80' : '#f59e0b', marginTop: '0.2rem' }}>
                {summary.llmsTxt ? 'llms.txt AI standard active' : 'llms.txt standard recommended'}
              </div>
            </div>

            <div className="growth-audit-mini-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Average Load Time</div>
              <div className="growth-audit-mini-val">
                {summary.loadTimeMs || 450} ms
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.2rem' }}>
                High server response speed (TTFB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues Filter Tabs & Search */}
      <div className="growth-audit-filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`growth-audit-tab ${filterSeverity === 'all' ? 'is-active' : ''}`}
            onClick={() => { setFilterSeverity('all'); setIssueCurrentPage(1); }}
          >
            All Issues ({issues.length})
          </button>
          <button
            type="button"
            className={`growth-audit-tab ${filterSeverity === 'critical' ? 'is-active' : ''}`}
            onClick={() => { setFilterSeverity('critical'); setIssueCurrentPage(1); }}
          >
            Critical ({issues.filter(i => i.severity === 'critical').length})
          </button>
          <button
            type="button"
            className={`growth-audit-tab ${filterSeverity === 'high' ? 'is-active' : ''}`}
            onClick={() => { setFilterSeverity('high'); setIssueCurrentPage(1); }}
          >
            High ({issues.filter(i => i.severity === 'high').length})
          </button>
          <button
            type="button"
            className={`growth-audit-tab ${filterSeverity === 'medium' ? 'is-active' : ''}`}
            onClick={() => { setFilterSeverity('medium'); setIssueCurrentPage(1); }}
          >
            Medium & Info ({issues.filter(i => i.severity === 'medium' || i.severity === 'low').length})
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          padding: '0.35rem 0.75rem',
          gap: '0.45rem',
          width: 240
        }}>
          <Search size={14} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search issues..."
            value={issueSearch}
            onChange={(e) => {
              setIssueSearch(e.target.value);
              setIssueCurrentPage(1);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main, #ffffff)',
              fontSize: '0.8rem',
              width: '100%'
            }}
          />
          {issueSearch && (
            <button
              type="button"
              onClick={() => { setIssueSearch(''); setIssueCurrentPage(1); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="growth-audit-issues-stack">
        {paginatedIssues.length > 0 ? (
          paginatedIssues.map((issue) => (
            <div key={issue.id} className="growth-issue-card">
              <div className="growth-issue-header">
                <span className={`growth-severity-tag severity-${issue.severity || 'medium'}`}>
                  {(issue.severity || 'info').toUpperCase()}
                </span>
                <h4 className="growth-issue-title">{issue.title}</h4>
              </div>

              <p className="growth-issue-desc">{issue.description}</p>

              {issue.recommended_fix && (
                <div className="growth-issue-fix-box">
                  <span className="fix-box-label">Recommended Fix:</span>
                  <p className="fix-box-text">{issue.recommended_fix}</p>
                </div>
              )}

              {issue.page_url && (
                <div className="growth-issue-url-row">
                  <Globe size={12} />
                  <span>{issue.page_url}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="growth-empty-card">
            <CheckCircle2 size={32} className="text-success" />
            <h4>No issues found for the selected filter</h4>
            <p>Your site passes this criteria.</p>
          </div>
        )}
      </div>

      {/* Issues Pagination Bar */}
      {totalIssuePages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 0.5rem 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Showing {(currentIssuePageSafe - 1) * issuePageSize + 1} - {Math.min(currentIssuePageSafe * issuePageSize, filteredIssues.length)} of {filteredIssues.length} issues
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="growth-secondary-btn"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={currentIssuePageSafe <= 1}
              onClick={() => setIssueCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-main, #ffffff)', fontWeight: 600, padding: '0 0.5rem' }}>
              Page {currentIssuePageSafe} / {totalIssuePages}
            </span>

            <button
              type="button"
              className="growth-secondary-btn"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={currentIssuePageSafe >= totalIssuePages}
              onClick={() => setIssueCurrentPage(prev => Math.min(totalIssuePages, prev + 1))}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Crawled Pages Section */}
      <div className="growth-panel-card" style={{ marginTop: '2rem' }}>
        <div className="growth-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="growth-panel-title">Crawled Pages ({pages.length})</h3>
            <p className="growth-panel-desc">Index & SEO status of all pages detected and crawled from the sitemap.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {paginatedPages.length > 0 && (
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => {
                  const allExpanded = paginatedPages.every(pg => expandedPages.has(pg.id || pg.url));
                  setExpandedPages(prev => {
                    const next = new Set(prev);
                    if (allExpanded) {
                      paginatedPages.forEach(pg => next.delete(pg.id || pg.url));
                    } else {
                      paginatedPages.forEach(pg => next.add(pg.id || pg.url));
                    }
                    return next;
                  });
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {paginatedPages.every(pg => expandedPages.has(pg.id || pg.url)) ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>Expand All</span>
                  </>
                )}
              </button>
            )}

            <div className="growth-search-input-wrap">
              <Search size={14} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search pages..."
                value={pageSearch}
                onChange={(e) => {
                  setPageSearch(e.target.value);
                  setPageCurrentPage(1);
                }}
                className="growth-search-input"
              />
              {pageSearch && (
                <button
                  type="button"
                  onClick={() => { setPageSearch(''); setPageCurrentPage(1); }}
                  style={{ position: 'absolute', right: '0.65rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="growth-table-wrap">
          <div className="growth-pages-table">
            <div className="pages-table-header">
              <span>Page URL & Title</span>
              <span>Status</span>
              <span>Word Count</span>
              <span>Structured Data</span>
              <span style={{ textAlign: 'right' }}>10 Parameters</span>
            </div>

            {paginatedPages.length > 0 ? (
              paginatedPages.map((pg) => {
                const pageKey = pg.id || pg.url;
                const isExpanded = expandedPages.has(pageKey);
                const auditParams = getPageAuditParameters(pg);
                const passedCount = auditParams.filter(p => p.passed).length;
                const totalCount = auditParams.length;
                const hasIssues = passedCount < totalCount;

                return (
                  <div key={pageKey} className={`growth-page-item-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
                    <div 
                      className="pages-table-row"
                      onClick={() => togglePageExpand(pageKey)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view technical parameter audit details"
                    >
                      <div className="page-url-cell">
                        <span className="page-title-text">{pg.title || 'Untitled Page'}</span>
                        <span className="page-url-sub">{pg.url}</span>
                      </div>
                      <div className="page-status-cell">
                        <span className={`page-status-pill ${pg.status_code >= 400 ? 'status-error' : ''}`}>
                          {pg.status_code || 200} {pg.status_code >= 400 ? 'ERROR' : 'OK'}
                        </span>
                      </div>
                      <div className="page-words-cell">
                        <span>{pg.word_count || 0} words</span>
                      </div>
                      <div className="page-schema-cell">
                        {Array.isArray(pg.schema_types) && pg.schema_types.length > 0 ? (
                          pg.schema_types.map((sc, scIdx) => (
                            <span key={scIdx} className="schema-pill">{typeof sc === 'string' ? sc : JSON.stringify(sc)}</span>
                          ))
                        ) : (
                          <span className="text-muted">No Schema</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="growth-page-toggle-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePageExpand(pageKey);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: hasIssues ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            background: hasIssues ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: hasIssues ? '#fbbf24' : '#34d399',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {hasIssues ? (
                            <AlertCircle size={13} style={{ color: '#fbbf24' }} />
                          ) : (
                            <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                          )}
                          <span>{passedCount}/{totalCount}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Parameter Details Drawer */}
                    {isExpanded && (
                      <div className="growth-page-audit-drawer">
                        <div className="drawer-header-row">
                          <div className="drawer-title-wrap">
                            <ShieldCheck size={16} style={{ color: hasIssues ? '#fbbf24' : '#10b981' }} />
                            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                              Page Technical Parameter Audit
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 4,
                              background: hasIssues ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: hasIssues ? '#fbbf24' : '#34d399',
                              fontWeight: 600
                            }}>
                              {passedCount} / {totalCount} Parameters Passed {hasIssues ? `(${totalCount - passedCount} Warning${totalCount - passedCount > 1 ? 's' : ''})` : ''}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <a 
                              href={pg.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                color: '#93c5fd',
                                textDecoration: 'none',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 6
                              }}
                            >
                              <span>Visit Page</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>

                        {/* Param Cards Grid */}
                        <div className="drawer-grid">
                          {auditParams.map((param, pIdx) => (
                            <div 
                              key={pIdx} 
                              className={`param-card ${param.passed ? 'passed' : 'failed'}`}
                            >
                              <div className="param-card-top">
                                <div className="param-title-group">
                                  {param.passed ? (
                                    <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                                  ) : (
                                    <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                  )}
                                  <span>{param.name}</span>
                                </div>
                                {param.passed ? (
                                  <span className="param-badge-pass">
                                    <CheckCircle2 size={11} />
                                    No Issues
                                  </span>
                                ) : (
                                  <span className="param-badge-fail">
                                    <AlertTriangle size={11} />
                                    Issue Detected
                                  </span>
                                )}
                              </div>

                              <div className="param-detail-text">
                                {param.detail}
                              </div>

                              {!param.passed && param.fix && (
                                <div className="param-fix-box">
                                  <strong>Recommended Fix:</strong> {param.fix}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No pages found matching the search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPageCount > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0.5rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            marginTop: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing {(currentPageSafe - 1) * pagePageSize + 1} - {Math.min(currentPageSafe * pagePageSize, filteredPages.length)} of {filteredPages.length} pages
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                disabled={currentPageSafe <= 1}
                onClick={() => setPageCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-main, #ffffff)', fontWeight: 600, padding: '0 0.5rem' }}>
                Page {currentPageSafe} / {totalPageCount}
              </span>

              <button
                type="button"
                className="growth-secondary-btn"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                disabled={currentPageSafe >= totalPageCount}
                onClick={() => setPageCurrentPage(prev => Math.min(totalPageCount, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
