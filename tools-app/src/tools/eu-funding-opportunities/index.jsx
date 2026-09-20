import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  Search,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  Euro,
  Globe,
  ExternalLink,
  Bookmark,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle,
  Building,
  Users,
  Target,
  Clock,
  X,
  Download,
  FileText
} from 'lucide-react';
import { euFundingManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { ToolHeader, Badge } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import EuFundingSeo from './components/EuFundingSeo';
import './eu-funding.css';

const DOMAINS_LIST = [
  'All Domains',
  'AI & Data',
  'CleanTech & Energy',
  'Health & Biotech',
  'Smart Mobility',
  'Bioeconomy & AgriFood',
  'Security & Society',
  'Digital & Space',
  'Manufacturing & Industry'
];

const BENEFICIARIES_LIST = [
  'All Beneficiaries',
  'SME',
  'Startups',
  'Universities',
  'Research Organizations',
  'Individuals',
  'Mid-Caps'
];

export default function EuFundingOpportunities({ onBack, toolMeta }) {
  const { trackUse, visitorCount } = useToolAnalytics(euFundingManifest.slug, toolMeta);

  // States
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('all'); // 'all' | 'cascadefunding' | 'ec_funding'
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('All Beneficiaries');
  const [selectedCallType, setSelectedCallType] = useState('all');
  const [sortOrder, setSortOrder] = useState('deadline_asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Detail State
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Bookmarks (saved in localStorage)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('cerilas_eu_funding_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = useCallback((opp) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === opp.id);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b.id !== opp.id);
      } else {
        updated = [
          ...prev,
          {
            id: opp.id,
            title: opp.title,
            source_key: opp.source_key,
            deadline_date: opp.deadline_date,
            funding_amount: opp.funding_amount,
            permalink: opp.permalink
          }
        ];
      }
      try {
        localStorage.setItem('cerilas_eu_funding_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save bookmarks to localStorage', e);
      }
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((id) => bookmarks.some((b) => b.id === id), [bookmarks]);

  // Fetch summary KPI stats once
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/scrapers/stats');
        const json = await res.json();
        if (json.status === 'success') {
          setStats(json.data.summary);
        }
      } catch (err) {
        console.warn('Failed to fetch scraper stats:', err.message);
      }
    }
    fetchStats();
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch opportunities whenever filters change (with debounced search)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (selectedSource !== 'all') params.set('source', selectedSource);
        if (selectedDomain !== 'All Domains') params.set('domain', selectedDomain);
        if (selectedBeneficiary !== 'All Beneficiaries') params.set('beneficiary', selectedBeneficiary);
        if (selectedCallType !== 'all') params.set('call_type', selectedCallType);
        params.set('status', 'open'); // strictly open opportunities
        params.set('sort', sortOrder);
        params.set('page', String(page));
        params.set('limit', String(limit));

        const res = await fetch(`/api/scrapers/opportunities?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();

        if (cancelled) return;

        if (json.status === 'success' && json.data) {
          setOpportunities(json.data.items || []);
          setTotalItems(json.data.total || 0);
          setTotalPages(json.data.total_pages || 1);
        } else {
          throw new Error(json.message || 'Failed to load opportunities');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching opportunities:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, selectedSource, selectedDomain, selectedBeneficiary, selectedCallType, sortOrder, page, limit, refreshKey]);

  const fetchOpportunities = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Open Call Detail Modal
  const openDetail = async (id) => {
    if (trackUse) trackUse({ callId: id });
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/scrapers/opportunities/${id}`);
      const json = await res.json();
      if (json.status === 'success') {
        setSelectedOpp(json.data);
      }
    } catch (err) {
      console.error('Failed to load call details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedOpp(null);
    setCopiedLink(false);
  };

  const copyShareLink = (opp) => {
    const url = opp.permalink || (opp.links && opp.links[0]) || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export Bookmarked Proposals
  const exportBookmarks = (format = 'markdown') => {
    if (bookmarks.length === 0) return;
    let content = '';
    let filename = `eu-grant-shortlist-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'markdown') {
      content = `# Shortlisted EU & Cascade Funding Opportunities\nExported from Cerilas Tools on ${new Date().toLocaleDateString()}\n\n`;
      bookmarks.forEach((b, idx) => {
        content += `### ${idx + 1}. ${b.title}\n`;
        content += `- **Source:** ${b.source_key === 'ec_funding' ? 'European Commission (Horizon Europe)' : 'Cascade Funding (FSTP)'}\n`;
        if (b.funding_amount) content += `- **Funding / Grant:** ${b.funding_amount}\n`;
        if (b.deadline_date) content += `- **Deadline:** ${new Date(b.deadline_date).toLocaleDateString()}\n`;
        if (b.permalink) content += `- **Official Portal:** ${b.permalink}\n`;
        content += `\n`;
      });
      filename += '.md';
    } else {
      content = JSON.stringify(bookmarks, null, 2);
      filename += '.json';
    }

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered displayed opportunities (if bookmarks only)
  const displayedOpportunities = useMemo(() => {
    if (!showBookmarksOnly) return opportunities;
    return opportunities.filter((o) => isBookmarked(o.id));
  }, [opportunities, showBookmarksOnly, isBookmarked]);

  // Helper for deadline countdown
  const getDeadlineBadge = (deadlineDate) => {
    if (!deadlineDate) return null;
    const now = new Date();
    const d = new Date(deadlineDate);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return <span className="eu-meta-chip deadline-urgent">Deadline Today</span>;
    if (diffDays <= 14) return <span className="eu-meta-chip deadline-urgent">{diffDays} days left</span>;
    if (diffDays <= 30) return <span className="eu-meta-chip deadline-soon">{diffDays} days left</span>;
    return <span className="eu-meta-chip deadline-normal">{diffDays} days left</span>;
  };

  return (
    <div className="c-tool-page-container eu-funding-root">
      {/* 1. Header */}
      <ToolHeader
        title={euFundingManifest.title}
        subtitle={euFundingManifest.shortDescription}
        onBack={onBack}
        slug={euFundingManifest.slug}
        badges={
          <>
            {visitorCount > 0 && (
              <Badge variant="blue" icon={<Users size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            <Badge variant="blue" icon={<Globe size={12} strokeWidth={2} />}>
              EU Grants & FSTP
            </Badge>
            <Badge variant="success" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
              Live Directory
            </Badge>
          </>
        }
      />

      {/* 2. Real-time KPI Stats Banner */}
      <div className="eu-kpi-grid">
        <div className="eu-kpi-card">
          <div className="eu-kpi-icon-wrap blue">
            <Globe size={24} />
          </div>
          <div className="eu-kpi-info">
            <span className="eu-kpi-label">Active EU Calls</span>
            <span className="eu-kpi-value">{stats?.open_count ? Number(stats.open_count).toLocaleString() : '660+'}</span>
            <span className="eu-kpi-sub">Strictly open & actionable</span>
          </div>
        </div>

        <div className="eu-kpi-card">
          <div className="eu-kpi-icon-wrap green">
            <Euro size={24} />
          </div>
          <div className="eu-kpi-info">
            <span className="eu-kpi-label">Total Allocated Grants</span>
            <span className="eu-kpi-value">
              {stats?.total_funding_amount && Number(stats.total_funding_amount) > 0
                ? `€${(Number(stats.total_funding_amount) / 1000000).toFixed(0)}M+`
                : '€1.2B+'}
            </span>
            <span className="eu-kpi-sub">Direct & sub-grant funding</span>
          </div>
        </div>

        <div className="eu-kpi-card">
          <div className="eu-kpi-icon-wrap purple">
            <Sparkles size={24} />
          </div>
          <div className="eu-kpi-info">
            <span className="eu-kpi-label">Cascade Funding (FSTP)</span>
            <span className="eu-kpi-value">42+</span>
            <span className="eu-kpi-sub">Equity-free lump-sum grants</span>
          </div>
        </div>

        <div className="eu-kpi-card">
          <div className="eu-kpi-icon-wrap amber">
            <Layers size={24} />
          </div>
          <div className="eu-kpi-info">
            <span className="eu-kpi-label">Direct Horizon Europe</span>
            <span className="eu-kpi-value">620+</span>
            <span className="eu-kpi-sub">European Commission SEDIA</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Comprehensive Filter Controls */}
      <div className="eu-controls-panel">
        <div className="eu-search-row">
          <div className="eu-search-input-wrap">
            <Search size={18} />
            <input
              type="text"
              className="eu-search-input"
              placeholder="Search by call title, topic ID, keyword, technology (AI, Energy, Health)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button className="eu-search-clear" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Source Tabs */}
          <div className="eu-source-tabs">
            <button
              className={`eu-source-tab ${selectedSource === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedSource('all');
                setPage(1);
              }}
            >
              All Portals
            </button>
            <button
              className={`eu-source-tab ${selectedSource === 'ec_funding' ? 'active' : ''}`}
              onClick={() => {
                setSelectedSource('ec_funding');
                setPage(1);
              }}
            >
              Horizon Europe (SEDIA)
              <span className="eu-source-tab-count">621</span>
            </button>
            <button
              className={`eu-source-tab ${selectedSource === 'cascadefunding' ? 'active' : ''}`}
              onClick={() => {
                setSelectedSource('cascadefunding');
                setPage(1);
              }}
            >
              Cascade Funding (FSTP)
              <span className="eu-source-tab-count">42</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="eu-filter-row">
          <div className="eu-filter-selects">
            {/* Domain Filter */}
            <select
              className="eu-select"
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setPage(1);
              }}
            >
              {DOMAINS_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Beneficiary Filter */}
            <select
              className="eu-select"
              value={selectedBeneficiary}
              onChange={(e) => {
                setSelectedBeneficiary(e.target.value);
                setPage(1);
              }}
            >
              {BENEFICIARIES_LIST.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Call Type Filter */}
            <select
              className="eu-select"
              value={selectedCallType}
              onChange={(e) => {
                setSelectedCallType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Call Types</option>
              <option value="Proposals">Proposals & Sub-grants</option>
              <option value="Evaluators">Expert Evaluators</option>
              <option value="Mentors">Mentors & Coaches</option>
            </select>

            {/* Sort Order */}
            <select
              className="eu-select"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="deadline_asc">Deadline: Soonest first</option>
              <option value="deadline_desc">Deadline: Furthest first</option>
              <option value="funding_desc">Funding: Highest first</option>
              <option value="newest">Recently Scraped</option>
              <option value="title_asc">Title: A to Z</option>
            </select>
          </div>

          <div className="eu-view-toggles">
            {/* Bookmarks Toggle */}
            <button
              className={`eu-bookmark-toggle-btn ${bookmarks.length > 0 ? 'has-bookmarks' : ''} ${showBookmarksOnly ? 'active' : ''}`}
              onClick={() => setShowBookmarksOnly((prev) => !prev)}
              title="Filter by bookmarked calls"
            >
              <Bookmark size={15} fill={bookmarks.length > 0 ? 'currentColor' : 'none'} />
              <span>Saved ({bookmarks.length})</span>
            </button>

            {bookmarks.length > 0 && (
              <button
                className="eu-view-btn"
                onClick={() => exportBookmarks('markdown')}
                title="Export bookmarked calls as Markdown"
              >
                <Download size={15} />
              </button>
            )}

            {/* Grid vs Table View */}
            <button
              className={`eu-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`eu-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Compact Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Results Section */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid rgba(150,150,150,0.2)',
              borderTopColor: '#3b82f6',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1.25rem'
            }}
          />
          <p style={{ margin: 0 }}>Searching live European Commission and Cascade databases...</p>
        </div>
      ) : error ? (
        <div className="eu-empty-state">
          <div className="eu-empty-icon">
            <AlertCircle size={28} />
          </div>
          <h3>Error loading opportunities</h3>
          <p>{error}</p>
          <button className="eu-details-btn" onClick={fetchOpportunities}>
            Retry
          </button>
        </div>
      ) : displayedOpportunities.length === 0 ? (
        <div className="eu-empty-state">
          <div className="eu-empty-icon">
            <Search size={28} />
          </div>
          <h3>No matching calls found</h3>
          <p>Try broadening your keywords or clearing the active domain and beneficiary filters.</p>
          <button
            className="eu-details-btn"
            onClick={() => {
              setSearch('');
              setSelectedSource('all');
              setSelectedDomain('All Domains');
              setSelectedBeneficiary('All Beneficiaries');
              setSelectedCallType('all');
              setShowBookmarksOnly(false);
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="eu-cards-grid">
          {displayedOpportunities.map((opp) => {
            const isEc = opp.source_key === 'ec_funding';
            const logoSrc = isEc ? '/eu-logo.svg' : opp.cover_image || '/eu-logo.svg';
            const bookmarked = isBookmarked(opp.id);

            return (
              <div key={opp.id} className="eu-opp-card">
                <div className="eu-card-header">
                  <div className="eu-card-brand">
                    <img
                      src={logoSrc}
                      alt={isEc ? 'European Commission' : 'Cascade Funding'}
                      className="eu-card-logo"
                      onError={(e) => {
                        e.target.src = '/eu-logo.svg';
                      }}
                    />
                    <div className="eu-card-source-info">
                      <span className="eu-card-source-name">
                        {isEc ? 'Horizon Europe / SEDIA' : 'Cascade Funding (FSTP)'}
                      </span>
                      <span className="eu-card-call-type">{opp.call_type || 'Proposal'}</span>
                    </div>
                  </div>

                  <button
                    className={`eu-card-bookmark-btn ${bookmarked ? 'saved' : ''}`}
                    onClick={() => toggleBookmark(opp)}
                    title={bookmarked ? 'Remove bookmark' : 'Bookmark call'}
                  >
                    <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <h3 className="eu-card-title" onClick={() => openDetail(opp.id)}>
                  {opp.title}
                </h3>

                <p className="eu-card-desc">
                  {opp.short_description || 'Detailed eligibility criteria, objectives, and application instructions.'}
                </p>

                {/* Metadata Row */}
                <div className="eu-card-meta-row">
                  {opp.funding_amount && (
                    <span className="eu-meta-chip funding">
                      <span>{opp.funding_amount}</span>
                    </span>
                  )}

                  {opp.deadline_date && getDeadlineBadge(opp.deadline_date)}

                  {opp.deadline_date && (
                    <span className="eu-meta-chip">
                      <Calendar size={12} />
                      <span>{new Date(opp.deadline_date).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                {/* Card Footer */}
                <div className="eu-card-footer">
                  <div className="eu-card-tags">
                    {Array.isArray(opp.technologies) &&
                      opp.technologies.slice(0, 2).map((t, i) => (
                        <span key={i} className="eu-domain-tag">
                          {t}
                        </span>
                      ))}
                    {Array.isArray(opp.eligible_applicants) && opp.eligible_applicants.length > 0 && (
                      <span className="eu-domain-tag">{opp.eligible_applicants[0]}</span>
                    )}
                  </div>

                  <button className="eu-details-btn" onClick={() => openDetail(opp.id)}>
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="eu-table-container">
          <table className="eu-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Call Title & Description</th>
                <th>Source Portal</th>
                <th>Funding Amount</th>
                <th>Deadline</th>
                <th>Beneficiaries</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOpportunities.map((opp) => {
                const isEc = opp.source_key === 'ec_funding';
                const bookmarked = isBookmarked(opp.id);

                return (
                  <tr key={opp.id}>
                    <td>
                      <button
                        className={`eu-card-bookmark-btn ${bookmarked ? 'saved' : ''}`}
                        onClick={() => toggleBookmark(opp)}
                      >
                        <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="eu-table-title-cell">
                      <div className="eu-table-title" onClick={() => openDetail(opp.id)}>
                        {opp.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {opp.external_id && <span style={{ marginRight: '0.5rem' }}>ID: {opp.external_id}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`eu-table-source-badge ${isEc ? 'ec' : 'cascade'}`}>
                        {isEc ? 'Horizon Europe' : 'Cascade FSTP'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: opp.funding_amount ? '#10b981' : 'var(--text-muted)' }}>
                        {opp.funding_amount || 'Competitive Grant'}
                      </span>
                    </td>
                    <td>
                      {opp.deadline_date ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span>{new Date(opp.deadline_date).toLocaleDateString()}</span>
                          {getDeadlineBadge(opp.deadline_date)}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Continuous / TBD</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: 200 }}>
                        {Array.isArray(opp.eligible_applicants) && opp.eligible_applicants.length > 0 ? (
                          opp.eligible_applicants.slice(0, 2).map((a, i) => (
                            <span key={i} className="eu-domain-tag">
                              {a}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standard EU</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="eu-details-btn" onClick={() => openDetail(opp.id)}>
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Pagination Bar */}
      {!loading && totalPages > 1 && (
        <div className="eu-pagination">
          <div className="eu-pagination-info">
            Showing <strong>{(page - 1) * limit + 1}</strong> –{' '}
            <strong>{Math.min(page * limit, totalItems)}</strong> of <strong>{totalItems.toLocaleString()}</strong> active calls
          </div>

          <div className="eu-pagination-controls">
            <button className="eu-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              className="eu-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Call Detail Modal */}
      {selectedOpp && (
        <div className="eu-modal-overlay" onClick={closeDetail}>
          <div className="eu-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="eu-modal-header">
              <div className="eu-modal-header-left">
                <img
                  src={selectedOpp.source_key === 'ec_funding' ? '/eu-logo.svg' : selectedOpp.cover_image || '/eu-logo.svg'}
                  alt=""
                  className="eu-modal-logo"
                  onError={(e) => {
                    e.target.src = '/eu-logo.svg';
                  }}
                />
                <div>
                  <h3 className="eu-modal-title">{selectedOpp.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="eu-table-source-badge ec">
                      {selectedOpp.source_key === 'ec_funding' ? 'Horizon Europe / SEDIA' : 'Cascade Funding (FSTP)'}
                    </span>
                    {selectedOpp.external_id && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Call ID: <strong>{selectedOpp.external_id}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button className="eu-modal-close-btn" onClick={closeDetail} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="eu-modal-body">
              {/* Key Metadata Pills */}
              <div className="eu-modal-pills">
                {selectedOpp.funding_amount && (
                  <span className="eu-meta-chip funding" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                    <span>Grant Budget: {selectedOpp.funding_amount}</span>
                  </span>
                )}

                {selectedOpp.deadline_date && (
                  <span className="eu-meta-chip" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                    <Calendar size={14} />
                    <span>Deadline: {new Date(selectedOpp.deadline_date).toLocaleDateString()}</span>
                  </span>
                )}

                {selectedOpp.deadline_date && getDeadlineBadge(selectedOpp.deadline_date)}

                {selectedOpp.call_type && (
                  <span className="eu-meta-chip" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                    <Layers size={14} />
                    <span>{selectedOpp.call_type}</span>
                  </span>
                )}
              </div>

              {/* Technologies & Domain tags */}
              {Array.isArray(selectedOpp.technologies) && selectedOpp.technologies.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    KEY TECHNOLOGIES & DOMAINS:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedOpp.technologies.map((t, i) => (
                      <span key={i} className="eu-domain-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Applicants */}
              {Array.isArray(selectedOpp.eligible_applicants) && selectedOpp.eligible_applicants.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    ELIGIBLE APPLICANTS / BENEFICIARIES:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedOpp.eligible_applicants.map((a, i) => (
                      <span
                        key={i}
                        className="eu-domain-tag"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          background: 'rgba(37, 99, 235, 0.12)',
                          color: '#3b82f6'
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rich Structured Description */}
              <div
                className="eu-modal-content-area"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedOpp.long_description ||
                    `<p style="color: var(--text-muted);">${selectedOpp.short_description || 'No additional details provided.'}</p>`
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="eu-modal-footer">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className={`eu-bookmark-toggle-btn ${isBookmarked(selectedOpp.id) ? 'has-bookmarks' : ''}`}
                  onClick={() => toggleBookmark(selectedOpp)}
                >
                  <Bookmark size={15} fill={isBookmarked(selectedOpp.id) ? 'currentColor' : 'none'} />
                  <span>{isBookmarked(selectedOpp.id) ? 'Saved' : 'Bookmark'}</span>
                </button>

                <button className="eu-bookmark-toggle-btn" onClick={() => copyShareLink(selectedOpp)}>
                  {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
                </button>
              </div>

              {(selectedOpp.permalink || (selectedOpp.links && selectedOpp.links[0])) && (
                <a
                  href={selectedOpp.permalink || selectedOpp.links[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eu-portal-btn"
                >
                  <span>Open Official Submission Portal</span>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Comprehensive Educational SEO Section */}
      <ToolSeoDivider />
      <EuFundingSeo />
    </div>
  );
}
