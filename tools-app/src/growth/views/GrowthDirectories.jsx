import React, { useState, useEffect } from 'react';
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
  Building2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthDirectories() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

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

  const filtered = directories.filter(d => filterCat === 'all' || d.category === filterCat);
  const totalCount = directories.length;
  const claimedCount = directories.filter(d => d.status === 'claimed').length;
  const missingCount = totalCount - claimedCount;
  const authorityScore = totalCount > 0 ? Math.round((claimedCount / totalCount) * 100) : 0;

  return (
    <div className="growth-page-container animate-fade">
      {/* Header */}
      <div className="growth-page-header">
        <div>
          <div className="growth-title-row">
            <Share2 size={22} className="text-primary" />
            <h1 className="growth-page-title">Yüksek Otoriteli Dizinler & GEO Alıntı Dağıtımı</h1>
          </div>
          <p className="growth-page-subtitle">
            Yapay zeka modelleri (ChatGPT, Gemini, Perplexity) bu güvenilir kaynakları tarayarak markaları öğrenir ve yanıtlarında alıntılar.
          </p>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Hedef Dizin</span>
            <Building2 size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalCount} Platform</div>
          <div className="stat-card-sub text-muted">Sektörel ve kurumsal otoriteler</div>
        </div>

        <div className="growth-stat-card highlight-growth">
          <div className="stat-card-header">
            <span className="stat-card-title">Doğrulanan Profiller</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{claimedCount} Profil</div>
          <div className="stat-card-sub text-muted">Aktif listelenmiş platformlar</div>
        </div>

        <div className="growth-stat-card highlight-quickwin">
          <div className="stat-card-header">
            <span className="stat-card-title">Eksik / Bekleyen</span>
            <AlertCircle size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{missingCount} Platform</div>
          <div className="stat-card-sub text-muted">Açılması önerilen yeni profiller</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">GEO Alıntı Kapsama</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">%{authorityScore}</div>
          <div className="stat-card-sub text-primary">LLM eğitim seti otorite ağırlığı</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="growth-subnav-bar">
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${filterCat === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCat('all')}
          >
            Tüm Platformlar ({totalCount})
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterCat === 'saas' ? 'active' : ''}`}
            onClick={() => setFilterCat('saas')}
          >
            SaaS &amp; Yazılım Dizinleri
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterCat === 'trust' ? 'active' : ''}`}
            onClick={() => setFilterCat('trust')}
          >
            Kurumsal Güven &amp; İş Profilleri
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterCat === 'community' ? 'active' : ''}`}
            onClick={() => setFilterCat('community')}
          >
            Topluluk &amp; Geliştirici Ağları
          </button>
        </div>
      </div>

      {/* Directories Grid */}
      {loading ? (
        <div className="growth-loading-view">
          <Loader2 size={32} className="growth-spinner" />
          <span>Otorite dizinleri taranıyor...</span>
        </div>
      ) : (
        <div className="growth-directories-grid">
          {filtered.map((dir) => {
            const isClaimed = dir.status === 'claimed';
            const isUpdating = updatingId === dir.id;

            return (
              <div key={dir.id} className={`growth-dir-card ${isClaimed ? 'is-claimed' : ''}`}>
                <div className="dir-card-top">
                  <div className="dir-brand-wrap">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${dir.domain}&sz=64`} 
                      alt="" 
                      className="dir-fav"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="dir-titles">
                      <h4 className="dir-name">{dir.name}</h4>
                      <span className="dir-domain">{dir.domain}</span>
                    </div>
                  </div>

                  <span className={`dir-status-pill ${isClaimed ? 'claimed' : 'missing'}`}>
                    {isClaimed ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Doğrulandı</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        <span>Eksik / Açılmalı</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="dir-metrics-row">
                  <div className="dir-metric-item">
                    <span className="m-label">Otorite Skoru:</span>
                    <strong className="m-val">DA {dir.authority}</strong>
                  </div>
                  <div className="dir-metric-item">
                    <span className="m-label">GEO Alıntı Etkisi:</span>
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
                        <span>Profilim Aktif</span>
                      </>
                    ) : (
                      <span>Profili Oluşturdum Olarak İşaretle</span>
                    )}
                  </button>

                  <a 
                    href={dir.submissionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="dir-external-link"
                    title="Platforma git"
                  >
                    <span>Kayıt Ol</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
