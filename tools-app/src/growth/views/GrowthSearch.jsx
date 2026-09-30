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
  { id: '1d', label: 'Son 1 Gün', badge: 'Dün' },
  { id: '3d', label: 'Son 3 Gün', badge: '72 saat' },
  { id: '7d', label: 'Son 1 Hafta', badge: '7 gün' },
  { id: '28d', label: 'Son 1 Ay', badge: '28 gün' },
  { id: '3m', label: 'Son 3 Ay', badge: '90 gün' },
  { id: '6m', label: 'Son 6 Ay', badge: '180 gün' },
  { id: 'all', label: 'Tüm Zamanlar', badge: '16 Ay (Maks.)' },
  { id: 'custom', label: 'Özel Tarih Aralığı...', badge: 'Özel Seçim' }
];

export default function GrowthSearch() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('queries'); // queries, striking, pages, cannibalization, breakdown, health
  const [searchFilter, setSearchFilter] = useState('');
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
      return 'Özel Tarih Aralığı';
    }
    const found = DATE_RANGE_OPTIONS.find(o => o.id === dateRange);
    return found ? found.label : 'Son 28 Gün';
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
        if (data.startDate && !cStart) setCustomStartDate(data.startDate.split('T')[0]);
        if (data.endDate && !cEnd) setCustomEndDate(data.endDate.split('T')[0]);
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
      if (!res.ok || !data.url) throw new Error(data.error || 'Google yetkilendirme linki alınamadı');

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
        throw new Error(data.error || 'URL denetimi başarısız oldu.');
      }
      setInspectResult(data.inspection);
    } catch (err) {
      setInspectError(err.message || 'Denetim sırasında bir hata oluştu.');
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

  const currentQueriesSource = activeTabSub === 'striking' ? strikingQueries : topQueries;
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
      cmp = (a.potential || '').localeCompare(b.potential || '', 'tr');
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
    return { x, y, data: d };
  });

  const pathLine = chartPoints.length > 0
    ? chartPoints.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '')
    : '';

  const pathArea = chartPoints.length > 0
    ? `${pathLine} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${chartH - padY} L ${chartPoints[0].x.toFixed(1)} ${chartH - padY} Z`
    : '';

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge={isConnected ? "Google Search Console Canlı Telemetrisi" : "Search Console Entegrasyon Modu"}
        badgeIcon={Activity}
        title="Google Organik Arama & Sıralama İstihbaratı"
        subtitle={isConnected 
          ? `Google Search Console (${searchData.siteUrl}) mülkünüzden canlı senkronize edilen gerçek sorgu, tık ve sayfa 1 fırsatları.` 
          : "Google arama sonuçlarından gelen gerçek organik sorgular, sayfa 1 fırsatları ve tıklama hacimleri."}
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { 
            label: 'Toplam Tıklama', 
            value: isConnected ? Number(totals.clicks || 0).toLocaleString('tr-TR') : '—', 
            positive: isConnected, 
            sub: isConnected ? 'Canlı GSC Verisi' : 'Google Bağlantısı Gerekli' 
          },
          { 
            label: 'Ort. Sıralama', 
            value: isConnected ? String(totals.position || '0.0') : '—', 
            positive: isConnected, 
            sub: isConnected ? 'Ağırlıklı Ortalama' : 'Google Bağlantısı Gerekli' 
          }
        ]}
        actions={
          <>
            <div className="growth-date-picker-wrap" ref={dateDropdownRef}>
              <button
                type="button"
                className={`growth-date-trigger-btn ${isDateMenuOpen ? 'is-open' : ''}`}
                onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                title="Google Search Console veri tarih aralığını değiştirin"
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
                    <span>Zaman Aralığı</span>
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
                        <label className="custom-date-label">Başlangıç Tarihi</label>
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
                        <label className="custom-date-label">Bitiş Tarihi</label>
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
                          {rangeSyncing ? 'Yükleniyor...' : 'Aralığı Uygula'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {isConnected && (
              <div 
                className="growth-gsc-compact-status" 
                title={`Google Search Console mülkü: ${searchData.siteUrl}${searchData.syncedAt ? ` • Son veri eşitleme: ${new Date(searchData.syncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
              >
                <span className="gsc-live-dot" />
                <span className="gsc-compact-site">{searchData.siteUrl}</span>
                {searchData.syncedAt && (
                  <span className="gsc-compact-time">
                    {new Date(searchData.syncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}

            {isConnected ? (
              <button 
                type="button" 
                disabled={syncing}
                onClick={handleManualSync}
                className="growth-secondary-btn"
                title="Google Search Console verilerini anlık yenile"
              >
                <RefreshCw size={13} className={syncing ? 'auth-spinner' : ''} />
                <span>{syncing ? 'Eşitleniyor...' : 'Yenile'}</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setActiveTab('settings')}
                className="growth-secondary-btn"
              >
                <Settings size={13} />
                <span>GSC Entegrasyonu</span>
              </button>
            )}
          </>
        }
      />

      {/* Integration Status Banner (Only shown if Google Search Console is NOT connected) */}
      {!isConnected && (
        <div className="growth-gsc-banner">
          <div className="gsc-banner-left">
            <div className="gsc-pill-badge">
              <span className="gsc-live-dot" style={{ background: '#f59e0b' }} />
              <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" className="gsc-pill-icon" />
              <span className="gsc-pill-brand">Google Search Console</span>
              <span className="gsc-pill-sep">•</span>
              <span className="gsc-pill-mode">Bağlantı Yapılmadı</span>
            </div>
            <p className="gsc-banner-text">
              Organik arama tıklamaları, gösterimler ve gerçek sıralamalar yalnızca doğrulanmış Google Search Console mülkünüz bağlandığında görüntülenir. Şu anda bu çalışma alanı için bağlı bir mülk bulunmamaktadır.
            </p>
          </div>

          <button
            type="button"
            disabled={connectingGoogle}
            onClick={handleConnectGoogle}
            className="growth-primary-btn btn-sm"
          >
            {connectingGoogle ? (
              <Loader2 size={13} className="auth-spinner" />
            ) : (
              <RefreshCw size={13} className="gsc-sync-spin-icon" />
            )}
            <span>{connectingGoogle ? 'Bağlanıyor...' : 'Mülkü Şimdi Bağla'}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* 4 Core Search Metrics Cards */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Tıklama (Clicks)</span>
            <Search size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">
            {isConnected ? Number(totals.clicks || 0).toLocaleString('tr-TR') : '—'}
          </div>
          <div className="stat-card-sub text-muted">
            <span>{isConnected ? 'Organik Arama Tıklamaları' : 'Google Search Console bağlı değil'}</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Gösterim (Impressions)</span>
            <BarChart3 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            {isConnected ? Number(totals.impressions || 0).toLocaleString('tr-TR') : '—'}
          </div>
          <div className="stat-card-sub text-muted">
            <span>{isConnected ? 'Arama Sonuçlarında Görünme' : 'Google Search Console bağlı değil'}</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Tıklama Oranı (CTR)</span>
            <Target size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            {isConnected ? String(totals.ctr || '0%') : '—'}
          </div>
          <div className="stat-card-sub text-muted">
            <span>{isConnected ? 'Genel Tıklama Performansı' : 'Google Search Console bağlı değil'}</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Pozisyon (Rank)</span>
            <TrendingUp size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            {isConnected ? `#${String(totals.position || '0.0')}` : '—'}
          </div>
          <div className="stat-card-sub text-muted">
            <span>{isConnected ? 'Ağırlıklı Sıralama' : 'Google Search Console bağlı değil'}</span>
          </div>
        </div>
      </div>

      {/* Main Content: If Unconnected show Zero-Data Connect Card; If Connected show real tables & charts */}
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

          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
            Google Search Console Bağlantısı Bulunmuyor
          </h3>

          <p style={{ maxWidth: 520, margin: '0 auto 24px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Bu markaya ait organik anahtar kelimeler, tıklama hacimleri, zaman serisi grafikleri ve Googlebot denetimleri yalnızca doğrulanmış resmi Google Search Console mülkünüz bağlandığında görüntülenir.
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
            <span>{connectingGoogle ? 'Bağlanıyor...' : 'Google ile Search Console\'u Bağla'}</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      ) : (
        <>
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
                    <span>Tıklamalar ({activeChartMetric === 'clicks' ? 'Seçili' : 'Görüntüle'})</span>
                  </div>
                  <div 
                    className="chart-legend-item"
                    onClick={() => setActiveChartMetric('impressions')}
                    style={{ opacity: activeChartMetric === 'impressions' ? 1 : 0.45 }}
                  >
                    <span className="legend-dot impressions" />
                    <span>Gösterimler ({activeChartMetric === 'impressions' ? 'Seçili' : 'Görüntüle'})</span>
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

                  {/* Interactive Points */}
                  {chartPoints.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3"
                        fill="#0f172a"
                        stroke={activeChartMetric === 'clicks' ? "#38bdf8" : "#818cf8"}
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredTrendPoint(pt)}
                        onMouseLeave={() => setHoveredTrendPoint(null)}
                      />
                    </g>
                  ))}
                </svg>

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
                    <div>Tıklama: <strong>{hoveredTrendPoint.data.clicks}</strong></div>
                    <div>Gösterim: <strong>{hoveredTrendPoint.data.impressions}</strong></div>
                    <div>CTR: <strong>{hoveredTrendPoint.data.ctr}</strong></div>
                    <div>Ort. Sıra: <strong>#{hoveredTrendPoint.data.position}</strong></div>
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
                  <span>Marka (Brand) vs Jenerik Arama</span>
                </span>
                <span className="ctr-badge">%{brandSplit.brandClicksShare || 0} Marka</span>
              </div>

              <div className="meta-split-bar">
                <div 
                  className="meta-split-fill brand" 
                  style={{ width: `${Math.min(100, Math.max(5, brandSplit.brandClicksShare || 0))}%` }} 
                  title={`Marka Aramaları: %${brandSplit.brandClicksShare || 0}`}
                />
                <div 
                  className="meta-split-fill non-brand" 
                  style={{ width: `${Math.max(0, 100 - (brandSplit.brandClicksShare || 0))}%` }} 
                  title={`Jenerik SEO Keşif: %${100 - (brandSplit.brandClicksShare || 0)}`}
                />
              </div>

              <div className="meta-split-stats">
                <div className="meta-stat-block">
                  <span className="meta-stat-num">{Number(brandSplit.brandClicks || 0).toLocaleString()} tık</span>
                  <span className="meta-stat-label">Doğrudan Marka Sorguları</span>
                </div>
                <div className="meta-stat-block" style={{ textAlign: 'right' }}>
                  <span className="meta-stat-num">{Number(brandSplit.nonBrandClicks || 0).toLocaleString()} tık</span>
                  <span className="meta-stat-label">Organik Jenerik Keşif</span>
                </div>
              </div>
            </div>

            {/* Search Types (Web vs Image) */}
            <div className="gsc-meta-card">
              <div className="meta-card-head">
                <span className="meta-card-title">
                  <ImageIcon size={15} color="#818cf8" />
                  <span>Arama Türleri (Search Appearance)</span>
                </span>
                <span className="ctr-badge">Google Web & Görseller</span>
              </div>

              <div className="meta-split-stats" style={{ marginTop: 'auto' }}>
                <div className="meta-stat-block">
                  <span className="meta-stat-num">{Number(searchTypes.web?.clicks || totals.clicks || 0).toLocaleString()} tık</span>
                  <span className="meta-stat-label">Google Web Araması</span>
                </div>
                <div className="meta-stat-block" style={{ textAlign: 'right' }}>
                  <span className="meta-stat-num">{Number(searchTypes.image?.clicks || 0).toLocaleString()} tık</span>
                  <span className="meta-stat-label">Google Görseller Trafiği</span>
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
                title="Google'da sitenizi getiren tüm gerçek organik arama ifadeleri, tıklama ve sıralamaları"
              >
                Organik Sorgular ({topQueries.length})
              </button>
              <button
                type="button"
                className={`subnav-pill highlight ${activeTabSub === 'striking' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('striking')}
                title="Google'da 4-15. sırada olan, ilk 3'e taşınması en kolay yüksek fırsatlı kelimeler"
              >
                <Zap size={13} />
                <span>Sayfa 1 Fırsatları ({strikingQueries.length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('pages')}
                title="Organik aramalardan sitenize en çok tıklama ve gösterim kazandıran açılış sayfalarınız"
              >
                Popüler Sayfalar ({topPages.length})
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'cannibalization' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('cannibalization')}
                title="Aynı arama kelimesinde birbiriyle yarışıp sıralamayı bölen sayfaların tespiti"
              >
                <AlertTriangle size={13} color={cannibalization.length > 0 ? '#f59e0b' : '#94a3b8'} />
                <span>Cannibalization ({cannibalization.length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'breakdown' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('breakdown')}
                title="Kullanıcıların masaüstü/mobil oranı ve arama yaptıkları ülkelerin coğrafi dökümü"
              >
                <Globe2 size={13} />
                <span>Cihaz & Ülke</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('health')}
                title="Googlebot'un son tarama tarihi, dizin durumu ve canlı URL denetim aracı"
              >
                <ShieldCheck size={13} />
                <span>Googlebot Dizin Sağlığı</span>
              </button>
            </div>

            {['queries', 'striking'].includes(activeTabSub) && (
              <div className="growth-search-input-wrap">
                <Search size={14} className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Sorgu filtrele..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="growth-search-input"
                />
              </div>
            )}
          </div>

          {/* Dynamic Tab Panes */}
          <div className="growth-panel-card">
            {/* 1. PAGES TAB */}
            {activeTabSub === 'pages' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8' }}>
                    <Layers size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>En Çok Tıklanan Açılış Sayfaları (Top Landing Pages)</span>
                      <span className="tab-badge-tag">{topPages.length} sayfa</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Google organik arama sonuçlarından sitenize en çok ziyaretçi ve gösterim kazandıran açılış sayfalarınızın listesidir. Kullanıcıların markanızla ilk kez karşılaştığı ana giriş kapılarını temsil eder.
                    </p>
                    <div className="tab-infobar-action">
                      <Target size={13} color="#818cf8" />
                      <span><strong>Önerilen Aksiyon:</strong> En çok trafik alan sayfalarınıza dönüşüm odaklı CTA (lead magnet, kayıt formu veya buton) ekleyerek organik trafiği müşteriye dönüştürün.</span>
                    </div>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  {topPages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>Bu mülk için henüz tıklanan sayfa verisi bulunamadı.</p>
                    </div>
                  ) : (
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th>Sayfa URL</th>
                          <th>Toplam Tıklama</th>
                          <th>Gösterim</th>
                          <th>Tıklama Oranı (CTR)</th>
                          <th>En Başarılı Sorgu</th>
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
                      <span>Keyword Cannibalization (Anahtar Kelime Yamyamlığı)</span>
                      <span className="tab-badge-tag" style={{ background: cannibalization.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: cannibalization.length > 0 ? '#f87171' : '#10b981' }}>
                        {cannibalization.length === 0 ? 'Temiz Dizin Mimarisi' : `${cannibalization.length} Çatışma`}
                      </span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Aynı arama sorgusu için sitenizdeki birden fazla URL'nin Google arama sonuçlarında gösterim paylaşması ve sıralama gücünüzün bölünmesi durumudur. Tek bir sayfayla ilk 3 sırada çıkabilecekken, iki sayfanız da 8. ve 14. sıralara gerileyerek potansiyel tıklamaların %80'ini kaybedebilir.
                    </p>
                    <div className="tab-infobar-action">
                      <AlertCircle size={13} color="#f87171" />
                      <span><strong>Önerilen Aksiyon:</strong> Zayıf sayfadan güçlü sayfaya <code>rel="canonical"</code> etiketi tanımlayın ya da iki sayfayı tek kapsamlı içerikte birleştirip 301 yönlendirmesi yapın.</span>
                    </div>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  {cannibalization.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '1rem' }}>Keyword Cannibalization Tespit Edilmedi</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>Arama sonuçlarında aynı sorgu için birbiriyle yarışan veya sıralama bölen URL bulunmuyor. Dizin mimariniz oldukça temiz ve optimize.</p>
                    </div>
                  ) : (
                    <table className="growth-table">
                      <thead>
                        <tr>
                          <th>Arama Sorgusu</th>
                          <th>Tehdit / Risk</th>
                          <th>Toplam Gösterim</th>
                          <th>Tıklama</th>
                          <th>Çatışan URL'ler ve Gösterim Dağılımı</th>
                          <th>Önerilen Eylem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cannibalization.map((item, cIdx) => (
                          <tr key={cIdx}>
                            <td className="font-semibold text-white">{item.query}</td>
                            <td>
                              <span className={`cannibal-risk-pill ${item.severity === 'Yüksek' ? 'high' : 'medium'}`}>
                                {item.severity} Risk
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
                                      {item.totalImpressions > 0 ? Math.round((p.impressions / item.totalImpressions) * 100) : 0}% ({p.impressions} gör.)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className="text-muted text-xs">
                                {item.severity === 'Yüksek' ? 'Kanonik veya 301 yönlendirmesiyle birleştirin' : 'İç bağlantılarla ana sayfayı güçlendirin'}
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
                      <span>Kullanıcı Cihazı ve Coğrafi Konum Dağılımı (Devices & Countries)</span>
                      <span className="tab-badge-tag">Masaüstü, Mobil & Global Kırılım</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Organik arama ziyaretçilerinizin hangi cihazları (Masaüstü, Mobil, Tablet) kullandığını ve hangi ülkelerden arama yaptıklarını gösterir. Cihazlara göre tıklama oranı (CTR) ve sıralama farklılıklarını analiz etmenizi sağlar.
                    </p>
                    <div className="tab-infobar-action">
                      <Smartphone size={13} color="#10b981" />
                      <span><strong>Önerilen Aksiyon:</strong> Mobil oranınız yüksekse mobil sayfa hızına ve dokunmatik kullanılabilirliğe odaklanın; yurt dışından gösterim alıyorsanız o dillerde yerelleştirilmiş içerikler açın.</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div className="gsc-breakdown-grid">
                    {/* Left: Devices */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Smartphone size={16} color="#38bdf8" />
                        <span>Cihaz Kırılımı (Desktop vs Mobile)</span>
                      </h4>

                      {devices.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Cihaz verisi henüz senkronize edilmedi.</p>
                      ) : (
                        devices.map((dev, dIdx) => (
                          <div key={dIdx} className="gsc-device-card">
                            <div className="device-left">
                              <div className="device-icon-box">
                                {dev.device === 'MOBILE' ? <Smartphone size={18} /> : dev.device === 'TABLET' ? <Tablet size={18} /> : <Monitor size={18} />}
                              </div>
                              <div>
                                <div className="device-name">{dev.label}</div>
                                <div className="device-sub">{Number(dev.impressions).toLocaleString()} Gösterim • Ort. Sıra #{dev.position}</div>
                              </div>
                            </div>
                            <div className="device-stats">
                              <div className="device-clicks">{Number(dev.clicks).toLocaleString()} tık (%{dev.share})</div>
                              <div className="device-ctr">CTR: {dev.ctr}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Right: Countries */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe2 size={16} color="#818cf8" />
                        <span>Coğrafi Dağılım & Ülkeler ({countries.length})</span>
                      </h4>

                      {countries.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ülke verisi henüz senkronize edilmedi.</p>
                      ) : (
                        <div className="growth-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                          <table className="growth-table">
                            <thead>
                              <tr>
                                <th>Ülke</th>
                                <th>Tıklama</th>
                                <th>Gösterim</th>
                                <th>CTR</th>
                                <th>Pay</th>
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
                                  <td><span className="text-muted text-xs">%{c.share}</span></td>
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
                      <span>Googlebot Dizin Sağlığı & Canlı URL Denetimi (URL Inspection)</span>
                      <span className="tab-badge-tag">Resmi Google URL Inspection API</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Google'ın sitenizi en son ne zaman taradığını, robots.txt engelinin olup olmadığını, sayfanın Google dizininde yer alıp almadığını ve seçilen kanonik URL'nin sizin beyanınızla uyuşup uyuşmadığını doğrular.
                    </p>
                    <div className="tab-infobar-action">
                      <CheckCircle2 size={13} color="#38bdf8" />
                      <span><strong>Önerilen Aksiyon:</strong> Yeni yayınladığınız blog veya ürün sayfalarının linkini arama kutusuna yazarak Google tarafından taranıp dizine alınıp alınmadığını anında canlı test edin.</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={16} color="#38bdf8" />
                    <span>Canlı URL Test Aracı (On-Demand Inspection)</span>
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Mülkünüz altındaki herhangi bir sayfa linkini aşağıya girerek Google Search Console'un anlık tarama kaydını sorgulayın.
                  </p>

                {/* Live Inspect Form */}
                <form onSubmit={handleLiveInspect} className="gsc-inspect-box">
                  <input
                    type="url"
                    placeholder="https://siteniz.com/sayfa-veya-blog-yazisi"
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
                    <span>{inspecting ? 'Google Denetliyor...' : 'Canlı Denetle'}</span>
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
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>Yukarıdaki kutucuğa bir URL girip canlı denetleme başlatabilirsiniz.</p>
                      </div>
                    );
                  }

                  const isPass = targetInspection.verdict === 'PASS';

                  return (
                    <div className="gsc-health-grid">
                      <div className="gsc-health-item">
                        <span className="health-item-label">Google Dizin Durumu</span>
                        <div className="health-item-value" style={{ color: isPass ? '#10b981' : '#f59e0b' }}>
                          <CheckCircle2 size={16} />
                          <span>{targetInspection.coverageState || (isPass ? 'Dizine Eklendi' : 'İnceleniyor')}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Son Googlebot Taraması</span>
                        <div className="health-item-value">
                          <span>{targetInspection.lastCrawlTime ? new Date(targetInspection.lastCrawlTime).toLocaleString('tr-TR') : 'Kayıt bulunamadı'}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Tarayan Googlebot Türü</span>
                        <div className="health-item-value">
                          <Smartphone size={15} color="#38bdf8" />
                          <span>{targetInspection.crawledAs === 'GOOGLEBOT_SMARTPHONE' ? 'Googlebot Smartphone (Mobil)' : targetInspection.crawledAs}</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Robots.txt İzni</span>
                        <div className="health-item-value" style={{ color: '#10b981' }}>
                          <Check size={16} />
                          <span>{targetInspection.robotsTxtState || 'ALLOWED'} (Taramaya Açık)</span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Google'ın Seçtiği Kanonik URL</span>
                        <div className="health-item-value font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {targetInspection.googleCanonical || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="gsc-health-item">
                        <span className="health-item-label">Kullanıcı Beyanı Kanonik</span>
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
                        <span>Tüm Organik Sorgular (Keyword Queries)</span>
                        <span className="tab-badge-tag">{topQueries.length} anahtar kelime</span>
                      </h4>
                      <p className="tab-infobar-desc">
                        Kullanıcıların Google'da arama yaparak sitenizi gördüğü veya tıkladığı gerçek arama terimleridir. Tıklama, gösterim, tıklama oranı (CTR) ve ortalama Google sıralamanızı gösterir.
                      </p>
                      <div className="tab-infobar-action">
                        <Sparkles size={13} color="#38bdf8" />
                        <span><strong>Önerilen Aksiyon:</strong> Gösterimi yüksek fakat tıklama oranı (CTR) düşük sorgularda meta başlık ve açıklamalarınızı güncelleyerek tıklamaları artırın.</span>
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
                        <span>Sayfa 1'e En Yakın Fırsatlar (Striking Distance Queries)</span>
                        <span className="tab-badge-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>Pozisyon 4.0 - 15.0</span>
                      </h4>
                      <p className="tab-infobar-desc">
                        Google arama sonuçlarında 4 ile 15. sıra arasında yer alan (1. sayfanın ortası veya 2. sayfanın başı) kelimelerdir. Zaten yüksek gösterim alan bu kelimeler, ilk 3 sıraya taşındığında organik trafiğinizi en hızlı katlayacak fırsatlardır.
                      </p>
                      <div className="tab-infobar-action">
                        <Flame size={13} color="#f59e0b" />
                        <span><strong>Önerilen Aksiyon:</strong> Bu kelimelerin yönlendiği sayfalara site içi iç bağlantılar (internal links) verin ve içeriği zenginleştirerek ilk 3'e taşıyın.</span>
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
                          ? `Bağlı mülkünüz (${searchData.siteUrl}) için Google dizininde seçili dönemde (${currentRangeLabel}) arama verisi henüz oluşmamış.` 
                          : 'Filtreye uygun arama sorgusu bulunamadı.'}
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
                              <span>Arama Sorgusu (Keyword Query)</span>
                              {renderSortIcon('query')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('clicks')}
                          >
                            <span className="th-sort-inner">
                              <span>Tıklama</span>
                              {renderSortIcon('clicks')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('impressions')}
                          >
                            <span className="th-sort-inner">
                              <span>Gösterim</span>
                              {renderSortIcon('impressions')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('ctr')}
                          >
                            <span className="th-sort-inner">
                              <span>Tıklama Oranı (CTR)</span>
                              {renderSortIcon('ctr')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('position')}
                          >
                            <span className="th-sort-inner">
                              <span>Ort. Sıralama</span>
                              {renderSortIcon('position')}
                            </span>
                          </th>
                          <th 
                            className="growth-th-sortable"
                            onClick={() => handleQuerySort('potential')}
                          >
                            <span className="th-sort-inner">
                              <span>Fırsat / Eylem</span>
                              {renderSortIcon('potential')}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedQueries.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="query-cell">
                                <span className="query-name">{item.query}</span>
                                {item.isStriking && (
                                  <span className="striking-pill">
                                    <Zap size={10} />
                                    <span>Hızlı Yükselme</span>
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
                            <td>
                              {item.potential ? (
                                <div className="potential-cell">
                                  <span className="potential-badge">{item.potential}</span>
                                  <span className="potential-hint">Başlığı optimize et</span>
                                </div>
                              ) : (
                                <span className="text-muted text-xs">Stabil sıralama</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {shouldPaginate && filteredQueries.length > 0 && (
                  <div className="growth-table-pagination">
                    <div className="pagination-info">
                      Toplam <strong>{sortedQueries.length}</strong> sorgudan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + queryPageSize, sortedQueries.length)}</strong> arası gösteriliyor
                    </div>
                    <div className="pagination-controls">
                      <div className="pagination-page-size">
                        <span>Sayfa başına:</span>
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
                          aria-label="Önceki Sayfa"
                        >
                          <ChevronLeft size={14} />
                          <span>Önceki</span>
                        </button>

                        <div className="pagination-pages-list">
                          {renderPaginationPages(currentPage, totalPages, (p) => setQueryPage(p))}
                        </div>

                        <button 
                          type="button" 
                          className="pagination-btn"
                          disabled={currentPage >= totalPages}
                          onClick={() => setQueryPage(p => Math.min(totalPages, p + 1))}
                          aria-label="Sonraki Sayfa"
                        >
                          <span>Sonraki</span>
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
