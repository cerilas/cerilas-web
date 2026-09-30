import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity,
  Users,
  Eye,
  Clock,
  TrendingDown,
  UserPlus,
  RefreshCw,
  Search,
  Calendar,
  Check,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Flame,
  Zap,
  Radio,
  ExternalLink,
  SlidersHorizontal,
  FileText
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
  { id: 'all', label: 'Tüm Zamanlar', badge: '1 Yıl' },
  { id: 'custom', label: 'Özel Tarih Aralığı...', badge: 'Özel Seçim' }
];

const CHANNEL_COLORS = {
  'Organic Search': '#38bdf8',
  'Direct': '#818cf8',
  'Organic Social': '#f472b6',
  'Referral': '#34d399',
  'Paid Search': '#fbbf24',
  'Email': '#a78bfa',
  'Cross-network': '#fb923c',
  'Unassigned': '#94a3b8'
};

const formatDuration = (seconds) => {
  const s = Math.round(Number(seconds) || 0);
  if (s < 60) return `${s}sn`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}dk ${rem < 10 ? '0' : ''}${rem}sn`;
};

export default function GrowthAnalytics() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('channels'); // 'channels' | 'pages' | 'tech' | 'demographics' | 'events'
  const [searchFilter, setSearchFilter] = useState('');
  const [activeChartMetric, setActiveChartMetric] = useState('sessions'); // 'sessions' | 'activeUsers' | 'screenPageViews'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);

  // Date Range state
  const [dateRange, setDateRange] = useState('28d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Realtime Polling
  const [realtimeData, setRealtimeData] = useState({ activeUsers: 0, activePages: [] });
  const [realtimeUpdating, setRealtimeUpdating] = useState(false);

  // Main Analytics Data
  const [analyticsData, setAnalyticsData] = useState({
    connected: false,
    propertyId: '',
    propertyName: '',
    availableProperties: [],
    syncedAt: null,
    totals: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      sessions: 0,
      screenPageViews: 0,
      averageSessionDuration: 0,
      bounceRate: '0%',
      engagementRate: '0%',
      eventCount: 0
    },
    trafficChannels: [],
    topPages: [],
    dailyTrend: [],
    devices: [],
    browsers: [],
    demographics: { countries: [], cities: [] },
    events: []
  });

  // Table sorting & pagination for top pages
  const [pageSortField, setPageSortField] = useState('views');
  const [pageSortDirection, setPageSortDirection] = useState('desc');
  const [pageCurrentPage, setPageCurrentPage] = useState(1);
  const pageSize = 25;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateMenuOpen(false);
      }
    };
    if (isDateMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDateMenuOpen]);

  const currentRangeLabel = useMemo(() => {
    if (dateRange === 'custom') {
      if (customStartDate && customEndDate) {
        return `${customStartDate} → ${customEndDate}`;
      }
      return 'Özel Tarih';
    }
    const found = DATE_RANGE_OPTIONS.find(o => o.id === dateRange);
    return found ? found.label : 'Son 1 Ay';
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch Main Performance Data
  const fetchAnalytics = useCallback(async (targetRange = dateRange, cStart = customStartDate, cEnd = customEndDate, forceSync = false) => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        range: targetRange
      });
      if (targetRange === 'custom' && cStart && cEnd) {
        qParams.set('startDate', cStart);
        qParams.set('endDate', cEnd);
      }
      if (forceSync) {
        qParams.set('sync', 'true');
      }

      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/analytics-performance?${qParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analytics verileri alınamadı.');

      setAnalyticsData(data);
      if (data.realtime) {
        setRealtimeData(data.realtime);
      }
    } catch (err) {
      console.warn('Analytics performance fetch warning:', err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [activeWorkspace?.id, token, dateRange, customStartDate, customEndDate]);

  // Fetch Realtime Visitors
  const fetchRealtime = useCallback(async () => {
    if (!activeWorkspace?.id || !token) return;
    setRealtimeUpdating(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/analytics-realtime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.realtime) {
        setRealtimeData(data.realtime);
      }
    } catch (err) {
      console.warn('Realtime fetch warning:', err.message);
    } finally {
      setRealtimeUpdating(false);
    }
  }, [activeWorkspace?.id, token]);

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [activeWorkspace?.id, token]);

  // Poll Realtime every 25 seconds
  useEffect(() => {
    if (!analyticsData.connected) return;
    const interval = setInterval(() => {
      fetchRealtime();
    }, 25000);
    return () => clearInterval(interval);
  }, [analyticsData.connected, fetchRealtime]);

  const handleSelectDateRange = (optionId) => {
    if (optionId === 'custom') {
      setDateRange('custom');
      return;
    }
    setDateRange(optionId);
    setIsDateMenuOpen(false);
    fetchAnalytics(optionId);
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) return;
    setIsDateMenuOpen(false);
    fetchAnalytics('custom', customStartDate, customEndDate);
  };

  const handleManualSync = () => {
    setSyncing(true);
    fetchAnalytics(dateRange, customStartDate, customEndDate, true);
  };

  // Sort & filter Pages
  const filteredPages = (analyticsData.topPages || []).filter(p =>
    (p.pagePath || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.pageTitle || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const sortedPages = [...filteredPages].sort((a, b) => {
    let cmp = 0;
    if (pageSortField === 'pagePath') {
      cmp = (a.pagePath || '').localeCompare(b.pagePath || '');
    } else if (pageSortField === 'views') {
      cmp = (Number(a.views) || 0) - (Number(b.views) || 0);
    } else if (pageSortField === 'activeUsers') {
      cmp = (Number(a.activeUsers) || 0) - (Number(b.activeUsers) || 0);
    } else if (pageSortField === 'avgDurationSeconds') {
      cmp = (Number(a.avgDurationSeconds) || 0) - (Number(b.avgDurationSeconds) || 0);
    } else if (pageSortField === 'bounceRate') {
      const bA = parseFloat(String(a.bounceRate || '0').replace('%', '')) || 0;
      const bB = parseFloat(String(b.bounceRate || '0').replace('%', '')) || 0;
      cmp = bA - bB;
    }
    return pageSortDirection === 'asc' ? cmp : -cmp;
  });

  const totalPagesCount = Math.max(1, Math.ceil(sortedPages.length / pageSize));
  const currentPagedList = sortedPages.slice((pageCurrentPage - 1) * pageSize, pageCurrentPage * pageSize);

  const handleSortPages = (field) => {
    if (pageSortField === field) {
      setPageSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setPageSortField(field);
      setPageSortDirection('desc');
    }
    setPageCurrentPage(1);
  };

  // Export current active view to CSV
  const handleExportCsv = () => {
    let headers = [];
    let rows = [];
    let filename = `ga4-${activeTabSub}-${dateRange}.csv`;

    if (activeTabSub === 'channels') {
      headers = ['Kanal', 'Oturumlar', 'Aktif Kullanıcılar', 'Hemen Çıkma Oranı', 'Ort. Süre (sn)'];
      rows = (analyticsData.trafficChannels || []).map(c => [
        c.channel,
        c.sessions,
        c.activeUsers,
        c.bounceRate,
        c.avgDurationSeconds
      ]);
    } else if (activeTabSub === 'pages') {
      headers = ['Sayfa Yolu', 'Sayfa Başlığı', 'Görüntüleme', 'Aktif Kullanıcılar', 'Ort. Süre (sn)', 'Hemen Çıkma'];
      rows = sortedPages.map(p => [
        `"${p.pagePath}"`,
        `"${(p.pageTitle || '').replace(/"/g, '""')}"`,
        p.views,
        p.activeUsers,
        p.avgDurationSeconds,
        p.bounceRate
      ]);
    } else if (activeTabSub === 'events') {
      headers = ['Olay Adı', 'Tetiklenme Sayısı', 'Toplam Kullanıcı'];
      rows = (analyticsData.events || []).map(e => [
        e.eventName,
        e.eventCount,
        e.totalUsers
      ]);
    } else {
      headers = ['Kategori / İsim', 'Oturumlar', 'Kullanıcılar'];
      rows = (analyticsData.devices || []).map(d => [d.category, d.sessions, d.activeUsers]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !analyticsData.connected) {
    return <GrowthSearchSkeleton />;
  }

  const totals = analyticsData.totals || {};
  const isConnected = !!analyticsData.connected;
  const totalSessions = Number(totals.sessions) || 0;
  const totalUsers = Number(totals.totalUsers) || 0;
  const pageViews = Number(totals.screenPageViews) || 0;
  const pagesPerSession = totalSessions > 0 ? (pageViews / totalSessions).toFixed(1) : '0';
  const newUsersPercent = totalUsers > 0 ? Math.round(((Number(totals.newUsers) || 0) / totalUsers) * 100) : 0;

  // Chart SVG Calculations
  const dailyTrend = analyticsData.dailyTrend || [];
  const chartMax = Math.max(...dailyTrend.map(d => Number(d[activeChartMetric]) || 0), 10);
  const chartWidth = 900;
  const chartHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartPoints = dailyTrend.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(dailyTrend.length - 1, 1)) * (chartWidth - paddingX * 2);
    const val = Number(pt[activeChartMetric]) || 0;
    const y = chartHeight - paddingY - (val / chartMax) * (chartHeight - paddingY * 2);
    return { x, y, data: pt, val };
  });

  const pathD = chartPoints.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaD = chartPoints.length > 0 
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} Z`
    : '';

  return (
    <div className="growth-search-view animate-fade-in">
      {/* 1. HERO COVER BANNER */}
      <GrowthPageCover
        badge="Google Analytics 4 (GA4)"
        badgeIcon={Activity}
        title="Web Analitiği & Ziyaretçi Telemetrisi"
        subtitle="Gerçek zamanlı kullanıcı akışları, etkileşim süreleri, trafik kaynakları ve dönüşüm hunisi ölçümleri."
        coverImage="/growth-covers/integrations-cover.jpg"
        actions={
          <div className="growth-date-picker-wrap" ref={dateDropdownRef}>
            <button
              type="button"
              className="growth-date-trigger-btn"
              onClick={() => setIsDateMenuOpen(prev => !prev)}
            >
              <Calendar size={14} className="text-primary" />
              <span>{currentRangeLabel}</span>
              <ChevronDown size={14} className={`date-chevron ${isDateMenuOpen ? 'open' : ''}`} />
            </button>

            {isDateMenuOpen && (
              <div className="growth-date-dropdown animate-scale-up">
                <div className="date-dropdown-header">
                  <span className="date-dropdown-title">Zaman Aralığı Seçin</span>
                </div>
                <div className="date-options-list">
                  {DATE_RANGE_OPTIONS.map((opt) => {
                    const isSelected = dateRange === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`date-option-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectDateRange(opt.id)}
                      >
                        <div className="date-option-labels">
                          <span className="date-label-main">{opt.label}</span>
                          <span className="date-badge-pill">{opt.badge}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {dateRange === 'custom' && (
                  <form onSubmit={handleApplyCustomDate} className="custom-date-box">
                    <div className="custom-date-row">
                      <label>Başlangıç:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        required
                        className="custom-date-input"
                      />
                    </div>
                    <div className="custom-date-row">
                      <label>Bitiş:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        required
                        className="custom-date-input"
                      />
                    </div>
                    <button type="submit" className="custom-date-submit-btn">
                      Uygula ve Getir
                    </button>
                  </form>
                )}
              </div>
            )}

            <button
              type="button"
              className="growth-btn growth-btn-secondary"
              onClick={handleManualSync}
              disabled={syncing || !isConnected}
              title="Google Analytics 4'ten en güncel verileri çek"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin text-primary' : ''} />
              <span>{syncing ? 'Eşitleniyor...' : 'Şimdi Eşitle'}</span>
            </button>
          </div>
        }
      />

      {/* DISCONNECTED STATE NOTICE */}
      {!isConnected ? (
        <div className="growth-panel-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: '#f59e0b' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#ffffff' }}>Google Analytics 4 Bağlantısı Bekleniyor</h2>
          <p style={{ maxWidth: 520, margin: '0 auto 1.75rem', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Web sitenizin gerçek kullanıcı oturumlarını, hemen çıkma oranlarını ve canlı ziyaretçi sayısını doğrudan görmek için Ayarlar sekmesinden Google Analytics 4 mülkünüzü bağlayın.
          </p>
          <button
            type="button"
            className="growth-btn growth-btn-primary"
            onClick={() => setActiveTab('settings')}
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
          >
            <SlidersHorizontal size={16} />
            <span>Ayarlar'a Git ve GA4'ü Bağla</span>
          </button>
        </div>
      ) : (
        <>
          {/* REALTIME PULSE BANNER */}
          <div className="growth-analytics-realtime-card">
            <div className="realtime-header">
              <div className="realtime-pulse-indicator">
                <span className="realtime-dot" />
                <span className="realtime-ping" />
              </div>
              <div className="realtime-title-group">
                <h3 className="realtime-main-title">
                  Canlı Ziyaretçi Nabzı: <strong>{realtimeData.activeUsers || 0} Kullanıcı</strong>
                </h3>
                <span className="realtime-sub">
                  Şu an sitede aktif olarak gezinen tekil kullanıcılar (Son 30 dakika)
                </span>
              </div>
              <button 
                type="button" 
                className="realtime-refresh-btn"
                onClick={fetchRealtime}
                disabled={realtimeUpdating}
                title="Canlı kullanıcıları yenile"
              >
                <Radio size={13} className={realtimeUpdating ? 'animate-pulse' : ''} />
                <span>{realtimeUpdating ? 'Güncelleniyor...' : 'Canlı Veri'}</span>
              </button>
            </div>

            {realtimeData.activePages && realtimeData.activePages.length > 0 ? (
              <div className="realtime-active-pages-wrap">
                <span className="realtime-pages-label">Şu An İzlenen Sayfalar:</span>
                <div className="realtime-pages-chips">
                  {realtimeData.activePages.map((pg, idx) => (
                    <div key={idx} className="realtime-page-chip">
                      <span className="page-chip-path">{pg.screenName}</span>
                      <span className="page-chip-badge">{pg.activeUsers} kişi</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="realtime-idle-note">
                <Radio size={14} style={{ opacity: 0.6 }} />
                <span>Şu an anlık aktif oturum tespit edilmedi. Yeni bir kullanıcı siteye girdiğinde burada canlı belirecektir.</span>
              </div>
            )}
          </div>

          {/* 2. TOP METRIC KPI CARDS */}
          <div className="growth-stats-grid">
            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Toplam & Aktif Kullanıcı</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono">
                {Number(totals.activeUsers || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                Toplam: <strong>{Number(totals.totalUsers || 0).toLocaleString()}</strong> tekil ziyaretçi
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Toplam Oturum (Sessions)</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8' }}>
                  <Activity size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono text-primary">
                {Number(totals.sessions || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                Oturum başına <strong>{pagesPerSession}</strong> sayfa
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Sayfa Görüntüleme (Views)</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(244, 114, 182, 0.12)', color: '#f472b6' }}>
                  <Eye size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono">
                {Number(totals.screenPageViews || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                Seçili dönemdeki toplam okuma
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Ort. Oturum Süresi</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono text-success">
                {formatDuration(totals.averageSessionDuration)}
              </div>
              <div className="stat-card-sub text-muted">
                Ortalama aktif etkileşim
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Hemen Çıkma (Bounce Rate)</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono text-warning">
                {totals.bounceRate || '0%'}
              </div>
              <div className="stat-card-sub text-muted">
                Etkileşim Oranı: <strong>{totals.engagementRate || '0%'}</strong>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Yeni Ziyaretçi Payı</span>
                <div className="stat-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                  <UserPlus size={18} />
                </div>
              </div>
              <div className="stat-card-value font-mono">
                %{newUsersPercent}
              </div>
              <div className="stat-card-sub text-muted">
                <strong>{Number(totals.newUsers || 0).toLocaleString()}</strong> yeni kullanıcı
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE TIMELINE CHART */}
          <div className="growth-panel-card">
            <div className="growth-chart-header">
              <div>
                <h3 className="panel-title">Trafik ve Etkileşim Eğilimi</h3>
                <span className="panel-subtitle">
                  {currentRangeLabel} boyunca gerçekleşen günlük metrik dağılımı
                </span>
              </div>
              <div className="chart-metric-toggle">
                <button
                  type="button"
                  className={`metric-toggle-btn ${activeChartMetric === 'sessions' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('sessions')}
                >
                  Oturumlar
                </button>
                <button
                  type="button"
                  className={`metric-toggle-btn ${activeChartMetric === 'activeUsers' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('activeUsers')}
                >
                  Kullanıcılar
                </button>
                <button
                  type="button"
                  className={`metric-toggle-btn ${activeChartMetric === 'screenPageViews' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('screenPageViews')}
                >
                  Sayfa Görüntüleme
                </button>
              </div>
            </div>

            <div className="trend-svg-container">
              {dailyTrend.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <Activity size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>Seçili dönem için günlük zaman serisi verisi bulunamadı.</p>
                </div>
              ) : (
                <div className="svg-wrapper" style={{ position: 'relative' }}>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="trend-line-svg"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="ga4TrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid horizontal guidelines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, gIdx) => {
                      const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                      const labelVal = Math.round(pct * chartMax);
                      return (
                        <g key={gIdx}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.06)"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingX - 8}
                            y={y + 4}
                            textAnchor="end"
                            fill="rgba(255, 255, 255, 0.35)"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {labelVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Filled Gradient Area */}
                    <path d={areaD} fill="url(#ga4TrendGrad)" />

                    {/* Line Stroke */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Circles */}
                    {chartPoints.map((pt, pIdx) => {
                      const isHovered = hoveredTrendPoint && hoveredTrendPoint.idx === pIdx;
                      return (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 3.5}
                          fill={isHovered ? '#ffffff' : '#38bdf8'}
                          stroke={isHovered ? '#0284c7' : '#0f172a'}
                          strokeWidth={isHovered ? 3 : 2}
                          className="trend-circle-point"
                          onMouseEnter={() => setHoveredTrendPoint({ idx: pIdx, ...pt })}
                          onMouseLeave={() => setHoveredTrendPoint(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Hover Floating Tooltip */}
                  {hoveredTrendPoint && (
                    <div
                      className="trend-chart-tooltip"
                      style={{
                        left: `${(hoveredTrendPoint.x / chartWidth) * 100}%`,
                        top: `${(hoveredTrendPoint.y / chartHeight) * 100}%`
                      }}
                    >
                      <div className="tooltip-date">{hoveredTrendPoint.data.date}</div>
                      <div className="tooltip-row">
                        <span>{activeChartMetric === 'sessions' ? 'Oturum' : activeChartMetric === 'activeUsers' ? 'Kullanıcı' : 'Görüntüleme'}:</span>
                        <strong>{Number(hoveredTrendPoint.val).toLocaleString()}</strong>
                      </div>
                      <div className="tooltip-sub">Hemen Çıkma: {hoveredTrendPoint.data.bounceRate}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. COMPREHENSIVE SUB-NAVIGATION TABS */}
          <div className="growth-subnav-row">
            <div className="growth-subnav-pills">
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'channels' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('channels')}
              >
                <Layers size={13} />
                <span>Trafik Kanalları ({(analyticsData.trafficChannels || []).length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('pages')}
              >
                <FileText size={13} />
                <span>Popüler Sayfalar ({(analyticsData.topPages || []).length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'tech' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('tech')}
              >
                <Monitor size={13} />
                <span>Cihazlar & Teknoloji</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'demographics' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('demographics')}
              >
                <Globe2 size={13} />
                <span>Coğrafi Dağılım</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('events')}
              >
                <Zap size={13} />
                <span>Etkinlikler ({(analyticsData.events || []).length})</span>
              </button>
            </div>

            <div className="growth-table-toolbar-row">
              {['pages', 'channels'].includes(activeTabSub) && (
                <div className="growth-search-input-wrap">
                  <Search size={14} className="search-input-icon" />
                  <input
                    type="text"
                    placeholder="Listede ara..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="growth-search-input"
                  />
                </div>
              )}

              <button
                type="button"
                className="growth-btn growth-btn-secondary"
                onClick={handleExportCsv}
                title="Mevcut tabloyu CSV olarak indir"
              >
                <Download size={13} />
                <span>CSV İndir</span>
              </button>
            </div>
          </div>

          {/* 5. TAB CONTENT PANES */}
          <div className="growth-panel-card">
            {/* 1. CHANNELS TAB */}
            {activeTabSub === 'channels' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                    <Layers size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Edinme Kanalları (Default Channel Grouping)</span>
                      <span className="tab-badge-tag">GA4 Standart Kanal Grubu</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Kullanıcılarınızın sitenize hangi trafik kaynağından geldiğini gösterir. Organik Arama (SEO), Doğrudan (Direct), Sosyal Medya ve Yönlendirme (Referral) kaynaklarının performansını karşılaştırın.
                    </p>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  <table className="growth-table">
                    <thead>
                      <tr>
                        <th>Kanal Grubu</th>
                        <th>Paylaşım Dağılımı</th>
                        <th>Oturumlar</th>
                        <th>Kullanıcılar</th>
                        <th>Hemen Çıkma</th>
                        <th>Ort. Süre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData.trafficChannels || []).map((ch, cIdx) => {
                        const sharePct = totalSessions > 0 ? ((ch.sessions / totalSessions) * 100).toFixed(1) : 0;
                        const barColor = CHANNEL_COLORS[ch.channel] || '#38bdf8';
                        return (
                          <tr key={cIdx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: barColor, flexShrink: 0 }} />
                                <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{ch.channel}</strong>
                              </div>
                            </td>
                            <td style={{ minWidth: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, Math.max(2, sharePct))}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: 45, textAlign: 'right' }}>%{sharePct}</span>
                              </div>
                            </td>
                            <td className="font-semibold text-primary font-mono">{Number(ch.sessions).toLocaleString()}</td>
                            <td className="font-mono">{Number(ch.activeUsers).toLocaleString()}</td>
                            <td><span className="ctr-badge">{ch.bounceRate}</span></td>
                            <td className="font-mono text-muted">{formatDuration(ch.avgDurationSeconds)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. PAGES TAB */}
            {activeTabSub === 'pages' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(244, 114, 182, 0.12)', color: '#f472b6' }}>
                    <FileText size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Sayfalar ve Ekranlar (Pages & Screens)</span>
                      <span className="tab-badge-tag">{sortedPages.length} sayfa bulundu</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Ziyaretçilerin en çok vakit geçirdiği ve görüntülediği açılış sayfalarınız. Hemen çıkma oranı düşük olan sayfalar yüksek dönüşüm fırsatı sunar.
                    </p>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  <table className="growth-table">
                    <thead>
                      <tr>
                        <th className="growth-th-sortable" onClick={() => handleSortPages('pagePath')}>
                          <span className="th-sort-inner">
                            <span>Sayfa Yolu & Başlık</span>
                          </span>
                        </th>
                        <th className="growth-th-sortable" onClick={() => handleSortPages('views')}>
                          <span className="th-sort-inner">
                            <span>Görüntülenme</span>
                          </span>
                        </th>
                        <th className="growth-th-sortable" onClick={() => handleSortPages('activeUsers')}>
                          <span className="th-sort-inner">
                            <span>Tekil Ziyaretçi</span>
                          </span>
                        </th>
                        <th className="growth-th-sortable" onClick={() => handleSortPages('avgDurationSeconds')}>
                          <span className="th-sort-inner">
                            <span>Ortalama Süre</span>
                          </span>
                        </th>
                        <th className="growth-th-sortable" onClick={() => handleSortPages('bounceRate')}>
                          <span className="th-sort-inner">
                            <span>Hemen Çıkma</span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPagedList.map((pg, pIdx) => (
                        <tr key={pIdx}>
                          <td style={{ maxWidth: 380 }}>
                            <div className="query-cell">
                              <span className="query-name" title={pg.pagePath}>{pg.pagePath}</span>
                              {pg.pageTitle && (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {pg.pageTitle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="font-semibold text-primary font-mono">{Number(pg.views).toLocaleString()}</td>
                          <td className="font-mono">{Number(pg.activeUsers).toLocaleString()}</td>
                          <td className="font-mono text-muted">{formatDuration(pg.avgDurationSeconds)}</td>
                          <td><span className="ctr-badge">{pg.bounceRate}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  {totalPagesCount > 1 && (
                    <div className="growth-table-pagination">
                      <div className="pagination-info">
                        Toplam <strong>{sortedPages.length}</strong> sayfa arasından{' '}
                        <strong>{(pageCurrentPage - 1) * pageSize + 1}</strong> -{' '}
                        <strong>{Math.min(pageCurrentPage * pageSize, sortedPages.length)}</strong> arası gösteriliyor.
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setPageCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={pageCurrentPage === 1}
                        >
                          Önceki
                        </button>
                        <span style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                          Sayfa {pageCurrentPage} / {totalPagesCount}
                        </span>
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setPageCurrentPage(prev => Math.min(prev + 1, totalPagesCount))}
                          disabled={pageCurrentPage === totalPagesCount}
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. TECH & DEVICES TAB */}
            {activeTabSub === 'tech' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8' }}>
                    <Monitor size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Cihazlar, Tarayıcılar ve İşletim Sistemleri</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Kullanıcılarınızın sitenize bağlandığı donanım ve yazılım ortamı. Mobil uyumluluk ve tarayıcı optimizasyonları için teknik kararları yönlendirir.
                    </p>
                  </div>
                </div>

                <div className="growth-two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {/* Device Categories */}
                  <div className="growth-subcard" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Smartphone size={16} className="text-primary" />
                      <span>Cihaz Kategorisi Dağılımı</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {(analyticsData.devices || []).map((dev, dIdx) => {
                        const share = totalSessions > 0 ? Math.round((dev.sessions / totalSessions) * 100) : 0;
                        const isMobile = dev.category.includes('mobile');
                        const isTablet = dev.category.includes('tablet');
                        const Icon = isTablet ? Tablet : isMobile ? Smartphone : Monitor;
                        return (
                          <div key={dIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <Icon size={16} className="text-primary" />
                              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{dev.category}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>%{share}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>{dev.sessions} oturum</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Browsers & OS */}
                  <div className="growth-subcard" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe2 size={16} className="text-primary" />
                      <span>Tarayıcılar & İşletim Sistemleri</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {(analyticsData.browsers || []).slice(0, 7).map((br, bIdx) => (
                        <div key={bIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <div>
                            <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>{br.browser}</strong>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>OS: {br.os}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="font-mono font-semibold text-primary">{br.sessions}</span>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>oturum</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DEMOGRAPHICS TAB */}
            {activeTabSub === 'demographics' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>
                    <Globe2 size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>Coğrafi Konum Dağılımı (Ülkeler & Şehirler)</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Trafiğinizin dünya ve Türkiye genelindeki coğrafi yoğunluğu. Hedef pazarlarınızdaki büyüme eğilimini izleyin.
                    </p>
                  </div>
                </div>

                <div className="growth-two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {/* Countries */}
                  <div className="growth-subcard" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#ffffff' }}>En Çok Ziyaret Alan Ülkeler</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {(analyticsData.demographics?.countries || []).slice(0, 10).map((cnt, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{cnt.country}</span>
                          <span className="font-mono text-primary font-semibold">{cnt.sessions} oturum</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="growth-subcard" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#ffffff' }}>En Çok Ziyaret Alan Şehirler</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {(analyticsData.demographics?.cities || []).slice(0, 10).map((ct, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <div>
                            <strong style={{ color: '#f1f5f9', fontSize: '0.85rem' }}>{ct.city}</strong>
                            {ct.country && <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>{ct.country}</span>}
                          </div>
                          <span className="font-mono text-primary font-semibold">{ct.sessions} oturum</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. EVENTS TAB */}
            {activeTabSub === 'events' && (
              <div>
                <div className="growth-tab-infobar">
                  <div className="tab-infobar-icon" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
                    <Zap size={20} />
                  </div>
                  <div className="tab-infobar-content">
                    <h4 className="tab-infobar-title">
                      <span>GA4 Etkinlikleri ve Kullanıcı Aksiyonları (Events)</span>
                    </h4>
                    <p className="tab-infobar-desc">
                      Kullanıcıların sitenizde gerçekleştirdiği sayfa görüntüleme, kaydırma (scroll), tıklama ve form başlatma gibi somut mikro etkileşimlerin dökümü.
                    </p>
                  </div>
                </div>

                <div className="growth-table-wrap">
                  <table className="growth-table">
                    <thead>
                      <tr>
                        <th>Etkinlik Adı (Event Name)</th>
                        <th>Tetiklenme Sayısı</th>
                        <th>Kullanıcı Sayısı</th>
                        <th>Olay Başına Ort.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData.events || []).map((ev, eIdx) => {
                        const perUser = ev.totalUsers > 0 ? (ev.eventCount / ev.totalUsers).toFixed(1) : 0;
                        return (
                          <tr key={eIdx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={13} className="text-warning" />
                                <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{ev.eventName}</strong>
                              </div>
                            </td>
                            <td className="font-semibold text-primary font-mono">{Number(ev.eventCount).toLocaleString()}</td>
                            <td className="font-mono">{Number(ev.totalUsers).toLocaleString()}</td>
                            <td className="font-mono text-muted">{perUser} kez/kişi</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
