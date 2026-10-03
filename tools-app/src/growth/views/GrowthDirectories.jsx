import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  ArrowUpRight, 
  Loader2, 
  Check, 
  AlertCircle,
  Layers,
  Building2,
  Plus,
  Trash2,
  X,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import GrowthFavicon from '../components/GrowthFavicon';
import { AiEngineGroup } from '../components/AiEngineBadge';
import { SkeletonBlock } from '../components/GrowthSkeleton';

export default function GrowthDirectories() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState('all'); // 'all', 'claimed', 'missing', 'custom'
  const [updatingId, setUpdatingId] = useState(null);

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Directory Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addCategory, setAddCategory] = useState('saas');
  const [addIsClaimed, setAddIsClaimed] = useState(false);
  const [adding, setAdding] = useState(false);

  // Delete Custom Directory Modal States
  const [deleteTargetDir, setDeleteTargetDir] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDirectories = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/directories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setDirectories(json.data || []);
      }
    } catch (err) {
      console.error('Fetch directories error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectories();
  }, [activeWorkspace?.id, token]);

  // Lock body scroll & listen for Escape key when modals are open
  useEffect(() => {
    if (!isAddOpen && !deleteTargetDir) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false);
        setDeleteTargetDir(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isAddOpen, deleteTargetDir]);

  const handleToggleStatus = async (dirId, currentStatus) => {
    const newStatus = currentStatus === 'claimed' ? 'missing' : 'claimed';
    setUpdatingId(dirId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/directories/${dirId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setDirectories(prev => prev.map(d => d.id === dirId ? { ...d, status: newStatus } : d));
      }
    } catch (err) {
      console.error('Toggle directory status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateDirectory = async (e) => {
    e.preventDefault();
    if (!addUrl.trim() || !activeWorkspace?.id || !token) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/directories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: addName.trim(),
          url: addUrl.trim(),
          category: addCategory,
          status: addIsClaimed ? 'claimed' : 'missing'
        })
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setDirectories(prev => [json.data, ...prev]);
        setAddName('');
        setAddUrl('');
        setAddCategory('saas');
        setAddIsClaimed(false);
        setIsAddOpen(false);
      }
    } catch (err) {
      console.error('Create directory error:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetDir || !activeWorkspace?.id || !token) return;
    const targetId = deleteTargetDir.id;
    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/directories/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDirectories(prev => prev.filter(d => d.id !== targetId));
        setDeleteTargetDir(null);
      }
    } catch (err) {
      console.error('Delete directory error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Live domain extraction for automatic favicon preview in Add modal
  const liveDomainPreview = addUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim()
    .toLowerCase();

  const totalCount = directories.length;
  const claimedCount = directories.filter(d => d.status === 'claimed').length;
  const missingCount = totalCount - claimedCount;
  const customCount = directories.filter(d => d.isCustom).length;
  const authorityScore = totalCount > 0 ? Math.round((claimedCount / totalCount) * 100) : 0;

  const filtered = directories.filter(d => {
    if (filterView === 'claimed' && d.status !== 'claimed') return false;
    if (filterView === 'missing' && d.status !== 'missing') return false;
    if (filterView === 'custom' && !d.isCustom) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = d.name?.toLowerCase().includes(q);
      const matchDomain = d.domain?.toLowerCase().includes(q);
      const matchCat = d.category?.toLowerCase().includes(q);
      if (!matchName && !matchDomain && !matchCat) return false;
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Auto-clamp page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === 'all' ? totalFiltered : Math.min(startIndex + pageSize, totalFiltered);
  const paginatedDirectories = pageSize === 'all' ? filtered : filtered.slice(startIndex, endIndex);

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="GEO Authority &amp; Directory Tracking"
        badgeIcon={Share2}
        title="Directories &amp; GEO Distribution Radar"
        subtitle="ChatGPT, Google Gemini, and Perplexity crawl these authoritative directories to discover and cite brands. Track your live profiles and add industry-specific sources."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={[
          { label: 'Target Platforms', value: `${totalCount} Sites`, sub: customCount > 0 ? `12 Core + ${customCount} Custom` : '12 Primary platforms' },
          { label: 'Claimed Profiles', value: `${claimedCount} Active`, sub: claimedCount > 0 ? `${claimedCount} profiles verified` : 'No profiles claimed yet' },
          { label: 'Completion Rate', value: `${authorityScore}%`, sub: `${claimedCount}/${totalCount} profiles ready` }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <AiEngineGroup size={20} />
            <button
              type="button"
              className="growth-primary-btn"
              onClick={() => setIsAddOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} />
              <span>Add New Source</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Metrics - 100% Real Accurate Counts */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Target Platforms</span>
            <Building2 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalCount} Sites</div>
          <div className="stat-card-sub text-muted">
            12 Core Platforms{customCount > 0 ? ` + ${customCount} Custom Sources` : ''}
          </div>
        </div>

        <div className="growth-stat-card highlight-growth">
          <div className="stat-card-header">
            <span className="stat-card-title">Claimed Profiles</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{claimedCount} Active</div>
          <div className="stat-card-sub text-muted">
            {claimedCount > 0 ? `${claimedCount} verified active profiles` : 'No profiles marked as claimed yet'}
          </div>
        </div>

        <div className="growth-stat-card highlight-quickwin">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Profiles</span>
            <AlertCircle size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{missingCount} Pending</div>
          <div className="stat-card-sub text-muted">Platforms recommended for profile setup</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">Profile Completion Rate</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{authorityScore}%</div>
          <div className="stat-card-sub text-primary">{claimedCount} of {totalCount} platforms completed</div>
        </div>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="growth-subnav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${filterView === 'all' ? 'active' : ''}`}
            onClick={() => { setFilterView('all'); setCurrentPage(1); }}
          >
            All Platforms ({totalCount})
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterView === 'claimed' ? 'active' : ''}`}
            onClick={() => { setFilterView('claimed'); setCurrentPage(1); }}
            style={filterView === 'claimed' ? { borderColor: '#10b981', color: '#10b981' } : {}}
          >
            <CheckCircle2 size={13} style={{ color: '#10b981' }} />
            <span>Claimed ({claimedCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterView === 'missing' ? 'active' : ''}`}
            onClick={() => { setFilterView('missing'); setCurrentPage(1); }}
            style={filterView === 'missing' ? { borderColor: '#f59e0b', color: '#f59e0b' } : {}}
          >
            <AlertCircle size={13} style={{ color: '#f59e0b' }} />
            <span>Pending ({missingCount})</span>
          </button>
          {customCount > 0 && (
            <button
              type="button"
              className={`subnav-pill ${filterView === 'custom' ? 'active' : ''}`}
              onClick={() => { setFilterView('custom'); setCurrentPage(1); }}
              style={filterView === 'custom' ? { borderColor: '#818cf8', color: '#818cf8' } : {}}
            >
              <Tag size={13} style={{ color: '#818cf8' }} />
              <span>Custom Added ({customCount})</span>
            </button>
          )}
        </div>

        <div className="growth-search-input-wrap">
          <Search size={14} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search directories..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="growth-search-input"
          />
        </div>
      </div>

      {/* Directories Grid */}
      {loading ? (
        <div className="growth-skeleton-3col-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="growth-skeleton-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SkeletonBlock width="42px" height="42px" borderRadius="10px" />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock width="130px" height="18px" borderRadius="4px" />
                  <SkeletonBlock width="80px" height="13px" borderRadius="4px" style={{ marginTop: 4 }} />
                </div>
              </div>
              <SkeletonBlock width="100%" height="34px" borderRadius="6px" />
              <SkeletonBlock width="100%" height="36px" borderRadius="8px" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="growth-empty-card">
          <Building2 size={44} className="text-primary" />
          <h3>
            {filterView === 'claimed'
              ? 'No Claimed Platforms Yet'
              : filterView === 'missing'
                ? 'All Recommended Platforms Claimed!'
                : 'No Platforms Found in This Filter'}
          </h3>
          <p>
            {filterView === 'claimed'
              ? 'Once you create profiles on the platforms below, click "Mark as Claimed" to track them here.'
              : 'You can add custom directory or profile URLs to your watchlist using the button below.'}
          </p>
          <button
            type="button"
            className="growth-primary-btn"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={15} />
            <span>Add New Source</span>
          </button>
        </div>
      ) : (
        <div className="growth-directories-grid">
          {paginatedDirectories.map((dir) => {
            const isClaimed = dir.status === 'claimed';
            const isUpdating = updatingId === dir.id;
            const targetUrl = dir.submittedUrl || dir.submissionUrl || `https://${dir.domain}`;

            return (
              <div key={dir.id} className={`growth-dir-card ${isClaimed ? 'is-claimed' : ''}`}>
                <div className="dir-card-top">
                  <div className="dir-brand-wrap">
                    <GrowthFavicon
                      src={`https://www.google.com/s2/favicons?domain=${dir.domain}&sz=64`}
                      domain={dir.domain}
                      name={dir.name}
                      size={24}
                      className="dir-fav"
                    />
                    <div className="dir-titles">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h4 className="dir-name">{dir.name}</h4>
                        {dir.isCustom && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.35rem',
                            borderRadius: 4,
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                          }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="dir-domain">{dir.domain}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className={`dir-status-pill ${isClaimed ? 'claimed' : 'missing'}`}>
                      {isClaimed ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Claimed</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          <span>Pending</span>
                        </>
                      )}
                    </span>

                    {dir.isCustom && (
                      <button
                        type="button"
                        className="comp-delete-btn"
                        onClick={() => setDeleteTargetDir(dir)}
                        title="Delete Custom Source"
                        style={{ padding: '0.25rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="dir-metrics-row">
                  <div className="dir-metric-item">
                    <span className="m-label">Authority Score:</span>
                    <strong className="m-val">DA {dir.authority}</strong>
                  </div>
                  <div className="dir-metric-item">
                    <span className="m-label">GEO Citation Impact:</span>
                    <strong className="m-val text-primary">{dir.geoWeight}</strong>
                  </div>
                </div>

                <div className="dir-card-footer">
                  <button
                    type="button"
                    className={`dir-claim-toggle-btn ${isClaimed ? 'is-claimed' : ''}`}
                    onClick={() => handleToggleStatus(dir.id, dir.status)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 size={13} className="spin" />
                    ) : isClaimed ? (
                      <>
                        <Check size={13} />
                        <span>Claimed (Undo)</span>
                      </>
                    ) : (
                      <span>Mark as Claimed</span>
                    )}
                  </button>

                  <a 
                    href={targetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="dir-external-link"
                    title={isClaimed ? "Inspect Profile" : "Visit Platform & Sign Up"}
                  >
                    <span>{isClaimed ? 'Open Profile' : 'Sign Up'}</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && totalFiltered > 0 && (
        <div 
          className="growth-table-pagination" 
          style={{ 
            borderRadius: 14, 
            marginTop: '1.5rem', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'var(--card-bg, rgba(24, 24, 27, 0.6))'
          }}
        >
          <div className="pagination-info">
            Showing <strong>{totalFiltered > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{totalFiltered}</strong> platforms
          </div>

          <div className="pagination-controls">
            <div className="pagination-page-size">
              <span>Per Page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="pagination-select"
              >
                <option value={6}>6 Platforms</option>
                <option value={9}>9 Platforms</option>
                <option value={12}>12 Platforms</option>
                <option value="all">All ({totalFiltered})</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="pagination-nav">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="pagination-pages-list">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-page-btn ${currentPage === pageNum ? 'is-active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Directory Modal */}
      {isAddOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => setIsAddOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dir-modal-title"
        >
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Share2 size={18} className="text-primary" />
                <h2 id="add-dir-modal-title">Add New Directory / Source</h2>
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

            <form onSubmit={handleCreateDirectory}>
              <div className="growth-modal-body">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Directory or Profile URL:</label>
                  <input
                    type="text"
                    placeholder="e.g. clutch.co or https://clutch.co/profile/brand"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    className="growth-text-input"
                    autoFocus
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', marginTop: 4, display: 'block' }}>
                    Favicon will be automatically detected from the domain.
                  </span>
                </div>

                {/* Live Favicon & Domain Preview Card */}
                {liveDomainPreview && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    marginBottom: '1.25rem'
                  }}>
                    <GrowthFavicon
                      src={`https://www.google.com/s2/favicons?domain=${liveDomainPreview}&sz=64`}
                      domain={liveDomainPreview}
                      name={addName || liveDomainPreview}
                      size={28}
                      className="dir-fav"
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main, #f8fafc)' }}>
                        {addName.trim() || liveDomainPreview}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {liveDomainPreview}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4
                    }}>
                      Favicon Detected
                    </span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Platform Name (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Clutch, Crunchbase, LinkedIn..."
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="growth-text-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Directory Category:</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="growth-select"
                  >
                    <option value="saas">SaaS &amp; Software Directory</option>
                    <option value="trust">Corporate Trust &amp; Business Profile</option>
                    <option value="community">Community &amp; Developer Network</option>
                    <option value="local">Local &amp; Industry Directory</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    color: 'var(--text-main, #f8fafc)'
                  }}>
                    <input
                      type="checkbox"
                      checked={addIsClaimed}
                      onChange={(e) => setAddIsClaimed(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <span>I already have a profile on this platform (save as Claimed)</span>
                  </label>
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
                  disabled={adding || !addUrl.trim()}
                >
                  {adding ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Save Directory</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Custom Directory Modal */}
      {deleteTargetDir && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => !deletingId && setDeleteTargetDir(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
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
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Delete Custom Directory</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setDeleteTargetDir(null)}
                disabled={Boolean(deletingId)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.55 }}>
                Are you sure you want to remove <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{deleteTargetDir.name}</strong> ({deleteTargetDir.domain}) from your directory list?
              </p>
            </div>

            <div className="growth-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', padding: '1rem 1.25rem' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setDeleteTargetDir(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff'
                }}
              >
                {deletingId ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
