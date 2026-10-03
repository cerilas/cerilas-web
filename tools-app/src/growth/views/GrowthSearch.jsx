import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  BarChart3, 
  Zap, 
  Target, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  ExternalLink, 
  Layers, 
  Filter, 
  Calendar, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Loader2, 
  Settings,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  Flame,
  Check,
  HelpCircle,
  Radio
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthSearchSkeleton } from '../components/GrowthSkeleton';

const DATE_RANGE_OPTIONS = [
  { id: '1d', label: 'Last 1 Day', badge: 'Yesterday' },
  { id: '3d', label: 'Last 3 Days', badge: '72 hours' },
  { id: '7d', label: 'Last 1 Week', badge: '7 days' },
  { id: '28d', label: 'Last 1 Month', badge: '28 days' },
  { id: '3m', label: 'Last 3 Months', badge: '90 days' },
  { id: '6m', label: 'Last 6 Months', badge: '180 days' },
  { id: 'all', label: 'All Time', badge: '16 Months (Max)' },
  { id: 'custom', label: 'Custom Date Range...', badge: 'Custom' }
];

// Real SEO Striking Distance and Additional Traffic Potential Computation
const computeQueryOpportunity = (item) => {
  const pos = parseFloat(item?.position) || 0;
  const imp = Number(item?.impressions) || 0;
  const clk = Number(item?.clicks) || 0;
  const ctrVal = parseFloat(String(item?.ctr || '0').replace('%', '')) || 0;

  // Benchmark: Google organic SERP benchmark average CTR for top 3 positions is ~14% (Advanced Web Ranking).
  // 1. Position must be between 4.0 and 15.0 (bottom of page 1 / top of page 2).
  // 2. Requires at least 30 impressions for statistical significance.
  if (pos < 4.0 || pos > 15.0 || imp < 30) {
    return {
      isOpportunity: false,
      potentialClicks: 0,
      potentialBadge: null,
      actionHint: imp < 30 ? 'Insufficient volume (<30 impressions)' : 'Stable ranking'
    };
  }

  const expectedTop3Clicks = Math.round(imp * 0.14);
  const gain = Math.max(0, expectedTop3Clicks - clk);

  if (gain < 3) {
    return {
      isOpportunity: false,
      potentialClicks: 0,
      potentialBadge: null,
      actionHint: 'CTR Peaked / Stable'
    };
  }

  let actionHint = 'Top 3 opportunity: Add internal links & enrich content';
  if (ctrVal < 2.0 && pos <= 10.0) {
    actionHint = 'Low CTR: Improve title tag and meta description';
  } else if (pos > 10.0) {
    actionHint = 'Page 2: Comprehensive content update to reach page 1';
  }

  return {
    isOpportunity: true,
    potentialClicks: gain,
    potentialBadge: `+${gain} click potential`,
    actionHint
  };
};

