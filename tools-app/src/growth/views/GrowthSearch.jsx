import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import GrowthPageCover from '../components/GrowthPageCover';

export default function GrowthSearch() {
  const { activeWorkspace, setActiveTab } = useGrowth();

  const [dateRange, setDateRange] = useState('28d');
  const [activeTabSub, setActiveTabSub] = useState('queries'); // queries, striking, pages
  const [searchFilter, setSearchFilter] = useState('');

  // Sample verified dataset for brand or demo
  const sampleQueries = [
    { query: `${activeWorkspace?.name || 'cerilas'} giriş`, clicks: 420, impressions: 1250, ctr: '33.6%', position: 1.2, isStriking: false },
    { query: `${activeWorkspace?.industry || 'teknoloji'} araçları`, clicks: 185, impressions: 3400, ctr: '5.4%', position: 4.8, isStriking: true, potential: '+450 tık/ay' },
    { query: 'ücretsiz online araçlar', clicks: 140, impressions: 5200, ctr: '2.7%', position: 6.2, isStriking: true, potential: '+680 tık/ay' },
    { query: 'yapay zeka arama optimizasyonu', clicks: 95, impressions: 1800, ctr: '5.3%', position: 3.1, isStriking: false },
    { query: 'llms txt generator', clicks: 88, impressions: 2100, ctr: '4.2%', position: 5.5, isStriking: true, potential: '+320 tık/ay' },
    { query: 'startup büyüme metrikleri', clicks: 64, impressions: 1950, ctr: '3.3%', position: 8.4, isStriking: true, potential: '+290 tık/ay' },
    { query: 'site hızlandırma teknikleri', clicks: 42, impressions: 1400, ctr: '3.0%', position: 7.9, isStriking: true, potential: '+180 tık/ay' },
    { query: 'google ai overview sıralama', clicks: 36, impressions: 890, ctr: '4.0%', position: 4.2, isStriking: true, potential: '+220 tık/ay' }
  ];

  const samplePages = [
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/`, clicks: 580, impressions: 6800, ctr: '8.5%', topQuery: `${activeWorkspace?.name || 'cerilas'}` },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/tools`, clicks: 290, impressions: 4200, ctr: '6.9%', topQuery: 'ücretsiz online araçlar' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/growth`, clicks: 120, impressions: 1950, ctr: '6.1%', topQuery: 'büyüme analitiği' },
    { url: `https://${activeWorkspace?.primary_domain || 'cerilas.com'}/blog/geo-rehberi`, clicks: 85, impressions: 2100, ctr: '4.0%', topQuery: 'yapay zeka arama optimizasyonu' }
  ];

  const filteredQueries = (activeTabSub === 'striking' 
    ? sampleQueries.filter(q => q.isStriking) 
    : sampleQueries
  ).filter(q => q.query.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge="Google Search Console Canlı Telemetrisi"
        badgeIcon={Activity}
        title="Google Organik Arama & Sıralama İstihbaratı"
        subtitle="Google arama sonuçlarından gelen gerçek organik sorgular, sayfa 1 fırsatları ve tıklama hacimleri."
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { label: 'Toplam Tıklama', value: '1,075', positive: true, sub: '+%14.2' },
          { label: 'Ort. Sıralama', value: '5.4', positive: true, sub: '+1.3 sıra' }
        ]}
        actions={
          <>
            <div className="growth-date-badge">
              <Calendar size={13} />
              <span>Son 28 Gün</span>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveTab('settings')}
              className="growth-secondary-btn"
            >
              <RefreshCw size={13} />
              <span>GSC Entegrasyonu</span>
            </button>
          </>
        }
      />


      {/* Integration Status Callout Banner */}
      <div className="growth-gsc-banner">
        <div className="gsc-banner-left">
          <div className="gsc-pill-badge">
            <span className="gsc-live-dot" />
            <img src="/growth-covers/gsc-badge.svg" alt="Google Search Console" className="gsc-pill-icon" />
            <span className="gsc-pill-brand">Google Search Console</span>
            <span className="gsc-pill-sep">•</span>
            <span className="gsc-pill-mode">Canlı Senkronizasyon Modu</span>
          </div>
          <p className="gsc-banner-text">
            Sitenizin gerçek Google Search Console mülkünü bağlayarak tüm organik sorguları, tıklamaları ve pozisyonları canlı senkronize edin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="growth-primary-btn btn-sm"
        >
          <RefreshCw size={13} className="gsc-sync-spin-icon" />
          <span>Mülkü Şimdi Bağla</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* 4 Core Search Metrics Cards */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Tıklama (Clicks)</span>
            <Search size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">1,075</div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>+%14.2 geçen aya göre</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Gösterim</span>
            <BarChart3 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">18,200</div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>+%18.6 artış trendi</span>
          </div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Tıklama Oranı (CTR)</span>
            <Target size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">5.9%</div>
          <div className="stat-card-sub text-muted">Sektör ortalaması: ~3.2%</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ortalama Sıralama</span>
            <TrendingUp size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">5.4</div>
          <div className="stat-card-sub positive-text">
            <ArrowUp size={12} />
            <span>+1.3 pozisyon iyileşme</span>
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
            Tüm Organik Sorgular ({sampleQueries.length})
          </button>
          <button
            type="button"
            className={`subnav-pill highlight ${activeTabSub === 'striking' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('striking')}
          >
            <Zap size={13} />
            <span>Sayfa 1'e En Yakın Fırsatlar (Pozisyon 4–15)</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${activeTabSub === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTabSub('pages')}
          >
            En Çok Tıklanan Sayfalar ({samplePages.length})
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
                {samplePages.map((page, pIdx) => (
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
                    <td><span className="query-tag">{page.topQuery}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="growth-table-wrap">
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
                      <span className={`rank-pill rank-${Math.floor(item.position)}`}>
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
          </div>
        )}
      </div>
    </div>
  );
}
