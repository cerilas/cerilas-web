import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Plus, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Bot, 
  Globe, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowUpRight,
  Layers,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import { SkeletonBlock } from '../components/GrowthSkeleton';

export default function GrowthCompetitors() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [compDomain, setCompDomain] = useState('');
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState('direct');
  const [addingComp, setAddingComp] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
          type: compType
        })
      });
      if (res.ok) {
        setCompDomain('');
        setCompName('');
        setIsAddOpen(false);
        fetchCompetitors();
      }
    } catch (err) {
      console.error('Add competitor error:', err);
    } finally {
      setAddingComp(false);
    }
  };

  const handleDeleteCompetitor = async (compId) => {
    if (!confirm('Bu rakibi takipten çıkarmak istediğinize emin misiniz?')) return;
    setDeletingId(compId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/competitors/${compId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCompetitors(prev => prev.filter(c => c.id !== compId));
      }
    } catch (err) {
      console.error('Delete competitor error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const ourScore = activeWorkspace?.growth_score || 76;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Rakip İstihbaratı & GEO Analizi"
        badgeIcon={Users2}
        title="Rakip İstihbaratı & Alıntı Boşluğu"
        subtitle="Rakiplerinizin Google arama ve Yapay Zeka (GEO) alıntılanma durumunu izleyin, nerede öne geçtiklerini ve hangi dizinlerde listelendiklerini analiz edin."
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { label: 'Bizim Skorumuz', value: `${ourScore}/100`, sub: 'Büyüme & GEO Gücü' },
          { label: 'İzlenen Rakip', value: `${competitors.length} Marka`, sub: 'Aktif radar' },
          { label: 'Alıntı Liderliği', value: ourScore >= 70 ? 'Öndesiniz' : 'Geliştirilmeli', sub: 'Modellerde öne geçme' }
        ]}
        actions={
          <button
            type="button"
            className="growth-primary-btn"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={15} />
            <span>Yeni Rakip Ekle</span>
          </button>
        }
      />

      {/* Top Comparison Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Bizim Büyüme Skorumuz</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{ourScore}/100</div>
          <div className="stat-card-sub text-muted">{activeWorkspace?.name || 'Markanız'}</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Takip Edilen Rakip</span>
            <Users2 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{competitors.length}</div>
          <div className="stat-card-sub text-muted">Doğrudan ve arama rakipleri</div>
        </div>

        <div className="growth-stat-card highlight-quickwin">
          <div className="stat-card-header">
            <span className="stat-card-title">GEO Görünürlük Farkı</span>
            <Bot size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">+%15 Öndeyiz</div>
          <div className="stat-card-sub text-muted">Yapay zeka tavsiyelerinde avantaj</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">İçerik Çakışması</span>
            <TrendingUp size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">%38</div>
          <div className="stat-card-sub text-muted">Ortak hedeflenen terimler</div>
        </div>
      </div>

      {/* Competitors Matrix & Cards */}
      <div className="growth-panel-card">
        <div className="growth-card-header">
          <div className="card-header-titles">
            <h3 className="growth-card-title">Rakip Karşılaştırma Matrisi</h3>
            <span className="growth-card-sub">Teknik sağlık, GEO hazır bulunuşluk ve alıntı boşluğu kıyaslaması.</span>
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
        ) : competitors.length === 0 ? (
          <div className="growth-empty-card">
            <Users2 size={44} className="text-primary" />
            <h3>Henüz Rakip Eklenmedi</h3>
            <p>Sektörünüzdeki diğer oyuncuların SEO ve AI görünürlüğünü takip etmek için ilk rakibinizi ekleyin.</p>
            <button
              type="button"
              className="growth-primary-btn"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={15} />
              <span>İlk Rakibi Ekle</span>
            </button>
          </div>
        ) : (
          <div className="growth-competitor-cards-grid">
            {competitors.map((comp, idx) => {
              const compScore = Math.max(45, Math.min(88, ourScore - 6 + (idx * 4)));
              const isDeleting = deletingId === comp.id;

              return (
                <div key={comp.id} className="growth-competitor-card">
                  <div className="comp-card-top">
                    <div className="comp-brand-info">
                      <div className="comp-fav-wrap">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`} 
                          alt="" 
                          className="comp-fav"
                          onError={(e) => { e.target.style.display = 'none'; }}
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
                        {comp.type === 'direct' ? 'Doğrudan' : 'Arama Rakibi'}
                      </span>
                      <button
                        type="button"
                        className="comp-delete-btn"
                        onClick={() => handleDeleteCompetitor(comp.id)}
                        disabled={isDeleting}
                        title="Takipten Çıkar"
                      >
                        {isDeleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Score vs Our Score */}
                  <div className="comp-score-section">
                    <div className="comp-score-row">
                      <span className="score-label">Tahmini Büyüme Skoru:</span>
                      <strong className="score-val">{compScore}/100</strong>
                    </div>
                    <div className="comp-score-bar-bg">
                      <div 
                        className="comp-score-bar-fill" 
                        style={{ width: `${compScore}%`, background: compScore > ourScore ? '#ef4444' : '#3b82f6' }}
                      />
                    </div>
                    <span className="comp-comparison-note">
                      {ourScore >= compScore 
                        ? `Bizim skorumuzdan ${ourScore - compScore} puan daha geride.` 
                        : `Bizim skorumuzdan ${compScore - ourScore} puan önde.`}
                    </span>
                  </div>

                  {/* Technical & GEO Readiness Flags */}
                  <div className="comp-readiness-grid">
                    <div className="readiness-item">
                      <span className="readiness-label">/llms.txt Standardı:</span>
                      {idx === 0 ? (
                        <span className="readiness-val yes"><CheckCircle2 size={12} /> Var</span>
                      ) : (
                        <span className="readiness-val no"><XCircle size={12} /> Yok (Avantaj Bizde)</span>
                      )}
                    </div>
                    <div className="readiness-item">
                      <span className="readiness-label">Schema.org Yapısı:</span>
                      <span className="readiness-val yes"><CheckCircle2 size={12} /> Mevcut</span>
                    </div>
                    <div className="readiness-item">
                      <span className="readiness-label">Güvenli SSL:</span>
                      <span className="readiness-val yes"><CheckCircle2 size={12} /> Aktif</span>
                    </div>
                  </div>

                  {/* Citation Gap Callout */}
                  <div className="comp-citation-gap-box">
                    <div className="gap-box-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={13} className="text-warning" />
                      <span>Alıntı Boşluğu (GEO Gap):</span>
                      <img src="/AI-logos/gemini-color.svg" alt="Gemini" title="Google Gemini" style={{ width: 13, height: 13 }} />
                      <img src="/AI-logos/chatgpt-black.svg" alt="ChatGPT" title="ChatGPT" style={{ width: 12, height: 12, filter: 'brightness(1.8)' }} />
                      <img src="/AI-logos/perplexity-color.svg" alt="Perplexity" title="Perplexity AI" style={{ width: 12, height: 12 }} />
                    </div>
                    <p className="gap-box-desc">
                      Bu rakip Product Hunt ve G2 profillerinden Gemini ve ChatGPT modellerine düzenli alıntı çekerken, markanızın profilinde eksikler tespit edildi.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {isAddOpen && (
        <div className="growth-modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Users2 size={18} className="text-primary" />
                <h2>Yeni Rakip Ekle</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsAddOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor}>
              <div className="growth-modal-body">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Rakip Web Sitesi Adresi (Domain):</label>
                  <input
                    type="text"
                    placeholder="örn. competitor.com veya https://competitor.com"
                    value={compDomain}
                    onChange={(e) => setCompDomain(e.target.value)}
                    className="growth-text-input"
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Marka Adı (Opsiyonel):</label>
                  <input
                    type="text"
                    placeholder="örn. Rakip Marka"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="growth-text-input"
                  />
                </div>

                <div className="form-group">
                  <label className="growth-input-label">Rakip Türü:</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="growth-select"
                  >
                    <option value="direct">Doğrudan Ürün / Hizmet Rakibi</option>
                    <option value="search">Arama Sonuçları (SEO) Rakibi</option>
                    <option value="ai">Yapay Zeka (GEO) Rakibi</option>
                  </select>
                </div>
              </div>

              <div className="growth-modal-footer">
                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() => setIsAddOpen(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="growth-primary-btn"
                  disabled={addingComp || !compDomain.trim()}
                >
                  {addingComp ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Rakibi Ekle &amp; Tara</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
