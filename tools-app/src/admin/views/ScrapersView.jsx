import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Eye, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  X, 
  FileText,
  Table as TableIcon,
  LayoutGrid,
  TrendingUp,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function ScrapersView() {
  const [sources, setSources] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [runningScraper, setRunningScraper] = useState(null);
  const [scraperMessage, setScraperMessage] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'));
  
  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Facet filter lists (all options from DB)
  const [availableDomains, setAvailableDomains] = useState([]);
  const [availableBeneficiaries, setAvailableBeneficiaries] = useState([]);

  // Detail Modal state
  const [activeOpportunity, setActiveOpportunity] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenDetail = async (opp) => {
    setActiveOpportunity(opp);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/scrapers/opportunities/${opp.id}`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setActiveOpportunity(json.data);
      }
    } catch (err) {
      console.error('Failed to load opportunity full detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Ref to scroll to top of list when page changes
  const listTopRef = useRef(null);

  // Fetch scraper sources
  const fetchSources = async () => {
    try {
      setLoadingSources(true);
      const res = await fetch('/api/scrapers/sources');
      const json = await res.json();
      if (json.status === 'success') {
        setSources(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load scraper sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  // Fetch filter facets
  const fetchFilterFacets = async () => {
    try {
      const res = await fetch('/api/scrapers/stats');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        if (Array.isArray(json.data.domains)) setAvailableDomains(json.data.domains);
        if (Array.isArray(json.data.beneficiaries)) setAvailableBeneficiaries(json.data.beneficiaries);
      }
    } catch (err) {
      console.warn('Could not fetch filter facets:', err);
    }
  };

  // Fetch paginated opportunities
  const fetchOpportunities = async () => {
    try {
      setLoadingOpps(true);
      const params = new URLSearchParams({ 
        page: currentPage.toString(), 
        limit: pageSize.toString() 
      });
      if (selectedSource !== 'all') params.append('source', selectedSource);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedBeneficiary !== 'all') params.append('beneficiary', selectedBeneficiary);
      if (selectedDomain !== 'all') params.append('domain', selectedDomain);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/scrapers/opportunities?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setOpportunities(json.data?.items || []);
        setTotalItems(json.data?.total || 0);
        setTotalPages(json.data?.total_pages || 1);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoadingOpps(false);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchFilterFacets();
  }, []);

  // Reset to page 1 whenever any filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSource, selectedDomain, selectedBeneficiary, selectedStatus, pageSize]);

  // Fetch opportunities whenever page or filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOpportunities();
    }, 200);
    return () => clearTimeout(timeout);
  }, [currentPage, pageSize, searchTerm, selectedSource, selectedDomain, selectedBeneficiary, selectedStatus]);

  // Scroll to table when page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Run scraper manually
  const handleRunScraper = async (sourceKey) => {
    try {
      setRunningScraper(sourceKey);
      setScraperMessage(null);
      const res = await fetch(`/api/scrapers/${sourceKey}/run`, { method: 'POST' });
      const json = await res.json();

      if (json.status === 'success') {
        const d = json.data;
        setScraperMessage({
          type: 'success',
          text: `Scraping completed: ${d.items_found} opportunities scanned. ${d.items_inserted} inserted, ${d.items_updated} updated, ${d.items_unchanged} unchanged (verified via SHA-256).`
        });
        await fetchSources();
        await fetchFilterFacets();
        await fetchOpportunities();
      } else {
        setScraperMessage({
          type: 'error',
          text: json.message || 'Scraping process failed.'
        });
      }
    } catch (err) {
      setScraperMessage({
        type: 'error',
        text: 'A connection error occurred while running the scraper.'
      });
    } finally {
      setRunningScraper(null);
    }
  };

  // Copy webhook URL
  const handleCopyWebhook = (path) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return 'Open / Ongoing';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Format source URL display helper
  const formatSourceUrl = (url) => {
    try {
      const u = new URL(url);
      const cleanPath = u.pathname.length > 25 ? u.pathname.slice(0, 22) + '...' : u.pathname;
      return `${u.hostname}${cleanPath && cleanPath !== '/' ? cleanPath : ''}`;
    } catch {
      return url.replace(/^https?:\/\//, '').slice(0, 30);
    }
  };

  const openOppsCount = opportunities.filter(o => o.status === 'open').length;

  return (
    <div className="admin-body">
      {/* 1. Top KPI Summary Grid (Standard Apple-Grade Minimalist Cards) */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Opportunities</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Database size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{totalItems}</div>
          <div className="admin-kpi-sub">
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ color: '#10b981', fontWeight: 600 }}>Indexed in Database</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Open Calls</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>
            {sources.length > 0 ? sources.reduce((acc, s) => acc + (s.open_items || 0), 0) : openOppsCount}
          </div>
          <div className="admin-kpi-sub">
            <span>Active for submission</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Change Detection</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#a855f7' }}>SHA-256</div>
          <div className="admin-kpi-sub">
            <span>Zero redundant writes</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Automation</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">Webhook</div>
          <div className="admin-kpi-sub">
            <span>Cron & Manual Triggers</span>
          </div>
        </div>
      </div>

      {/* Scraper Run Feedback Alert */}
      {scraperMessage && (
        <div 
          className={`admin-alert ${scraperMessage.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 14,
            background: scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            color: scraperMessage.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {scraperMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{scraperMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setScraperMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Configured Scraper Sources */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Target Scraper Sources ({sources.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Deterministic scraper engines triggered on-demand or via secure webhooks
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sources.map((src) => {
            const isRunning = runningScraper === src.key;
            return (
              <div 
                key={src.key}
                className="admin-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                {/* Header: Icon, Name, Link & Top Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between', 
                  gap: '1rem', 
                  flexWrap: 'wrap' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: src.key === 'ec_funding' 
                        ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' 
                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: src.key === 'ec_funding' 
                        ? '0 4px 12px rgba(139, 92, 246, 0.25)' 
                        : '0 4px 12px rgba(59, 130, 246, 0.25)',
                      flexShrink: 0
                    }}>
                      <Globe size={22} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {src.name}
                        </h4>
                        <span className="admin-badge success" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                          ● Active
                        </span>
                      </div>
                      <a 
                        href={src.url} 
                        target="_blank" 
                        rel="noreferrer"
                        title={src.url}
                        style={{ 
                          fontSize: '0.78rem', 
                          color: '#3b82f6', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.2rem',
                          marginTop: '0.2rem',
                          textDecoration: 'none',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatSourceUrl(src.url)}
                        </span>
                        <ArrowUpRight size={12} style={{ flexShrink: 0 }} />
                      </a>
                    </div>
                  </div>

                  {/* Actions: Run Scraper & Copy Webhook */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="admin-action-btn primary"
                      onClick={() => handleRunScraper(src.key)}
                      disabled={isRunning}
                      style={{ minWidth: 140, justifyContent: 'center' }}
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw size={14} className="spin" />
                          <span>Scraping...</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} fill="currentColor" />
                          <span>Run Scraper</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-action-btn secondary"
                      onClick={() => handleCopyWebhook(src.webhook_path)}
                      title="Copy Webhook URL to trigger via Cron, n8n, or external services"
                      style={{ justifyContent: 'center' }}
                    >
                      {copiedWebhook ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copiedWebhook ? 'Copied!' : 'Webhook URL'}</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {src.description}
                </p>

                {/* Bottom Row: Stats and Last Run */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--card-border, rgba(0, 0, 0, 0.05))'
                }}>
                  {/* Stats Badges / Grid */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(150, 150, 150, 0.06)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 8,
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Indexed:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{src.total_items}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 8,
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: '#10b981' }}>Open Calls:</span>
                      <strong style={{ color: '#10b981' }}>{src.open_items}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(168, 85, 247, 0.08)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 8,
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: '#a855f7' }}>Deduplication:</span>
                      <strong style={{ color: '#a855f7' }}>SHA-256</strong>
                    </div>
                  </div>

                  {/* Last Run Info */}
                  {src.last_run && (
                    <div style={{ 
                      fontSize: '0.76rem', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem' 
                    }}>
                      <Clock size={13} style={{ flexShrink: 0 }} />
                      <span>
                        Last Run: {formatDate(src.last_run.created_at)} ({src.last_run.items_found} calls, {src.last_run.items_unchanged} unchanged)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Toolbar (Search, Filter, View Mode Switcher) */}
      <div className="admin-toolbar" ref={listTopRef}>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Search opportunities, topics, keywords or organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="admin-select"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="all">All Sources ({sources.length})</option>
            {sources.map(s => (
              <option key={s.key} value={s.key}>{s.name}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedBeneficiary}
            onChange={(e) => setSelectedBeneficiary(e.target.value)}
          >
            <option value="all">All Eligible Applicants</option>
            {availableBeneficiaries.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            <option value="all">All Domains / Sectors</option>
            {availableDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="admin-view-switcher">
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <TableIcon size={16} />
          </button>
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* 4. Opportunities Display */}
      {loadingOpps ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
          <div>Loading funding opportunities...</div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0 }}>No open funding opportunities matched your search criteria.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="admin-table-container">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Program & Title</th>
                  <th>Funding Amount</th>
                  <th>Eligible Applicants</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} onClick={() => handleOpenDetail(opp)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {(opp.cover_image || opp.source_key === 'ec_funding') ? (
                          <img 
                            src={opp.cover_image && !opp.cover_image.includes('logo-ec.svg') ? opp.cover_image : (opp.source_key === 'ec_funding' ? '/eu-logo.svg' : opp.cover_image)} 
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              if (opp.source_key === 'ec_funding' && e.target.src !== window.location.origin + '/eu-logo.svg') {
                                e.target.src = '/eu-logo.svg';
                              } else {
                                e.target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            €
                          </div>
                        )}
                        <div style={{ maxWidth: 360, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {opp.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                            <span 
                              className={`admin-badge ${opp.source_key === 'ec_funding' ? 'purple' : 'primary'}`}
                              style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', flexShrink: 0 }}
                            >
                              {opp.source_key === 'ec_funding' ? 'EU Portal' : 'Cascade'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {opp.short_description || opp.source_key}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                        {opp.funding_amount || 'Grant'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: 220 }}>
                        {(opp.eligible_applicants || []).slice(0, 2).map((b) => (
                          <span key={b} className="admin-badge neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                            {b}
                          </span>
                        ))}
                        {(opp.eligible_applicants || []).length > 2 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            +{opp.eligible_applicants.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDate(opp.deadline_date)}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`admin-badge ${opp.status === 'open' ? 'success' : 'neutral'}`}>
                        {opp.status === 'open' ? '● Open' : 'Closed'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        className="admin-action-btn secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(opp);
                        }}
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {opportunities.map((opp) => (
            <div 
              key={opp.id}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => handleOpenDetail(opp)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {(opp.cover_image || opp.source_key === 'ec_funding') ? (
                    <img 
                      src={opp.cover_image && !opp.cover_image.includes('logo-ec.svg') ? opp.cover_image : (opp.source_key === 'ec_funding' ? '/eu-logo.svg' : opp.cover_image)} 
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
                      }}
                      onError={(e) => {
                        if (opp.source_key === 'ec_funding' && e.target.src !== window.location.origin + '/eu-logo.svg') {
                          e.target.src = '/eu-logo.svg';
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      €
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span 
                        className={`admin-badge ${opp.source_key === 'ec_funding' ? 'purple' : 'primary'}`} 
                        style={{ fontSize: '0.64rem', padding: '0.12rem 0.4rem' }}
                      >
                        {opp.source_key === 'ec_funding' ? 'EU Tenders' : 'Cascade'}
                      </span>
                      {opp.call_type && opp.call_type !== 'Cascade Funding' && (
                        <span className="admin-badge neutral" style={{ fontSize: '0.62rem', padding: '0.12rem 0.35rem' }}>
                          {opp.call_type}
                        </span>
                      )}
                    </div>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '0.94rem', 
                      fontWeight: 700, 
                      color: 'var(--text-main)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {opp.title}
                    </h4>
                  </div>
                </div>

                <span className={`admin-badge ${opp.status === 'open' ? 'success' : 'neutral'}`}>
                  {opp.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45
              }}>
                {opp.short_description || 'No description available'}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(opp.eligible_applicants || []).slice(0, 3).map(b => (
                  <span key={b} className="admin-badge neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                    {b}
                  </span>
                ))}
              </div>

              {/* Card Footer with Funding & Deadline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--card-border, rgba(0,0,0,0.06))'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max Funding</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                    {opp.funding_amount || 'Grant'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deadline</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatDate(opp.deadline_date)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Pagination Bar */}
      {totalItems > 0 && (
        <div className="admin-pagination">
          <div className="admin-pagination-info">
            <span>
              Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> opportunities
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem' }}>Per page:</span>
              <select
                className="admin-page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="admin-pagination-controls">
            <button
              type="button"
              className="admin-page-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              title="First Page"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              type="button"
              className="admin-page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="admin-page-ellipsis">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  className={`admin-page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              className="admin-page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              className="admin-page-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              title="Last Page"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Complete Opportunity Detail Modal */}
      {activeOpportunity && (
        <div 
          className="admin-modal-backdrop"
          onClick={() => setActiveOpportunity(null)}
        >
          <div 
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--card-border, rgba(0,0,0,0.06))',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(activeOpportunity.cover_image || activeOpportunity.source_key === 'ec_funding') && (
                  <img 
                    src={activeOpportunity.cover_image && !activeOpportunity.cover_image.includes('logo-ec.svg') ? activeOpportunity.cover_image : (activeOpportunity.source_key === 'ec_funding' ? '/eu-logo.svg' : activeOpportunity.cover_image)} 
                    alt=""
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      objectFit: 'cover',
                      border: '1px solid var(--card-border, rgba(0,0,0,0.08))'
                    }}
                    onError={(e) => {
                      if (activeOpportunity.source_key === 'ec_funding' && e.target.src !== window.location.origin + '/eu-logo.svg') {
                        e.target.src = '/eu-logo.svg';
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                )}
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className={`admin-badge ${activeOpportunity.source_key === 'ec_funding' ? 'purple' : 'primary'}`}>
                      {activeOpportunity.source_key === 'ec_funding' ? 'EU Funding & Tenders Portal (SEDIA)' : 'Cascade Funding'}
                    </span>
                    {activeOpportunity.call_type && activeOpportunity.call_type !== 'Cascade Funding' && (
                      <span className="admin-badge neutral">
                        {activeOpportunity.call_type}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                    {activeOpportunity.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveOpportunity(null)}
                style={{
                  background: 'rgba(150, 150, 150, 0.1)',
                  border: 'none',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Financial & Deadline Overview Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.85rem',
                background: 'rgba(150, 150, 150, 0.04)',
                padding: '1rem',
                borderRadius: 14,
                border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Funding Amount</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    {activeOpportunity.funding_amount || 'Free Grant'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deadline Date</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.deadline_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Opening Date</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.opening_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`admin-badge ${activeOpportunity.status === 'open' ? 'success' : 'neutral'}`}>
                      {activeOpportunity.status === 'open' ? '● Active / Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eligible Applicants */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                  Eligible Applicants
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(activeOpportunity.eligible_applicants || []).map(app => (
                    <span key={app} className="admin-badge primary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Focus Domains & Technologies */}
              {((activeOpportunity.domains && activeOpportunity.domains.length > 0) || 
                (activeOpportunity.technologies && activeOpportunity.technologies.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {activeOpportunity.domains && activeOpportunity.domains.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                        Sectors & Focus Domains
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.domains.map(d => (
                          <span key={d} className="admin-badge neutral" style={{ fontSize: '0.75rem' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeOpportunity.technologies && activeOpportunity.technologies.filter(t => typeof t === 'string' && !/^\d+$/.test(t) && !t.includes('<') && t.length <= 40).length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                        Technologies
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.technologies
                          .filter(t => typeof t === 'string' && !/^\d+$/.test(t) && !t.includes('<') && t.length <= 40)
                          .map(t => (
                            <span key={t} className="admin-badge purple" style={{ fontSize: '0.75rem' }}>
                              {t}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                  Summary & Objectives
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                  {activeOpportunity.short_description}
                </p>
              </div>

              {/* Call Details & Scope (HTML) */}
              {loadingDetail && !activeOpportunity.long_description && (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(150, 150, 150, 0.04)', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
                  <RefreshCw size={18} className="spin" style={{ marginBottom: '0.4rem', display: 'inline-block' }} />
                  <div style={{ fontSize: '0.84rem' }}>Loading detailed call scope and eligibility conditions...</div>
                </div>
              )}

              {activeOpportunity.long_description && (
                <div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                    Call Details, Scope & Requirements
                  </h4>
                  <div 
                    style={{
                      maxHeight: 480,
                      overflowY: 'auto',
                      padding: '1.25rem',
                      borderRadius: 12,
                      background: 'rgba(150, 150, 150, 0.04)',
                      border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                      fontSize: '0.88rem',
                      lineHeight: 1.65,
                      color: 'var(--text-main)'
                    }}
                    dangerouslySetInnerHTML={{ __html: activeOpportunity.long_description }}
                  />
                </div>
              )}

              {/* External Links */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                  Official Links & Submission Portals
                </h4>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {(activeOpportunity.links?.apply || activeOpportunity.permalink) && (
                    <a
                      href={activeOpportunity.links?.apply || activeOpportunity.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn primary"
                      style={{ textDecoration: 'none' }}
                    >
                      <ArrowUpRight size={14} />
                      <span>
                        {activeOpportunity.source_key === 'ec_funding' ? 'Official EU Portal / Apply' : 'Apply on Official Portal'}
                      </span>
                    </a>
                  )}

                  {activeOpportunity.links?.website && (
                    <a
                      href={activeOpportunity.links.website}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Globe size={14} />
                      <span>Project Website</span>
                    </a>
                  )}

                  {activeOpportunity.links?.guidelines && (
                    <a
                      href={activeOpportunity.links.guidelines}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <FileText size={14} />
                      <span>Call Guidelines (PDF)</span>
                    </a>
                  )}

                  {activeOpportunity.links?.portal && (
                    <a
                      href={activeOpportunity.links.portal}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} />
                      <span>All Calls Listing</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Deduplication & Technical Hash Info */}
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                padding: '0.6rem 0.85rem',
                borderRadius: 10,
                background: 'rgba(150, 150, 150, 0.04)',
                border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>SHA-256 Content Signature: <code>{activeOpportunity.content_hash?.substring(0, 18)}...</code></span>
                </div>
                <span>DB ID: #{activeOpportunity.id} | Source: {activeOpportunity.source_key}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
