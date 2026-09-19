import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Eye, 
  Calendar, 
  Layers, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  X, 
  FileText,
  Table as TableIcon,
  LayoutGrid,
  TrendingUp,
  Database
} from 'lucide-react';

export default function ScrapersView() {
  const [sources, setSources] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [runningScraper, setRunningScraper] = useState(null);
  const [scraperMessage, setScraperMessage] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'));
  
  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Detail Modal state
  const [activeOpportunity, setActiveOpportunity] = useState(null);

  // Fetch scraper sources
  const fetchSources = async () => {
    try {
      setLoadingSources(true);
      const res = await fetch('/api/scrapers/sources');
      const json = await res.json();
      if (json.status === 'success') {
        setSources(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load scraper sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  // Fetch opportunities
  const fetchOpportunities = async () => {
    try {
      setLoadingOpps(true);
      const params = new URLSearchParams({ limit: '200' });
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedBeneficiary !== 'all') params.append('beneficiary', selectedBeneficiary);
      if (selectedDomain !== 'all') params.append('domain', selectedDomain);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/scrapers/opportunities?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setOpportunities(json.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoadingOpps(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOpportunities();
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedDomain, selectedBeneficiary, selectedStatus]);

  // Run scraper manually
  const handleRunScraper = async (sourceKey) => {
    try {
      setRunningScraper(sourceKey);
      setScraperMessage(null);
      const res = await fetch(`/api/scrapers/${sourceKey}/run`, { method: 'POST' });
      const json = await res.json();

      if (json.status === 'success') {
        const d = json.data;
        setScraperMessage({
          type: 'success',
          text: `Scraping tamamlandı: ${d.items_found} program tarandı. ${d.items_inserted} yeni eklendi, ${d.items_updated} güncellendi, ${d.items_unchanged} değişmedi (SHA-256 ile korundu).`
        });
        await fetchSources();
        await fetchOpportunities();
      } else {
        setScraperMessage({
          type: 'error',
          text: json.message || 'Scraping işlemi başarısız oldu.'
        });
      }
    } catch (err) {
      setScraperMessage({
        type: 'error',
        text: 'Scraper çalıştırılırken bağlantı hatası oluştu.'
      });
    } finally {
      setRunningScraper(null);
    }
  };

  // Copy webhook URL
  const handleCopyWebhook = (path) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Extract unique domains and beneficiaries for filter dropdowns
  const { allDomains, allBeneficiaries } = useMemo(() => {
    const domainSet = new Set();
    const benSet = new Set();
    opportunities.forEach(opp => {
      (opp.domains || []).forEach(d => domainSet.add(d));
      (opp.eligible_applicants || []).forEach(b => benSet.add(b));
    });
    return {
      allDomains: Array.from(domainSet).sort(),
      allBeneficiaries: Array.from(benSet).sort()
    };
  }, [opportunities]);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return 'Açık / Devam Ediyor';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const totalOppsCount = opportunities.length;
  const openOppsCount = opportunities.filter(o => o.status === 'open').length;

  return (
    <div className="admin-body">
      {/* 1. Top KPI Summary Grid (Standard Apple-Grade Minimalist Cards) */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Toplam Fon Fırsatı</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Database size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{totalOppsCount}</div>
          <div className="admin-kpi-sub">
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ color: '#10b981', fontWeight: 600 }}>Veritabanında Kayıtlı</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Açık Çağrılar</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>{openOppsCount}</div>
          <div className="admin-kpi-sub">
            <span>Aktif başvuruya açık</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Değişiklik Algılama</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#a855f7', fontSize: '1.4rem' }}>
            SHA-256
          </div>
          <div className="admin-kpi-sub">
            <span>Mükerrer yazma engellendi</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Scraper Motoru</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
              <Globe size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: 'var(--text-main)', fontSize: '1.4rem' }}>
            Deterministik
          </div>
          <div className="admin-kpi-sub">
            <span>AI'sız & Yüksek Hızlı</span>
          </div>
        </div>
      </div>

      {/* Scraper Result Notification Banner */}
      {scraperMessage && (
        <div style={{
          padding: '0.85rem 1.1rem',
          borderRadius: 14,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          color: scraperMessage.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          {scraperMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ flex: 1 }}>{scraperMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setScraperMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Configured Scraper Sources */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Hedef Scraper Siteleri ({sources.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Webhook veya buton ile tetiklenen deterministik scraper modülleri
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {sources.map((src) => {
            const isRunning = runningScraper === src.key;
            return (
              <div 
                key={src.key}
                className="admin-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                    }}>
                      <Globe size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {src.name}
                      </h4>
                      <a 
                        href={src.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          fontSize: '0.76rem', 
                          color: '#3b82f6', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.2rem',
                          marginTop: '0.15rem',
                          textDecoration: 'none'
                        }}
                      >
                        <span>{src.url.replace(/^https?:\/\//, '')}</span>
                        <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>

                  <span className="admin-badge success">
                    ● Aktif
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {src.description}
                </p>

                {/* Scraper Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  background: 'rgba(150, 150, 150, 0.04)',
                  borderRadius: 12,
                  padding: '0.75rem 0.85rem',
                  border: '1px solid var(--card-border, rgba(0, 0, 0, 0.05))'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kayıtlı Program</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {src.total_items}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Açık Çağrı</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                      {src.open_items}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deduplication</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>
                      SHA-256
                    </div>
                  </div>
                </div>

                {/* Last Run Info */}
                {src.last_run && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={13} />
                    <span>
                      Son Tarama: {formatDate(src.last_run.created_at)} ({src.last_run.items_found} çağrı, {src.last_run.items_unchanged} değişmedi)
                    </span>
                  </div>
                )}

                {/* Webhook & Trigger Actions */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: 'auto', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="admin-action-btn primary"
                    onClick={() => handleRunScraper(src.key)}
                    disabled={isRunning}
                    style={{ flex: 1, justifyContent: 'center', minWidth: 140 }}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Taranıyor...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span>Scrap Et (Manuel)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-action-btn secondary"
                    onClick={() => handleCopyWebhook(src.webhook_path)}
                    title="Cron veya harici servislerle tetiklemek için Webhook URL'sini kopyala"
                    style={{ justifyContent: 'center' }}
                  >
                    {copiedWebhook ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedWebhook ? 'Kopyalandı!' : 'Webhook URL'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Toolbar (Search, Filter, View Mode Switcher) */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Hibe, anahtar kelime veya kurum ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="admin-select"
            value={selectedBeneficiary}
            onChange={(e) => setSelectedBeneficiary(e.target.value)}
          >
            <option value="all">Tüm Başvuru Sahipleri</option>
            {allBeneficiaries.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            <option value="all">Tüm Sektörler / Alanlar</option>
            {allDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="open">Sadece Açık</option>
            <option value="closed">Kapananlar</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="admin-view-switcher">
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Tablo Görünümü"
          >
            <TableIcon size={16} />
          </button>
          <button 
            type="button"
            className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Kart Görünümü"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* 4. Opportunities Display */}
      {loadingOpps ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
          <div>Fon fırsatları yükleniyor...</div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0 }}>Arama kriterinize uygun açık çağrı bulunamadı.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="admin-table-container">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Program & Başlık</th>
                  <th>Funding Miktarı</th>
                  <th>Kimler Başvurabilir</th>
                  <th>Son Başvuru</th>
                  <th>Durum</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} onClick={() => setActiveOpportunity(opp)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {opp.cover_image ? (
                          <img 
                            src={opp.cover_image} 
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                              flexShrink: 0
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            €
                          </div>
                        )}
                        <div style={{ maxWidth: 360, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {opp.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {opp.short_description || opp.source_key}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                        {opp.funding_amount || 'Hibe'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: 220 }}>
                        {(opp.eligible_applicants || []).slice(0, 2).map((b) => (
                          <span key={b} className="admin-badge neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                            {b}
                          </span>
                        ))}
                        {(opp.eligible_applicants || []).length > 2 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            +{opp.eligible_applicants.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDate(opp.deadline_date)}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`admin-badge ${opp.status === 'open' ? 'success' : 'neutral'}`}>
                        {opp.status === 'open' ? '● Açık' : 'Kapandı'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        className="admin-action-btn secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOpportunity(opp);
                        }}
                      >
                        <Eye size={13} />
                        <span>Detay</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {opportunities.map((opp) => (
            <div 
              key={opp.id}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setActiveOpportunity(opp)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {opp.cover_image ? (
                    <img 
                      src={opp.cover_image} 
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      €
                    </div>
                  )}

                  <div>
                    <span className="admin-badge primary" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                      {opp.call_type || 'Open Call'}
                    </span>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '0.94rem', 
                      fontWeight: 700, 
                      color: 'var(--text-main)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {opp.title}
                    </h4>
                  </div>
                </div>

                <span className={`admin-badge ${opp.status === 'open' ? 'success' : 'neutral'}`}>
                  {opp.status === 'open' ? 'Açık' : 'Kapandı'}
                </span>
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45
              }}>
                {opp.short_description || 'Açıklama bulunmuyor'}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(opp.eligible_applicants || []).slice(0, 3).map(b => (
                  <span key={b} className="admin-badge neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                    {b}
                  </span>
                ))}
              </div>

              {/* Card Footer with Funding & Deadline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--card-border, rgba(0,0,0,0.06))'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maksimum Hibe</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                    {opp.funding_amount || 'Grant'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Son Başvuru</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatDate(opp.deadline_date)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Complete Opportunity Detail Modal */}
      {activeOpportunity && (
        <div 
          className="admin-modal-backdrop"
          onClick={() => setActiveOpportunity(null)}
        >
          <div 
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--card-border, rgba(0,0,0,0.06))',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {activeOpportunity.cover_image && (
                  <img 
                    src={activeOpportunity.cover_image} 
                    alt=""
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      objectFit: 'cover',
                      border: '1px solid var(--card-border, rgba(0,0,0,0.08))'
                    }}
                  />
                )}
                <div>
                  <span className="admin-badge primary" style={{ marginBottom: '0.3rem' }}>
                    {activeOpportunity.call_type || 'Cascade Funding'}
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                    {activeOpportunity.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveOpportunity(null)}
                style={{
                  background: 'rgba(150, 150, 150, 0.1)',
                  border: 'none',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Financial & Deadline Overview Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.85rem',
                background: 'rgba(150, 150, 150, 0.04)',
                padding: '1rem',
                borderRadius: 14,
                border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hibe Miktarı</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    {activeOpportunity.funding_amount || 'Free Grant'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Son Başvuru Tarihi</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.deadline_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Açılış Tarihi</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.opening_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Durum</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`admin-badge ${activeOpportunity.status === 'open' ? 'success' : 'neutral'}`}>
                      {activeOpportunity.status === 'open' ? '● Aktif / Açık' : 'Kapandı'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kimler Başvurabilir */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                  Kimler Başvurabilir (Eligible Applicants)
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(activeOpportunity.eligible_applicants || []).map(app => (
                    <span key={app} className="admin-badge primary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Focus Domains & Technologies */}
              {((activeOpportunity.domains && activeOpportunity.domains.length > 0) || 
                (activeOpportunity.technologies && activeOpportunity.technologies.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {activeOpportunity.domains && activeOpportunity.domains.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                        Sektörler / Odak Alanları
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.domains.map(d => (
                          <span key={d} className="admin-badge neutral" style={{ fontSize: '0.75rem' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeOpportunity.technologies && activeOpportunity.technologies.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                        Teknolojiler
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.technologies.map(t => (
                          <span key={t} className="admin-badge purple" style={{ fontSize: '0.75rem' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Kısa Açıklama */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                  Kısa Açıklama
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                  {activeOpportunity.short_description}
                </p>
              </div>

              {/* Uzun Açıklama (HTML Detaylar) */}
              {activeOpportunity.long_description && (
                <div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                    Çağrı Detayları & Açıklama
                  </h4>
                  <div 
                    style={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      padding: '1rem',
                      borderRadius: 12,
                      background: 'rgba(150, 150, 150, 0.04)',
                      border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                      fontSize: '0.85rem',
                      lineHeight: 1.65,
                      color: 'var(--text-muted)'
                    }}
                    dangerouslySetInnerHTML={{ __html: activeOpportunity.long_description }}
                  />
                </div>
              )}

              {/* External Links */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                  Resmi Bağlantılar & Başvuru Portalları
                </h4>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {activeOpportunity.links?.apply && (
                    <a
                      href={activeOpportunity.links.apply}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn primary"
                      style={{ textDecoration: 'none' }}
                    >
                      <ArrowUpRight size={14} />
                      <span>Hemen Başvur (Apply Portal)</span>
                    </a>
                  )}

                  {activeOpportunity.links?.website && (
                    <a
                      href={activeOpportunity.links.website}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Globe size={14} />
                      <span>Proje Web Sitesi</span>
                    </a>
                  )}

                  {activeOpportunity.links?.guidelines && (
                    <a
                      href={activeOpportunity.links.guidelines}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <FileText size={14} />
                      <span>Guidelines (Call Text PDF)</span>
                    </a>
                  )}

                  {activeOpportunity.permalink && (
                    <a
                      href={activeOpportunity.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-action-btn secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} />
                      <span>CascadeFunding Sayfası</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Deduplication & Technical Hash Info */}
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                padding: '0.6rem 0.85rem',
                borderRadius: 10,
                background: 'rgba(150, 150, 150, 0.04)',
                border: '1px solid var(--card-border, rgba(0,0,0,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>SHA-256 İçerik İmzası: <code>{activeOpportunity.content_hash?.substring(0, 18)}...</code></span>
                </div>
                <span>DB ID: #{activeOpportunity.id} | Kaynak: {activeOpportunity.source_key}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