function generateSmoothCurve(pts, minY, maxY) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    if (minY !== undefined && maxY !== undefined) {
      cp1y = Math.max(minY, Math.min(maxY, cp1y));
      cp2y = Math.max(minY, Math.min(maxY, cp2y));
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function GrowthSearch() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('queries'); // queries, striking, pages, cannibalization, breakdown, health
  const [searchFilter, setSearchFilter] = useState('');
  const [showOpportunityCol, setShowOpportunityCol] = useState(true);
  const [querySortField, setQuerySortField] = useState('clicks');
  const [querySortDirection, setQuerySortDirection] = useState('desc');
  const [queryPage, setQueryPage] = useState(1);
  const [queryPageSize, setQueryPageSize] = useState(50);

  const [searchData, setSearchData] = useState({
    connected: false,
    siteUrl: '',
    syncedAt: null,
    totals: { clicks: 0, impressions: 0, ctr: '0%', position: '0' },
    topQueries: [],
    strikingQueries: [],
    topPages: [],
    dailyTrend: [],
    devices: [],
    countries: [],
    cannibalization: [],
    searchTypes: { web: { clicks: 0, impressions: 0, ctr: '0%' }, image: { clicks: 0, impressions: 0 } },
    brandSplit: { brandClicks: 0, brandImpressions: 0, nonBrandClicks: 0, nonBrandImpressions: 0, brandClicksShare: 0 },
    urlInspection: null
  });

  const [activeChartMetric, setActiveChartMetric] = useState('clicks'); // 'clicks' | 'impressions'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);
  const [inspectInputUrl, setInspectInputUrl] = useState('');
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState('');

  // Date Range State
  const [dateRange, setDateRange] = useState('28d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [rangeSyncing, setRangeSyncing] = useState(false);
  const dateDropdownRef = useRef(null);

  // Close date menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateMenuOpen(false);
      }
    };
    if (isDateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateMenuOpen]);

  const currentRangeLabel = useMemo(() => {
    if (dateRange === 'custom') {
      if (customStartDate && customEndDate) {
        return `${customStartDate} → ${customEndDate}`;
      }
      return 'Custom Date Range';
    }
    const found = DATE_RANGE_OPTIONS.find(o => o.id === dateRange);
    return found ? found.label : 'Last 28 Days';
  }, [dateRange, customStartDate, customEndDate]);

  const fetchPerformance = useCallback(async (targetRange = dateRange, cStart = customStartDate, cEnd = customEndDate) => {
    if (!activeWorkspace?.id || !token) return;
    try {
      setRangeSyncing(true);
      let url = `/api/growth/workspaces/${activeWorkspace.id}/search-performance?range=${encodeURIComponent(targetRange)}`;
      if (targetRange === 'custom' && cStart && cEnd) {
        url += `&startDate=${encodeURIComponent(cStart)}&endDate=${encodeURIComponent(cEnd)}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchData(data);
        if (data.dateRange) setDateRange(data.dateRange.startsWith('custom') ? 'custom' : data.dateRange);
        if (data.startDate && typeof data.startDate === 'string' && !cStart) setCustomStartDate(data.startDate.split('T')[0]);
        if (data.endDate && typeof data.endDate === 'string' && !cEnd) setCustomEndDate(data.endDate.split('T')[0]);
        if (data.siteUrl && !inspectInputUrl) {
          const defaultInspect = data.siteUrl.startsWith('sc-domain:')
            ? 'https://' + data.siteUrl.replace('sc-domain:', '')
            : data.siteUrl;
          setInspectInputUrl(defaultInspect);
        }
      }
    } catch (err) {
      console.error('Search performance fetch error:', err);
    } finally {
      setRangeSyncing(false);
    }
  }, [activeWorkspace?.id, token, dateRange, customStartDate, customEndDate, inspectInputUrl]);

  useEffect(() => {
    setLoading(true);
    fetchPerformance().finally(() => {
      setLoading(false);
    });
  }, [activeWorkspace?.id, fetchPerformance]);

  useEffect(() => {
    setQueryPage(1);
  }, [searchFilter, activeTabSub]);

  const handleSelectRange = (optId) => {
    if (optId === 'custom') {
      setDateRange('custom');
      if (!customStartDate || !customEndDate) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
        setCustomStartDate(twoWeeksAgo);
        setCustomEndDate(yesterday);
      }
      return;
    }
    setDateRange(optId);
    setIsDateMenuOpen(false);
    fetchPerformance(optId);
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) return;
    setIsDateMenuOpen(false);
    fetchPerformance('custom', customStartDate, customEndDate);
  };

  const handleManualSync = async () => {
    if (!activeWorkspace?.id || !token) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/sync`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRange,
          startDate: dateRange === 'custom' ? customStartDate : undefined,
          endDate: dateRange === 'custom' ? customEndDate : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchPerformance(dateRange, customStartDate, customEndDate);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!activeWorkspace?.id) return;
    setConnectingGoogle(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to get Google authorization link');

      const width = 560;
      const height = 680;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      const popup = window.open(
        data.url,
        'GoogleIntegrationAuth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GROWTH_GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          await fetchPerformance();
          setConnectingGoogle(false);
        } else if (event.data?.type === 'GROWTH_GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          setConnectingGoogle(false);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnectingGoogle(false);
        }
      }, 1000);
    } catch (err) {
      console.error('Google connect error:', err);
      setConnectingGoogle(false);
    }
  };

  const handleLiveInspect = async (e) => {
    if (e) e.preventDefault();
    if (!inspectInputUrl.trim() || !activeWorkspace?.id || !token) return;
    setInspecting(true);
    setInspectError('');
    setInspectResult(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/inspect-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: inspectInputUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'URL inspection failed.');
      }
      setInspectResult(data.inspection);
    } catch (err) {
      setInspectError(err.message || 'An error occurred during inspection.');
    } finally {
      setInspecting(false);
    }
  };

  const handleQuerySort = (field) => {
    if (querySortField === field) {
      setQuerySortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setQuerySortField(field);
      setQuerySortDirection(field === 'position' || field === 'query' ? 'asc' : 'desc');
    }
    setQueryPage(1);
  };

  const renderSortIcon = (field) => {
    if (querySortField !== field) {
      return <ArrowUpDown size={12} className="sort-icon is-idle" />;
    }
    return querySortDirection === 'asc' ? (
      <ArrowUp size={12} className="sort-icon is-active" />
    ) : (
      <ArrowDown size={12} className="sort-icon is-active" />
    );
  };

  if (loading) {
    return <GrowthSearchSkeleton />;
  }

  const isConnected = !!searchData.connected;
  const totals = searchData.totals || { clicks: 0, impressions: 0, ctr: '0%', position: '0' };
  const topQueries = searchData.topQueries || [];
  const strikingQueries = searchData.strikingQueries || [];
  const topPages = searchData.topPages || [];
  const dailyTrend = searchData.dailyTrend || [];
  const devices = searchData.devices || [];
  const countries = searchData.countries || [];
  const cannibalization = searchData.cannibalization || [];
  const searchTypes = searchData.searchTypes || { web: { clicks: totals.clicks || 0, impressions: totals.impressions || 0, ctr: '0%' }, image: { clicks: 0, impressions: 0 } };
  const brandSplit = searchData.brandSplit || { brandClicks: 0, brandImpressions: 0, nonBrandClicks: 0, nonBrandImpressions: 0, brandClicksShare: 0 };
  const urlInspection = searchData.urlInspection || null;

  // Real SEO Striking Distance filter: 4th-15th position and 30+ impressions
  const computedStrikingQueries = topQueries
    .filter(q => computeQueryOpportunity(q).isOpportunity)
    .sort((a, b) => (Number(b.impressions) || 0) - (Number(a.impressions) || 0));

  const currentQueriesSource = activeTabSub === 'striking' 
    ? (computedStrikingQueries.length > 0 ? computedStrikingQueries : strikingQueries.filter(q => (Number(q.impressions) || 0) >= 30))
    : topQueries;

  const filteredQueries = currentQueriesSource.filter(q => 
    (q.query || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const sortedQueries = [...filteredQueries].sort((a, b) => {
    let cmp = 0;
    if (querySortField === 'query') {
      cmp = (a.query || '').localeCompare(b.query || '', 'tr', { sensitivity: 'base' });
    } else if (querySortField === 'clicks') {
      cmp = (Number(a.clicks) || 0) - (Number(b.clicks) || 0);
    } else if (querySortField === 'impressions') {
      cmp = (Number(a.impressions) || 0) - (Number(b.impressions) || 0);
    } else if (querySortField === 'ctr') {
      const ctrA = parseFloat(String(a.ctr || '0').replace('%', '')) || 0;
      const ctrB = parseFloat(String(b.ctr || '0').replace('%', '')) || 0;
      cmp = ctrA - ctrB;
    } else if (querySortField === 'position') {
      cmp = (parseFloat(a.position) || 0) - (parseFloat(b.position) || 0);
    } else if (querySortField === 'potential') {
      const oppA = computeQueryOpportunity(a);
      const oppB = computeQueryOpportunity(b);
      cmp = oppA.potentialClicks - oppB.potentialClicks;
    }
    return querySortDirection === 'asc' ? cmp : -cmp;
  });

  const shouldPaginate = sortedQueries.length >= 50;
  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(sortedQueries.length / queryPageSize)) : 1;
  const currentPage = Math.min(Math.max(queryPage, 1), totalPages);
  const startIndex = (currentPage - 1) * queryPageSize;
  const displayedQueries = shouldPaginate
    ? sortedQueries.slice(startIndex, startIndex + queryPageSize)
    : sortedQueries;

  const renderPaginationPages = (currPage, totalPgs, onSelect) => {
    if (totalPgs <= 7) {
      return Array.from({ length: totalPgs }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          type="button"
          className={`pagination-page-btn ${p === currPage ? 'is-active' : ''}`}
          onClick={() => onSelect(p)}
        >
          {p}
        </button>
      ));
    }

    const pages = [1];
    if (currPage > 3) pages.push('dots1');
    const start = Math.max(2, currPage - 1);
    const end = Math.min(totalPgs - 1, currPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currPage < totalPgs - 2) pages.push('dots2');
    if (totalPgs > 1) pages.push(totalPgs);

    return pages.map(item => {
      if (typeof item === 'string') {
        return <span key={item} className="pagination-ellipsis">…</span>;
      }
      return (
        <button
          key={item}
          type="button"
          className={`pagination-page-btn ${item === currPage ? 'is-active' : ''}`}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      );
    });
  };

  // SVG Trend Chart Geometry Calculations
  const chartW = 900;
  const chartH = 180;
  const padX = 40;
  const padY = 25;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const maxVal = Math.max(...dailyTrend.map(d => Number(d[activeChartMetric]) || 0), 10);
  const chartPoints = dailyTrend.map((d, idx) => {
    const x = padX + (idx / Math.max(1, dailyTrend.length - 1)) * innerW;
    const y = chartH - padY - ((Number(d[activeChartMetric]) || 0) / maxVal) * innerH;
    return { 
      x, 
      y, 
      xPercent: (x / chartW) * 100,
      yPercent: (y / chartH) * 100,
      data: d 
    };
  });

  const pathLine = generateSmoothCurve(chartPoints, padY, chartH - padY);
  const pathArea = chartPoints.length > 0
    ? `${pathLine} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${chartH - padY} L ${chartPoints[0].x.toFixed(1)} ${chartH - padY} Z`
    : '';

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge={isConnected ? "Google Search Console Live Telemetry" : "Search Console Integration Mode"}
        badgeIcon={Activity}
        title="Google Organic Search & Ranking Intelligence"
        subtitle={isConnected 
          ? `Live synced real queries, page 1 opportunities and clicks from your Google Search Console property (${searchData.siteUrl}).` 
          : "Real organic queries, page 1 opportunities and click volumes from Google search results."}
        coverImage="/growth-covers/seo-cover.jpg"
        actions={
          isConnected ? (
            <>
              <div className="growth-date-picker-wrap" ref={dateDropdownRef}>
                <button
                  type="button"
                  className={`growth-date-trigger-btn ${isDateMenuOpen ? 'is-open' : ''}`}
                  onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                  title="Change Google Search Console data date range"
                >
                  {rangeSyncing ? (
                    <Loader2 size={13} className="auth-spinner text-primary" />
                  ) : (
                    <Calendar size={13} className="text-primary" />
                  )}
                  <span>{currentRangeLabel}</span>
                  <ChevronDown size={13} style={{ transform: isDateMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.7 }} />
                </button>

                {isDateMenuOpen && (
                  <div className="growth-date-dropdown">
                    <div className="growth-date-dropdown-header">
                      <span>Time Range</span>
                      {rangeSyncing && <Loader2 size={12} className="auth-spinner text-primary" />}
                    </div>

                    <div className="growth-date-options-list">
                      {DATE_RANGE_OPTIONS.map(opt => {
                        const isActive = dateRange === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={`growth-date-option ${isActive ? 'active' : ''}`}
                            onClick={() => handleSelectRange(opt.id)}
                          >
                            <div className="date-option-left">
                              <Clock size={13} style={{ opacity: isActive ? 1 : 0.45 }} />
                              <span>{opt.label}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="date-option-badge">{opt.badge}</span>
                              {isActive && <Check size={14} color="#38bdf8" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {dateRange === 'custom' && (
                      <form onSubmit={handleApplyCustomDate} className="growth-date-custom-panel">
                        <div className="custom-date-row">
                          <label className="custom-date-label">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            max={customEndDate || new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="custom-date-input"
                            required
                          />
                        </div>
                        <div className="custom-date-row">
                          <label className="custom-date-label">End Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            min={customStartDate}
                            max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="custom-date-input"
                            required
                          />
                        </div>
                        <div className="custom-date-actions">
                          <button
                            type="submit"
                            disabled={!customStartDate || !customEndDate || rangeSyncing}
                            className="custom-date-apply-btn"
                          >
                            {rangeSyncing ? 'Loading...' : 'Apply Range'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <div 
                className="growth-gsc-compact-status" 
                title={`Google Search Console property: ${searchData.siteUrl}${searchData.syncedAt ? ` • Last synced: ${new Date(searchData.syncedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
              >
                <span className="gsc-live-dot" />
                <span className="gsc-compact-site">{searchData.siteUrl}</span>
                {searchData.syncedAt && (
                  <span className="gsc-compact-time">
                    {new Date(searchData.syncedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <button 
                type="button" 
                disabled={syncing}
                onClick={handleManualSync}
                className="growth-secondary-btn"
                title="Instantly refresh Google Search Console data"
              >
                <RefreshCw size={13} className={syncing ? 'auth-spinner' : ''} />
                <span>{syncing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </>
          ) : null
        }
      />

      {/* Main Content: If Unconnected show ONLY Connection CTA Card; If Connected show 4 Metric Cards + real tables & charts */}
      {!isConnected ? (
        <div className="growth-panel-card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            margin: '0 auto 18px',
            borderRadius: 16,
            background: 'rgba(66, 133, 244, 0.1)',
            border: '1px solid rgba(66, 133, 244, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '8px' }}>
            No Google Search Console Connection Found
          </h3>

          <p style={{ maxWidth: 520, margin: '0 auto 24px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Organic keywords, click volumes, time-series charts and Googlebot audits for this brand are only shown when your verified Google Search Console property is connected.
          </p>

          <button
            type="button"
            disabled={connectingGoogle}
            onClick={handleConnectGoogle}
            className="growth-primary-btn"
            style={{ margin: '0 auto', display: 'inline-flex' }}
          >
            {connectingGoogle ? (
              <Loader2 size={15} className="auth-spinner" />
            ) : (
              <RefreshCw size={15} className="gsc-sync-spin-icon" />
            )}
            <span>{connectingGoogle ? 'Connecting...' : 'Connect Search Console with Google'}</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      ) : (
        <>
          {/* 4 Core Search Metrics Cards */}
          <div className="growth-stats-grid four-col">
            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Clicks (Clicks)</span>
                <Search size={16} className="stat-card-icon text-primary" />
              </div>
              <div className="stat-card-value text-primary">
                {Number(totals.clicks || 0).toLocaleString('en-US')}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Organic Search Clicks</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Impressions</span>
                <BarChart3 size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value">
                {Number(totals.impressions || 0).toLocaleString('en-US')}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Appearances in Search Results</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Average Click-Through Rate (CTR)</span>
                <Target size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value">
                {String(totals.ctr || '0%')}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Overall Click Performance</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Ortalama Position (Rank)</span>
                <TrendingUp size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value">
                {`#${String(totals.position || '0.0')}`}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Weighted Position</span>
              </div>
            </div>
          </div>

          {/* Daily Trend Interactive SVG Chart */}
          {dailyTrend.length > 0 && (
            <div className="growth-chart-card">
              <div className="growth-chart-header">
                <div className="growth-chart-title-wrap">
                  <Activity size={16} className="text-primary" />
                  <span className="growth-chart-title">{currentRangeLabel} Performans & Trend Zaman Serisi</span>
                </div>

                <div className="growth-chart-legend">
                  <div 
                    className="chart-legend-item"
                    onClick={() => setActiveChartMetric('clicks')}
                    style={{ opacity: activeChartMetric === 'clicks' ? 1 : 0.45 }}
                  >
                    <span className="legend-dot clicks" />
                    <span>Clicks ({activeChartMetric === 'clicks' ? 'Selected' : 'View'})</span>
                  </div>
                  <div 
                    className="chart-legend-item"
                    onClick={() => setActiveChartMetric('impressions')}
                    style={{ opacity: activeChartMetric === 'impressions' ? 1 : 0.45 }}
                  >
                    <span className="legend-dot impressions" />
                    <span>Impressions ({activeChartMetric === 'impressions' ? 'Selected' : 'View'})</span>
                  </div>
                </div>
              </div>

              <div className="growth-chart-svg-container">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="growth-chart-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="chartGradImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline */}
                  <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} className="chart-grid-line" />
                  <line x1={padX} y1={chartH / 2} x2={chartW - padX} y2={chartH / 2} className="chart-grid-line" />
                  <line x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY} className="chart-grid-line" />

                  {/* Gradient Area Fill */}
                  <path 
                    d={pathArea} 
                    fill={activeChartMetric === 'clicks' ? "url(#chartGradClicks)" : "url(#chartGradImpressions)"} 
                  />

                  {/* Main Line */}
                  <path 
                    d={pathLine} 
                    fill="none" 
                    stroke={activeChartMetric === 'clicks' ? "#38bdf8" : "#818cf8"} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  </svg>

                  {/* Circular Points Layer - rendered in pure HTML so they are always 100% round and crisp */}
                  <div className="chart-points-html-overlay">
                    {chartPoints.map((pt, i) => {
                      const isHovered = hoveredTrendPoint && hoveredTrendPoint.data?.date === pt.data?.date;
                      const showDot = chartPoints.length <= 35 || isHovered;
                      if (!showDot) return null;

                      return (
                        <div
                          key={i}
                          className={`chart-static-dot ${isHovered ? 'is-active' : ''}`}
                          style={{
                            left: `${pt.xPercent.toFixed(2)}%`,
                            top: `${pt.yPercent.toFixed(2)}%`,
                            borderColor: activeChartMetric === 'clicks' ? '#38bdf8' : '#818cf8',
                            backgroundColor: isHovered ? '#ffffff' : '#080d1a',
                            boxShadow: isHovered
                              ? `0 0 0 3px #080d1a, 0 0 0 6px ${activeChartMetric === 'clicks' ? '#38bdf8' : '#818cf8'}, 0 0 16px rgba(56, 189, 248, 0.45)`
                              : `0 0 4px rgba(56, 189, 248, 0.35)`
                          }}
                        />
                      );
                    })}
                  </div>

                {hoveredTrendPoint && (
                  <div 
                    className="chart-tooltip"
                    style={{
                      left: `${(hoveredTrendPoint.x / chartW) * 100}%`,
                      top: `${(hoveredTrendPoint.y / chartH) * 100}%`
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '2px' }}>
                      {hoveredTrendPoint.data.date}
                    </div>
                    <div>Clicks: <strong>{hoveredTrendPoint.data.clicks}</strong></div>
                    <div>Impressions: <strong>{hoveredTrendPoint.data.impressions}</strong></div>
                    <div>CTR: <strong>{hoveredTrendPoint.data.ctr}</strong></div>
                    <div>Avg. Position: <strong>#{hoveredTrendPoint.data.position}</strong></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand vs Non-Brand & Search Appearance Overview Cards */}
          <div className="gsc-meta-grid">
            {/* Brand vs Non-Brand Split */}
            <div className="gsc-meta-card">
              <div className="meta-card-head">
                <span className="meta-card-title">
                  <Target size={15} color="#38bdf8" />
                  <span>Branded vs Generic Search</span>
                </span>
                <span className="ctr-badge">{brandSplit.brandClicksShare || 0}% Branded</span>
              </div>

              <div className="meta-split-bar">
                <div 
                  className="meta-split-fill brand" 
                  style={{ width: `${Math.min(100, Math.max(5, brandSplit.brandClicksShare || 0))}%` }} 
                  title={`Brand Searches: ${brandSplit.brandClicksShare || 0}%`}
                />
                <div 
                  className="meta-split-fill non-brand" 
                  style={{ width: `${Math.max(0, 100 - (brandSplit.brandClicksShare || 0))}%` }} 
                  title={`Generic SEO Discovery: ${100 - (brandSplit.brandClicksShare || 0)}%`}
                />
              </div>

              <div className="meta-split-stats">
                <div className="meta-stat-block">
                  <span className="meta-stat-num">{Number(brandSplit.brandClicks || 0).toLocaleString()} clicks</span>
                  <span className="meta-stat-label">Direct Brand Queries</span>
                </div>
                <div className="meta-stat-block" style={{ textAlign: 'right' }}>
                  <span className="meta-stat-num">{Number(brandSplit.nonBrandClicks || 0).toLocaleString()} clicks</span>
                  <span className="meta-stat-label">Organic Generic Discovery</span>
                </div>
              </div>
            </div>

            {/* Search Types (Web vs Image) */}
            <div className="gsc-meta-card">
              <div className="meta-card-head">
                <span className="meta-card-title">
                  <ImageIcon size={15} color="#818cf8" />
                  <span>Search Types (Search Appearance)</span>
                </span>
                <span className="ctr-badge">Google Web &amp; Images</span>
              </div>

              <div className="meta-split-stats" style={{ marginTop: 'auto' }}>
                <div className="meta-stat-block">
                  <span className="meta-stat-num">{Number(searchTypes.web?.clicks || totals.clicks || 0).toLocaleString()} clicks</span>
                  <span className="meta-stat-label">Google Web Search</span>
                </div>
                <div className="meta-stat-block" style={{ textAlign: 'right' }}>
                  <span className="meta-stat-num">{Number(searchTypes.image?.clicks || 0).toLocaleString()} clicks</span>
                  <span className="meta-stat-label">Google Image Traffic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subnav Navigation Bar */}
          <div className="growth-subnav-bar">
            <div className="growth-subnav-pills">
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'queries' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('queries')}
                title="All real organic search queries bringing traffic to your site from Google"
              >
                Organik Querylar ({topQueries.length})
              </button>
              <button
                type="button"
                className={`subnav-pill highlight ${activeTabSub === 'striking' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('striking')}
                title="High-opportunity keywords ranked 4-15 on Google with 30+ impressions, easiest to move into top 3"
              >
                <Zap size={13} />
                <span>Page 1 Opportunities ({computedStrikingQueries.length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('pages')}
                title="Landing pages earning the most clicks and impressions from organic search"
              >
                Top Pages ({topPages.length})
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'cannibalization' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('cannibalization')}
                title="Detect pages competing for the same keywords and splitting rankings"
              >
                <AlertTriangle size={13} color={cannibalization.length > 0 ? '#f59e0b' : '#94a3b8'} />
                <span>Cannibalization ({cannibalization.length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'breakdown' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('breakdown')}
                title="Desktop/mobile ratio and geographic breakdown of users' search countries"
              >
                <Globe2 size={13} />
                <span>Device & Country</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('health')}
                title="Googlebot's last crawl date, index status and live URL inspection tool"
              >
                <ShieldCheck size={13} />
                <span>Googlebot Index Health</span>
              </button>
            </div>

            {['queries', 'striking'].includes(activeTabSub) && (
              <div className="growth-table-toolbar-row">
                <div className="growth-search-input-wrap">
                  <Search size={14} className="search-input-icon" />
                  <input
                    type="text"
                    placeholder="Filter queries..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="growth-search-input"
                  />
                </div>
                <button
                  type="button"
                  className={`growth-col-toggle-btn ${showOpportunityCol ? 'active' : ''}`}
                  onClick={() => setShowOpportunityCol(prev => !prev)}
                  title="Show or hide the SEO estimated clicks and action suggestions column"
                >
                  <Zap size={12} />
                  <span>{showOpportunityCol ? 'Opportunity Column On' : 'Basic GSC Only'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Tab Panes */}
          <div className="growth-panel-card table-panel-card">
            {/* 1. PAGES TAB */}
            {activeTabSub === 'pages' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8' }}>
                    <Layers size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Top Landing Pages</span>
                      <span className="tab-badge-tag">{topPages.length} pages</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Landing pages earning the most visitors and impressions from Google organic search. These represent the primary entry points where users first discover your brand.
                    </p>
                    <div className="tab-infobar-action">
                      <Target size={13} color="#818cf8" />
                      <span><strong>Recommended Action:</strong> Add a <code>rel="canonical"</code> tag from the weaker page to the stronger one, or merge both into a single comprehensive page with a 301 redirect.</span>
                    </div>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  {topPages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>No clicked page data found for this property yet.</p>
                    </div>
                  ) : (
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th>Page URL</th>
                          <th>Total Clicks</th>
                          <th>Impressions</th>
                          <th>Click-Through Rate (CTR)</th>
                          <th>Top Performing Query</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPages.map((page, pIdx) => (
                          <tr key={pIdx}>
                            <td className="font-mono">
                              <a href={page.url} target="_blank" rel="noopener noreferrer" className="growth-table-link">
                                <span>{page.url}</span>
                                <ExternalLink size={12} />
                              </a>
                            </td>
                            <td className="font-semibold text-primary">{Number(page.clicks).toLocaleString()}</td>
                            <td>{Number(page.impressions).toLocaleString()}</td>
                            <td><span className="ctr-badge">{page.ctr}</span></td>
                            <td><span className="query-tag">{page.topQuery || '-'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* 2. KEYWORD CANNIBALIZATION TAB */}
            {activeTabSub === 'cannibalization' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Keyword Cannibalization</span>
                      <span className="tab-badge-tag" style={{ background: cannibalization.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: cannibalization.length > 0 ? '#f87171' : '#10b981' }}>
                        {cannibalization.length === 0 ? 'Clean Index Architecture' : `${cannibalization.length} Conflicts`}
                      </span>
                    </h4>
                    <p className="tab-infobar-desc">
                      When multiple URLs on your site compete for the same search query, Google splits your ranking power between them. Instead of a single page ranking in the top 3, both pages may drop to positions 8 and 14, losing up to 80% of potential clicks.
                    </p>
                    <div className="tab-infobar-action">
                      <AlertCircle size={13} color="#f87171" />
                      <span><strong>Recommended Action:</strong> Add a <code>rel="canonical"</code> tag from the weaker page to the stronger one, or merge both into a single comprehensive page with a 301 redirect.</span>
                    </div>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  {cannibalization.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ color: 'var(--text-main, #ffffff)', margin: '0 0 6px 0', fontSize: '1rem' }}>No Keyword Cannibalization Detected</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No URLs are competing against each other or splitting rankings for the same query. Your index architecture is clean and well-structured.</p>
                    </div>
                  ) : (
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th>Search Query</th>
                          <th>Threat / Risk</th>
                          <th>Total Impressions</th>
                          <th>Clicks</th>
                          <th>Conflicting URLs &amp; Impression Share</th>
                          <th>Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cannibalization.map((item, cIdx) => (
                          <tr key={cIdx}>
                            <td className="font-semibold text-white">{item.query}</td>
                            <td>
                              <span className={`cannibal-risk-pill ${(item.severity === 'Yüksek' || item.severity === 'High') ? 'high' : 'medium'}`}>
                                {(item.severity === 'Yüksek' || item.severity === 'High') ? 'High' : 'Medium'} Risk
                              </span>
                            </td>
                            <td>{Number(item.totalImpressions).toLocaleString()}</td>
                            <td className="font-semibold text-primary">{Number(item.totalClicks).toLocaleString()}</td>
                            <td>
                              <div className="cannibal-pages-list">
                                {item.pages.map((p, pI) => (
                                  <div key={pI} className="cannibal-page-item">
                                    <span className="cannibal-page-url" title={p.url}>{p.url}</span>
                                    <span className="cannibal-page-share">
                                      {item.totalImpressions > 0 ? Math.round((p.impressions / item.totalImpressions) * 100) : 0}% ({p.impressions} imp.)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className="text-muted text-xs">
                                {(item.severity === 'Yüksek' || item.severity === 'High') ? 'Consolidate with canonical or 301 redirect' : 'Strengthen primary page with internal links'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* 3. DEVICE & COUNTRY BREAKDOWN TAB */}
            {activeTabSub === 'breakdown' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <Globe2 size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>User Devices &amp; Geographical Distribution (Devices &amp; Countries)</span>
                      <span className="tab-badge-tag">Desktop, Mobile &amp; Global Breakdown</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Shows which devices (Desktop, Mobile, Tablet) and countries your organic visitors search from, allowing you to analyze CTR and ranking differences.
                    </p>
                    <div className="tab-infobar-action">
                      <Smartphone size={13} color="#10b981" />
                      <span><strong>Recommended Action:</strong> Optimize mobile page speed and responsiveness to maximize CTR on high-share devices.</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div className="gsc-breakdown-grid">
                    {/* Left: Devices */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Smartphone size={16} color="#38bdf8" />
                        <span>Device Breakdown (Desktop vs Mobile)</span>
                      </h4>

                      {devices.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Device data is not yet synchronized.</p>
                      ) : (
                        devices.map((dev, dIdx) => (
                          <div key={dIdx} className="gsc-device-card">
                            <div className="device-left">
                              <div className="device-icon-box">
                                {dev.device === 'MOBILE' ? <Smartphone size={18} /> : dev.device === 'TABLET' ? <Tablet size={18} /> : <Monitor size={18} />}
                              </div>
                              <div>
                                <div className="device-name">{dev.label}</div>
                                <div className="device-sub">{Number(dev.impressions).toLocaleString()} Impressions • Avg. Position #{dev.position}</div>
                              </div>
                            </div>
                            <div className="device-stats">
                              <div className="device-clicks">{Number(dev.clicks).toLocaleString()} clicks ({dev.share}%)</div>
                              <div className="device-ctr">CTR: {dev.ctr}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Right: Countries */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe2 size={16} color="#818cf8" />
                        <span>Geographic Distribution &amp; Countries ({countries.length})</span>
                      </h4>

                      {countries.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Country data is not yet synchronized.</p>
                      ) : (
                        <div className="growth-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                          <table className="growth-table">
                            <thead>
                              <tr>
                                <th>Country</th>
                                <th>Clicks</th>
                                <th>Impressions</th>
                                <th>CTR</th>
                                <th>Share</th>
                              </tr>
                            </thead>
                            <tbody>
                              {countries.slice(0, 15).map((c, cIdx) => (
                                <tr key={cIdx}>
                                  <td>
                                    <span style={{ marginRight: '6px' }}>{c.flag}</span>
                                    <span className="font-semibold text-white">{c.name}</span>
                                  </td>
                                  <td className="font-semibold text-primary">{Number(c.clicks).toLocaleString()}</td>
                                  <td>{Number(c.impressions).toLocaleString()}</td>
                                  <td><span className="ctr-badge">{c.ctr}</span></td>
                                  <td><span className="text-muted text-xs">{c.share}%</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. GOOGLEBOT HEALTH & URL INSPECTION TAB */}
            {activeTabSub === 'health' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#38bdf8' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Googlebot Index Health &amp; Live URL Inspection</span>
                      <span className="tab-badge-tag">Official Google URL Inspection API</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Verifies when Google last crawled your site, whether robots.txt allows crawling, if the page is indexed, and whether Google's selected canonical matches your declaration.
                    </p>
                    <div className="tab-infobar-action">
                      <CheckCircle2 size={13} color="#38bdf8" />
                      <span><strong>Recommended Action:</strong> Fix crawl errors and keep robots.txt optimized to allow Googlebot discovery.</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={16} color="#38bdf8" />
                    <span>Live URL Test Tool (On-Demand Inspection)</span>
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Enter any URL under your verified property to inspect Google Search Console's real-time crawl record.
                  </p>

                {/* Live Inspect Form */}
                <form onSubmit={handleLiveInspect} className="gsc-inspect-box">
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/page-or-blog-post"
                    value={inspectInputUrl}
                    onChange={(e) => setInspectInputUrl(e.target.value)}
                    className="gsc-inspect-input"
                  />
                  <button
                    type="submit"
                    disabled={inspecting}
                    className="growth-primary-btn"
                  >
                    {inspecting ? (
                      <Loader2 size={14} className="auth-spinner" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>{inspecting ? 'Inspecting with Google...' : 'Inspect Live'}</span>
                  </button>
                </form>

                {inspectError && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', color: '#f87171', fontSize: '0.825rem', marginBottom: '1rem' }}>
                    {inspectError}
                  </div>
                )}

                {/* Inspect Results Display (Either from interactive test or synced property) */}
                {(() => {
                  const targetInspection = inspectResult || urlInspection;
                  if (!targetInspection) {
                    return (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>Enter a URL above to start a live inspection.</p>
                      </div>
                    );
                  }

                  const isPass = targetInspection.verdict === 'PASS';

                  return (
                    <div className="gsc-health-grid">
                      <div className="gsc-health-item">
                        <span className="health-item-label">Google Index Status</span>
                        <div className="health-item-value" style={{ color: isPass ? '#10b981' : '#f59e0b' }}>
                          <CheckCircle2 size={16} />
                          <span>{targetInspection.coverageState || (isPass ? 'Indexed' : 'Under Review')}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Last Googlebot Crawl</span>
                        <div className="health-item-value">
                          <span>{targetInspection.lastCrawlTime ? new Date(targetInspection.lastCrawlTime).toLocaleString('en-US') : 'No record found'}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Googlebot Crawler Type</span>
                        <div className="health-item-value">
                          <Smartphone size={15} color="#38bdf8" />
                          <span>{targetInspection.crawledAs === 'GOOGLEBOT_SMARTPHONE' ? 'Googlebot Smartphone (Mobile)' : targetInspection.crawledAs}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Robots.txt Permission</span>
                        <div className="health-item-value" style={{ color: '#10b981' }}>
                          <Check size={16} />
                          <span>{targetInspection.robotsTxtState || 'ALLOWED'} (Open to Crawling)</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Google-Selected Canonical URL</span>
                        <div className="health-item-value font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {targetInspection.googleCanonical || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">User-Declared Canonical URL</span>
                        <div className="health-item-value font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {targetInspection.userCanonical || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

            {/* 5. QUERIES / STRIKING TABS */}
            {['queries', 'striking'].includes(activeTabSub) && (
              <>
                {activeTabSub === 'queries' ? (
                  <div className="growth-tab-infobar">
                    <div className="tab-infobar-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                      <Search size={20} />
                    </div>
                    <div className="tab-infobar-content">
                      <h4 className="tab-infobar-title">
                        <span>All Organic Queries (Keyword Queries)</span>
                        <span className="tab-badge-tag">{topQueries.length} keywords</span>
                      </h4>
                      <p className="tab-infobar-desc">
                        Real search terms users search on Google where your site appeared or was clicked. Shows clicks, impressions, CTR, and average ranking.
                      </p>
                      <div className="tab-infobar-action">
                        <Sparkles size={13} color="#38bdf8" />
                        <span><strong>Recommended Action:</strong> Focus on queries with high impressions but low CTR by optimizing your page titles and meta descriptions.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="growth-tab-infobar">
                    <div className="tab-infobar-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                      <Zap size={20} />
                    </div>
                    <div className="tab-infobar-content">
                      <h4 className="tab-infobar-title">
                        <span>Page 1 Striking Distance Queries</span>
                        <span className="tab-badge-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>Position 4.0 - 15.0</span>
                      </h4>
                      <p className="tab-infobar-desc">
                        Keywords ranking between positions 4 and 15 (middle of page 1 or top of page 2). High in impressions, ranking these into the top 3 will multiply your traffic fastest.
                      </p>
                      <div className="tab-infobar-action">
                        <Flame size={13} color="#f59e0b" />
                        <span><strong>Recommended Action:</strong> Build internal links and enrich content sections for these striking distance terms to break into top 3.</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="growth-table-wrap">
                  {filteredQueries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        {topQueries.length === 0 
                          ? `No organic search data has been recorded in the Google index for your connected property (${searchData.siteUrl}) during the selected range (${currentRangeLabel}).` 
                          : 'No search queries match the active filter.'}
                      </p>
                    </div>
                  ) : (
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('query')}
                          >
                            <span className="th-sort-inner">
                              <span>Search Query (Keyword Query)</span>
                              {renderSortIcon('query')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('clicks')}
                          >
                            <span className="th-sort-inner">
                              <span>Clicks</span>
                              {renderSortIcon('clicks')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('impressions')}
                          >
                            <span className="th-sort-inner">
                              <span>Impressions</span>
                              {renderSortIcon('impressions')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('ctr')}
                          >
                            <span className="th-sort-inner">
                              <span>Click-Through Rate (CTR)</span>
                              {renderSortIcon('ctr')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('position')}
                          >
                            <span className="th-sort-inner">
                              <span>Avg. Position</span>
                              {renderSortIcon('position')}
                            </span>
                          </th>
                          {showOpportunityCol && (
                            <th 
                              className="growth-th-sortable"
                              onClick={() => handleQuerySort('potential')}
                            >
                              <span className="th-sort-inner">
                                <span>Opportunity / Action</span>
                                <span 
                                  className="th-info-tooltip-trigger" 
                                  title="Based on Google SERP benchmarks, top 3 results capture an avg. 14% CTR. Estimated additional clicks if positions 4-15 queries with 30+ impressions rise to the top 3. No estimates for low volume (<30) queries."
                                >
                                  <HelpCircle size={12} />
                                </span>
                                {renderSortIcon('potential')}
                              </span>
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedQueries.map((item, idx) => {
                          const opp = computeQueryOpportunity(item);
                          return (
                            <tr key={idx}>
                              <td>
                                <div className="query-cell">
                                  <span className="query-name">{item.query}</span>
                                  {opp.isOpportunity && (
                                    <span className="striking-pill" title="Keywords at positions 4-15 with 30+ impressions">
                                      <Zap size={10} />
                                      <span>Striking Distance</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="font-semibold text-primary">{Number(item.clicks).toLocaleString()}</td>
                              <td>{Number(item.impressions).toLocaleString()}</td>
                              <td><span className="ctr-badge">{item.ctr}</span></td>
                              <td>
                                <span className={`rank-pill rank-${Math.max(1, Math.min(10, Math.floor(Number(item.position) || 1)))}`}>
                                  #{item.position}
                                </span>
                              </td>
                              {showOpportunityCol && (
                                <td>
                                  {opp.potentialBadge ? (
                                    <div className="potential-cell">
                                      <span className="potential-badge">{opp.potentialBadge}</span>
                                      <span className="potential-hint">{opp.actionHint}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted text-xs">{opp.actionHint}</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {shouldPaginate && filteredQueries.length > 0 && (
                  <div className="growth-table-pagination">
                    <div className="pagination-info">
                      Showing <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + queryPageSize, sortedQueries.length)}</strong> of <strong>{sortedQueries.length}</strong> queries
                    </div>
                    <div className="pagination-controls">
                      <div className="pagination-page-size">
                        <span>Per page:</span>
                        <select 
                          value={queryPageSize} 
                          onChange={(e) => {
                            setQueryPageSize(Number(e.target.value));
                            setQueryPage(1);
                          }}
                          className="pagination-select"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                      <div className="pagination-nav">
                        <button 
                          type="button" 
                          className="pagination-btn"
                          disabled={currentPage <= 1}
                          onClick={() => setQueryPage(p => Math.max(1, p - 1))}
                          aria-label="Previous Page"
                        >
                          <ChevronLeft size={14} />
                          <span>Previous</span>
                        </button>

                        <div className="pagination-pages-list">
                          {renderPaginationPages(currentPage, totalPages, (p) => setQueryPage(p))}
                        </div>

                        <button 
                          type="button" 
                          className="pagination-btn"
                          disabled={currentPage >= totalPages}
                          onClick={() => setQueryPage(p => Math.min(totalPages, p + 1))}
                          aria-label="Next Page"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
