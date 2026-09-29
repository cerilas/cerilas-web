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
  Loader2, 
  Settings 
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
    totals: { clicks: 0, impressions: 0, ctr: '0%', position: '0' },
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

  if (loading) {
    return <GrowthSearchSkeleton />;
  }

  const isConnected = !!searchData.connected;
  const totals = searchData.totals || { clicks: 0, impressions: 0, ctr: '0%', position: '0' };
  const topQueries = searchData.topQueries || [];
  const strikingQueries = searchData.strikingQueries || [];
  const topPages = searchData.topPages || [];

  const currentQueriesSource = activeTabSub === 'striking' ? strikingQueries : topQueries;
  const filteredQueries = currentQueriesSource.filter(q => 
    (q.query || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

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
            <div className="growth-date-badge">
              <Calendar size={13} />
              <span>Son 28 Gün</span>
            </div>
            {isConnected ? (
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
            <span className="gsc-live-dot" style={{ background: isConnected ? '#10b981' : '#f59e0b' }} />
            <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" className="gsc-pill-icon" />
            <span className="gsc-pill-brand">Google Search Console</span>
            <span className="gsc-pill-sep">•</span>
            <span className="gsc-pill-mode">
              {isConnected ? `Bağlı (${searchData.siteUrl})` : 'Bağlantı Yapılmadı'}
            </span>
          </div>
          <p className="gsc-banner-text">
            {isConnected ? (
              <>
                Doğrulanmış mülkünüz başarıyla senkronize edildi. {searchData.syncedAt && (
                  <span>Son veri eşitleme: <strong>{new Date(searchData.syncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</strong>.</span>
                )}
              </>
            ) : (
              'Organik arama tıklamaları, gösterimler ve gerçek sıralamalar yalnızca doğrulanmış Google Search Console mülkünüz bağlandığında görüntülenir. Şu anda bu çalışma alanı için bağlı bir mülk bulunmamaktadır.'
            )}
          </p>
        </div>

        {isConnected ? (
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

      {/* Main Content: If Unconnected show Zero-Data Connect Card; If Connected show real tables */}
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
            Bu markaya ait organik anahtar kelimeler, tıklama hacimleri ve sayfa 1 fırsatları yalnızca doğrulanmış resmi Google Search Console mülkünüz bağlandığında görüntülenir. Hiçbir simüle veya tahmini veri gösterilmez.
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
          {/* Tabs Row & Search Filter */}
          <div className="growth-subnav-bar">
            <div className="growth-subnav-pills">
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'queries' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('queries')}
              >
                Tüm Organik Sorgular ({topQueries.length})
              </button>
              <button
                type="button"
                className={`subnav-pill highlight ${activeTabSub === 'striking' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('striking')}
              >
                <Zap size={13} />
                <span>Sayfa 1'e En Yakın Fırsatlar ({strikingQueries.length})</span>
              </button>
              <button
                type="button"
                className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
                onClick={() => setActiveTabSub('pages')}
              >
                En Çok Tıklanan Sayfalar ({topPages.length})
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

          {/* Real Data Table */}
          <div className="growth-panel-card">
            {activeTabSub === 'pages' ? (
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
                          <td className="font-semibold text-primary">{page.clicks}</td>
                          <td>{page.impressions}</td>
                          <td><span className="ctr-badge">{page.ctr}</span></td>
                          <td><span className="query-tag">{page.topQuery || '-'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="growth-table-wrap">
                {filteredQueries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      {topQueries.length === 0 
                        ? `Bağlı mülkünüz (${searchData.siteUrl}) için Google dizininde son 28 günde arama verisi henüz oluşmamış.` 
                        : 'Filtreye uygun arama sorgusu bulunamadı.'}
                    </p>
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
        </>
      )}
    </div>
  );
}
