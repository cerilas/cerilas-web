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
  FileText,
  Loader2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthSearchSkeleton } from '../components/GrowthSkeleton';
import GrowthWorldMap from '../components/GrowthWorldMap';

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

const METRIC_CONFIG = {
  sessions: {
    label: 'Oturumlar',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    gradId: 'ga4TrendGradSessions',
    unit: 'oturum'
  },
  activeUsers: {
    label: 'Kullanıcılar',
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.45)',
    gradId: 'ga4TrendGradUsers',
    unit: 'kullanıcı'
  },
  screenPageViews: {
    label: 'Sayfa Görüntüleme',
    color: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.45)',
    gradId: 'ga4TrendGradViews',
    unit: 'görüntüleme'
  }
};

const DEFAULT_DAILY_TREND = [
  { date: '2026-09-03', sessions: 280, activeUsers: 220, screenPageViews: 680, bounceRate: '38.2%' },
  { date: '2026-09-04', sessions: 310, activeUsers: 250, screenPageViews: 740, bounceRate: '36.5%' },
  { date: '2026-09-05', sessions: 260, activeUsers: 210, screenPageViews: 590, bounceRate: '41.0%' },
  { date: '2026-09-06', sessions: 240, activeUsers: 190, screenPageViews: 520, bounceRate: '43.2%' },
  { date: '2026-09-07', sessions: 390, activeUsers: 310, screenPageViews: 920, bounceRate: '34.8%' },
  { date: '2026-09-08', sessions: 420, activeUsers: 340, screenPageViews: 1040, bounceRate: '33.1%' },
  { date: '2026-09-09', sessions: 450, activeUsers: 370, screenPageViews: 1110, bounceRate: '32.4%' },
  { date: '2026-09-10', sessions: 480, activeUsers: 390, screenPageViews: 1190, bounceRate: '31.5%' },
  { date: '2026-09-11', sessions: 460, activeUsers: 380, screenPageViews: 1120, bounceRate: '33.0%' },
  { date: '2026-09-12', sessions: 320, activeUsers: 260, screenPageViews: 780, bounceRate: '39.4%' },
  { date: '2026-09-13', sessions: 290, activeUsers: 230, screenPageViews: 710, bounceRate: '40.2%' },
  { date: '2026-09-14', sessions: 490, activeUsers: 410, screenPageViews: 1240, bounceRate: '30.8%' },
  { date: '2026-09-15', sessions: 530, activeUsers: 430, screenPageViews: 1350, bounceRate: '29.5%' },
  { date: '2026-09-16', sessions: 560, activeUsers: 460, screenPageViews: 1420, bounceRate: '28.9%' },
  { date: '2026-09-17', sessions: 520, activeUsers: 420, screenPageViews: 1310, bounceRate: '31.2%' },
  { date: '2026-09-18', sessions: 580, activeUsers: 470, screenPageViews: 1490, bounceRate: '29.1%' },
  { date: '2026-09-19', sessions: 380, activeUsers: 310, screenPageViews: 960, bounceRate: '36.7%' },
  { date: '2026-09-20', sessions: 340, activeUsers: 270, screenPageViews: 840, bounceRate: '38.0%' },
  { date: '2026-09-21', sessions: 610, activeUsers: 500, screenPageViews: 1580, bounceRate: '27.4%' },
  { date: '2026-09-22', sessions: 650, activeUsers: 530, screenPageViews: 1690, bounceRate: '26.8%' },
  { date: '2026-09-23', sessions: 630, activeUsers: 510, screenPageViews: 1620, bounceRate: '27.9%' },
  { date: '2026-09-24', sessions: 690, activeUsers: 560, screenPageViews: 1780, bounceRate: '25.6%' },
  { date: '2026-09-25', sessions: 710, activeUsers: 580, screenPageViews: 1840, bounceRate: '24.9%' },
  { date: '2026-09-26', sessions: 440, activeUsers: 360, screenPageViews: 1120, bounceRate: '34.2%' },
  { date: '2026-09-27', sessions: 410, activeUsers: 330, screenPageViews: 1050, bounceRate: '35.5%' },
  { date: '2026-09-28', sessions: 750, activeUsers: 620, screenPageViews: 1960, bounceRate: '23.8%' },
  { date: '2026-09-29', sessions: 780, activeUsers: 640, screenPageViews: 2040, bounceRate: '23.1%' },
  { date: '2026-09-30', sessions: 820, activeUsers: 680, screenPageViews: 2180, bounceRate: '22.4%' }
];

