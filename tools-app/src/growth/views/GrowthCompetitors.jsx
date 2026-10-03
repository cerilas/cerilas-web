import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users2, 
  Plus, 
  ExternalLink, 
  Globe, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  ArrowUpRight,
  X,
  Target,
  Search,
  Sparkles,
  Info,
  Layers,
  Building2,
  FileText
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import GrowthFavicon from '../components/GrowthFavicon';
import { SkeletonBlock } from '../components/GrowthSkeleton';

export default function GrowthCompetitors() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [competitors, setCompetitors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState('all'); // 'all', 'direct', 'search', 'ai'

  // Add Competitor Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [compDomain, setCompDomain] = useState('');
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState('direct');
  const [compNotes, setCompNotes] = useState('');
  const [addingComp, setAddingComp] = useState(false);

  // AI Discover State
  const [discovering, setDiscovering] = useState(false);
  const [discoverMessage, setDiscoverMessage] = useState(null);

  // Delete Modal
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTargetComp, setDeleteTargetComp] = useState(null);

  const fetchCompetitors = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/competitors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setCompetitors(json.data || []);
        if (json.meta) setMeta(json.meta);
      }
    } catch (err) {
      console.error('Fetch competitors error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, [activeWorkspace?.id, token]);

  // Lock body scroll & listen for Escape key when any modal is open
  useEffect(() => {
    if (!isAddOpen && !deleteTargetComp) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false);
        setDeleteTargetComp(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isAddOpen, deleteTargetComp]);

  // AI Competitor Discovery
  const handleAiDiscover = async () => {
    if (!activeWorkspace?.id || !token || discovering) return;
    setDiscovering(true);
    setDiscoverMessage(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/competitors/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok) {
        setCompetitors(json.data || []);
        setDiscoverMessage({
          type: 'success',
          text: json.message || `${json.addedCount || 0} new competitors discovered and added via AI.`
        });
        fetchCompetitors();
      } else {
        throw new Error(json.error || 'AI competitor analysis failed.');
      }
    } catch (err) {
      console.error('AI discover error:', err);
      setDiscoverMessage({
        type: 'error',
        text: err.message || 'An error occurred while scanning competitors.'
      });
    } finally {
      setDiscovering(false);
      setTimeout(() => setDiscoverMessage(null), 6000);
    }
  };

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!compDomain.trim() || !activeWorkspace?.id || !token) return;

    setAddingComp(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/competitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: compDomain.trim(),
          name: compName.trim() || compDomain.trim(),
          type: compType,
          notes: compNotes.trim() || null
        })
      });
      if (res.ok) {
        setCompDomain('');
        setCompName('');
        setCompNotes('');
        setIsAddOpen(false);
        fetchCompetitors();
      }
    } catch (err) {
      console.error('Add competitor error:', err);
    } finally {
      setAddingComp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetComp || !activeWorkspace?.id || !token) return;
    const compId = deleteTargetComp.id;
    setDeletingId(compId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/competitors/${compId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCompetitors(prev => prev.filter(c => c.id !== compId));
        setDeleteTargetComp(null);
      }
    } catch (err) {
      console.error('Delete competitor error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // 100% Real Live Database Counts
  const totalCount = competitors.length;
  const directCount = competitors.filter(c => c.type === 'direct').length;
  const searchCount = competitors.filter(c => c.type === 'search').length;
  const aiCount = competitors.filter(c => c.type === 'ai').length;

  const filteredCompetitors = competitors.filter(c => {
    if (filterView === 'direct') return c.type === 'direct';
    if (filterView === 'search') return c.type === 'search';
    if (filterView === 'ai') return c.type === 'ai';
    return true;
  });

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Competitor Intelligence"
        badgeIcon={Users2}
        title="Competitor Tracking Radar"
        subtitle="Real-time monitoring of direct market alternatives, organic search competitors, and brands cited by AI answer engines."
        coverImage="/growth-covers/seo-cover.jpg"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="growth-secondary-btn"
              onClick={handleAiDiscover}
              disabled={discovering}
              title="Automatically discover and add 5-8 leading market competitors using AI"
            >
              {discovering ? <Loader2 size={14} className="spin text-primary" /> : <Sparkles size={14} className="text-primary" />}
              <span>{discovering ? 'Analyzing Competitors...' : 'Discover Competitors with AI'}</span>
            </button>
            <button
              type="button"
              className="growth-primary-btn"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={15} />
              <span>Add Competitor</span>
            </button>
          </div>
        }
      />

      {/* Discovery Alert Toast */}
      {discoverMessage && (
        <div 
          className="growth-info-alert animate-fade"
          style={{
            borderColor: discoverMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
            background: discoverMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            marginBottom: '1rem'
          }}
        >
          {discoverMessage.type === 'error' ? (
            <Info size={16} className="text-danger" style={{ flexShrink: 0 }} />
          ) : (
            <Sparkles size={16} className="text-primary" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '0.86rem', color: 'var(--text-main, #f8fafc)' }}>
            {discoverMessage.text}
          </span>
        </div>
      )}

      {/* Top 4 Dedicated Real Metric Cards */}
      <div className="growth-stats-grid four-col">
        {/* Metric 1: Total */}
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Monitored</span>
            <Users2 size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{totalCount}</div>
          <div className="stat-card-sub text-muted">
            Tracked in active radar
          </div>
        </div>

        {/* Metric 2: Direct */}
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Direct Competitors</span>
            <Target size={16} className="stat-card-icon" style={{ color: '#60a5fa' }} />
          </div>
          <div className="stat-card-value" style={{ color: '#60a5fa' }}>{directCount}</div>
          <div className="stat-card-sub text-muted">
            Product &amp; service alternatives
          </div>
        </div>

        {/* Metric 3: Search SEO */}
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Search (SEO) Rivals</span>
            <Search size={16} className="stat-card-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>{searchCount}</div>
          <div className="stat-card-sub text-muted">
            Organic SERP leaders
          </div>
        </div>

        {/* Metric 4: AI GEO */}
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">AI (GEO) Citations</span>
            <Sparkles size={16} className="stat-card-icon" style={{ color: '#c084fc' }} />
          </div>
          <div className="stat-card-value" style={{ color: '#c084fc' }}>{aiCount}</div>
          <div className="stat-card-sub text-muted">
            Prominent in LLM answers
          </div>
        </div>
      </div>

      {/* Subnav Filter Pills */}
      <div className="growth-subnav-bar" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${filterView === 'all' ? 'active' : ''}`}
            onClick={() => setFilterView('all')}
          >
            <Layers size={13} />
            <span>All Competitors ({totalCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterView === 'direct' ? 'active' : ''}`}
            onClick={() => setFilterView('direct')}
          >
            <Target size={13} />
            <span>Direct ({directCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterView === 'search' ? 'active' : ''}`}
            onClick={() => setFilterView('search')}
          >
            <Search size={13} />
            <span>Search (SEO) ({searchCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterView === 'ai' ? 'active' : ''}`}
            onClick={() => setFilterView('ai')}
          >
            <Sparkles size={13} />
            <span>AI Search (GEO) ({aiCount})</span>
          </button>
        </div>
      </div>

      {/* Low Count Suggestion Banner */}
      {!loading && totalCount < 5 && (
        <div className="growth-info-alert animate-fade" style={{ marginBottom: '1.25rem' }}>
          <Sparkles size={18} className="text-primary" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.86rem', lineHeight: 1.5 }}>
            <strong>Expand Your Radar:</strong> You currently have {totalCount} competitors tracked. 
            Discover direct and search competitors with one click using AI to reach at least 6-8 monitored competitors.
          </div>
          <button
            type="button"
            className="growth-secondary-btn"
            onClick={handleAiDiscover}
            disabled={discovering}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', flexShrink: 0 }}
          >
            {discovering ? <Loader2 size={12} className="spin text-primary" /> : <Sparkles size={12} className="text-primary" />}
            <span>Discover Competitors Now</span>
          </button>
        </div>
      )}

      {/* Competitors List Panel */}
      <div className="growth-panel-card">
        <div className="growth-card-header">
          <div className="card-header-titles">
            <h3 className="growth-card-title">Tracked Competitors &amp; Watchlist</h3>
            <span className="growth-card-sub">
              {filterView === 'all' 
                ? 'All competitor brands and root domains registered in your radar.' 
                : filterView === 'direct' 
                ? 'Market alternatives directly offering the same products and services.' 
                : filterView === 'search' 
                ? 'Organic SEO competitors ranking for your strategic target keywords.' 
                : 'Brands referenced by AI answer engines and LLMs in market responses.'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="growth-skeleton-3col-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="growth-skeleton-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonBlock width="130px" height="18px" borderRadius="4px" />
                    <SkeletonBlock width="90px" height="13px" borderRadius="4px" style={{ marginTop: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <SkeletonBlock width="50%" height="45px" borderRadius="8px" />
                  <SkeletonBlock width="50%" height="45px" borderRadius="8px" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCompetitors.length === 0 ? (
          <div className="growth-empty-card">
            <Users2 size={44} className="text-primary" />
            <h3>No Competitors Found for This Filter</h3>
            <p>No competitors added for this filter category yet. You can add a new competitor or discover them with AI.</p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={handleAiDiscover}
                disabled={discovering}
              >
                <Sparkles size={14} className="text-primary" />
                <span>Discover with AI</span>
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus size={15} />
                <span>Add Competitor</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="growth-competitor-cards-grid">
            {filteredCompetitors.map((comp) => {
              const isDeleting = deletingId === comp.id;
              const formattedDate = comp.created_at
                ? new Date(comp.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : null;

              return (
                <div key={comp.id} className="growth-competitor-card">
                  <div className="comp-card-top">
                    <div className="comp-brand-info">
                      <div className="comp-fav-wrap">
                        <GrowthFavicon
                          src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`}
                          domain={comp.domain}
                          name={comp.name}
                          size={24}
                          className="comp-fav"
                        />
                      </div>
                      <div className="comp-titles">
                        <h4 className="comp-name">{comp.name}</h4>
                        <a 
                          href={`https://${comp.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="comp-domain-link"
                        >
                          <span>{comp.domain}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    <div className="comp-card-actions">
                      <span className={`comp-type-pill pill-${comp.type || 'direct'}`}>
                        {comp.type === 'direct' ? 'Direct' : comp.type === 'ai' ? 'AI Search (GEO)' : 'Search (SEO)'}
                      </span>
                      <button
                        type="button"
                        className="comp-delete-btn"
                        onClick={() => setDeleteTargetComp(comp)}
                        disabled={isDeleting}
                        title="Remove from Tracking"
                      >
                        {isDeleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Competitor Notes / AI Description */}
                  {comp.notes && (
                    <div 
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted, #94a3b8)',
                        lineHeight: 1.45
                      }}
                    >
                      {comp.notes}
                    </div>
                  )}

                  {/* Real Competitor Attributes */}
                  <div className="comp-details-list">
                    <div className="comp-detail-item">
                      <span className="comp-detail-label">Status:</span>
                      <span className="comp-detail-badge active">
                        <CheckCircle2 size={12} /> Active Radar
                      </span>
                    </div>

                    <div className="comp-detail-item">
                      <span className="comp-detail-label">Category:</span>
                      <span className="comp-detail-val">
                        {comp.type === 'direct' 
                          ? 'Product / Service Alternative' 
                          : comp.type === 'ai' 
                          ? 'AI Search (GEO) Authority' 
                          : 'Organic SEO Competitor'}
                      </span>
                    </div>

                    {formattedDate && (
                      <div className="comp-detail-item">
                        <span className="comp-detail-label">Added Date:</span>
                        <span className="comp-detail-val">{formattedDate}</span>
                      </div>
                    )}
                  </div>

                  {/* External Visit Button */}
                  <div className="comp-card-footer">
                    <a
                      href={`https://${comp.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comp-visit-link"
                    >
                      <Globe size={13} />
                      <span>Visit Site</span>
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {isAddOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => setIsAddOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-comp-modal-title"
        >
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Users2 size={18} className="text-primary" />
                <h2 id="add-comp-modal-title">Add New Competitor</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsAddOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor}>
              <div className="growth-modal-body">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Competitor Website (Domain):</label>
                  <input
                    type="text"
                    placeholder="e.g. competitor.com or https://competitor.com"
                    value={compDomain}
                    onChange={(e) => setCompDomain(e.target.value)}
                    className="growth-text-input"
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Brand Name (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Competitor Brand"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="growth-text-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Competitor Type:</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="growth-select"
                  >
                    <option value="direct">Direct Product / Service Alternative</option>
                    <option value="search">Search Engine (SEO) Competitor</option>
                    <option value="ai">AI Search (GEO) Competitor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="growth-input-label">Competitive Note / Focus (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary competitor in mobile app segment"
                    value={compNotes}
                    onChange={(e) => setCompNotes(e.target.value)}
                    className="growth-text-input"
                  />
                </div>
              </div>

              <div className="growth-modal-footer">
                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="growth-primary-btn"
                  disabled={addingComp || !compDomain.trim()}
                >
                  {addingComp ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Save Competitor</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetComp && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => !deletingId && setDeleteTargetComp(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-comp-modal-title"
        >
          <div 
            className="growth-guide-modal modal-sm animate-scale" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="growth-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}>
                  <Trash2 size={18} />
                </div>
                <h2 id="delete-comp-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Remove Competitor from Tracking
                </h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setDeleteTargetComp(null)}
                disabled={!!deletingId}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.55 }}>
                Are you sure you want to remove <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                  {deleteTargetComp.name ? `${deleteTargetComp.name} (${deleteTargetComp.domain})` : deleteTargetComp.domain}
                </strong> from your competitor radar?
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                marginBottom: '0.5rem'
              }}>
                <GrowthFavicon
                  src={`https://www.google.com/s2/favicons?domain=${deleteTargetComp.domain}&sz=64`}
                  domain={deleteTargetComp.domain}
                  name={deleteTargetComp.name}
                  size={24}
                  className="comp-fav"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main, #f8fafc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {deleteTargetComp.name || deleteTargetComp.domain}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {deleteTargetComp.domain}
                  </div>
                </div>
                <span className={`comp-type-pill pill-${deleteTargetComp.type || 'direct'}`} style={{ margin: 0 }}>
                  {deleteTargetComp.type === 'direct' ? 'Direct' : deleteTargetComp.type === 'ai' ? 'AI Search' : 'Search'}
                </span>
              </div>
            </div>

            <div className="growth-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', padding: '1rem 1.25rem' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setDeleteTargetComp(null)}
                disabled={!!deletingId}
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={handleConfirmDelete}
                disabled={!!deletingId}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {deletingId ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
