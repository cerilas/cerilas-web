import React, { useState, useEffect } from 'react';
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
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';

const SEARCH_ANIM_STEPS = [
  'Google Haritalar dizininde eşleşen işletmeler taranıyor...',
  'Konum, koordinat ve yerel mağaza bilgileri doğrulanıyor...',
  'Müşteri puanları, yorum sayıları ve profil detayları derleniyor...'
];

export default function GoogleBusinessProfileCard() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Search & connect state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
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

  // Manual fallback state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualRating, setManualRating] = useState('4.8');
  const [manualReviews, setManualReviews] = useState('25');

  // Review list state & pagination
  const [reviewTab, setReviewTab] = useState('all'); // 'all', 'low_star', 'unanswered', 'with_reply'
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [generatingReplyFor, setGeneratingReplyFor] = useState(null);
  const [generatedReplies, setGeneratedReplies] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 1. Fetch current profile status
  const fetchProfile = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.connected && data.profile) {
        setProfile(data.profile);
        setIsConnected(true);
      } else {
        setProfile(null);
        setIsConnected(false);
        setSearchQuery(activeWorkspace.name || '');
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

  // 2. Search businesses
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowManualForm(false);
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
      }
    } catch (err) {
      console.error('Search places error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Connect selected business from search
  const handleConnect = async (place) => {
    setIsConnecting(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          placeId: place.place_id,
          businessName: place.business_name,
          formattedAddress: place.formatted_address,
          googleMapsUrl: place.google_maps_url,
          rating: place.rating,
          totalReviews: place.user_ratings_total
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setIsConnected(true);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Connect place error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // 3.1 Connect manually entered business profile
  const handleConnectManual = async (e) => {
    if (e) e.preventDefault();
    if (!manualName.trim() || isConnecting) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          placeId: `manual_${Date.now()}`,
          businessName: manualName.trim(),
          formattedAddress: manualCity.trim() || 'Türkiye',
          googleMapsUrl: manualUrl.trim() || '',
          rating: parseFloat(manualRating) || 4.8,
          totalReviews: parseInt(manualReviews, 10) || 15
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setIsConnected(true);
        setShowManualForm(false);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Manual connect place error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // 4. Sync reviews
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Sync business error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Disconnect profile
  const handleDisconnect = async () => {
    if (!window.confirm('Google İşletme Profili bağlantısını kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(null);
        setIsConnected(false);
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
        <span style={{ marginLeft: 10, color: '#94a3b8', fontSize: '0.9rem' }}>Google İşletme Profili verileri yükleniyor...</span>
      </div>
    );
  }

  // Not Connected State
  if (!isConnected || !profile) {
    return (
      <div className="growth-panel-card gbp-card animate-fade">
        <div className="growth-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="ai-report-icon-box" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234, 67, 53, 0.15)', borderColor: 'rgba(234, 67, 53, 0.3)', color: '#ea4335' }}>
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="growth-panel-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Google Haritalar Profilinizi Bağlayın
              </h3>
              <p className="growth-panel-desc" style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                İşletmenizi aratarak puanınızı, yorum sayınızı ve düşük yıldızlı şikayetleri AI radarına dahil edin.
              </p>
            </div>
          </div>

          <span className="growth-badge neutral">
            İsteğe Bağlı
          </span>
        </div>

        <div className="gbp-search-box">
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.86rem', color: 'var(--text-main, #e2e8f0)', lineHeight: 1.5 }}>
            Yapay zeka arama motorları (Gemini, ChatGPT, Perplexity), yerel aramalarda işletmenizin <strong>Google ortalama puanına</strong> ve <strong>düşük yıldızlı olumsuz yorumlardaki şikayet konularına</strong> göre tavsiye kararı verir.
          </p>

          <form onSubmit={handleSearch} className="gbp-search-form">
            <div className="gbp-search-input-wrap">
              <Search size={16} className="gbp-search-icon" />
              <input
                type="text"
                className="gbp-search-input"
                placeholder="Google Haritalar işletme adı veya şehir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="growth-primary-btn gbp-search-btn"
            >
              {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>İşletmeyi Ara</span>
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
                  <span>"{searchQuery}" için Google Haritalar Taranıyor</span>
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
              <span className="gbp-results-title">Bulunan Eşleşen İşletmeler:</span>
              <div className="gbp-results-list">
                {searchResults.map((place, pIdx) => (
                  <div key={pIdx} className="gbp-result-item">
                    <div className="gbp-result-info" style={{ minWidth: 0, flex: 1 }}>
                      <div className="gbp-result-name-row">
                        <strong className="gbp-result-name">{place.business_name}</strong>
                        {place.rating > 0 && (
                          <span className="gbp-rating-pill">
                            <Star size={11} fill="#eab308" color="#eab308" />
                            <span>{place.rating}</span>
                            <span style={{ color: '#94a3b8' }}>({place.user_ratings_total} yorum)</span>
                          </span>
                        )}
                      </div>
                      <span className="gbp-result-addr">{place.formatted_address || 'Adres bilgisi mevcut'}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={() => handleConnect(place)}
                      className="growth-secondary-btn"
                      style={{ background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#38bdf8', flexShrink: 0 }}
                    >
                      {isConnecting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Bağla &amp; Analiz Et</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results banner with manual connect toggle */}
          {searchResults.length === 0 && searchQuery && !isSearching && !showManualForm && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.15rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)', display: 'block' }}>
                    "{searchQuery}" için doğrudan harita eşleşmesi bulunamadı
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    İşletmeniz dijital/online ise veya Google Haritalar linkinizi biliyorsanız bilgileri doğrudan girebilirsiniz.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setManualName(searchQuery || activeWorkspace?.name || '');
                    setShowManualForm(true);
                  }}
                  className="growth-secondary-btn"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: 6, color: '#38bdf8', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                >
                  <Building2 size={13} />
                  <span>Bilgileri Manuel Gir</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick toggle if hasn't searched yet */}
          {!showManualForm && searchResults.length === 0 && !searchQuery && (
            <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => {
                  setManualName(activeWorkspace?.name || '');
                  setShowManualForm(true);
                }}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Veya işletme profilini doğrudan manuel tanımla →
              </button>
            </div>
          )}

          {/* Manual Profile Entry Form */}
          {showManualForm && (
            <form onSubmit={handleConnectManual} className="animate-fade" style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="#3b82f6" />
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main, #f8fafc)' }}>
                    Manuel İşletme Profili Tanımla
                  </strong>
                </div>
                <span className="growth-badge blue" style={{ fontSize: '0.72rem' }}>
                  Hemen Analiz Et
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                    İşletme / Marka Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Örn: Cerilas Web Studio"
                    className="gbp-search-input"
                    style={{ paddingLeft: '1rem', height: 40 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                    Google Maps Linki veya Web Adresi
                  </label>
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... veya alan adı"
                    className="gbp-search-input"
                    style={{ paddingLeft: '1rem', height: 40 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                    Şehir / Bölge
                  </label>
                  <input
                    type="text"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="Örn: İstanbul, Türkiye"
                    className="gbp-search-input"
                    style={{ paddingLeft: '1rem', height: 40 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                      Google Puanı
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={manualRating}
                      onChange={(e) => setManualRating(e.target.value)}
                      className="gbp-search-input"
                      style={{ paddingLeft: '1rem', height: 40 }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                      Toplam Yorum
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualReviews}
                      onChange={(e) => setManualReviews(e.target.value)}
                      className="gbp-search-input"
                      style={{ paddingLeft: '1rem', height: 40 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="growth-secondary-btn"
                  style={{ height: 38, fontSize: '0.8rem' }}
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isConnecting || !manualName.trim()}
                  className="growth-primary-btn"
                  style={{ height: 38, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isConnecting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Profili Bağla &amp; Analiz Et</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Connected State
  const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
  const lowStarReviews = reviews.filter(r => Number(r.rating) <= 2);
  const unansweredReviews = lowStarReviews.filter(r => !r.has_owner_response && !r.owner_response);
  const withReplyReviews = reviews.filter(r => r.has_owner_response || Boolean(r.owner_response));

  let baseFilteredReviews = reviews;
  if (reviewTab === 'low_star') {
    baseFilteredReviews = lowStarReviews;
  } else if (reviewTab === 'unanswered') {
    baseFilteredReviews = unansweredReviews;
  } else if (reviewTab === 'with_reply') {
    baseFilteredReviews = withReplyReviews;
  }

  const finalFilteredReviews = starFilter === 'all'
    ? baseFilteredReviews
    : baseFilteredReviews.filter(r => Number(r.rating) === Number(starFilter));

  const totalPages = Math.max(1, Math.ceil(finalFilteredReviews.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedReviews = finalFilteredReviews.slice(startIndex, startIndex + pageSize);

  const aiSummary = profile.ai_summary || {};
  const chronicThemes = aiSummary.chronic_complaint_themes || [];
  const riskClass = profile.ai_recommendation_risk === 'Yüksek Risk' ? 'red' : profile.ai_recommendation_risk === 'Orta Risk' ? 'yellow' : 'green';

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
                ✓ Google Haritalar Bağlı
              </span>
            </div>
            <p className="growth-panel-desc" style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              {profile.formatted_address || 'Google Haritalar Profili'}
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
              title="Google Haritalar'da Görüntüle"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem' }}
            >
              <ExternalLink size={13} />
              <span>Haritalarda Aç</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="growth-secondary-btn"
            title="Yorumları ve Puanları Güncelle"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem' }}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Yenileniyor...' : 'Güncelle'}</span>
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            className="growth-secondary-btn"
            title="Bağlantıyı Kaldır"
            style={{ padding: '0.4rem 0.65rem', color: '#f87171' }}
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="growth-secondary-btn"
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
            style={{ padding: '0.4rem 0.65rem' }}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* 4 Metric Cards */}
          <div className="gbp-metrics-grid">
            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Google Puanı</span>
              <div className="gbp-metric-val score-gold">
                <Star size={18} fill="#eab308" color="#eab308" />
                <span>{Number(profile.rating || 0).toFixed(1)}</span>
                <span className="gbp-metric-sub-inline">/ 5.0</span>
              </div>
              <span className="gbp-metric-sub">
                {profile.rating >= 4.5 ? '⭐ Mükemmel İtibar' : profile.rating >= 4.0 ? '👍 İyi Durumda' : '⚠️ İyileştirilmeli'}
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Toplam Yorum</span>
              <div className="gbp-metric-val">
                {profile.total_reviews}
              </div>
              <span className="gbp-metric-sub">
                {profile.total_reviews >= 50 ? '✓ AI Güven Barajı Geçildi' : 'Min. 50 yorum önerilir'}
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Düşük Yıldızlı Yorumlar (1-2★)</span>
              <div className="gbp-metric-val text-danger" style={{ color: profile.low_rating_count > 0 ? '#f87171' : '#34d399' }}>
                {profile.low_rating_count} Adet
              </div>
              <span className="gbp-metric-sub">
                %{Math.round(((profile.low_rating_count || 0) / (profile.total_reviews || 1)) * 100)} Olumsuz şikayet oranı
              </span>
            </div>

            <div className="gbp-metric-card">
              <span className="gbp-metric-label">Yanıtsız Olumsuz Yorum</span>
              <div className="gbp-metric-val" style={{ color: profile.unanswered_low_count > 0 ? '#fb923c' : '#34d399' }}>
                {profile.unanswered_low_count} Adet
              </div>
              <span className="gbp-metric-sub">
                {profile.unanswered_low_count > 0 ? '⚠️ AI Tavsiyesini Tehdit Ediyor' : '✓ Tüm şikayetler yanıtlandı'}
              </span>
            </div>
          </div>

          {/* AI Recommendation Risk & Chronic Themes Box */}
          <div className="gbp-ai-analysis-box">
            <div className="gbp-ai-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={16} color="#38bdf8" />
                <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>
                  Yapay Zeka (GEO) Tavsiye Riski Analizi
                </strong>
              </div>

              <span className={`growth-badge ${riskClass}`}>
                <ShieldAlert size={12} /> {profile.ai_recommendation_risk || 'Düşük Risk'}
              </span>
            </div>

            {aiSummary.sentiment_summary && (
              <p style={{ margin: '0.5rem 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {aiSummary.sentiment_summary}
              </p>
            )}

            {aiSummary.ai_risk_explanation && (
              <div className="gbp-ai-explanation">
                <strong>AI Görünürlük Etkisi:</strong> {aiSummary.ai_risk_explanation}
              </div>
            )}

            {chronicThemes.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Düşük Yıldızlı Yorumlardaki Kronik Müşteri Şikayetleri:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {chronicThemes.map((th, thIdx) => (
                    <span key={thIdx} className="gbp-theme-pill">
                      <AlertTriangle size={12} color="#f87171" />
                      <strong>{th.theme}</strong>
                      <span className="theme-count">({th.count} kez geçti)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews Explorer with Filter Tabs & Pagination */}
          <div className="gbp-reviews-section">
            <div className="gbp-reviews-toolbar">
              <div className="gbp-tab-buttons">
                <button
                  type="button"
                  onClick={() => { setReviewTab('all'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'all' ? 'active' : ''}`}
                >
                  <MessageSquare size={13} />
                  <span>Tüm Yorumlar ({reviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setReviewTab('low_star'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'low_star' ? 'active danger' : ''}`}
                >
                  <AlertTriangle size={13} />
                  <span>Düşük Yıldızlı (1-2★) ({lowStarReviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setReviewTab('unanswered'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'unanswered' ? 'active warning' : ''}`}
                >
                  <AlertTriangle size={13} />
                  <span>Yanıtsız Kalanlar ({unansweredReviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setReviewTab('with_reply'); setCurrentPage(1); }}
                  className={`gbp-tab-btn ${reviewTab === 'with_reply' ? 'active' : ''}`}
                  style={{
                    borderColor: reviewTab === 'with_reply' ? 'rgba(16, 185, 129, 0.4)' : undefined,
                    color: reviewTab === 'with_reply' ? '#34d399' : undefined
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>İşletme Yanıtı Olanlar ({withReplyReviews.length})</span>
                </button>
              </div>

              {/* Star Rating Filter Chips */}
              <div className="gbp-star-filter-row">
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginRight: 4 }}>
                  Puan Filtresi:
                </span>
                {['all', '5', '4', '3', '2', '1'].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => { setStarFilter(starVal); setCurrentPage(1); }}
                    className={`gbp-star-chip ${starFilter === starVal ? 'active' : ''}`}
                  >
                    {starVal === 'all' ? (
                      <span>Tümü ({baseFilteredReviews.length})</span>
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
                  {reviewTab === 'unanswered' 
                    ? 'Tebrikler! Yanıtsız kalan düşük yıldızlı şikayet bulunmuyor.' 
                    : 'Seçili filtrelerde görüntülenecek yorum bulunamadı.'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Farklı bir puan veya sekme seçerek diğer müşteri yorumlarını inceleyebilirsiniz.
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
                            <span className="gbp-review-time">{rev.relative_time || 'Yakın zamanda'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {hasReply ? (
                            <span className="growth-badge green" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={11} />
                              <span>✓ İşletme Yanıtladı</span>
                            </span>
                          ) : isLow ? (
                            <span className="growth-badge red" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={11} />
                              <span>⚠️ Yanıtsız Şikayet</span>
                            </span>
                          ) : null}

                          {rev.issue_category && (
                            <span className="growth-badge neutral" style={{ fontSize: '0.72rem' }}>
                              {rev.issue_category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="gbp-review-text">
                        "{rev.text || 'Kullanıcı metin girmeden sadece puan verdi.'}"
                      </p>

                      {/* Existing owner response - highlighted with verified badge */}
                      {rev.owner_response && (
                        <div className="gbp-owner-response animate-fade">
                          <div className="gbp-owner-response-header">
                            <div className="gbp-owner-response-badge">
                              <CheckCircle2 size={13} color="#10b981" />
                              <span>İşletme Sahibinin Yanıtı</span>
                              <span className="gbp-verified-tag">Doğrulanmış</span>
                            </div>
                            <span className="gbp-owner-response-date">
                              {rev.owner_response_time || rev.relative_time || 'Google İşletme Yanıtı'}
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
                          {!generatedReply ? (
                            <button
                              type="button"
                              onClick={() => handleGenerateReply(rev, rIdx)}
                              disabled={generatingReplyFor === rIdx}
                              className="growth-secondary-btn gbp-ai-btn"
                            >
                              {generatingReplyFor === rIdx ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>AI Telafi Yanıtı Oluşturuluyor...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={13} color="#38bdf8" />
                                  <span>✨ AI ile Telafi Yanıtı Üret (Google'a Yapıştır)</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="gbp-generated-reply-box animate-fade">
                              <div className="reply-top">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8' }}>
                                  <Sparkles size={12} />
                                  <span>Önerilen Telafi Yanıtı:</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(generatedReply, rIdx)}
                                  className="growth-secondary-btn"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', gap: 4 }}
                                >
                                  {copiedId === rIdx ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                                  <span>{copiedId === rIdx ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
                                </button>
                              </div>

                              <p className="reply-content">
                                {generatedReply}
                              </p>

                              <span className="reply-tip">
                                💡 Bu metni kopyalayıp Google İşletme Profilinizde bu yoruma yanıt olarak yapıştırabilirsiniz.
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
                  Toplam <strong>{finalFilteredReviews.length}</strong> yorumdan{' '}
                  <strong>{startIndex + 1} - {Math.min(startIndex + pageSize, finalFilteredReviews.length)}</strong> arası gösteriliyor
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div className="gbp-page-size-selector">
                    <span>Sayfa Başı:</span>
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
                      title="Önceki Sayfa"
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
                      title="Sonraki Sayfa"
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
    </div>
  );
}
