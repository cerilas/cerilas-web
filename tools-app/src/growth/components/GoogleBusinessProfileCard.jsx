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
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';

export default function GoogleBusinessProfileCard() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Search & connect state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Review list state
  const [reviewTab, setReviewTab] = useState('low_star'); // 'low_star', 'unanswered', 'all'
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

  // 3. Connect selected business
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
          businessName: place.business_name
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

          {/* Search Results */}
          {searchResults.length > 0 && (
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

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              💡 İşletmeniz bulunamadıysa Google Haritalar'daki tam tabelası adını veya şehir ekleyerek aratabilirsiniz.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Connected State
  const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
  const lowStarReviews = reviews.filter(r => Number(r.rating) <= 2);
  const unansweredReviews = lowStarReviews.filter(r => !r.has_owner_response);

  const displayedReviews = reviewTab === 'low_star' 
    ? lowStarReviews 
    : reviewTab === 'unanswered' 
      ? unansweredReviews 
      : reviews;

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

          {/* Reviews Explorer with Low-Star Filters */}
          <div className="gbp-reviews-section">
            <div className="gbp-reviews-toolbar">
              <div className="gbp-tab-buttons">
                <button
                  type="button"
                  onClick={() => setReviewTab('low_star')}
                  className={`gbp-tab-btn ${reviewTab === 'low_star' ? 'active danger' : ''}`}
                >
                  <AlertTriangle size={13} />
                  <span>Düşük Yıldızlı Yorumlar (1-2★) ({lowStarReviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewTab('unanswered')}
                  className={`gbp-tab-btn ${reviewTab === 'unanswered' ? 'active warning' : ''}`}
                >
                  <MessageSquare size={13} />
                  <span>Yanıtsız Kalanlar ({unansweredReviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewTab('all')}
                  className={`gbp-tab-btn ${reviewTab === 'all' ? 'active' : ''}`}
                >
                  <span>Tüm Yorumlar ({reviews.length})</span>
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {displayedReviews.length === 0 ? (
              <div className="gbp-empty-reviews">
                <CheckCircle2 size={24} color="#34d399" />
                <span style={{ fontWeight: 600, color: '#f8fafc', marginTop: 6 }}>
                  {reviewTab === 'unanswered' 
                    ? 'Tebrikler! Yanıtsız kalan düşük yıldızlı yorum bulunmuyor.' 
                    : 'Bu filtrede görüntülenecek yorum bulunamadı.'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  İşletmenizin Google Haritalar'daki itibar durumu iyi görünüyor.
                </span>
              </div>
            ) : (
              <div className="gbp-reviews-list">
                {displayedReviews.map((rev, rIdx) => {
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong className="gbp-reviewer-name">{rev.author_name}</strong>
                              <span className={`gbp-stars-badge ${isLow ? 'bad' : 'good'}`}>
                                <Star size={11} fill={isLow ? '#ef4444' : '#eab308'} color={isLow ? '#ef4444' : '#eab308'} />
                                <span>{rev.rating}★</span>
                              </span>
                            </div>
                            <span className="gbp-review-time">{rev.relative_time || 'Yakın zamanda'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {hasReply ? (
                            <span className="growth-badge green" style={{ fontSize: '0.72rem' }}>
                              ✓ İşletme Yanıtladı
                            </span>
                          ) : isLow ? (
                            <span className="growth-badge red" style={{ fontSize: '0.72rem' }}>
                              ⚠️ Yanıtsız Şikayet
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

                      {/* Existing owner response */}
                      {rev.owner_response && (
                        <div className="gbp-owner-response">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <ThumbsUp size={11} color="#34d399" />
                            <strong style={{ fontSize: '0.78rem', color: '#34d399' }}>İşletme Yanıtı:</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                            {rev.owner_response}
                          </p>
                        </div>
                      )}

                      {/* AI Response Generator for Low-Star */}
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
          </div>
        </>
      )}
    </div>
  );
}
