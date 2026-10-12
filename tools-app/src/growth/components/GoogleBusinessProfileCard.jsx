import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Search,
  Trash2,
  ThumbsUp,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Compass,
  Radio,
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';

const SEARCH_ANIM_STEPS = [
  'Searching matching businesses in Google Maps directory...',
  'Verifying location, coordinates, and local store details...',
  'Compiling customer ratings, review counts, and profile data...'
];

export default function GoogleBusinessProfileCard({ onProfileChange }) {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Search & connect state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search ticker animation effect
  useEffect(() => {
    let interval;
    if (isSearching) {
      setSearchStep(0);
      interval = setInterval(() => {
        setSearchStep(prev => (prev + 1) % SEARCH_ANIM_STEPS.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionError, setActionError] = useState('');

  // Review list state & pagination
  const [reviewTab, setReviewTab] = useState('all'); // 'all', 'low_star', 'unanswered', 'with_reply'
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [generatingReplyFor, setGeneratingReplyFor] = useState(null);
  const [generatedReplies, setGeneratedReplies] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Close search modal on Escape key
  useEffect(() => {
    if (!isSearchModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsSearchModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen]);

  // 1. Fetch current profile status
  const fetchProfile = async ({ silent = false } = {}) => {
    if (!activeWorkspace?.id || !token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.connected && data.profile) {
        setProfile(data.profile);
        setIsConnected(true);
        if (onProfileChange) onProfileChange(data.profile);
      } else {
        setProfile(null);
        setIsConnected(false);
        setSearchQuery(activeWorkspace.name || '');
        if (onProfileChange) onProfileChange(null);
      }
    } catch (err) {
      console.error('Fetch Google Business error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [activeWorkspace?.id, token]);

  // Poll while the background review analysis is running
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const isAnalysisPending = isConnected && profile?.ai_summary?.status === 'pending' && !pollTimedOut;

  useEffect(() => {
    if (!isAnalysisPending) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startedAt > 3 * 60 * 1000) {
        setPollTimedOut(true);
        return;
      }
      fetchProfile({ silent: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAnalysisPending, activeWorkspace?.id, token]);

  // 2. Search businesses
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchError('');
    setActionError('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: searchQuery.trim() })
      });
      const data = await res.json();
      if (res.ok && data.places) {
        setSearchResults(data.places);
      } else {
        setSearchError(data.error || 'Google Maps search failed.');
      }
    } catch (err) {
      console.error('Search places error:', err);
      setSearchError('Google Maps search failed.');
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  // 3. Connect selected business from search
  const handleConnect = async (place) => {
    setIsConnecting(true);
    setConnectingId(place.place_id);
    setActionError('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ placeId: place.place_id })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setPollTimedOut(false);
        setProfile(data.profile);
        setIsConnected(true);
        setSearchResults([]);
        setIsSearchModalOpen(false);
        if (onProfileChange) onProfileChange(data.profile);
      } else {
        setActionError(data.error || 'Could not connect this business.');
      }
    } catch (err) {
      console.error('Connect place error:', err);
      setActionError('Could not connect this business.');
    } finally {
      setIsConnecting(false);
      setConnectingId(null);
    }
  };

  // 4. Sync reviews
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setActionError('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setPollTimedOut(false);
        setProfile(data.profile);
        if (onProfileChange) onProfileChange(data.profile);
      } else {
        setActionError(data.error || 'Could not refresh Google data.');
      }
    } catch (err) {
      console.error('Sync business error:', err);
      setActionError('Could not refresh Google data.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Disconnect profile
  const handleDisconnect = () => {
    setShowDeleteModal(true);
  };

  const handleDisconnectConfirm = async () => {
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(null);
        setIsConnected(false);
        setShowDeleteModal(false);
        if (onProfileChange) onProfileChange(null);
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // 6. Generate AI response for review
  const handleGenerateReply = async (review, idx) => {
    setGeneratingReplyFor(idx);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/generate-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewerName: review.author_name,
          rating: review.rating,
          reviewText: review.text,
          issueTheme: review.issue_category,
          businessName: profile.business_name
        })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setGeneratedReplies(prev => ({ ...prev, [idx]: data.reply }));
      }
    } catch (err) {
      console.error('Generate reply error:', err);
    } finally {
      setGeneratingReplyFor(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="growth-panel-card animate-pulse" style={{ padding: '1.5rem', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={24} color="#3b82f6" />
        <span style={{ marginLeft: 10, color: '#94a3b8', fontSize: '0.9rem' }}>Loading Google Business Profile data...</span>
      </div>
    );
  }

  // Not Connected State
  if (!isConnected || !profile) {
    return (
      <>
        <div className="growth-panel-card animate-fade" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            margin: '0 auto 18px',
            borderRadius: 16,
            background: 'rgba(234, 67, 53, 0.1)',
            border: '1px solid rgba(234, 67, 53, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/growth-covers/google-icon.svg" alt="Google Business Profile" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '8px' }}>
            No Google Business Profile Connected
          </h3>

          <p style={{ maxWidth: 520, margin: '0 auto 24px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Connect your Google Maps and Business Profile to monitor customer reviews on a live radar, generate AI-assisted smart replies, and boost your local search visibility.
          </p>

          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="growth-primary-btn"
            style={{
              margin: '0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              height: '48px',
              padding: '0 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Plus size={18} />
            <span>Connect Google Business Profile</span>
          </button>
        </div>

        {/* Modal for Search & Connect */}
        {isSearchModalOpen && typeof document !== 'undefined' && createPortal(
          <div 
            className="growth-modal-backdrop" 
            onClick={() => setIsSearchModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gbp-search-modal-title"
          >
            <div 
              className="growth-guide-modal gbp-connect-modal animate-scale" 
              style={{ maxWidth: 680, width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
              onClick={e => e.stopPropagation()}
            >
              <div className="growth-modal-header">
                <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(234, 67, 53, 0.12)', border: '1px solid rgba(234, 67, 53, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/growth-covers/google-icon.svg" alt="Google" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h2 id="gbp-search-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
                      Connect Google Business Profile
                    </h2>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                      Search for your Google Maps business or match directly by domain/address.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="growth-modal-close" 
                  onClick={() => setIsSearchModalOpen(false)}
                  aria-label="Close"
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="growth-modal-body" style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Building2 size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-main, #e2e8f0)', lineHeight: 1.5 }}>
                    AI search engines (Gemini, ChatGPT, Perplexity) prioritize recommendations based on your Google rating and customer reviews.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="gbp-search-form">
                  <div className="gbp-search-input-wrap">
                    <Search size={18} className="gbp-search-icon" />
                    <input
                      type="text"
                      className="gbp-search-input"
                      placeholder="Business name or Google Maps link..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="growth-primary-btn gbp-search-btn"
                  >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    <span>Search Business</span>
                  </button>
                </form>

                {/* Live Radar Searching Animation Card */}
                {isSearching && (
                  <div className="gbp-searching-anim-card animate-fade">
                    <div className="gbp-radar-visual-wrap">
                      <div className="gbp-radar-ring gbp-radar-ring-1" />
                      <div className="gbp-radar-ring gbp-radar-ring-2" />
                      <div className="gbp-radar-ring gbp-radar-ring-3" />
                      <div className="gbp-radar-crosshair-h" />
                      <div className="gbp-radar-crosshair-v" />
                      <div className="gbp-radar-sweep-beam" />
                      <div className="gbp-radar-center-blip">
                        <Radio size={20} className="animate-pulse" />
                      </div>
                    </div>

                    <div className="gbp-search-steps-ticker">
                      <div className="gbp-ticker-title">
                        <Compass size={18} color="#38bdf8" className="animate-spin" style={{ animationDuration: '4s' }} />
                        <span>Scanning Google Maps for "{searchQuery}"</span>
                      </div>

                      <div className="gbp-ticker-desc">
                        {SEARCH_ANIM_STEPS[searchStep]}
                      </div>

                      <div className="gbp-search-step-indicators">
                        {SEARCH_ANIM_STEPS.map((_, sIdx) => (
                          <div key={sIdx} className={`gbp-step-dot ${sIdx === searchStep ? 'active' : ''}`} />
                        ))}
                      </div>

                      <div className="gbp-skeleton-preview-rows">
                        <div className="gbp-skeleton-bar" style={{ width: '85%' }} />
                        <div className="gbp-skeleton-bar" style={{ width: '100%' }} />
                        <div className="gbp-skeleton-bar" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !isSearching && (
                  <div className="gbp-search-results animate-fade">
                    <span className="gbp-results-title">Matching Businesses Found:</span>
                    <div className="gbp-results-list">
                      {searchResults.map((place, pIdx) => (
                        <div key={pIdx} className="gbp-result-item">
                          <div className="gbp-result-info">
                            <div className="gbp-result-name-row">
                              <strong className="gbp-result-name">{place.business_name}</strong>
                              {place.rating > 0 && (
                                <span className="gbp-rating-pill">
                                  <Star size={12} fill="#eab308" color="#eab308" />
                                  <span>{place.rating}</span>
                                  <span style={{ color: '#94a3b8' }}>({place.user_ratings_total} ratings)</span>
                                </span>
                              )}
                            </div>
                            {place.formatted_address && (
                              <span className="gbp-result-addr">{place.formatted_address}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isConnecting}
                            onClick={() => handleConnect(place)}
                            className="gbp-connect-action-btn"
                          >
                            {connectingId === place.place_id ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Connecting...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Connect &amp; Analyze</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search / connect errors */}
                {(searchError || actionError) && !isSearching && (
                  <div style={{ padding: '0.85rem 1rem', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)', lineHeight: 1.5 }}>
                      {searchError || actionError}
                    </span>
                  </div>
                )}

                {/* No results banner */}
                {hasSearched && searchResults.length === 0 && !searchError && !isSearching && (
                  <div style={{ padding: '1.15rem 1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.15))' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #f8fafc)', display: 'block', marginBottom: 4 }}>
                      No Google Maps match found for &quot;{searchQuery}&quot;
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      Open your business on Google Maps, tap Share, and paste the link here. Only businesses listed on Google Maps can be connected.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Profiles saved before Google Places verification contain estimated data
  if (!profile.is_verified) {
    return (
      <div className="growth-panel-card gbp-connected-card animate-fade">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#fb923c" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h3 className="growth-panel-title" style={{ margin: 0, fontSize: '1.05rem' }}>
              {profile.business_name}: reconnect required
            </h3>
            <p className="growth-panel-desc" style={{ margin: '0.35rem 0 0.85rem 0', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
              This profile was added before ratings and reviews were verified against Google Maps, so its data is not shown. Reconnect your business to load real Google data.
            </p>
            <button
              type="button"
              className="growth-primary-btn"
              onClick={async () => {
                await handleDisconnectConfirm();
                setIsSearchModalOpen(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <MapPin size={14} />
              <span>Reconnect via Google Maps</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connected State
  const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
  const lowStarReviews = reviews.filter(r => Number(r.rating) <= 2);

  const baseFilteredReviews = reviewTab === 'low_star' ? lowStarReviews : reviews;

  const finalFilteredReviews = starFilter === 'all'
    ? baseFilteredReviews
    : baseFilteredReviews.filter(r => Number(r.rating) === Number(starFilter));

  const totalPages = Math.max(1, Math.ceil(finalFilteredReviews.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedReviews = finalFilteredReviews.slice(startIndex, startIndex + pageSize);

  const aiSummary = profile.ai_summary || {};
  const isAnalysisFailed = aiSummary.status === 'failed';
  const riskClass = (profile.ai_recommendation_risk === 'Yüksek Risk' || profile.ai_recommendation_risk === 'High Risk') ? 'red' : (profile.ai_recommendation_risk === 'Orta Risk' || profile.ai_recommendation_risk === 'Medium Risk') ? 'yellow' : 'green';
  const riskLabel = (profile.ai_recommendation_risk === 'Yüksek Risk' || profile.ai_recommendation_risk === 'High Risk') ? 'High Risk' : (profile.ai_recommendation_risk === 'Orta Risk' || profile.ai_recommendation_risk === 'Medium Risk') ? 'Medium Risk' : 'Low Risk';
  const chronicThemes = Array.isArray(aiSummary.chronic_complaint_themes)
    ? aiSummary.chronic_complaint_themes
    : Array.isArray(aiSummary.chronic_themes)
    ? aiSummary.chronic_themes
    : Array.isArray(profile.chronic_complaint_themes)
    ? profile.chronic_complaint_themes
    : Array.isArray(profile.chronic_themes)
    ? profile.chronic_themes
    : [];

  return (
    <div className="growth-panel-card gbp-connected-card animate-fade">
      {/* Top Header */}
      <div className="growth-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="ai-report-icon-box" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234, 67, 53, 0.15)', borderColor: 'rgba(234, 67, 53, 0.3)', color: '#ea4335' }}>
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 className="growth-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                {profile.business_name}
              </h3>
              <span className="growth-badge green" style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}>
                ✓ Google Maps Connected
              </span>
            </div>
            <p className="growth-panel-desc" style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              {profile.formatted_address || 'Google Maps Profile'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {profile.google_maps_url && (
            <a
              href={profile.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="growth-secondary-btn"
              title="View on Google Maps"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem' }}
            >
              <ExternalLink size={13} />
              <span>Open in Maps</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isAnalysisPending}
            className="growth-secondary-btn"
            title="Update Reviews and Ratings"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem' }}
          >
            <RefreshCw size={13} className={isSyncing || isAnalysisPending ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Refreshing...' : isAnalysisPending ? 'Analyzing reviews...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            className="growth-secondary-btn"
            title="Disconnect Profile"
            style={{ padding: '0.4rem 0.65rem', color: '#f87171' }}
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="growth-secondary-btn"
            title={isCollapsed ? 'Expand' : 'Collapse'}
            style={{ padding: '0.4rem 0.65rem' }}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: 10, fontSize: '0.84rem', color: 'var(--text-main, #f8fafc)' }}>
          {actionError}
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* 4 Metric Cards */}
          <div className="gbp-metrics-grid">
            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Google Rating</span>
              <div className="gbp-metric-val score-gold">
                <Star size={18} fill="#eab308" color="#eab308" />
                <span>{Number(profile.rating || 0).toFixed(1)}</span>
                <span className="gbp-metric-sub-inline">/ 5.0</span>
              </div>
              <span className="gbp-metric-sub">
                {profile.rating >= 4.5 ? '⭐ Excellent Reputation' : profile.rating >= 4.0 ? '👍 Good Standing' : '⚠️ Needs Improvement'}
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Total Ratings
                <span title="Total rating count on Google Maps, including star-only ratings without text." style={{ cursor: 'help', color: '#94a3b8' }}>
                  <AlertTriangle size={12} />
                </span>
              </span>
              <div className="gbp-metric-val">
                {profile.total_reviews}
              </div>
              <span className="gbp-metric-sub">
                {profile.total_reviews >= 50 ? '✓ AI Trust Threshold Passed' : 'Min. 50 reviews recommended'}
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Low-Star in Latest Reviews</span>
              <div className="gbp-metric-val text-danger" style={{ color: lowStarReviews.length > 0 ? '#f87171' : '#34d399' }}>
                {lowStarReviews.length} / {reviews.length}
              </div>
              <span className="gbp-metric-sub">
                1-2★ among the reviews Google returned
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Last Synced</span>
              <div className="gbp-metric-val" style={{ fontSize: '1rem' }}>
                {profile.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : '—'}
              </div>
              <span className="gbp-metric-sub">
                Source: Google Maps
              </span>
            </div>
          </div>

          {/* AI Recommendation Risk & Chronic Themes Box */}
          <div className="gbp-ai-analysis-box">
            <div className="gbp-ai-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={16} color="#38bdf8" />
                <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>
                  AI (GEO) Recommendation Risk Analysis
                </strong>
              </div>

              <span className={`growth-badge ${riskClass}`}>
                <ShieldAlert size={12} /> {riskLabel}
              </span>
            </div>

            {isAnalysisPending && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0.5rem 0', fontSize: '0.84rem', color: '#38bdf8', lineHeight: 1.5 }}>
                <Loader2 size={14} className="animate-spin" />
                Analyzing customer reviews and owner replies in the background. This card updates automatically.
              </p>
            )}

            {isAnalysisFailed && (
              <p style={{ margin: '0.5rem 0', fontSize: '0.84rem', color: '#fb923c', lineHeight: 1.5 }}>
                Review analysis could not be completed. Use Refresh to try again.
              </p>
            )}

            {aiSummary.sentiment_summary && (
              <p style={{ margin: '0.5rem 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {aiSummary.sentiment_summary}
              </p>
            )}

            {aiSummary.ai_risk_explanation && (
              <div className="gbp-ai-explanation">
                <strong>AI Visibility Impact:</strong> {aiSummary.ai_risk_explanation}
              </div>
            )}

            {chronicThemes.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Chronic Customer Complaints in Low-Star Reviews:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {chronicThemes.map((th, thIdx) => {
                    const themeName = typeof th === 'string' ? th : (th.theme || th.name || th.topic || 'Complaint');
                    const mentionCount = typeof th === 'object' ? (th.count || th.mentions || null) : null;
                    return (
                      <span key={thIdx} className="gbp-theme-pill">
                        <AlertTriangle size={12} color="#f87171" />
                        <strong>{themeName}</strong>
                        {mentionCount !== null && <span className="theme-count">({mentionCount} mentions)</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Business Photos Gallery */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="gbp-photos-section" style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 12, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <ImageIcon size={16} color="#a855f7" />
                <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>Business Photos</strong>
                <span className="growth-badge neutral" style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Google Maps</span>
              </div>
              <div className="gbp-photos-scroll-container" style={{ 
                display: 'flex', 
                gap: '0.85rem', 
                overflowX: 'auto', 
                paddingBottom: '0.5rem', 
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch'
              }}>
                {profile.photos.map((photoUrl, idx) => (
                  <div key={idx} style={{ position: 'relative', flexShrink: 0, height: 130, width: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))' }}>
                    <img
                      src={photoUrl}
                      alt={`${profile.business_name || 'Business'} Photo ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="gbp-reviews-section" style={{ marginTop: '1.25rem' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: '#f8fafc' }}>Notice:</strong> All reviews below come directly from Google Maps. Google&apos;s public API returns <strong style={{ color: '#38bdf8' }}>up to 5 of the most relevant reviews</strong> per business and does not include owner replies. The AI analysis is based only on these reviews.
              </p>
            </div>
            <div className="gbp-reviews-toolbar">
              <div className="gbp-tab-buttons">
                <button
                  type="button"
                  onClick={() => { setReviewTab('all'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'all' ? 'active' : ''}`}
                >
                  <MessageSquare size={13} />
                  <span>All Reviews ({reviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setReviewTab('low_star'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'low_star' ? 'active danger' : ''}`}
                >
                  <AlertTriangle size={13} />
                  <span>Low-Star (1-2★) ({lowStarReviews.length})</span>
                </button>
              </div>

              {/* Star Rating Filter Chips */}
              <div className="gbp-star-filter-row">
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginRight: 4 }}>
                  Rating Filter:
                </span>
                {['all', '5', '4', '3', '2', '1'].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => { setStarFilter(starVal); setCurrentPage(1); }}
                    className={`gbp-star-chip ${starFilter === starVal ? 'active' : ''}`}
                  >
                    {starVal === 'all' ? (
                      <span>All ({baseFilteredReviews.length})</span>
                    ) : (
                      <>
                        <Star size={11} fill={starFilter === starVal ? '#eab308' : '#94a3b8'} color={starFilter === starVal ? '#eab308' : '#94a3b8'} />
                        <span>{starVal}★ ({baseFilteredReviews.filter(r => Number(r.rating) === Number(starVal)).length})</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            {finalFilteredReviews.length === 0 ? (
              <div className="gbp-empty-reviews">
                <CheckCircle2 size={24} color="#34d399" />
                <span style={{ fontWeight: 600, color: '#f8fafc', marginTop: 6 }}>
                  {reviews.length === 0
                    ? 'Google did not return any written reviews for this business.'
                    : 'No reviews found matching the selected filters.'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  You can select a different rating or tab to explore other customer reviews.
                </span>
              </div>
            ) : (
              <div className="gbp-reviews-list">
                {paginatedReviews.map((rev, pIdx) => {
                  const rIdx = startIndex + pIdx;
                  const isLow = Number(rev.rating) <= 2;
                  const hasReply = rev.has_owner_response || Boolean(rev.owner_response);
                  const generatedReply = generatedReplies[rIdx];

                  return (
                    <div key={rIdx} className={`gbp-review-card ${isLow ? 'is-low' : ''}`}>
                      <div className="gbp-review-top">
                        <div className="gbp-reviewer-box">
                          <div className="gbp-reviewer-avatar">
                            {rev.author_name ? rev.author_name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <strong className="gbp-reviewer-name">{rev.author_name}</strong>
                              <span className={`gbp-stars-badge ${isLow ? 'bad' : 'good'}`}>
                                <Star size={11} fill={isLow ? '#ef4444' : '#eab308'} color={isLow ? '#ef4444' : '#eab308'} />
                                <span>{rev.rating}★</span>
                              </span>
                            </div>
                            <span className="gbp-review-time">{rev.relative_time || 'Recently'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {rev.google_maps_uri && (
                            <a
                              href={rev.google_maps_uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="growth-badge neutral"
                              style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <ExternalLink size={11} />
                              <span>View on Google</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="gbp-review-text">
                        "{rev.text || 'User left a rating without text review.'}"
                      </p>

                      {/* Existing owner response - highlighted with verified badge */}
                      {rev.owner_response && (
                        <div className="gbp-owner-response animate-fade">
                          <div className="gbp-owner-response-header">
                            <div className="gbp-owner-response-badge">
                              <CheckCircle2 size={13} color="#10b981" />
                              <span>Business Owner Response</span>
                              <span className="gbp-verified-tag">Verified</span>
                            </div>
                            <span className="gbp-owner-response-date">
                              {rev.owner_response_time || rev.relative_time || 'Google Business Reply'}
                            </span>
                          </div>
                          <p className="gbp-owner-response-text">
                            {rev.owner_response}
                          </p>
                        </div>
                      )}

                      {/* AI Response Generator for Low-Star without reply */}
                      {isLow && !hasReply && (
                        <div className="gbp-ai-reply-container">
                          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: generatedReply ? '0.75rem' : '0' }}>
                            <a
                              href={profile.google_maps_url || "https://business.google.com/"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="growth-primary-btn"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: 6, display: 'inline-flex', alignItems: 'center', height: '36px' }}
                              title="Reply to this review on your Google Business Profile"
                            >
                              <ExternalLink size={13} />
                              <span>Reply on Google</span>
                            </a>
                            
                            {!generatedReply && (
                              <button
                                type="button"
                                onClick={() => handleGenerateReply(rev, rIdx)}
                                disabled={generatingReplyFor === rIdx}
                                className="growth-secondary-btn gbp-ai-btn"
                                style={{ height: '36px' }}
                              >
                                {generatingReplyFor === rIdx ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Generating AI Reply...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} color="#38bdf8" />
                                    <span>✨ Generate AI Apology Reply (Copy to Google)</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {generatedReply && (
                            <div className="gbp-generated-reply-box animate-fade">
                              <div className="reply-top">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8' }}>
                                  <Sparkles size={12} />
                                  <span>Recommended Recovery Reply:</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(generatedReply, rIdx)}
                                  className="growth-secondary-btn"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', gap: 4 }}
                                >
                                  {copiedId === rIdx ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                                  <span>{copiedId === rIdx ? 'Copied!' : 'Copy Text'}</span>
                                </button>
                              </div>

                              <p className="reply-content">
                                {generatedReply}
                              </p>

                              <span className="reply-tip">
                                💡 You can copy this response and paste it as a direct reply on your Google Business Profile.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {finalFilteredReviews.length > 0 && (
              <div className="gbp-pagination-container">
                <div className="gbp-pagination-info">
                  Showing <strong>{startIndex + 1} - {Math.min(startIndex + pageSize, finalFilteredReviews.length)}</strong> of{' '}
                  <strong>{finalFilteredReviews.length}</strong> reviews
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div className="gbp-page-size-selector">
                    <span>Per Page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  <div className="gbp-pagination-controls">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={validCurrentPage <= 1}
                      className="gbp-page-btn"
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pNum => {
                      if (
                        totalPages > 7 &&
                        pNum !== 1 &&
                        pNum !== totalPages &&
                        Math.abs(pNum - validCurrentPage) > 2
                      ) {
                        if (pNum === 2 || pNum === totalPages - 1) {
                          return <span key={pNum} style={{ color: '#64748b', padding: '0 4px', fontSize: '0.8rem' }}>...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setCurrentPage(pNum)}
                          className={`gbp-page-btn ${validCurrentPage === pNum ? 'active' : ''}`}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={validCurrentPage >= totalPages}
                      className="gbp-page-btn"
                      title="Next Page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }} className="animate-fade">
          <div style={{
            background: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 440,
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={28} />
            </div>
            
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              Disconnect Profile
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
              Are you sure you want to disconnect this Google Business Profile? This will reset your current analysis and reports.
            </p>
            
            <div style={{ display: 'flex', width: '100%', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="growth-secondary-btn"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectConfirm}
                className="growth-primary-btn"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', background: '#ef4444', borderColor: '#ef4444' }}
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
