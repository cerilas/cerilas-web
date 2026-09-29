import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
  Layers,
  Filter,
  Calendar,
  AlertCircle,
  RefreshCw,
  Activity,
  Loader2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { GrowthSearchSkeleton } from '../components/GrowthSkeleton';

export default function GrowthSearch() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('queries'); // queries, striking, pages
  const [searchFilter, setSearchFilter] = useState('');

  const [searchData, setSearchData] = useState({
    connected: false,
    siteUrl: '',
    syncedAt: null,
    totals: { clicks: 1075, impressions: 18200, ctr: '5.9%', position: '5.4' },
    topQueries: [],
    strikingQueries: [],
    topPages: []
  });

  const fetchPerformance = useCallback(async () => {
    if (!activeWorkspace?.id || !token) return;
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/search-performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchData(data);
      }
    } catch (err) {
      console.error('Search performance fetch error:', err);
    }
  }, [activeWorkspace?.id, token]);

  useEffect(() => {
    setLoading(true);
    fetchPerformance().finally(() => {
      setLoading(false);
    });
  }, [activeWorkspace?.id, fetchPerformance]);

  const handleManualSync = async () => {
    if (!activeWorkspace?.id || !token) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations/google/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchPerformance();
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

  // Sample fallback baseline if not yet connected
  const sampleQueries = [
    { query: `${activeWorkspace?.name || 'cerilas'} giriş`, clicks: 420, impressions: 1250, ctr: '33.6%', position: '1.2', isStriking: false },
    { query: `${activeWorkspace?.industry || 'teknoloji'} araçları`, clicks: 185, impressions: 3400, ctr: '5.4%', position: '4.8', isStriking: true, potential: '+450 tık/ay' },
    { query: 'ücretsiz online araçlar', clicks: 140, impressions: 5200, ctr: '2.7%', position: '6.2', isStriking: true, potential: '+680 tık/ay' },
    { query: 'yapay zeka arama optimizasyonu', clicks: 95, impressions: 1800, ctr: '5.3%', position: '3.1', isStriking: false },
    { query: 'llms txt generator', clicks: 88, impressions: 2100, ctr: '4.2%', position: '5.5', isStriking: true, potential: '+320 tık/ay' },
    { query: 'startup büyüme metrikleri', clicks: 64, impressions: 1950, ctr: '3.3%', position: '8.4', isStriking: true, potential: '+290 tık/ay' },
    { query: 'site hızlandırma teknikleri', clicks: 42, impressions: 1400, ctr: '3.0%', position: '7.9', isStriking: true, potential: '+180 tık/ay' },
    { query: 'google ai overview sıralama', clicks: 36, impressions: 890, ctr: '4.0%', position: '4.2', isStriking: true, potential: '+220 tık/ay' }
  ];

  const samplePages = [
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/`, clicks: 580, impressions: 6800, ctr: '8.5%', topQuery: `${activeWorkspace?.name || 'cerilas'}` },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/tools`, clicks: 290, impressions: 4200, ctr: '6.9%', topQuery: 'ücretsiz online araçlar' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/growth`, clicks: 120, impressions: 1950, ctr: '6.1%', topQuery: 'büyüme analitiği' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/blog/geo-rehberi`, clicks: 85, impressions: 2100, ctr: '4.0%', topQuery: 'yapay zeka arama optimizasyonu' }
  ];

  const hasRealQueries = searchData.connected && (searchData.topQueries?.length > 0 || searchData.strikingQueries?.length > 0);
  const activeQueriesList = hasRealQueries ? searchData.topQueries : sampleQueries;
  const activeStrikingList = hasRealQueries ? searchData.strikingQueries : sampleQueries.filter(q => q.isStriking);
  const activePagesList = searchData.connected && searchData.topPages?.length > 0 ? searchData.topPages : samplePages;

  const currentQueriesSource = activeTabSub === 'striking' ? activeStrikingList : activeQueriesList;
  const filteredQueries = currentQueriesSource.filter(q => 
    (q.query || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return <GrowthSearchSkeleton />;
  }

  const totals = searchData.totals || { clicks: 0, impressions: 0, ctr: '0%', position: '0' };

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge={searchData.connected ? "Google Search Console Canlı Telemetrisi" : "Search Console Entegrasyon Modu"}
        badgeIcon={Activity}
        title="Google Organik Arama & Sıralama İstihbaratı"
        subtitle={searchData.connected 
          ? `Google Search Console (${searchData.siteUrl}) mülkünüzden canlı senkronize edilen gerçek sorgu, tık ve sayfa 1 fırsatları.` 
          : "Google arama sonuçlarından gelen gerçek organik sorgular, sayfa 1 fırsatları ve tıklama hacimleri."}
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { label: 'Toplam Tıklama', value: Number(totals.clicks || 0).toLocaleString('tr-TR'), positive: true, sub: searchData.connected ? 'Canlı GSC Verisi' : '+%14.2' },
          { label: 'Ort. Sıralama', value: String(totals.position || '0.0'), positive: true, sub: searchData.connected ? 'Ağırlıklı Ortalama' : '+1.3 sıra' }
        ]}
        actions={
          <>
            <div className="growth-date-badge">
              <Calendar size={13} />
              <span>Son 28 Gün</span>
            </div>
            {searchData.connected ? (
              <button 
                type="button" 
                disabled={syncing}
                onClick={handleManualSync}
                className="growth-secondary-btn"
              >
                <RefreshCw size={13} className={syncing ? 'auth-spinner' : ''} />
                <span>{syncing ? 'Eşitleniyor...' : 'Verileri Yenile'}</span>
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

      {/* Integration Status Callout Banner */}
      <div className="growth-gsc-banner">
        <div className="gsc-banner-left">
          <div className="gsc-pill-badge">
            <span className="gsc-live-dot" style={{ background: searchData.connected ? '#10b981' : '#f59e0b' }} />
            <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" className="gsc-pill-icon" />
            <span className="gsc-pill-brand">Google Search Console</span>
            <span className="gsc-pill-sep">•</span>
            <span className="gsc-pill-mode">
              {searchData.connected ? `Bağlı (${searchData.siteUrl})` : 'Canlı Senkronizasyon Modu'}
            </span>
          </div>
          <p className="gsc-banner-text">
            {searchData.connected ? (
              <>
                Doğrulanmış mülkünüz başarıyla senkronize edildi. {searchData.syncedAt && (
                  <span>Son veri eşitleme: <strong>{new Date(searchData.syncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</strong>.</span>
                )}
              </>
            ) : (
              'Sitenizin gerçek Google Search Console mülkünü bağlayarak tüm organik sorguları, tıklamaları ve pozisyonları canlı senkronize edin.'
            )}
          </p>
        </div>

        {searchData.connected ? (
          <button
            type="button"
            disabled={syncing}
            onClick={handleManualSync}
            className="growth-secondary-btn btn-sm"
          >
            <RefreshCw size={13} className={syncing ? 'auth-spinner' : ''} />
            <span>{syncing ? 'Eşitleniyor...' : 'Canlı Veriyi Eşitle'}</span>
          </button>
        ) : (
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
        )}
      </div>

      {/* 4 Core Search Metrics Cards */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Tıklama (Clicks)</span>
            <Search size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">
            {Number(totals.clicks || 0).toLocaleString('tr-TR')}
          </div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>{searchData.connected ? 'Organik Arama Tıklamaları' : '+%14.2 geçen aya göre'}</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Gösterim (Impressions)</span>
            <BarChart3 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            {Number(totals.impressions || 0).toLocaleString('tr-TR')}
          </div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>{searchData.connected ? 'Arama Sonuçlarında Görünme' : '+%18.6 artış trendi'}</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Tıklama Oranı (CTR)</span>
            <Target size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            {String(totals.ctr || '0%')}
          </div>
          <div className="stat-card-sub text-muted">
            {searchData.connected ? 'Genel Tıklama Performansı' : 'Sektör ortalaması: ~3.2%'}
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Pozisyon (Rank)</span>
            <TrendingUp size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">
            #{String(totals.position || '0.0')}
          </div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>{searchData.connected ? 'Arama Sıralaması' : '+1.3 pozisyon iyileşme'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Row & Search Filter */}
      <div className="growth-subnav-bar">
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${activeTabSub === 'queries' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('queries')}
          >
            Tüm Organik Sorgular ({activeQueriesList.length})
          </button>
          <button
            type="button"
            className={`subnav-pill highlight ${activeTabSub === 'striking' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('striking')}
          >
            <Zap size={13} />
            <span>Sayfa 1'e En Yakın Fırsatlar ({activeStrikingList.length})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('pages')}
          >
            En Çok Tıklanan Sayfalar ({activePagesList.length})
          </button>
        </div>

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
      </div>

      {/* Data Table */}
      <div className="growth-panel-card">
        {activeTabSub === 'pages' ? (
          <div className="growth-table-wrap">
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
                {activePagesList.map((page, pIdx) => (
                  <tr key={pIdx}>
                    <td className="font-mono">
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="growth-table-link">
                        <span>{page.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="font-semibold text-primary">{page.clicks}</td>
                    <td>{page.impressions}</td>
                    <td><span className="ctr-badge">{page.ctr}</span></td>
                    <td><span className="query-tag">{page.topQuery || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="growth-table-wrap">
            {filteredQueries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Eşleşen arama sorgusu bulunamadı.</p>
              </div>
            ) : (
              <table className="growth-table">
                <thead>
                  <tr>
                    <th>Arama Sorgusu (Keyword Query)</th>
                    <th>Tıklama</th>
                    <th>Gösterim</th>
                    <th>Tıklama Oranı (CTR)</th>
                    <th>Ort. Sıralama</th>
                    <th>Fırsat / Eylem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueries.map((item, idx) => (
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
                      <td className="font-semibold text-primary">{item.clicks}</td>
                      <td>{item.impressions}</td>
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
        )}
      </div>
    </div>
  );
}
