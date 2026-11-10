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

function formatClientCallId(externalId) {
  const raw = String(externalId || '').trim();
  if (!raw) return '';
  return raw
    .replace(/_?TOPICS_?[a-z]{2}$/i, '')
    .replace(/_?COMPETITIVE[-_]?CALL_?[a-z]{2}$/i, '')
    .replace(/^cascade_/i, 'FSTP-')
    .trim();
}

function cleanClientLongDescHtml(longDescHtml) {
  const raw = String(longDescHtml || '').trim();
  if (!raw) return '';
  const parts = raw.split(/<hr[^>]*>/i);
  if (parts.length <= 1) return raw;
  const BOILERPLATE_HEADINGS = [
    'Destination & Policy Context',
    'Conditions & Eligibility Criteria',
    'Support & Documentation Guidance'
  ];
  const kept = parts.filter((sectionHtml) => {
    const plain = sectionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return false;
    return !BOILERPLATE_HEADINGS.some((h) => plain.startsWith(h));
  });
  return kept.length > 0
    ? kept.join('<hr style="margin: 1.25rem 0; border: 0; border-top: 1px solid rgba(150, 150, 150, 0.15);" />')
    : parts[0];
}

function buildClientGrantFaqs(opp) {
  if (Array.isArray(opp?.faqs) && opp.faqs.length > 0) return opp.faqs;
  const title = (opp?.title || 'this EU funding call').trim();
  const cleanId = opp?.clean_call_id || formatClientCallId(opp?.external_id);
  const isEc = opp?.source_key === 'ec_funding';
  const programName = isEc
    ? 'Horizon Europe (European Commission SEDIA)'
    : 'EU Cascade Funding (Financial Support to Third Parties / FSTP)';
  const budgetText =
    opp?.funding_amount && opp.funding_amount !== 'Not specified' && opp.funding_amount !== 'EUR 0'
      ? opp.funding_amount
      : isEc
        ? 'Competitive European Commission topic budget (see official Work Programme table)'
        : 'Equity-free lump-sum sub-grant (typically €50,000–€200,000 per beneficiary)';
  const deadlineText = opp?.deadline_date
    ? new Date(opp.deadline_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : (opp?.deadline_raw || 'Continuous / Check Official Portal');
  const applicants =
    Array.isArray(opp?.eligible_applicants) && opp.eligible_applicants.length > 0
      ? opp.eligible_applicants.join(', ')
      : 'SMEs, Startups, Universities, and Research Organizations established in EU Member States or Horizon Europe Associated Countries';
  const domains =
    Array.isArray(opp?.domains) && opp.domains.length > 0
      ? opp.domains.join(', ')
      : 'Research, Innovation & Technology Deployment';

  return [
    {
      q: `What is the grant budget and funding instrument for "${title}"${cleanId ? ` (Call #${cleanId})` : ''}?`,
      a: `"${title}"${cleanId ? ` (Call Reference: ${cleanId})` : ''} is published under ${programName} as a ${opp?.call_type || 'Grant Call'}. The indicative funding allocation is ${budgetText}. Funding is provided as non-dilutive, equity-free European grant support subject to the call's grant agreement terms.`
    },
    {
      q: `Who is eligible to apply for "${title}"?`,
      a: `Eligible applicant categories for this call include: ${applicants}. Applicants must be legally established in an eligible European Union Member State or Horizon Europe Associated Country and meet the specific consortium or single-beneficiary admissibility rules detailed on the official submission portal.`
    },
    {
      q: `When is the submission deadline for "${title}" and how do I apply?`,
      a: `The official submission deadline for "${title}" is ${deadlineText}. Proposals must be submitted electronically before the cutoff time via the official ${isEc ? 'European Commission Funding & Tenders Portal (SEDIA)' : 'managing consortium open-call submission portal'} linked in the Grant Key Specifications table above.`
    },
    {
      q: `What are the core objectives and scope of "${title}"?`,
      a: `This call targets ${domains}. Specifically: ${opp?.short_description || 'Review the full Expected Outcomes & Scope section above for technical deliverables and work programme requirements.'}`
    }
  ];
}

function getInitialGrantSlugFromLocation() {
  if (typeof window === 'undefined') return null;
  const pathMatch = window.location.pathname.match(/^\/tools?\/eu-funding-opportunities\/([a-zA-Z0-9_-]+)\/?$/);
  const hashMatch =
    window.location.hash.match(/[?&]call=([a-zA-Z0-9_-]+)/) ||
    window.location.hash.match(/#\/tools?\/eu-funding-opportunities\/([a-zA-Z0-9_-]+)/);
  const slug = pathMatch ? pathMatch[1] : hashMatch ? hashMatch[1] : null;
  return slug && slug !== 'all' ? slug : null;
}

export default function EuFundingOpportunities({ onBack, toolMeta }) {
  const { trackUse, visitorCount } = useToolAnalytics(euFundingManifest.slug, toolMeta);

  // Synchronously detect if we are on a dedicated Grant Call Dossier URL (/tool/eu-funding-opportunities/:grantSlug)
  const [activeGrantSlug, setActiveGrantSlug] = useState(() => getInitialGrantSlugFromLocation());

  // States
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(() => !getInitialGrantSlugFromLocation());
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

  // Synchronously hydrate Grant Call Dossier from SSR window.__INITIAL_GRANT_DATA__ when available
  const [selectedOpp, setSelectedOpp] = useState(() => {
    if (typeof window === 'undefined') return null;
    const initSlug = getInitialGrantSlugFromLocation();
    const ssrOpp = window.__INITIAL_GRANT_DATA__?.opp;
    if (initSlug && ssrOpp && (ssrOpp.slug === initSlug || ssrOpp.external_id === initSlug)) {
      return ssrOpp;
    }
    return null;
  });
  const [relatedGrants, setRelatedGrants] = useState(() => {
    if (typeof window === 'undefined') return [];
    return Array.isArray(window.__INITIAL_GRANT_DATA__?.relatedGrants)
      ? window.__INITIAL_GRANT_DATA__.relatedGrants
      : [];
  });
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

  // Fetch summary KPI stats once (only when viewing the main directory)
  useEffect(() => {
    if (activeGrantSlug) return;
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
  }, [activeGrantSlug]);

  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch directory opportunities whenever filters change (skip when viewing a dedicated grant dossier URL)
  useEffect(() => {
    if (activeGrantSlug) return;
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
  }, [activeGrantSlug, search, selectedSource, selectedDomain, selectedBeneficiary, selectedCallType, sortOrder, page, limit, refreshKey]);

  const fetchOpportunities = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const syncGrantDocumentMeta = useCallback((oppData) => {
    if (typeof document === 'undefined' || !oppData) return;
    const slug = oppData.slug || oppData.id;
    const canonicalUrl = `https://tools.cerilas.com/tool/eu-funding-opportunities/${slug}`;
    const pageTitle = oppData.seo_title || `${oppData.title} | Horizon Europe & EU Grant`;
    const pageDesc = oppData.meta_description || oppData.short_description || '';

    document.title = pageTitle;
    const setMetaTag = (nameOrProp, attr, val) => {
      if (!val) return;
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
    setMetaTag('description', 'name', pageDesc);
    setMetaTag('og:title', 'property', pageTitle);
    setMetaTag('og:description', 'property', pageDesc);
    setMetaTag('og:url', 'property', canonicalUrl);
    setMetaTag('twitter:title', 'name', pageTitle);
    setMetaTag('twitter:description', 'name', pageDesc);
    setMetaTag('twitter:url', 'name', canonicalUrl);
  }, []);

  // Open Dedicated Call Dossier View
  const openDetail = useCallback(async (idOrSlug) => {
    if (!idOrSlug || idOrSlug === 'all') return;
    setActiveGrantSlug(String(idOrSlug));
    if (trackUse) trackUse({ callId: idOrSlug });

    // If SSR already hydrated this exact grant, sync meta and skip redundant fetch
    if (selectedOpp && (selectedOpp.slug === idOrSlug || String(selectedOpp.id) === String(idOrSlug))) {
      syncGrantDocumentMeta(selectedOpp);
      return;
    }

    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/scrapers/opportunities/${idOrSlug}`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setSelectedOpp(json.data);
        const slug = json.data.slug || json.data.id;
        setActiveGrantSlug(String(slug));
        const targetUrl = `/tool/eu-funding-opportunities/${slug}`;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ grantSlug: slug }, '', targetUrl);
        }
        syncGrantDocumentMeta(json.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to load call details:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedOpp, syncGrantDocumentMeta, trackUse]);

  const closeDetail = useCallback(() => {
    setActiveGrantSlug(null);
    setSelectedOpp(null);
    setCopiedLink(false);
    const directoryUrl = 'https://tools.cerilas.com/tool/eu-funding-opportunities';
    if (window.location.pathname !== '/tool/eu-funding-opportunities') {
      window.history.pushState({}, '', '/tool/eu-funding-opportunities');
    }
    document.title = 'EU Funding & Cascade Funding Opportunities (2026) — Live Horizon Europe & FSTP Grants';
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute('href', directoryUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Synchronize browser history and handle deep-linking
  useEffect(() => {
    const handlePopState = () => {
      const slug = getInitialGrantSlugFromLocation();
      if (slug) {
        openDetail(slug);
      } else {
        setActiveGrantSlug(null);
        setSelectedOpp(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [openDetail]);

  // Initial deep-link check on mount (only fetches if SSR did not already populate selectedOpp)
  useEffect(() => {
    if (activeGrantSlug) {
      if (selectedOpp && (selectedOpp.slug === activeGrantSlug || selectedOpp.external_id === activeGrantSlug)) {
        syncGrantDocumentMeta(selectedOpp);
      } else {
        openDetail(activeGrantSlug);
      }
    }
  }, []);

  const copyShareLink = (opp) => {
    const slug = opp.slug || opp.id;
    const url = `https://tools.cerilas.com/tool/eu-funding-opportunities/${slug}`;
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

  const formatTotalGrants = (amount) => {
    const num = Number(amount);
    if (!num || isNaN(num) || num <= 0) return '€1.2B+';
    if (num >= 1e9) {
      const b = num / 1e9;
      return `€${b.toFixed(1).replace(/\.0$/, '')}B+`;
    }
    if (num >= 1e6) {
      return `€${(num / 1e6).toFixed(0)}M+`;
    }
    return `€${num.toLocaleString()}`;
  };

  // Dedicated Full-Page Grant Call Dossier View (/tool/eu-funding-opportunities/:grantSlug)
  if (activeGrantSlug) {
    const cleanId = selectedOpp ? (selectedOpp.clean_call_id || formatClientCallId(selectedOpp.external_id)) : '';
    const isEc = selectedOpp?.source_key === 'ec_funding';
    const sourceLabel = isEc ? 'Horizon Europe (SEDIA)' : 'Cascade Funding (FSTP)';
    const deadlineFormatted = selectedOpp?.deadline_date
      ? new Date(selectedOpp.deadline_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : (selectedOpp?.deadline_raw || 'Open Call');
    const budgetFormatted = selectedOpp?.funding_amount || 'See Official Call Budget';
    const cleanedLongHtml = selectedOpp ? cleanClientLongDescHtml(selectedOpp.long_description) : '';
    const grantFaqs = selectedOpp ? buildClientGrantFaqs(selectedOpp) : [];
    const portalHref = selectedOpp?.permalink || (Array.isArray(selectedOpp?.links) ? selectedOpp.links[0] : null);

    return (
      <div className="c-tool-page-container eu-funding-root">
        {/* Breadcrumb Navigation matching SSR BreadcrumbList */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem'
          }}
        >
          <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Cerilas Tools</a>
          <span>/</span>
          <a href="/research-tools" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Research Tools</a>
          <span>/</span>
          <a
            href="/tool/eu-funding-opportunities"
            onClick={(e) => {
              e.preventDefault();
              closeDetail();
            }}
            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
          >
            EU &amp; Cascade Funding
          </a>
          {selectedOpp && (
            <>
              <span>/</span>
              <span aria-current="page" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                {selectedOpp.title}{cleanId ? ` (#${cleanId})` : ''}
              </span>
            </>
          )}
        </nav>

        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a
            href="/tool/eu-funding-opportunities"
            onClick={(e) => {
              e.preventDefault();
              closeDetail();
            }}
            className="eu-page-btn"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ChevronLeft size={16} />
            <span>Browse All Open EU &amp; Cascade Funding Calls</span>
          </a>

          {selectedOpp && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className={`eu-bookmark-toggle-btn ${isBookmarked(selectedOpp.id) ? 'has-bookmarks' : ''}`}
                onClick={() => toggleBookmark(selectedOpp)}
              >
                <Bookmark size={15} fill={isBookmarked(selectedOpp.id) ? 'currentColor' : 'none'} />
                <span>{isBookmarked(selectedOpp.id) ? 'Saved to Shortlist' : 'Bookmark Call'}</span>
              </button>

              <button className="eu-bookmark-toggle-btn" onClick={() => copyShareLink(selectedOpp)}>
                {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copiedLink ? 'Link Copied' : 'Share Call URL'}</span>
              </button>

              {portalHref && (
                <a
                  href={portalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eu-portal-btn"
                >
                  <span>Official Submission Portal</span>
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          )}
        </div>

        {loadingDetail && !selectedOpp ? (
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
            <p style={{ margin: 0 }}>Loading EU grant call dossier...</p>
          </div>
        ) : !selectedOpp ? (
          <div className="eu-empty-state">
            <div className="eu-empty-icon">
              <AlertCircle size={28} />
            </div>
            <h3>Grant Call Not Found</h3>
            <p>This funding opportunity may have closed or moved.</p>
            <button className="eu-details-btn" onClick={closeDetail}>
              View All Active EU &amp; Cascade Calls
            </button>
          </div>
        ) : (
          <article
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '2rem',
              display: 'grid',
              gap: '2rem'
            }}
          >
            {/* Dossier Header with Unique H1 matching SSR 1:1 */}
            <header style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <span className={`eu-table-source-badge ${isEc ? 'ec' : 'cascade'}`}>
                  {sourceLabel}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: selectedOpp.status === 'open' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(148, 163, 184, 0.16)',
                    color: selectedOpp.status === 'open' ? '#10b981' : 'var(--text-muted)'
                  }}
                >
                  <CheckCircle2 size={12} />
                  {(selectedOpp.status || 'open').toUpperCase()}
                </span>
                {cleanId && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Call Reference: #{cleanId}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.45rem, 2.5vw, 2.05rem)', fontWeight: 700, lineHeight: 1.25, margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
                {selectedOpp.title}
                {cleanId && (
                  <span style={{ fontSize: '1.05rem', fontWeight: 500, color: '#3b82f6', marginLeft: '0.5rem' }}>
                    (Call #{cleanId})
                  </span>
                )}
              </h1>

              {selectedOpp.short_description && (
                <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 }}>
                  {selectedOpp.short_description}
                </p>
              )}
            </header>

            {/* Key Specifications Table */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
                Grant Key Specifications
              </h2>
              <div className="eu-table-container">
                <table className="eu-table">
                  <tbody>
                    {cleanId && (
                      <tr>
                        <th style={{ width: '240px', fontWeight: 600 }}>Call Reference ID</th>
                        <td><strong>#{cleanId}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({selectedOpp.external_id})</span></td>
                      </tr>
                    )}
                    <tr>
                      <th style={{ width: '240px', fontWeight: 600 }}>Funding Program &amp; Instrument</th>
                      <td>{sourceLabel} — <strong>{selectedOpp.call_type || 'Grant Call'}</strong></td>
                    </tr>
                    <tr>
                      <th style={{ fontWeight: 600 }}>Indicative Grant Budget</th>
                      <td>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
                          {budgetFormatted}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th style={{ fontWeight: 600 }}>Submission Deadline</th>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <strong>{deadlineFormatted}</strong>
                          {selectedOpp.deadline_date && getDeadlineBadge(selectedOpp.deadline_date)}
                        </div>
                      </td>
                    </tr>
                    {Array.isArray(selectedOpp.eligible_applicants) && selectedOpp.eligible_applicants.length > 0 && (
                      <tr>
                        <th style={{ fontWeight: 600 }}>Eligible Beneficiaries</th>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {selectedOpp.eligible_applicants.map((a, idx) => (
                              <span key={idx} className="eu-domain-tag" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {Array.isArray(selectedOpp.domains) && selectedOpp.domains.length > 0 && (
                      <tr>
                        <th style={{ fontWeight: 600 }}>Target Domains</th>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {selectedOpp.domains.map((d, idx) => (
                              <span key={idx} className="eu-domain-tag">{d}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {Array.isArray(selectedOpp.technologies) && selectedOpp.technologies.length > 0 && (
                      <tr>
                        <th style={{ fontWeight: 600 }}>Key Technologies</th>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {selectedOpp.technologies.map((t, idx) => (
                              <span key={idx} className="eu-domain-tag">{t}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {portalHref && (
                      <tr>
                        <th style={{ fontWeight: 600 }}>Official Call Portal</th>
                        <td>
                          <a
                            href={portalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span>Open Official European Commission / Consortium Notice</span>
                            <ExternalLink size={14} />
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Full Cleaned Call Scope & Expected Outcomes */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
                Expected Outcomes, Scope &amp; Call Description
              </h2>
              <div
                className="eu-modal-content-area"
                style={{
                  background: 'rgba(148, 163, 184, 0.04)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    cleanedLongHtml ||
                    `<p style="color: var(--text-muted); margin: 0;">${selectedOpp.short_description || 'Refer to the official submission portal for complete call work programme annexes.'}</p>`
                }}
              />
            </section>

            {/* Call-Specific Frequently Asked Questions */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
                Frequently Asked Questions: {selectedOpp.title}
              </h2>
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {grantFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem',
                      background: 'rgba(148, 163, 184, 0.03)'
                    }}
                  >
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: '0 0 0.45rem 0', color: 'var(--text-main)' }}>
                      {faq.q}
                    </h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0, color: 'var(--text-muted)' }}>
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Proposal Preparation Toolkit Banner */}
            <section
              style={{
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '1.25rem',
                background: 'rgba(59, 130, 246, 0.05)'
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: 'var(--text-main)' }}>
                Prepare Your EU Grant Proposal
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Verify your project&apos;s expected maturity with our free{' '}
                <a href="/tool/trl-calculator" style={{ color: '#3b82f6', fontWeight: 600 }}>
                  TRL Calculator (Horizon Europe TRL 1–9)
                </a>
                , calculate work-package statistical power with the{' '}
                <a href="/tool/sample-size-calculator" style={{ color: '#3b82f6', fontWeight: 600 }}>
                  Sample Size Calculator
                </a>
                , or{' '}
                <a
                  href="/tool/eu-funding-opportunities"
                  onClick={(e) => {
                    e.preventDefault();
                    closeDetail();
                  }}
                  style={{ color: '#3b82f6', fontWeight: 600 }}
                >
                  browse all open EU &amp; Cascade Funding Opportunities &rarr;
                </a>
              </p>
            </section>

            {/* Related Open EU & Cascade Funding Calls */}
            {relatedGrants.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
                  Related Open EU &amp; Cascade Funding Calls
                </h2>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {relatedGrants.map((g, idx) => {
                    const gDl = g.deadline_date
                      ? new Date(g.deadline_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : (g.deadline_raw || 'Open');
                    return (
                      <a
                        key={g.slug || idx}
                        href={`/tool/eu-funding-opportunities/${g.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          openDetail(g.slug);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--card-border)',
                          background: 'rgba(148, 163, 184, 0.03)',
                          textDecoration: 'none',
                          color: 'var(--text-main)'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#3b82f6' }}>{g.title}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {g.funding_amount ? `${g.funding_amount} · ` : ''}Deadline: {gDl}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </article>
        )}
      </div>
    );
  }

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
              {formatTotalGrants(stats?.total_funding_amount)}
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
              {stats?.open_count && <span className="eu-source-tab-count">{stats.open_count}</span>}
            </button>
            <button
              className={`eu-source-tab ${selectedSource === 'ec_funding' ? 'active' : ''}`}
              onClick={() => {
                setSelectedSource('ec_funding');
                setPage(1);
              }}
            >
              Horizon Europe (SEDIA)
              <span className="eu-source-tab-count">{stats?.ec_open_count || '560+'}</span>
            </button>
            <button
              className={`eu-source-tab ${selectedSource === 'cascadefunding' ? 'active' : ''}`}
              onClick={() => {
                setSelectedSource('cascadefunding');
                setPage(1);
              }}
            >
              Cascade Funding (FSTP)
              <span className="eu-source-tab-count">{stats?.cascade_open_count || '42'}</span>
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
              <option value="ria">Research & Innovation (RIA)</option>
              <option value="ia">Innovation Actions (IA)</option>
              <option value="cascade">Cascade & Sub-grants (FSTP)</option>
              <option value="csa">Coordination & Support (CSA)</option>
              <option value="lump_sum">Lump Sum & Project Grants</option>
              <option value="msca">Doctoral & MSCA Fellowships</option>
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
              <option value="opening_desc">Opening Date: Newest first</option>
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

                <a
                  href={`/tool/eu-funding-opportunities/${opp.slug || opp.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    openDetail(opp.slug || opp.id);
                  }}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h3 className="eu-card-title">
                    {opp.title}
                  </h3>
                </a>

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

                  <a
                    href={`/tool/eu-funding-opportunities/${opp.slug || opp.id}`}
                    className="eu-details-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      openDetail(opp.slug || opp.id);
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    View Details
                  </a>
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
                      <a
                        href={`/tool/eu-funding-opportunities/${opp.slug || opp.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          openDetail(opp.slug || opp.id);
                        }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div className="eu-table-title">
                          {opp.title}
                        </div>
                      </a>
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
                      <a
                        href={`/tool/eu-funding-opportunities/${opp.slug || opp.id}`}
                        className="eu-details-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          openDetail(opp.slug || opp.id);
                        }}
                        style={{ textDecoration: 'none' }}
                      >
                        Details
                      </a>
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
