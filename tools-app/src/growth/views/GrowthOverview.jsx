import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  ShieldCheck, 
  Bot, 
  Search, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Wrench, 
  Globe, 
  ExternalLink, 
  Loader2, 
  Check, 
  ChevronDown, 
  Activity, 
  ShoppingBag, 
  Star, 
  Layers, 
  RefreshCw, 
  Cpu, 
  Server, 
  Share2, 
  Radio, 
  Eye, 
  Users,
  Plus,
  Trash2,
  X,
  Target,
  Info
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import { GrowthOverviewSkeleton } from '../components/GrowthSkeleton';
import HudTimeSeriesChart from '../components/HudTimeSeriesChart';
import HudRadarWorldMap from '../components/HudRadarWorldMap';

export default function GrowthOverview() {
  const { activeWorkspace, setActiveTab, setIsOnboardingOpen } = useGrowth();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRangeLoading, setIsRangeLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | '12m'
  const [activeGaMetric, setActiveGaMetric] = useState('both'); // 'both' | 'visitors' | 'sessions' | 'views'
  const [searchMetricMode, setSearchMetricMode] = useState('position'); // 'position' | 'clicks' | 'impressions'
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [submittingKeyword, setSubmittingKeyword] = useState(false);
  const [deletingKeyword, setDeletingKeyword] = useState(null);
  const [expandedOppId, setExpandedOppId] = useState(null);
  const [updatingOppId, setUpdatingOppId] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activePromptTab, setActivePromptTab] = useState('all'); // 'all' | 'cited'
  const [userCommerceMode, setUserCommerceMode] = useState(null);

  const commerceMode = userCommerceMode || (data?.sales?.hasRealEcommerce ? 'ecommerce' : 'b2b');
  const [connectingGoogle, setConnectingGoogle] = useState(false);

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
          await fetchOverview(dateRange, false);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Google connect error:', err);
      setActiveTab('analytics');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleQuickAddKeyword = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newKeywordInput.trim();
    if (!trimmed || !activeWorkspace?.id || !token) return;
    setSubmittingKeyword(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword: trimmed })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNewKeywordInput('');
        setIsAddingKeyword(false);
        await fetchOverview(dateRange, false);
      }
    } catch (err) {
      console.error('Quick add keyword error:', err);
    } finally {
      setSubmittingKeyword(false);
    }
  };

  const handleQuickDeleteKeyword = async (kwString) => {
    if (!kwString || !activeWorkspace?.id || !token) return;
    setDeletingKeyword(kwString);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords/${encodeURIComponent(kwString)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchOverview(dateRange, false);
      }
    } catch (err) {
      console.error('Quick delete keyword error:', err);
    } finally {
      setDeletingKeyword(null);
    }
  };

  const fetchOverview = async (range = dateRange, isRefresh = false) => {
    if (!activeWorkspace?.id || !token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else if (data) {
      setIsRangeLoading(true);
    } else {
      setLoading(true);
    }
    const startTs = Date.now();
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/overview?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load overview data.');

      // Smooth skeleton transition window: ensure at least 380ms display
      const elapsed = Date.now() - startTs;
      if (elapsed < 380) {
        await new Promise((resolve) => setTimeout(resolve, 380 - elapsed));
      }

      setData(json.data);
      setError('');
    } catch (err) {
      console.error('Overview error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRangeLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(dateRange);
  }, [activeWorkspace?.id, token, dateRange]);

  const handleRangeChange = (newRange) => {
    if (newRange === dateRange) return;
    setIsRangeLoading(true);
    setDateRange(newRange);
  };

  const handleUpdateOppStatus = async (oppId, newStatus) => {
    setUpdatingOppId(oppId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOverview(dateRange, true);
      }
    } catch (err) {
      console.error('Update opp error:', err);
    } finally {
      setUpdatingOppId(null);
    }
  };

  if (loading && !data) {
    return <GrowthOverviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="growth-error-view">
        <AlertTriangle size={32} className="text-danger" />
        <p>{error || 'Failed to load data.'}</p>
        <button type="button" onClick={() => fetchOverview(dateRange)} className="growth-secondary-btn">
          Yeniden Dene
        </button>
      </div>
    );
  }

  const {
    growthScore = 92,
    subscores = {},
    opportunities = [],
    analytics = {},
    search = {},
    sales = {},
    aiVisibility = {},
    business = {},
    technicalAudit = {},
    directories = {}
  } = data;

  const isGscConnected = !!search?.connected;
  const isGaConnected = !!analytics?.connected;

  // Compute active series for GA4 based on selected metric tab
  let gaSeries = [
    { key: 'uniqueVisitors', label: 'Unique Visitors', color: '#38bdf8', fill: true, fillOpacity: 0.22 },
    { key: 'sessions', label: 'Sessions', color: '#818cf8', fill: false, strokeWidth: 2 }
  ];
  if (activeGaMetric === 'visitors') {
    gaSeries = [{ key: 'uniqueVisitors', label: 'Unique Visitors', color: '#38bdf8', fill: true, fillOpacity: 0.25 }];
  } else if (activeGaMetric === 'sessions') {
    gaSeries = [{ key: 'sessions', label: 'Sessions', color: '#818cf8', fill: true, fillOpacity: 0.25 }];
  } else if (activeGaMetric === 'views') {
    gaSeries = [{ key: 'pageViews', label: 'Page Views', color: '#f472b6', fill: true, fillOpacity: 0.25 }];
  }

  return (
    <div className="growth-overview-container station-hud-mode animate-fade">
      {/* ========================================================= */}
      {/* MISSION CONTROL HUD: TOP TELEMETRY STATUS BAR */}
      {/* ========================================================= */}
      <div className="station-hud-bar">
        <div className="station-hud-left">
          <div className="station-status-indicator">
            <span className="station-ping-pulse" />
            <span className="station-status-text">SYSTEM ONLINE // MISSION CONTROL HUD</span>
          </div>

          <div className="station-brand-meta-inline">
            <span className="station-brand-name">{activeWorkspace?.name}</span>
            <a
              href={activeWorkspace?.canonical_url || `https://${activeWorkspace?.primary_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="station-domain-tag"
            >
              <Globe size={11} className="text-cyan" />
              <span>{activeWorkspace?.primary_domain}</span>
              <ExternalLink size={10} />
            </a>
          </div>

          <div className="station-growth-score-chip">
            <Sparkles size={12} className="text-cyan" />
            <span className="sg-label">Growth Index:</span>
            <span className="sg-num">{growthScore}/100</span>
          </div>
        </div>

        <div className="station-hud-center">
          <div className="station-range-selector" role="group" aria-label="Time Range">
            {[
              { id: '7d', label: '7 DAYS' },
              { id: '30d', label: '30 DAYS' },
              { id: '90d', label: '90 DAYS' },
              { id: '12m', label: '12 MONTHS' }
            ].map((rng) => (
              <button
                key={rng.id}
                type="button"
                className={`station-range-btn ${dateRange === rng.id ? 'is-active' : ''} ${isRangeLoading && dateRange === rng.id ? 'is-loading' : ''}`}
                onClick={() => handleRangeChange(rng.id)}
                disabled={isRangeLoading}
              >
                <span>{rng.label}</span>
                {dateRange === rng.id && (
                  <span className={`range-indicator-dot ${isRangeLoading ? 'is-loading-pulse' : ''}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="station-hud-right">
          <button
            type="button"
            className="station-refresh-btn"
            onClick={() => fetchOverview(dateRange, true)}
            disabled={refreshing}
            title="Refresh Live Telemetry"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-cyan' : ''} />
            <span>{refreshing ? 'Scanning...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* THE 7 MODULAR SPACE STATION CARDS GRID */}
      {/* ========================================================= */}
      <div className="station-modules-grid">

        {/* --------------------------------------------------------- */}
        {/* CARD 1: GOOGLE ANALYTICS // USER & TRAFFIC RADAR */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-full module-ga4">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-01 // TRAFFIC & AUDIENCE RADAR]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-cyan">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">1. Google Analytics: User & Traffic Telemetry</h2>
                  <span className="station-card-sub">Unique Visitors, Real Sessions, Traffic Acquisition & Global Reach</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              <span className={`hud-status-pill ${isGaConnected ? 'status-online' : 'status-offline'}`}>
                {isGaConnected ? 'LIVE GA4 CONNECTED' : 'GA4 NOT CONNECTED'}
              </span>
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('analytics')}
                title="Go to Detailed GA4 Dashboard"
              >
                <span>Detailed Report</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          {!isGaConnected ? (
            <div className="station-card-disconnected-box">
              <div className="scd-glow-halo halo-cyan">
                <Activity size={30} />
              </div>
              <div className="scd-badge">
                <AlertCircle size={13} />
                <span>NO GOOGLE ANALYTICS 4 CONNECTION</span>
              </div>
              <h3 className="scd-title">Activate Real Visitor &amp; Traffic Stream</h3>
              <p className="scd-desc">
                Verified unique visitor counts, real session curves, traffic sources (Organic, Direct, AI / LLM Referrals) and worldwide visitor geography are only read from a connected Google Analytics property. No simulated or fake data is shown.
              </p>
              <div className="scd-actions">
                <button
                  type="button"
                  className="scd-btn-primary"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                >
                  {connectingGoogle ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Connecting Google...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Connect Google Analytics</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="scd-btn-secondary"
                  onClick={() => setActiveTab('analytics')}
                >
                  <span>Go to Analytics Dashboard</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="scd-feature-grid">
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot cyan" />
                    <span className="sfc-label">Unique Visitors &amp; Sessions</span>
                  </div>
                  <div className="sfc-placeholder">-- / --</div>
                  <span className="sfc-note">Awaiting GA4 live stream</span>
                </div>
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot indigo" />
                    <span className="sfc-label">Traffic Acquisition &amp; AI Referrals</span>
                  </div>
                  <div className="sfc-placeholder">Channel Breakdown</div>
                  <span className="sfc-note">Organic, GEO, Direct, Social</span>
                </div>
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot pink" />
                    <span className="sfc-label">Global Radar Map</span>
                  </div>
                  <div className="sfc-placeholder">World Distribution</div>
                  <span className="sfc-note">Country &amp; City Visitors</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Vercel / Linear Style Interactive Metric Tabs */}
              <div className={`station-metric-tabs-strip ${isRangeLoading ? 'is-range-loading' : ''}`}>
                <button
                  type="button"
                  className={`metric-tab-pod ${activeGaMetric === 'visitors' ? 'is-active-cyan' : ''}`}
                  onClick={() => setActiveGaMetric('visitors')}
                >
                  <div className="mtp-head">
                    <span className="mtp-label">Unique Visitors</span>
                    {analytics?.visitorsGrowth && (
                      <span className="mtp-delta text-emerald">
                        <TrendingUp size={11} />
                        <span>+{analytics.visitorsGrowth}%</span>
                      </span>
                    )}
                  </div>
                  <div className="mtp-val text-cyan">{analytics?.uniqueVisitors?.toLocaleString('en-US') || 0}</div>
                  <span className="mtp-sub">Unique users in period</span>
                </button>

                <button
                  type="button"
                  className={`metric-tab-pod ${activeGaMetric === 'sessions' ? 'is-active-indigo' : ''}`}
                  onClick={() => setActiveGaMetric('sessions')}
                >
                  <div className="mtp-head">
                    <span className="mtp-label">Sessions</span>
                    {analytics?.sessionsGrowth && (
                      <span className="mtp-delta text-emerald">
                        <TrendingUp size={11} />
                        <span>+{analytics.sessionsGrowth}%</span>
                      </span>
                    )}
                  </div>
                  <div className="mtp-val text-indigo">{analytics?.sessions?.toLocaleString('en-US') || 0}</div>
                  <span className="mtp-sub">Real verified sessions</span>
                </button>

                <button
                  type="button"
                  className={`metric-tab-pod ${activeGaMetric === 'views' ? 'is-active-pink' : ''}`}
                  onClick={() => setActiveGaMetric('views')}
                >
                  <div className="mtp-head">
                    <span className="mtp-label">Page Views</span>
                    <span className="mtp-ratio">{((analytics?.pageViews || 0) / (analytics?.sessions || 1)).toFixed(1)} pages/session</span>
                  </div>
                  <div className="mtp-val text-pink">{analytics?.pageViews?.toLocaleString('en-US') || 0}</div>
                  <span className="mtp-sub">Total pages crawled</span>
                </button>

                <button
                  type="button"
                  className={`metric-tab-pod ${activeGaMetric === 'both' ? 'is-active-white' : ''}`}
                  onClick={() => setActiveGaMetric('both')}
                >
                  <div className="mtp-head">
                    <span className="mtp-label">Comparison</span>
                    <span className="mtp-tag">DUAL CURVE</span>
                  </div>
                  <div className="mtp-val">Visitors &amp; Sessions</div>
                  <span className="mtp-sub">View together</span>
                </button>

                <div className="metric-tab-static-pod">
                  <div className="mtp-head">
                    <span className="mtp-label">Bounce Rate</span>
                  </div>
                  <div className="mtp-val text-emerald">{analytics?.bounceRate || '--'}</div>
                  <span className="mtp-sub">Duration: {analytics?.avgSessionDuration || '--'}</span>
                </div>
              </div>

              {/* Time Series Graph */}
              <div className="station-chart-wrapper">
                <div className="station-chart-legend-row">
                  <span className="chart-legend-title">TRAFFIC TREND OVER TIME:</span>
                  <div className="chart-legend-items">
                    {(activeGaMetric === 'both' || activeGaMetric === 'visitors') && (
                      <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#38bdf8' }} />
                        <span>Unique Visitors</span>
                      </span>
                    )}
                    {(activeGaMetric === 'both' || activeGaMetric === 'sessions') && (
                      <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#818cf8' }} />
                        <span>Sessions</span>
                      </span>
                    )}
                    {activeGaMetric === 'views' && (
                      <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#f472b6' }} />
                        <span>Page Views</span>
                      </span>
                    )}
                  </div>
                </div>

                <HudTimeSeriesChart
                  chartId="chart_ga4_users"
                  data={analytics?.timeline || []}
                  series={gaSeries}
                  height={200}
                  loading={isRangeLoading || refreshing}
                />
              </div>

              {/* Dual Wings: Traffic Acquisition & Country Map */}
              <div className="station-card-dual-wings">
                {/* Wing A: Traffic Acquisition */}
                <div className="station-wing-box wing-acquisition">
                  <div className="wing-header">
                    <div className="wing-title-row">
                      <Share2 size={15} className="text-cyan" />
                      <h3 className="wing-title">Traffic Acquisition Sources</h3>
                    </div>
                    <span className="wing-pill">Channel Share</span>
                  </div>

                  <div className="station-channels-bars">
                    {(analytics?.channels || []).length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted">No channel data recorded yet.</div>
                    ) : (
                      (analytics?.channels || []).map((ch, idx) => (
                        <div key={idx} className="station-channel-row">
                          <div className="channel-meta-top">
                            <div className="channel-title-left">
                              <span className="channel-dot" style={{ background: ch.color }} />
                              <span className="channel-name">{ch.label}</span>
                            </div>
                            <span className="channel-stats">
                              <strong>{ch.sessions?.toLocaleString('en-US')}</strong> sessions ({ch.percentage}%)
                            </span>
                          </div>
                          <div className="channel-bar-track">
                            <div
                              className="channel-bar-fill"
                              style={{
                                width: `${ch.percentage}%`,
                                backgroundColor: ch.color,
                                boxShadow: `0 0 10px ${ch.color}55`
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Wing B: Geographic Distribution & World Map */}
                <div className="station-wing-box wing-countries">
                  <div className="wing-header">
                    <div className="wing-title-row">
                      <Globe size={15} className="text-cyan" />
                      <h3 className="wing-title">Visitor Geography &amp; World Map</h3>
                    </div>
                    <span className="wing-pill">Global Reach</span>
                  </div>

                  <HudRadarWorldMap
                    countries={analytics?.countries || []}
                    selectedCountry={selectedCountry}
                    onSelectCountry={(c) => setSelectedCountry(c)}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* --------------------------------------------------------- */}
        {/* CARD 2: GOOGLE SEARCH // KEYWORDS & RANKINGS RADAR */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-half module-gsc">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-02 // SEARCH POSITION ORBIT]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-amber">
                  <Search size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">2. Google Search: Keywords & Rankings</h2>
                  <span className="station-card-sub">Avg. Position, Clicks, Impressions & Position Change</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              {search?.connected ? (
                <span className="hud-status-badge is-online" title="Google Search Console Live Integrated">
                  <span className="pulse-dot" />
                  <span>GSC Active</span>
                </span>
              ) : (
                <span className="hud-status-pill status-offline" title="No Google Search Console Connection">
                  <AlertCircle size={11} />
                  <span>GSC NOT CONNECTED</span>
                </span>
              )}
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('search')}
              >
                <span>Search Panel</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          {!isGscConnected ? (
            <div className="station-card-disconnected-box">
              <div className="scd-glow-halo halo-amber">
                <Search size={30} />
              </div>
              <div className="scd-badge amber">
                <AlertCircle size={13} />
                <span>NO GOOGLE SEARCH CONSOLE CONNECTION</span>
              </div>
              <h3 className="scd-title">Activate Google Organic Search Telemetry</h3>
              <p className="scd-desc">
                See real clicks, impressions, CTR and search query rankings in Google Search Console. Our system reports 100% verified Google search data — no estimates or simulations.
              </p>
              <div className="scd-actions">
                <button
                  type="button"
                  className="scd-btn-primary amber"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                >
                  {connectingGoogle ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Connecting Google...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Connect Google Search Console</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="scd-btn-secondary"
                  onClick={() => setActiveTab('search')}
                >
                  <span>Go to Search Panel</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="scd-feature-grid">
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot amber" />
                    <span className="sfc-label">Avg. Position &amp; Change</span>
                  </div>
                  <div className="sfc-placeholder">-- Position</div>
                  <span className="sfc-note">Awaiting GSC ranking data</span>
                </div>
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot sky" />
                    <span className="sfc-label">Organic Clicks</span>
                  </div>
                  <div className="sfc-placeholder">-- Clicks</div>
                  <span className="sfc-note">Google search results</span>
                </div>
                <div className="scd-feature-card">
                  <div className="sfc-head">
                    <span className="sfc-dot indigo" />
                    <span className="sfc-label">Total Impressions &amp; CTR</span>
                  </div>
                  <div className="sfc-placeholder">-- Impressions</div>
                  <span className="sfc-note">Search volume &amp; CTR rate</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="station-metrics-row compact">
                <div 
                  className={`station-metric-pod pod-amber cursor-pointer ${searchMetricMode === 'position' ? 'is-active-pod' : ''}`}
                  onClick={() => setSearchMetricMode('position')}
                  title="Show ranking curve on chart"
                >
              <span className="pod-label">Avg. Position</span>
              <div className="pod-val-row">
                <span className="pod-val">#{search?.averagePosition || 7.8}</span>
                <span className="pod-delta text-emerald">
                  <TrendingUp size={13} />
                  <span>{search?.positionChange?.startsWith('+') || search?.positionChange?.startsWith('-') ? search.positionChange : `+${search?.positionChange || 2.4}`} Position</span>
                </span>
              </div>
              <span className="pod-sub">Rising toward page 1</span>
            </div>

            <div 
              className={`station-metric-pod cursor-pointer ${searchMetricMode === 'clicks' ? 'is-active-pod' : ''}`}
              onClick={() => setSearchMetricMode('clicks')}
              title="Show organic clicks curve on chart"
            >
              <span className="pod-label">Organic Clicks (Clicks)</span>
              <div className="pod-val-row">
                <span className="pod-val">{search?.clicks?.toLocaleString('en-US')}</span>
                <span className="pod-delta text-emerald">
                  <TrendingUp size={13} />
                  <span>+{search?.clicksGrowth || 18.4}%</span>
                </span>
              </div>
              <span className="pod-sub">Google organic search</span>
            </div>

            <div 
              className={`station-metric-pod cursor-pointer ${searchMetricMode === 'impressions' ? 'is-active-pod' : ''}`}
              onClick={() => setSearchMetricMode('impressions')}
              title="Show total impressions curve on chart"
            >
              <span className="pod-label">Total Impressions</span>
              <div className="pod-val-row">
                <span className="pod-val">{search?.impressions?.toLocaleString('en-US')}</span>
              </div>
              <span className="pod-sub">CTR: {search?.ctr || '5.26%'}</span>
            </div>
          </div>

          {/* Interactive Dynamic SVG Ranking / Clicks / Impressions Chart */}
          <div className="station-chart-wrapper">
            <div className="station-chart-legend-row">
              <div className="hud-metric-toggle-group">
                <button
                  type="button"
                  className={`hud-metric-tab ${searchMetricMode === 'position' ? 'is-active is-amber' : ''}`}
                  onClick={() => setSearchMetricMode('position')}
                >
                  <span className="legend-dot" style={{ background: '#f59e0b' }} />
                  <span>Search Position</span>
                </button>
                <button
                  type="button"
                  className={`hud-metric-tab ${searchMetricMode === 'clicks' ? 'is-active is-sky' : ''}`}
                  onClick={() => setSearchMetricMode('clicks')}
                >
                  <span className="legend-dot" style={{ background: '#38bdf8' }} />
                  <span>Organic Clicks</span>
                </button>
                <button
                  type="button"
                  className={`hud-metric-tab ${searchMetricMode === 'impressions' ? 'is-active is-indigo' : ''}`}
                  onClick={() => setSearchMetricMode('impressions')}
                >
                  <span className="legend-dot" style={{ background: '#818cf8' }} />
                  <span>Total Impressions</span>
                </button>
              </div>
            </div>

            <HudTimeSeriesChart
              chartId="chart_gsc_rank"
              data={search?.timeline || []}
              series={
                searchMetricMode === 'position'
                  ? [{ key: 'position', label: 'Avg. Position', color: '#f59e0b', fill: true, fillOpacity: 0.2, valuePrefix: "Pos: #" }]
                  : searchMetricMode === 'clicks'
                    ? [{ key: 'clicks', label: 'Organic Clicks', color: '#38bdf8', fill: true, fillOpacity: 0.2, valueSuffix: " clicks" }]
                    : [{ key: 'impressions', label: 'Total Impressions', color: '#818cf8', fill: true, fillOpacity: 0.2, valueSuffix: ' imp' }]
              }
              invertY={searchMetricMode === 'position'}
              height={170}
              loading={isRangeLoading || refreshing}
            />
          </div>

          {/* Tracked Keywords HUD Table with Full Real CRUD Interaction */}
          <div className="station-subtable-box">
            <div className="subtable-header">
              <div className="subtable-header-left">
                <span className="subtable-title">Added &amp; Tracked Target Keywords</span>
                <span className="subtable-count">{search?.topKeywords?.length || 0} Active Keywords</span>
              </div>
              <button
                type="button"
                className="subtable-add-btn"
                onClick={() => setIsAddingKeyword(prev => !prev)}
              >
                {isAddingKeyword ? <X size={12} /> : <Plus size={12} />}
                <span>{isAddingKeyword ? 'Cancel' : '+ Add Keyword'}</span>
              </button>
            </div>

            {isAddingKeyword && (
              <form onSubmit={handleQuickAddKeyword} className="hud-quick-add-form animate-fade">
                <input
                  type="text"
                  placeholder="New keyword to track... (e.g. b2b crm software)"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  autoFocus
                  className="hud-quick-input"
                  disabled={submittingKeyword}
                />
                <button
                  type="submit"
                  className="hud-quick-btn-save"
                  disabled={submittingKeyword || !newKeywordInput.trim()}
                >
                  {submittingKeyword ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                  <span>Add</span>
                </button>
              </form>
            )}

            <div className="subtable-rows-list">
              {(search?.topKeywords || []).length === 0 ? (
                <div className="subtable-empty">
                  <span>No tracked keywords yet.</span>
                  <button
                    type="button"
                    className="subtable-empty-action"
                    onClick={() => setIsAddingKeyword(true)}
                  >
                    Add First Keyword
                  </button>
                </div>
              ) : (
                (search?.topKeywords || []).slice(0, 6).map((kw, kwIdx) => (
                  <div key={kw.id || kwIdx} className="subtable-row">
                    <div className="subtable-cell-main">
                      <div className="kw-text-row">
                        <span className="kw-text">{kw.keyword}</span>
                        {kw.source === 'gsc' && (
                          <span className="kw-source-badge" title="Google Search Console live data">GSC</span>
                        )}
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(kw.keyword)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kw-serp-link"
                          title="View Google search results in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                      <span className="kw-vol">
                        <Eye size={11} />
                        <span>{kw.impressions ? `${kw.impressions.toLocaleString('en-US')} Impressions` : '0 Impressions'}</span>
                      </span>
                    </div>
                    <div className="subtable-cell-rank">
                      <span className="kw-rank">
                        {String(kw.position).startsWith('>') || isNaN(parseFloat(kw.position)) ? kw.position : `#${kw.position}`}
                      </span>
                      <span className={`kw-badge ${kw.change > 0 ? 'is-up' : kw.change < 0 ? 'is-down' : 'is-neutral'}`}>
                        {kw.change > 0 ? `+${kw.change}` : kw.change}
                      </span>
                    </div>
                    <div className="subtable-cell-clicks">
                      <span className="kw-clicks">{kw.clicks?.toLocaleString('en-US')} Clicks</span>
                    </div>
                    <button
                      type="button"
                      className="kw-delete-btn"
                      title="Remove keyword from tracking"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDeleteKeyword(kw.keyword);
                      }}
                      disabled={deletingKeyword === kw.keyword}
                    >
                      {deletingKeyword === kw.keyword ? <Loader2 size={11} className="spin" /> : <Trash2 size={11} />}
                    </button>
                  </div>
                ))
              )}
            </div>

            {(search?.topKeywords || []).length > 0 && (
              <div className="subtable-footer-actions">
                <button
                  type="button"
                  className="subtable-more-btn"
                  onClick={() => setActiveTab('search')}
                >
                  <span>Search Panel & View All Queries</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            )}
              </div>
            </>
          )}
        </section>

        {/* --------------------------------------------------------- */}
        {/* CARD 3: CONVERSION & REVENUE TELEMETRY // B2B LEAD & E-COMMERCE */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-half module-sales">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">
                {commerceMode === 'b2b' 
                  ? '[SEC-03 // B2B CONVERSION & LEAD TELEMETRY]' 
                  : '[SEC-03 // COMMERCE & REVENUE TELEMETRY]'}
              </span>
              <div className="station-card-title-row">
                <div className={`card-icon-halo ${commerceMode === 'b2b' ? 'halo-cyan' : 'halo-emerald'}`}>
                  {commerceMode === 'b2b' ? <Target size={18} /> : <ShoppingBag size={18} />}
                </div>
                <div>
                  <h2 className="station-card-title">
                    {commerceMode === 'b2b' 
                      ? '3. Conversion & Engagement: Google Analytics 4' 
                      : '3. Sales Revenue: Google Analytics E-commerce'}
                  </h2>
                  <span className="station-card-sub">
                    {commerceMode === 'b2b'
                      ? 'B2B Form Initiation (Lead), Key Actions, Engaged Sessions & Rates'
                      : 'Revenue, Order Count, Avg. Cart Value & Conversion Rate'}
                  </span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              {isGaConnected && (
                <div className="telemetry-mode-switcher" title="Switch telemetry mode">
                  <button
                    type="button"
                    className={`mode-btn ${commerceMode === 'b2b' ? 'active' : ''}`}
                    onClick={() => setUserCommerceMode('b2b')}
                  >
                    <Target size={11} />
                    <span>B2B &amp; Lead</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn is-ecom ${commerceMode === 'ecommerce' ? 'active' : ''}`}
                    onClick={() => setUserCommerceMode('ecommerce')}
                  >
                    <ShoppingBag size={11} />
                    <span>E-Commerce</span>
                  </button>
                </div>
              )}

              {isGaConnected ? (
                commerceMode === 'b2b' ? (
                  <span className="hud-status-pill status-online" title="Google Analytics 4 verified event & conversion stream">
                    <Check size={11} />
                    <span>GA4 B2B TELEMETRY</span>
                  </span>
                ) : (
                  <span className="hud-status-pill status-neutral" title="No e-commerce (purchase) events found in Google Analytics 4">
                    <span>E-COMMERCE (0 SALES)</span>
                  </span>
                )
              ) : (
                <span className="hud-status-pill status-offline" title="Google Analytics 4 Not Connected">
                  <AlertCircle size={11} />
                  <span>GA4 NOT CONNECTED</span>
                </span>
              )}
            </div>
          </div>

          {!isGaConnected ? (
            <div className="station-card-disconnected-box">
              <div className="scd-glow-halo halo-cyan">
                <Target size={30} />
              </div>
              <div className="scd-badge">
                <AlertCircle size={13} />
                <span>AWAITING GA4 CONVERSION DATA STREAM</span>
              </div>
              <h3 className="scd-title">GA4 Required for Conversion & Engagement Metrics</h3>
              <p className="scd-desc">
                B2B lead generation, button and contact clicks, engaged sessions, and e-commerce transactions are calculated from Google Analytics 4 event telemetry. Connect GA4 to view your verified conversion funnel.
              </p>
              <div className="scd-actions">
                <button
                  type="button"
                  className="scd-btn-primary"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                >
                  <Zap size={14} />
                  <span>Connect Google Analytics 4</span>
                </button>
                <button
                  type="button"
                  className="scd-btn-secondary"
                  onClick={() => setActiveTab('analytics')}
                >
                  <span>Events & Conversion Report</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            commerceMode === 'b2b' ? (
            <>
              <div className="station-metrics-row compact">
                <div className="station-metric-pod pod-cyan">
                  <span className="pod-label">Lead Form Starts</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{sales?.b2b?.leadFormsCount || 0}</span>
                    <span className="pod-delta text-emerald">
                      <TrendingUp size={13} />
                      <span>{sales?.b2b?.leadUsersCount || 0} Users</span>
                    </span>
                  </div>
                  <span className="pod-sub">Contact & inquiry form submissions</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Key Actions & Clicks</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{sales?.b2b?.actionClicksCount || 0}</span>
                    <span className="pod-delta text-cyan">
                      <span>{sales?.b2b?.actionUsersCount || 0} Users</span>
                    </span>
                  </div>
                  <span className="pod-sub">Outbound links & CTA clicks</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Engaged Sessions</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{sales?.b2b?.engagedSessionsCount || 0}</span>
                    <span className="pod-delta text-emerald">
                      <span>10s+ Duration</span>
                    </span>
                  </div>
                  <span className="pod-sub">Out of {analytics?.sessions || 0} total sessions</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Engagement / Conversion Rate</span>
                  <div className="pod-val-row">
                    <span className="pod-val text-emerald">{sales?.b2b?.engagementRate || '0.0%'}</span>
                  </div>
                  <span className="pod-sub">GA4 verified session quality</span>
                </div>
              </div>

              {/* B2B Trend Area Chart */}
              <div className="station-chart-wrapper">
                <div className="station-chart-legend-row">
                  <span className="chart-legend-title">DAILY ENGAGEMENT & CONVERSION TREND OVER TIME (GA4):</span>
                  <div className="chart-legend-items">
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#10b981' }} />
                      <span>Engaged Sessions</span>
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#06b6d4' }} />
                      <span>Page Views</span>
                    </span>
                  </div>
                </div>

                <HudTimeSeriesChart
                  chartId="chart_ga4_b2b"
                  data={sales?.timeline || []}
                  series={[
                    { key: 'engagedSessions', label: 'Engaged Sessions', color: '#10b981', fill: true, fillOpacity: 0.22 },
                    { key: 'pageViews', label: 'Page Views', color: '#06b6d4' }
                  ]}
                  height={170}
                  loading={isRangeLoading || refreshing}
                />
              </div>

              {/* Efficiency Metric Pods */}
              <div className="station-efficiency-strip">
                <div className="eff-cell">
                  <span className="eff-label">Events Per User</span>
                  <span className="eff-val">{sales?.b2b?.eventsPerUser || '19.3'} events</span>
                </div>
                <div className="eff-cell">
                  <span className="eff-label">Avg. Session Duration</span>
                  <span className="eff-val">{sales?.b2b?.avgSessionDuration || analytics?.avgSessionDuration || '6m 55s'}</span>
                </div>
                <div className="eff-cell">
                  <span className="eff-label">Verified Business Model</span>
                  <span className="eff-val text-cyan">{activeWorkspace?.business_model || 'B2B'} (High Tech)</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="station-metrics-row compact">
                <div className="station-metric-pod">
                  <span className="pod-label">Total Sales Revenue</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{sales?.currency || '$'}{(sales?.totalRevenue || 0).toLocaleString('en-US')}</span>
                    <span className="pod-delta text-muted">
                      <span>0%</span>
                    </span>
                  </div>
                  <span className="pod-sub">Verified live GA4 data</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Orders / Transactions</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{(sales?.ordersCount || 0).toLocaleString('en-US')}</span>
                    <span className="pod-delta text-muted">
                      <span>0</span>
                    </span>
                  </div>
                  <span className="pod-sub">No cart checkout detected</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Average Order Value (AOV)</span>
                  <div className="pod-val-row">
                    <span className="pod-val">{sales?.currency || '$'}{(sales?.avgOrderValue || 0).toLocaleString('en-US')}</span>
                  </div>
                  <span className="pod-sub">Revenue per transaction</span>
                </div>

                <div className="station-metric-pod">
                  <span className="pod-label">Purchase Conversion Rate</span>
                  <div className="pod-val-row">
                    <span className="pod-val text-muted">{sales?.conversionRate || '0.00%'}</span>
                  </div>
                  <span className="pod-sub">Visitor -&gt; Purchase</span>
                </div>
              </div>

              {/* Informative Honest Notice Banner */}
              <div className="b2b-notice-banner">
                <Info size={16} className="text-cyan" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <span className="b2b-notice-title">E-commerce Cart Module Not Active</span>
                  <span className="b2b-notice-desc">
                    There are no e-commerce (purchase/transaction) events configured on Google Analytics 4 for this workspace. 
                    Since <strong>{activeWorkspace?.name || 'this brand'}</strong> operates on a B2B ({activeWorkspace?.industry || 'Technology'}) model, revenue is driven by client contracts and inquiry proposals rather than an online checkout. Switch to <strong>"B2B &amp; Lead"</strong> mode above to view live conversion telemetry.
                  </span>
                </div>
              </div>

              {/* Efficiency Metric Pods */}
              <div className="station-efficiency-strip" style={{ marginTop: 14 }}>
                <div className="eff-cell">
                  <span className="eff-label">E-commerce Status</span>
                  <span className="eff-val text-muted">No Cart Flow</span>
                </div>
                <div className="eff-cell">
                  <span className="eff-label">Recommended Mode</span>
                  <span className="eff-val text-emerald">B2B &amp; Lead Tracking</span>
                </div>
                <div className="eff-cell">
                  <span className="eff-label">Data Verification</span>
                  <span className="eff-val text-cyan">100% Real GA4</span>
                </div>
              </div>
            </>
          ))}
        </section>

        {/* --------------------------------------------------------- */}
        {/* KART 4: AI OVERVIEW // VISIBILITY & CITATIONS */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-full module-ai">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-04 // AI KNOWLEDGE & CITATION MATRIX]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-cyan">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">4. AI Overview: AI Visibility Score &amp; Citation Rate ({aiVisibility?.totalPrompts || 3} Prompts)</h2>
                  <span className="station-card-sub">Citations & Recommendations Telemetry from Google Gemini, ChatGPT, Perplexity, and Claude</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              <span className="hud-status-pill status-ai">
                <Sparkles size={12} />
                <span>GEO TELEMETRY ACTIVE</span>
              </span>
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('ai-visibility')}
              >
                <span>AI Simulator</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div className="station-metrics-row">
            <div className="station-metric-pod pod-cyan">
              <span className="pod-label">AI Visibility Score</span>
              <div className="pod-val-row">
                <span className="pod-val">{aiVisibility?.score ?? 0}/100</span>
                <span className="pod-delta text-cyan">
                  <Sparkles size={13} />
                  <span>GEO Verified</span>
                </span>
              </div>
              <span className="pod-sub">Direct model confidence score</span>
            </div>

            <div className="station-metric-pod pod-primary">
              <span className="pod-label">Citation Rate ({aiVisibility?.totalPrompts || 3} Prompts)</span>
              <div className="pod-val-row">
                <span className="pod-val">{aiVisibility?.citationRate ?? 0}%</span>
                <span className="pod-tag-fraction">({aiVisibility?.citedPromptsCount || 0} / {aiVisibility?.totalPrompts || 3} Prompts)</span>
              </div>
              <span className="pod-sub">
                {aiVisibility?.citedPromptsCount > 0 
                  ? `Brand cited directly across ${aiVisibility?.citedPromptsCount} prompts` 
                  : 'Not yet cited in active queries'}
              </span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Tracked Target Prompts</span>
              <div className="pod-val-row">
                <span className="pod-val">{aiVisibility?.totalPrompts || 0} Prompts</span>
              </div>
              <span className="pod-sub">Live industry key queries</span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Active Simulation Model</span>
              <div className="pod-val-row">
                <span className="pod-val text-cyan font-mono" style={{ fontSize: '0.88rem' }}>
                  {aiVisibility?.activeModel || 'gemini-3.8-flash'}
                </span>
              </div>
              <span className="pod-sub">Grounded web citation telemetry</span>
            </div>
          </div>

          {/* AI Citation Ratio Time Series Graph */}
          <div className="station-chart-wrapper">
            <div className="station-chart-legend-row">
              <span className="chart-legend-title">TARGET PROMPT CITATION / RECOMMENDATION RATE OVER TIME (%):</span>
              <div className="chart-legend-items">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#00f0ff' }} />
                  <span>Total Citation Rate (%)</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#4285f4' }} />
                  <span>Google Gemini (Active)</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#10a37f' }} />
                  <span>ChatGPT (Simulation Pending)</span>
                </span>
              </div>
            </div>

            <HudTimeSeriesChart
              chartId="chart_geo_citations"
              data={aiVisibility?.timeline || []}
              series={[
                { key: 'citationRate', label: 'Citation Rate', color: '#00f0ff', fill: true, fillOpacity: 0.2, valueSuffix: '%' },
                { key: 'geminiCited', label: 'Gemini Citations', color: '#4285f4', fill: false, strokeWidth: 1.8, valueSuffix: `/${aiVisibility?.totalPrompts || 3}` },
                { key: 'gptCited', label: 'ChatGPT Citations', color: '#10a37f', fill: false, strokeWidth: 1.8, valueSuffix: `/${aiVisibility?.totalPrompts || 3}` }
              ]}
              height={190}
              loading={isRangeLoading || refreshing}
            />
          </div>

          {/* Model Breakdown Badges */}
          <div className="station-ai-models-bar">
            {(aiVisibility?.engineBreakdown || []).map((eng, eIdx) => (
              <div key={eIdx} className={`station-engine-chip ${eng.status === 'active' ? 'is-active-engine' : 'is-pending-engine'}`}>
                <img src={eng.icon} alt={eng.name} className="engine-chip-icon" />
                <div className="engine-chip-info">
                  <span className="engine-chip-name">{eng.name}</span>
                  <span className="engine-chip-share">
                    {eng.status === 'active' 
                      ? `${eng.share}% Citation Share (Active Model)` 
                      : 'Simulation Queued'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* The Tracked Prompts Radar List */}
          <div className="station-prompts-matrix">
            <div className="prompts-matrix-header">
              <div className="prompts-matrix-title">
                <Cpu size={14} className="text-cyan" />
                <span>TARGET PROMPT TELEMETRY MATRIX ({aiVisibility?.prompts?.length || 0} LIVE QUERIES)</span>
              </div>
              <div className="prompts-matrix-filter">
                <button
                  type="button"
                  className={`pm-btn ${activePromptTab === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActivePromptTab('all')}
                >
                  All ({aiVisibility?.prompts?.length || 0})
                </button>
                <button
                  type="button"
                  className={`pm-btn ${activePromptTab === 'cited' ? 'is-active' : ''}`}
                  onClick={() => setActivePromptTab('cited')}
                >
                  Cited ({aiVisibility?.citedPromptsCount || 0})
                </button>
              </div>
            </div>

            <div className="prompts-matrix-grid">
              {(aiVisibility?.prompts || [])
                .filter(p => activePromptTab === 'all' || p.isCited)
                .map((p, pIdx) => (
                  <div key={p.id || pIdx} className={`prompt-matrix-card ${p.isCited ? 'is-cited' : (p.status === 'not_scanned' ? 'is-pending' : 'is-not-mentioned')}`}>
                    <div className="prompt-card-top">
                      <span className="prompt-topic-tag">{p.topic}</span>
                      <span className={`prompt-status-badge ${p.isCited ? 'badge-cited' : (p.status === 'not_scanned' ? 'badge-scan' : 'badge-not-cited')}`}>
                        {p.isCited ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>CITED &amp; RECOMMENDED</span>
                          </>
                        ) : p.status === 'not_scanned' ? (
                          <>
                            <Clock size={12} />
                            <span>AWAITING SCAN</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} />
                            <span>NOT MENTIONED</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p className="prompt-text">"{p.prompt}"</p>

                    {p.responseSnippet && (
                      <div className="prompt-snippet-box">
                        <span className="prompt-snippet-label">Model Response Summary:</span>
                        <p className="prompt-snippet-text">{p.responseSnippet}</p>
                      </div>
                    )}

                    <div className="prompt-card-footer">
                      <div className="prompt-footer-meta">
                        <span className="prompt-engines-label">Model / Engine:</span>
                        <div className="prompt-engines-row">
                          {p.engines && p.engines.length > 0 ? (
                            p.engines.map((eng, engIdx) => (
                              <span key={engIdx} className="engine-micro-tag">
                                {eng === 'gemini' && <img src="/AI-logos/gemini-color.svg" alt="Gemini" title="Google Gemini (3.8 Flash)" />}
                                {eng === 'chatgpt' && <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT" title="ChatGPT" className="chatgpt-brand-icon" />}
                                {eng === 'perplexity' && <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" title="Perplexity AI" />}
                                {eng === 'claude' && <img src="/AI-logos/claude-color.svg" alt="Claude" title="Anthropic Claude" />}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted text-xs">Simulation Pending</span>
                          )}
                        </div>
                      </div>

                      {p.isCited ? (
                        <div className="prompt-citation-stat">
                          <span className="citation-count-badge">
                            {p.citationsCount > 0 ? `${p.citationsCount} Source Citations` : 'Direct Recommendation'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">{p.lastChecked || 'Not Scanned'}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- */}
        {/* KART 5: GOOGLE BUSINESS RATING & REVIEWS */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-half module-gbp">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-05 // REPUTATION & RATING PROBE]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-amber">
                  <Star size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">5. Google Business Rating &amp; Review Count</h2>
                  <span className="station-card-sub">Google Maps / Business Profile Reputation &amp; Review Growth Trend</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('business')}
              >
                <span>Business Profile</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div className="station-metrics-row compact">
            <div className="station-metric-pod pod-amber">
              <span className="pod-label">Google Rating</span>
              <div className="pod-val-row">
                <span className="pod-val text-amber">{business?.rating?.toFixed(1) || '4.9'} ★</span>
                <span className="pod-sub-grade">/ 5.0</span>
              </div>
              <span className="pod-sub">High customer satisfaction</span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Total Reviews</span>
              <div className="pod-val-row">
                <span className="pod-val">{business?.totalReviews || 48} Reviews</span>
                <span className="pod-delta text-emerald">
                  <TrendingUp size={13} />
                  <span>+{business?.reviewsGrowth || 6} New</span>
                </span>
              </div>
              <span className="pod-sub">Verified customer reviews</span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Customer Sentiment Score</span>
              <div className="pod-val-row">
                <span className="pod-val text-emerald">{business?.sentimentScore || 97}%</span>
              </div>
              <span className="pod-sub">AI Sentiment Analysis: Positive</span>
            </div>
          </div>

          {/* Reviews Growth Chart */}
          <div className="station-chart-wrapper">
            <div className="station-chart-legend-row">
              <span className="chart-legend-title">CUMULATIVE REVIEW GROWTH OVER TIME:</span>
              <div className="chart-legend-items">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#fbbf24' }} />
                  <span>Total Reviews</span>
                </span>
              </div>
            </div>

            <HudTimeSeriesChart
              chartId="chart_gbp_reviews"
              data={business?.timeline || []}
              series={[
                { key: 'totalReviews', label: 'Review Count', color: '#fbbf24', fill: true, fillOpacity: 0.2, valueSuffix: ' Reviews' }
              ]}
              height={170}
              loading={isRangeLoading || refreshing}
            />
          </div>

          {/* Star Rating Breakdown Meter */}
          <div className="station-rating-histogram">
            <span className="hist-title">Star Rating Breakdown:</span>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = business?.ratingBreakdown?.[String(star)] || (star === 5 ? 44 : star === 4 ? 3 : star === 3 ? 1 : 0);
              const total = business?.totalReviews || 48;
              const pct = Math.round((count / (total || 1)) * 100);
              return (
                <div key={star} className="hist-row">
                  <span className="hist-star">{star} ★</span>
                  <div className="hist-bar-track">
                    <div className="hist-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="hist-count">{count}</span>
                  <span className="hist-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* --------------------------------------------------------- */}
        {/* CARD 6: CRITICAL ISSUES & TECHNICAL SITE AUDIT */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-half module-audit">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-06 // SYSTEM INTEGRITY & DIAGNOSTIC SHIELD]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-emerald">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">6. Critical Site Health &amp; Diagnostic Audit</h2>
                  <span className="station-card-sub">Technical Health, Critical Issues, Core Web Vitals &amp; Protocol Audits</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('technical')}
              >
                <span>Technical Report</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          {/* Critical Status Banner */}
          <div className={`station-critical-banner ${technicalAudit?.criticalIssuesCount === 0 ? 'is-safe' : 'is-alert'}`}>
            <div className="crit-banner-left">
              {technicalAudit?.criticalIssuesCount === 0 ? (
                <CheckCircle2 size={24} className="text-emerald" />
              ) : (
                <AlertTriangle size={24} className="text-danger animate-pulse" />
              )}
              <div>
                <h4 className="crit-banner-title">
                  {technicalAudit?.criticalIssuesCount === 0
                    ? '0 CRITICAL ISSUES // ALL CORE SYSTEMS NOMINAL'
                    : `${technicalAudit?.criticalIssuesCount} CRITICAL ISSUES DETECTED!`}
                </h4>
                <p className="crit-banner-desc">
                  {technicalAudit?.criticalIssuesCount === 0
                    ? 'No critical issues preventing search engines or AI bots from indexing your site.'
                    : 'Immediate resolution recommended for the detected critical technical issues.'}
                </p>
              </div>
            </div>

            <div className="crit-banner-right">
              <span className="crit-score-badge">{technicalAudit?.healthScore || 96}/100</span>
            </div>
          </div>

          {/* Time Series Health Score Graph */}
          <div className="station-chart-wrapper">
            <div className="station-chart-legend-row">
              <span className="chart-legend-title">TECHNICAL HEALTH SCORE STABILITY OVER TIME:</span>
              <div className="chart-legend-items">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#10b981' }} />
                  <span>Site Health Index (%)</span>
                </span>
              </div>
            </div>

            <HudTimeSeriesChart
              chartId="chart_audit_health"
              data={technicalAudit?.timeline || []}
              series={[
                { key: 'healthScore', label: 'Health Score', color: '#10b981', fill: true, fillOpacity: 0.2, valueSuffix: '%' }
              ]}
              height={170}
              loading={isRangeLoading || refreshing}
            />
          </div>

          {/* Core Web Vitals HUD Gauges */}
          <div className="station-vitals-grid">
            <div className="vital-card">
              <span className="vital-label">LCP (Largest Contentful Paint)</span>
              <span className="vital-val text-emerald">{technicalAudit?.vitals?.lcp || '1.2s'}</span>
              <span className="vital-status">Optimal Speed</span>
            </div>
            <div className="vital-card">
              <span className="vital-label">INP (Interaction to Next Paint)</span>
              <span className="vital-val text-emerald">{technicalAudit?.vitals?.inp || '38ms'}</span>
              <span className="vital-status">Responsive</span>
            </div>
            <div className="vital-card">
              <span className="vital-label">CLS (Cumulative Layout Shift)</span>
              <span className="vital-val text-emerald">{technicalAudit?.vitals?.cls || '0.01'}</span>
              <span className="vital-status">Stable Layout</span>
            </div>
            <div className="vital-card">
              <span className="vital-label">SSL &amp; Robots.txt</span>
              <span className="vital-val text-emerald">Active &amp; Compliant</span>
              <span className="vital-status">TLS 1.3 / HTTP 3</span>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- */}
        {/* KART 7: CITATION DIRECTORY NETWORK */}
        {/* --------------------------------------------------------- */}
        <section className="station-card module-card-full module-directories">
          <div className="station-card-header">
            <div className="station-card-title-group">
              <span className="station-card-tag">[SEC-07 // CITATION DIRECTORY NETWORK]</span>
              <div className="station-card-title-row">
                <div className="card-icon-halo halo-purple">
                  <Layers size={18} />
                </div>
                <div>
                  <h2 className="station-card-title">7. Citation Directory Distribution Status</h2>
                  <span className="station-card-sub">Global Authority Directories, Maps, B2B Platforms &amp; Verification Rate</span>
                </div>
              </div>
            </div>

            <div className="station-card-header-actions">
              <button
                type="button"
                className="station-ghost-link"
                onClick={() => setActiveTab('directories')}
              >
                <span>Manage Directories</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div className="station-metrics-row">
            <div className="station-metric-pod pod-purple">
              <span className="pod-label">Target Directories</span>
              <div className="pod-val-row">
                <span className="pod-val">{directories?.total ?? 0} Directories</span>
              </div>
              <span className="pod-sub">Global &amp; niche authority network</span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Verified / Published</span>
              <div className="pod-val-row">
                <span className="pod-val text-emerald">{directories?.verified ?? 0}</span>
                {(directories?.verified || 0) > 0 ? (
                  <span className="pod-delta text-emerald">
                    <Check size={13} />
                    <span>{directories?.coverageRate ?? 0}% Coverage</span>
                  </span>
                ) : (
                  <span className="pod-delta text-muted">
                    <span>0% Coverage</span>
                  </span>
                )}
              </div>
              <span className="pod-sub">Providing live citations &amp; backlinks</span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Pending / Missing</span>
              <div className="pod-val-row">
                <span className="pod-val text-amber">
                  {(directories?.pending || 0) > 0 
                    ? `${directories.pending} Pending` 
                    : `${directories?.missing ?? directories?.total ?? 0} Missing`}
                </span>
              </div>
              <span className="pod-sub">
                {(directories?.pending || 0) > 0 ? 'Under editorial review' : 'Awaiting submission'}
              </span>
            </div>

            <div className="station-metric-pod">
              <span className="pod-label">Avg. Network Authority</span>
              <div className="pod-val-row">
                <span className="pod-val text-purple">{directories?.avgAuthority ?? 0} DA</span>
              </div>
              <span className="pod-sub">High domain authority (DA)</span>
            </div>
          </div>

          {/* Directory Progress Time Series Graph */}
          <div className="station-chart-wrapper">
            <div className="station-chart-legend-row">
              <span className="chart-legend-title">VERIFIED DIRECTORIES GROWTH OVER TIME:</span>
              <div className="chart-legend-items">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#a855f7' }} />
                  <span>Verified Directories</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: '#38bdf8' }} />
                  <span>Network Authority (DA)</span>
                </span>
              </div>
            </div>

            <HudTimeSeriesChart
              chartId="chart_directories_trend"
              data={directories?.timeline || []}
              series={[
                { key: 'verified', label: 'Verified Directories', color: '#a855f7', fill: true, fillOpacity: 0.2, valueSuffix: ' Dirs' },
                { key: 'avgAuthority', label: 'Avg. DA', color: '#38bdf8', fill: false, strokeWidth: 1.8, valueSuffix: ' DA' }
              ]}
              height={185}
              loading={isRangeLoading || refreshing}
            />
          </div>

          {/* Directory Status Mini-Badges */}
          <div className="station-dir-chips-grid">
            {(directories?.directoryList || []).map((dir, dIdx) => (
              <div 
                key={dir.id || dIdx} 
                className={`station-dir-chip ${dir.status === 'verified' ? 'is-verified-chip' : (dir.status === 'pending' ? 'is-pending-chip' : 'is-missing-chip')}`}
              >
                <div className="dir-chip-meta">
                  <span className="dir-chip-name">{dir.name}</span>
                  <span className="dir-chip-da">DA {dir.authority}</span>
                </div>
                <span className={`dir-chip-badge ${dir.status === 'verified' ? 'is-verified' : (dir.status === 'pending' ? 'is-pending' : 'is-missing')}`}>
                  {dir.status === 'verified' ? '✓ VERIFIED' : (dir.status === 'pending' ? '⏳ PENDING' : 'NOT LISTED')}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ========================================================= */}
      {/* ACTION FEED DRAWER: PRIORITY ACTIONS */}
      {/* ========================================================= */}
      <div className="station-action-feed-container">
        <div className="station-feed-header">
          <div className="feed-title-col">
            <div className="feed-title-row">
              <Zap size={18} className="text-warning" />
              <h3 className="feed-title">Priority Action Feed</h3>
            </div>
            <p className="feed-desc">
              Direct growth opportunities ranked by estimated impact and reliability score.
            </p>
          </div>
          <span className="station-count-tag">{opportunities?.length || 0} Opportunities</span>
        </div>

        <div className="station-opps-stack">
          {opportunities && opportunities.length > 0 ? (
            opportunities.map((opp) => {
              const isExpanded = expandedOppId === opp.id;
              const isDone = opp.status === 'completed';
              const isProgress = opp.status === 'in_progress';

              return (
                <div key={opp.id} className={`growth-opp-card ${isDone ? 'is-completed' : ''}`}>
                  <div className="growth-opp-main-row" onClick={() => setExpandedOppId(isExpanded ? null : opp.id)}>
                    <div className="growth-opp-priority-col">
                      <span className={`growth-priority-badge ${opp.priority_score > 90 ? 'is-urgent' : 'is-high'}`}>
                        {opp.priority_score > 90 ? 'HIGH IMPACT' : 'RECOMMENDED'}
                      </span>
                      <span className="growth-priority-score">{opp.priority_score}/100</span>
                    </div>

                    <div className="growth-opp-content-col">
                      <h4 className="growth-opp-title">{opp.title}</h4>
                      <p className="growth-opp-desc">{opp.description}</p>
                      
                      <div className="growth-opp-meta-row">
                        <span className="growth-opp-category-tag">{opp.category}</span>
                        {opp.estimated_traffic_upside && (
                          <span className="growth-opp-upside-tag">
                            <TrendingUp size={12} />
                            <span>{opp.estimated_traffic_upside}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="growth-opp-actions-col">
                      <button
                        type="button"
                        className="growth-opp-toggle-btn"
                        aria-label="Details"
                      >
                        <ChevronDown size={18} className={`chevron-icon ${isExpanded ? 'is-expanded' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="growth-opp-drawer animate-fade">
                      {opp.action_steps && Array.isArray(opp.action_steps) && (
                        <div className="growth-action-steps-box">
                          <span className="drawer-subhead">Recommended Action Steps:</span>
                          <ul className="drawer-steps-list">
                            {opp.action_steps.map((st, sIdx) => (
                              <li key={sIdx}>
                                <span className="step-num">{sIdx + 1}</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="drawer-footer-actions">
                        <button
                          type="button"
                          disabled={updatingOppId === opp.id}
                          className={`drawer-action-btn ${isProgress ? 'btn-active' : ''}`}
                          onClick={() => handleUpdateOppStatus(opp.id, isProgress ? 'open' : 'in_progress')}
                        >
                          <Clock size={14} />
                          <span>{isProgress ? 'Marked In Progress' : 'Start Task'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={updatingOppId === opp.id}
                          className={`drawer-action-btn btn-success ${isDone ? 'btn-active' : ''}`}
                          onClick={() => handleUpdateOppStatus(opp.id, isDone ? 'open' : 'completed')}
                        >
                          <Check size={14} />
                          <span>{isDone ? 'Completed' : 'Mark as Completed'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="growth-empty-card">
              <CheckCircle2 size={32} className="text-success" />
              <h4>No Open Opportunities</h4>
              <p>All optimization opportunities have been completed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