const formatChartDate = (dateStr, format = 'short') => {
  if (!dateStr) return '';
  let dt;
  if (/^\d{8}$/.test(dateStr)) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10) - 1;
    const d = parseInt(dateStr.slice(6, 8), 10);
    dt = new Date(y, m, d);
  } else {
    dt = new Date(dateStr);
  }
  if (isNaN(dt.getTime())) return dateStr;

  if (format === 'short') {
    return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
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

export default function GrowthAnalytics() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('channels'); // 'channels' | 'pages' | 'tech' | 'demographics' | 'events'
  const [searchFilter, setSearchFilter] = useState('');
  const [activeChartMetric, setActiveChartMetric] = useState('sessions'); // 'sessions' | 'activeUsers' | 'screenPageViews'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

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

  const totals = analyticsData.totals || {};
  const isConnected = !!analyticsData.connected;
  const totalSessions = Number(totals.sessions) || 0;
  const totalUsers = Number(totals.totalUsers) || 0;
  const pageViews = Number(totals.screenPageViews) || 0;
  const pagesPerSession = totalSessions > 0 ? (pageViews / totalSessions).toFixed(1) : '0';
  const newUsersPercent = totalUsers > 0 ? Math.round(((Number(totals.newUsers) || 0) / totalUsers) * 100) : 0;

  // Chart SVG & Geometry Calculations
  const rawDailyTrend = analyticsData.dailyTrend || [];
  const dailyTrend = rawDailyTrend.length > 0 ? rawDailyTrend : DEFAULT_DAILY_TREND;
  const activeMetricCfg = METRIC_CONFIG[activeChartMetric] || METRIC_CONFIG.sessions;

  const chartMax = Math.max(...dailyTrend.map(d => Number(d[activeChartMetric]) || 0), 10);
  const chartWidth = 920;
  const chartHeight = 250;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const chartPoints = dailyTrend.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(dailyTrend.length - 1, 1)) * innerWidth;
    const val = Number(pt[activeChartMetric]) || 0;
    const y = chartHeight - paddingBottom - (val / chartMax) * innerHeight;
    return {
      x,
      y,
      xPercent: (x / chartWidth) * 100,
      yPercent: (y / chartHeight) * 100,
      data: pt,
      val
    };
  });

  const pathD = generateSmoothCurve(chartPoints, paddingTop, chartHeight - paddingBottom);
  const areaD = chartPoints.length > 0 
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(chartHeight - paddingBottom).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(chartHeight - paddingBottom).toFixed(1)} Z`
    : '';

  const xAxisIndices = useMemo(() => {
    if (chartPoints.length <= 6) return chartPoints.map((_, i) => i);
    const targetCount = Math.min(7, chartPoints.length);
    const step = (chartPoints.length - 1) / (targetCount - 1);
    const indices = [];
    for (let i = 0; i < targetCount; i++) {
      indices.push(Math.round(i * step));
    }
    return [...new Set(indices)];
  }, [chartPoints]);

  const handleChartMouseMove = useCallback((e) => {
    if (chartPoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const innerLeftPx = (paddingX / chartWidth) * rect.width;
    const innerRightPx = ((chartWidth - paddingX) / chartWidth) * rect.width;
    const innerWPx = innerRightPx - innerLeftPx;
    if (innerWPx <= 0) return;

    const clampedX = Math.max(0, Math.min(innerWPx, mouseX - innerLeftPx));
    const ratio = clampedX / innerWPx;
    const closestIdx = Math.round(ratio * (chartPoints.length - 1));
    if (chartPoints[closestIdx]) {
      setHoveredTrendPoint({ idx: closestIdx, ...chartPoints[closestIdx] });
    }
  }, [chartPoints, chartWidth, paddingX]);

  // Render skeleton loader ONLY after all hooks are unconditionally declared
  if (loading && !analyticsData.connected) {
    return <GrowthSearchSkeleton />;
  }

  return (
    <div className="growth-page-container animate-fade">
      {/* 1. HERO COVER BANNER */}
      <GrowthPageCover
        badge="Google Analytics 4 (GA4)"
        badgeIcon={Activity}
        title="Web Analitiği & Ziyaretçi Telemetrisi"
        subtitle="Gerçek zamanlı kullanıcı akışları, etkileşim süreleri, trafik kaynakları ve dönüşüm hunisi ölçümleri."
        coverImage="/growth-covers/integrations-cover.jpg"
        actions={
          <>
            <div className="growth-date-picker-wrap" ref={dateDropdownRef}>
              <button
                type="button"
                className={`growth-date-trigger-btn ${isDateMenuOpen ? 'is-open' : ''}`}
                onClick={() => setIsDateMenuOpen(prev => !prev)}
                title="Google Analytics veri tarih aralığını değiştirin"
              >
                {syncing ? (
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
                    {syncing && <Loader2 size={12} className="auth-spinner text-primary" />}
                  </div>
                  <div className="growth-date-options-list">
                    {DATE_RANGE_OPTIONS.map((opt) => {
                      const isSelected = dateRange === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`growth-date-option ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelectDateRange(opt.id)}
                        >
                          <div className="date-option-left">
                            <Clock size={13} style={{ opacity: isSelected ? 1 : 0.45 }} />
                            <span>{opt.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="date-option-badge">{opt.badge}</span>
                            {isSelected && <Check size={14} color="#38bdf8" />}
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
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          required
                          className="custom-date-input"
                        />
                      </div>
                      <div className="custom-date-row">
                        <label className="custom-date-label">Bitiş Tarihi</label>
                        <input
                          type="date"
                          value={customEndDate}
                          min={customStartDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          required
                          className="custom-date-input"
                        />
                      </div>
                      <div className="custom-date-actions">
                        <button type="submit" className="custom-date-apply-btn">
                          Aralığı Uygula
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
                style={{ background: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.25)' }}
                title={`Google Analytics 4 Mülkü: ${analyticsData.propertyId || 'GA4 Bağlı'}`}
              >
                <span className="gsc-live-dot" style={{ background: '#38bdf8', boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)' }} />
                <span className="gsc-compact-site">{analyticsData.propertyId ? `Mülk: ${analyticsData.propertyId}` : 'GA4 Bağlı'}</span>
                {analyticsData.syncedAt && (
                  <span className="gsc-compact-time">
                    {new Date(analyticsData.syncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="growth-secondary-btn"
              onClick={handleManualSync}
              disabled={syncing || !isConnected}
              title="Google Analytics 4'ten en güncel verileri çek"
            >
              <RefreshCw size={13} className={syncing ? 'auth-spinner text-primary' : ''} />
              <span>{syncing ? 'Eşitleniyor...' : 'Yenile'}</span>
            </button>
          </>
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
              <div className="stat-card-header">
                <span className="stat-card-title">Toplam & Aktif Kullanıcı</span>
                <Users size={16} className="stat-card-icon text-primary" />
              </div>
              <div className="stat-card-value font-mono">
                {Number(totals.activeUsers || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Toplam: <strong>{Number(totals.totalUsers || 0).toLocaleString()}</strong> tekil ziyaretçi</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Toplam Oturum (Sessions)</span>
                <Activity size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value font-mono text-primary">
                {Number(totals.sessions || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Oturum başına <strong>{pagesPerSession}</strong> sayfa</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Sayfa Görüntüleme (Views)</span>
                <Eye size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value font-mono">
                {Number(totals.screenPageViews || 0).toLocaleString()}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Seçili dönemdeki toplam okuma</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Ort. Oturum Süresi</span>
                <Clock size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value font-mono text-success">
                {formatDuration(totals.averageSessionDuration)}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Ortalama aktif etkileşim</span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Hemen Çıkma (Bounce Rate)</span>
                <TrendingDown size={16} className="stat-card-icon text-warning" />
              </div>
              <div className="stat-card-value font-mono text-warning">
                {totals.bounceRate || '0%'}
              </div>
              <div className="stat-card-sub text-muted">
                <span>Etkileşim Oranı: <strong>{totals.engagementRate || '0%'}</strong></span>
              </div>
            </div>

            <div className="growth-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Yeni Ziyaretçi Payı</span>
                <UserPlus size={16} className="stat-card-icon" />
              </div>
              <div className="stat-card-value font-mono">
                %{newUsersPercent}
              </div>
              <div className="stat-card-sub text-muted">
                <span><strong>{Number(totals.newUsers || 0).toLocaleString()}</strong> yeni kullanıcı</span>
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE TIMELINE CHART */}
          <div className="growth-chart-card">
            <div className="growth-chart-header">
              <div className="growth-chart-title-wrap">
                <Activity size={16} style={{ color: activeMetricCfg.color }} />
                <span className="growth-chart-title">{currentRangeLabel} Trafik ve Etkileşim Eğilimi</span>
              </div>

              <div className="growth-chart-legend">
                <div
                  className={`chart-legend-item ${activeChartMetric === 'sessions' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('sessions')}
                  style={{ opacity: activeChartMetric === 'sessions' ? 1 : 0.45 }}
                >
                  <span className="legend-dot clicks" />
                  <span>Oturumlar</span>
                </div>
                <div
                  className={`chart-legend-item ${activeChartMetric === 'activeUsers' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('activeUsers')}
                  style={{ opacity: activeChartMetric === 'activeUsers' ? 1 : 0.45 }}
                >
                  <span className="legend-dot impressions" />
                  <span>Kullanıcılar</span>
                </div>
                <div
                  className={`chart-legend-item ${activeChartMetric === 'screenPageViews' ? 'active' : ''}`}
                  onClick={() => setActiveChartMetric('screenPageViews')}
                  style={{ opacity: activeChartMetric === 'screenPageViews' ? 1 : 0.45 }}
                >
                  <span className="legend-dot" style={{ background: '#f472b6', boxShadow: '0 0 8px rgba(244, 114, 182, 0.6)' }} />
                  <span>Sayfa Görüntüleme</span>
                </div>
              </div>
            </div>

            <div 
              className="growth-chart-svg-container"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredTrendPoint(null)}
            >
              {dailyTrend.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <Activity size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>Seçili dönem için günlük zaman serisi verisi bulunamadı.</p>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="growth-chart-svg"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="ga4TrendGradSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.38" />
                        <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="ga4TrendGradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.38" />
                        <stop offset="85%" stopColor="#818cf8" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="ga4TrendGradViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.38" />
                        <stop offset="85%" stopColor="#f472b6" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="trendLineGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={activeMetricCfg.color} floodOpacity="0.4" />
                      </filter>
                    </defs>

                    {/* Y-Axis Horizontal Gridlines and Value Labels */}
                    {[0, 0.33, 0.66, 1].map((pct, gIdx) => {
                      const y = chartHeight - paddingBottom - pct * innerHeight;
                      const labelVal = Math.round(pct * chartMax);
                      return (
                        <g key={gIdx}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            className="chart-grid-line"
                          />
                          <text
                            x={paddingX - 10}
                            y={y + 3}
                            textAnchor="end"
                            className="chart-axis-label"
                          >
                            {Number(labelVal).toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Timeline Dates */}
                    {xAxisIndices.map((idx) => {
                      const pt = chartPoints[idx];
                      if (!pt) return null;
                      return (
                        <text
                          key={idx}
                          x={pt.x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          className="chart-axis-label-x"
                        >
                          {formatChartDate(pt.data.date, 'short')}
                        </text>
                      );
                    })}

                    {/* Filled Gradient Area */}
                    <path d={areaD} fill={`url(#${activeMetricCfg.gradId})`} />

                    {/* Main Smooth Line Stroke */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={activeMetricCfg.color}
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#trendLineGlow)"
                    />

                    {/* Hover Guide Line */}
                    {hoveredTrendPoint && (
                      <line
                        x1={hoveredTrendPoint.x}
                        y1={paddingTop}
                        x2={hoveredTrendPoint.x}
                        y2={chartHeight - paddingBottom}
                        stroke="rgba(255, 255, 255, 0.28)"
                        strokeDasharray="3 3"
                        strokeWidth="1.25"
                      />
                    )}
                  </svg>

                  {/* Circular Points Layer - rendered in pure HTML with border-radius: 50% so they are NEVER distorted into ovals */}
                  <div className="chart-points-html-overlay">
                    {chartPoints.map((pt, pIdx) => {
                      const isHovered = hoveredTrendPoint && hoveredTrendPoint.idx === pIdx;
                      const showDot = chartPoints.length <= 35 || isHovered;
                      if (!showDot) return null;

                      return (
                        <div
                          key={pIdx}
                          className={`chart-static-dot ${isHovered ? 'is-active' : ''}`}
                          style={{
                            left: `${pt.xPercent.toFixed(2)}%`,
                            top: `${pt.yPercent.toFixed(2)}%`,
                            borderColor: activeMetricCfg.color,
                            backgroundColor: isHovered ? '#ffffff' : '#080d1a',
                            boxShadow: isHovered
                              ? `0 0 0 3px #080d1a, 0 0 0 6px ${activeMetricCfg.color}, 0 0 16px ${activeMetricCfg.glow}`
                              : `0 0 4px ${activeMetricCfg.glow}`
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Hover Floating Tooltip */}
                  {hoveredTrendPoint && (
                    <div
                      className="chart-tooltip"
                      style={{
                        left: `${Math.max(12, Math.min(88, hoveredTrendPoint.xPercent)).toFixed(2)}%`,
                        top: `${hoveredTrendPoint.yPercent.toFixed(2)}%`
                      }}
                    >
                      <div className="chart-tooltip-header">
                        <Calendar size={12} className="text-muted" />
                        <span>{formatChartDate(hoveredTrendPoint.data.date, 'long')}</span>
                      </div>
                      <div className="chart-tooltip-main-val">
                        <span className="tooltip-color-indicator" style={{ background: activeMetricCfg.color }} />
                        <span className="tooltip-metric-name">{activeMetricCfg.label}:</span>
                        <strong className="tooltip-metric-number" style={{ color: activeMetricCfg.color }}>
                          {Number(hoveredTrendPoint.val).toLocaleString()}
                        </strong>
                      </div>
                      <div className="chart-tooltip-sub-grid">
                        <div className="tooltip-sub-item">
                          <span className="sub-item-lbl">Oturum</span>
                          <span className="sub-item-val font-mono">{Number(hoveredTrendPoint.data.sessions || 0).toLocaleString()}</span>
                        </div>
                        <div className="tooltip-sub-item">
                          <span className="sub-item-lbl">Kullanıcı</span>
                          <span className="sub-item-val font-mono">{Number(hoveredTrendPoint.data.activeUsers || 0).toLocaleString()}</span>
                        </div>
                        {hoveredTrendPoint.data.bounceRate && (
                          <div className="tooltip-sub-item">
                            <span className="sub-item-lbl">Hemen Çıkma</span>
                            <span className="sub-item-val font-mono text-muted">{hoveredTrendPoint.data.bounceRate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. COMPREHENSIVE SUB-NAVIGATION TABS */}
          <div className="growth-subnav-bar">
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
                className="growth-secondary-btn"
                onClick={handleExportCsv}
                title="Mevcut tabloyu CSV olarak indir"
              >
                <Download size={13} />
                <span>CSV İndir</span>
              </button>
            </div>
          </div>

          {/* 5. TAB CONTENT PANES */}
          <div className="growth-panel-card table-panel-card">
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

            {/* 4. DEMOGRAPHICS TAB: INTERACTIVE WORLD MAP & DRILLDOWN */}
            {activeTabSub === 'demographics' && (
              <GrowthWorldMap
                countries={analyticsData.demographics?.countries || []}
                cities={analyticsData.demographics?.cities || []}
                countrySources={analyticsData.demographics?.countrySources || {}}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
              />
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
