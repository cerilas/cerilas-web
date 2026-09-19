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
  Filter, 
  Eye, 
  Euro, 
  Calendar, 
  Users, 
  Layers, 
  AlertCircle, 
  ArrowUpRight, 
  Hash, 
  ShieldCheck,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';

export default function ScrapersView() {
  const [sources, setSources] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [runningScraper, setRunningScraper] = useState(null);
  const [scraperMessage, setScraperMessage] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  
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
          text: `Scrape completed! ${d.items_found} programs found. ${d.items_inserted} newly inserted, ${d.items_updated} updated, ${d.items_unchanged} unchanged (verified via SHA-256).`
        });
        await fetchSources();
        await fetchOpportunities();
      } else {
        setScraperMessage({
          type: 'error',
          text: json.message || 'Scraping failed.'
        });
      }
    } catch (err) {
      setScraperMessage({
        type: 'error',
        text: 'Network error while running scraper.'
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
    if (!isoString) return 'Ongoing / Open';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner / Title */}
      <div className="admin-section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              padding: '0.25rem 0.6rem', 
              borderRadius: 6, 
              background: 'rgba(59, 130, 246, 0.12)', 
              color: '#3b82f6', 
              fontSize: '0.72rem', 
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Funding & Matcher Engine
            </span>
            <span style={{
              display: 'inline-flex',
              padding: '0.25rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              Deterministic (No AI)
            </span>
            <span style={{
              display: 'inline-flex',
              padding: '0.25rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#a855f7',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              SHA-256 Deduplicated
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Funding Opportunities Scrappers
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automated, deterministic grant scraping pipeline with webhook triggers and change-detection hashing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-action-btn secondary"
            onClick={() => { fetchSources(); fetchOpportunities(); }}
            title="Refresh opportunities from DB"
          >
            <RefreshCw size={15} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Scraper Result Notification Banner */}
      {scraperMessage && (
        <div style={{
          padding: '0.85rem 1.1rem',
          borderRadius: 10,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${scraperMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: scraperMessage.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.88rem',
          fontWeight: 500
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

      {/* Scraper Sources Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.85rem', color: 'var(--text-main)' }}>
          Configured Scraper Targets
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {sources.map((src) => {
            const isRunning = runningScraper === src.key;
            return (
              <div 
                key={src.key}
                className="admin-card"
                style={{
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}>
                      <Globe size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {src.name}
                      </h4>
                      <a 
                        href={src.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          fontSize: '0.78rem', 
                          color: '#3b82f6', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          marginTop: '0.15rem',
                          textDecoration: 'none'
                        }}
                      >
                        <span>{src.url}</span>
                        <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    ● Active
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {src.description}
                </p>

                {/* Scraper Stats Pill */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  background: 'rgba(150, 150, 150, 0.05)',
                  borderRadius: 10,
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--card-border, rgba(255,255,255,0.05))'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Saved</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {src.total_items}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status / Open</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                      {src.open_items}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deduplication</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7', marginTop: '0.15rem' }}>
                      SHA-256
                    </div>
                  </div>
                </div>

                {/* Last Run Info */}
                {src.last_run && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={13} />
                    <span>
                      Son Tetiklenme: {formatDate(src.last_run.created_at)} ({src.last_run.items_found} items, {src.last_run.items_unchanged} unchanged)
                    </span>
                  </div>
                )}

                {/* Webhook & Trigger Actions */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: 'auto', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="admin-action-btn primary"
                    onClick={() => handleRunScraper(src.key)}
                    disabled={isRunning}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Scraping...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span>Scrap Et (Run Now)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-action-btn secondary"
                    onClick={() => handleCopyWebhook(src.webhook_path)}
                    title="Copy Webhook Endpoint to trigger automatically via cron/CI"
                    style={{ justifyContent: 'center' }}
                  >
                    {copiedWebhook ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedWebhook ? 'Copied!' : 'Webhook URL'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunities Section */}
      <div className="admin-card" style={{ padding: '1.4rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          marginBottom: '1.25rem' 
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Scraped Funding Opportunities ({opportunities.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Database records extracted from verified sources
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search grants, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.85rem 0.45rem 2.2rem',
                  borderRadius: 8,
                  border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                  background: 'var(--input-bg, rgba(255,255,255,0.04))',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            {/* Beneficiary Filter */}
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                background: 'var(--input-bg, rgba(255,255,255,0.04))',
                color: 'var(--text-main)',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">All Beneficiaries</option>
              {allBeneficiaries.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Domain Filter */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                background: 'var(--input-bg, rgba(255,255,255,0.04))',
                color: 'var(--text-main)',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">All Domains</option>
              {allDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunities List / Table */}
        {loadingOpps ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
            <div>Loading opportunities...</div>
          </div>
        ) : opportunities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No funding opportunities match your search criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                style={{
                  borderRadius: 12,
                  padding: '1.1rem 1.25rem',
                  background: 'rgba(150, 150, 150, 0.03)',
                  border: '1px solid var(--card-border, rgba(255,255,255,0.06))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Thumbnail & Title Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 450px' }}>
                  {opp.cover_image ? (
                    <img 
                      src={opp.cover_image} 
                      alt={opp.title}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                        background: 'rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: 10,
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem'
                    }}>
                      €
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '0.98rem', 
                        fontWeight: 700, 
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {opp.title}
                      </h4>
                      {opp.status === 'open' && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 999,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981'
                        }}>
                          Open
                        </span>
                      )}
                    </div>

                    <p style={{
                      margin: '0 0 0.45rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4
                    }}>
                      {opp.short_description || 'No description available'}
                    </p>

                    {/* Tags: Beneficiaries & Domains */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(opp.eligible_applicants || []).slice(0, 3).map(ben => (
                        <span key={ben} style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 4,
                          background: 'rgba(150, 150, 150, 0.08)',
                          color: 'var(--text-muted)'
                        }}>
                          {ben}
                        </span>
                      ))}
                      {(opp.domains || []).slice(0, 2).map(dom => (
                        <span key={dom} style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 4,
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#3b82f6'
                        }}>
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Financial, Deadline & Actions */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  flexWrap: 'wrap', 
                  justifyContent: 'flex-end',
                  marginLeft: 'auto'
                }}>
                  {/* Funding Amount */}
                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max Funding</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                      {opp.funding_amount || 'Grant'}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div style={{ textAlign: 'right', minWidth: 110 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deadline</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatDate(opp.deadline_date)}</span>
                    </div>
                  </div>

                  {/* Detail Action */}
                  <button
                    type="button"
                    className="admin-action-btn secondary"
                    onClick={() => setActiveOpportunity(opp)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Eye size={14} />
                    <span>Detaylar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Program Detail Modal */}
      {activeOpportunity && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setActiveOpportunity(null)}
        >
          <div 
            style={{
              background: 'var(--card-bg, #18181b)',
              color: 'var(--text-main, #ffffff)',
              borderRadius: 16,
              maxWidth: 780,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {activeOpportunity.cover_image && (
                  <img 
                    src={activeOpportunity.cover_image} 
                    alt={activeOpportunity.title}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 6,
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    textTransform: 'uppercase'
                  }}>
                    {activeOpportunity.call_type || 'Cascade Funding Call'}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.4rem 0 0', color: 'var(--text-main)' }}>
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
                  borderRadius: 8,
                  padding: '0.4rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Financial & Deadline Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                background: 'rgba(150, 150, 150, 0.05)',
                padding: '1.1rem',
                borderRadius: 12,
                border: '1px solid var(--card-border, rgba(255,255,255,0.06))'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Funding Miktarı</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    {activeOpportunity.funding_amount || 'Free Grant'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Son Başvuru Tarihi</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.deadline_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Açılış Tarihi</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatDate(activeOpportunity.opening_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Durum</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                    ● {activeOpportunity.status}
                  </div>
                </div>
              </div>

              {/* Kimler Başvurabilir (Eligible Applicants) */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                  Kimler Başvurabilir (Eligible Applicants)
                </h4>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {(activeOpportunity.eligible_applicants || []).map(app => (
                    <span key={app} style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 6,
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}>
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Domains & Technologies */}
              {((activeOpportunity.domains && activeOpportunity.domains.length > 0) || 
                (activeOpportunity.technologies && activeOpportunity.technologies.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {activeOpportunity.domains && activeOpportunity.domains.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.45rem', color: 'var(--text-main)' }}>
                        Sektörler / Odak Alanları (Domains)
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.domains.map(d => (
                          <span key={d} style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            background: 'rgba(150, 150, 150, 0.08)',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem'
                          }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeOpportunity.technologies && activeOpportunity.technologies.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.45rem', color: 'var(--text-main)' }}>
                        Teknolojiler (Technologies)
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {activeOpportunity.technologies.map(t => (
                          <span key={t} style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            background: 'rgba(168, 85, 247, 0.12)',
                            color: '#a855f7',
                            fontSize: '0.78rem'
                          }}>
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
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                  Kısa Açıklama
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                  {activeOpportunity.short_description}
                </p>
              </div>

              {/* Uzun Açıklama (HTML Long Description) */}
              {activeOpportunity.long_description && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)' }}>
                    Uzun Açıklama & Program Detayları
                  </h4>
                  <div 
                    style={{
                      maxHeight: 280,
                      overflowY: 'auto',
                      padding: '1rem',
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--card-border, rgba(255,255,255,0.06))',
                      fontSize: '0.86rem',
                      lineHeight: 1.6,
                      color: 'var(--text-muted)'
                    }}
                    dangerouslySetInnerHTML={{ __html: activeOpportunity.long_description }}
                  />
                </div>
              )}

              {/* Direct Links */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
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
                borderRadius: 8,
                background: 'rgba(150, 150, 150, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>SHA-256 Content Hash: <code>{activeOpportunity.content_hash?.substring(0, 16)}...</code></span>
                </div>
                <span>DB ID: #{activeOpportunity.id} | Source: {activeOpportunity.source_key}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
