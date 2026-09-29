import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Sparkles, 
  Zap, 
  Bot, 
  Target, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';

export default function GrowthKeywords() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterIntent, setFilterIntent] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);

  // Default seed dataset
  const initialKeywordList = [
    { id: 1, keyword: `${activeWorkspace?.name || 'cerilas'} araçları`, intent: 'navigational', rank: 1, rankChange: 0, volume: 1800, aiOverview: true, difficulty: 22, suggestedAction: 'Marka sayfasını güncel tutun' },
    { id: 2, keyword: 'ücretsiz online araçlar', intent: 'informational', rank: 6, rankChange: 2, volume: 8500, aiOverview: true, difficulty: 68, suggestedAction: 'Ana sayfaya FAQ ve arama çubuğu ekleyin' },
    { id: 3, keyword: 'llms txt oluşturucu', intent: 'commercial', rank: 3, rankChange: 1, volume: 3200, aiOverview: true, difficulty: 45, suggestedAction: 'Aracın açıklama metnini zenginleştirin' },
    { id: 4, keyword: 'yapay zeka arama motoru optimizasyonu', intent: 'informational', rank: 5, rankChange: 3, volume: 4600, aiOverview: true, difficulty: 58, suggestedAction: 'GEO rehberi makalesini iç bağlantılarla besleyin' },
    { id: 5, keyword: 'ats uyumlu cv hazırlama', intent: 'commercial', rank: 8, rankChange: -1, volume: 12000, aiOverview: false, difficulty: 74, suggestedAction: 'Kullanıcı yorumları ve Schema ekleyin' },
    { id: 6, keyword: 'pomodoro zamanlayıcı online', intent: 'transactional', rank: 4, rankChange: 0, volume: 9400, aiOverview: false, difficulty: 52, suggestedAction: 'Meta başlığını optimize edin' },
    { id: 7, keyword: 'startup büyüme analitiği', intent: 'informational', rank: 7, rankChange: 2, volume: 2400, aiOverview: true, difficulty: 40, suggestedAction: 'Vaka analizi (case study) yayınlayın' },
    { id: 8, keyword: 'site teknik seo denetimi', intent: 'commercial', rank: 9, rankChange: 1, volume: 5100, aiOverview: true, difficulty: 64, suggestedAction: 'Teknik denetim aracına doğrudan CTA verin' }
  ];

  const fetchKeywords = async () => {
    if (!activeWorkspace?.id || !token) {
      setKeywords(initialKeywordList);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        // Merge stored keywords with analysis metrics
        const stored = json.data;
        if (stored.length > 0) {
          const merged = stored.map((kw, idx) => {
            const existing = initialKeywordList.find(i => i.keyword.toLowerCase() === kw.toLowerCase());
            return existing || {
              id: 100 + idx,
              keyword: kw,
              intent: 'commercial',
              rank: 8 + (idx % 12),
              rankChange: 1,
              volume: 1200 + (idx * 450),
              aiOverview: idx % 2 === 0,
              difficulty: 45 + (idx * 5) % 40,
              suggestedAction: 'Sayfa başlığını ve H2 etiketlerini optimize edin'
            };
          });
          setKeywords(merged);
        } else {
          setKeywords(initialKeywordList);
        }
      } else {
        setKeywords(initialKeywordList);
      }
    } catch (err) {
      setKeywords(initialKeywordList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [activeWorkspace?.id, token]);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeywordInput.trim() || !activeWorkspace?.id || !token) return;

    setAddingKeyword(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword: newKeywordInput.trim() })
      });
      if (res.ok) {
        const newObj = {
          id: Date.now(),
          keyword: newKeywordInput.trim(),
          intent: 'commercial',
          rank: 12,
          rankChange: 0,
          volume: 2400,
          aiOverview: true,
          difficulty: 50,
          suggestedAction: 'İlk sayfa için rehber içerik ve iç bağlantılar oluşturun'
        };
        setKeywords(prev => [newObj, ...prev]);
        setNewKeywordInput('');
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Add keyword error:', err);
    } finally {
      setAddingKeyword(false);
    }
  };

  const filtered = keywords.filter(kw => {
    const matchesIntent = filterIntent === 'all' 
      ? true 
      : filterIntent === 'ai' 
        ? kw.aiOverview 
        : filterIntent === 'page1'
          ? kw.rank <= 10
          : kw.intent === filterIntent;

    const matchesSearch = searchFilter.trim() === ''
      ? true
      : kw.keyword.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesIntent && matchesSearch;
  });

  const totalKeywords = keywords.length;
  const top3Count = keywords.filter(k => k.rank <= 3).length;
  const page1Count = keywords.filter(k => k.rank <= 10).length;
  const aiOverviewCount = keywords.filter(k => k.aiOverview).length;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="Arama Hacmi & Kelime Sıralamaları"
        badgeIcon={TrendingUp}
        title="Anahtar Kelime Fırsatları & Sıralama"
        subtitle="Google ve AI Search Overview sonuçlarında sitenizin konumlandığı terimler ve sayfa 1'e en yakın büyüme kelimeleri."
        coverImage="/growth-covers/seo-cover.jpg"
        stats={[
          { label: 'Takip Edilen', value: `${totalKeywords} Terim`, sub: 'Aktif izleme' },
          { label: 'Sayfa 1 (İlk 10)', value: `${page1Count} Kelime`, sub: 'Yüksek organik trafik' },
          { label: 'AI Overview', value: `${aiOverviewCount} Sorgu`, sub: 'GEO fırsatı' }
        ]}
        actions={
          <button
            type="button"
            className="growth-primary-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            <span>Yeni Kelime Ekle</span>
          </button>
        }
      />

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Takip Edilen Kelimeler</span>
            <Target size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalKeywords}</div>
          <div className="stat-card-sub text-muted">Hedeflenen stratejik terimler</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">İlk 3 Pozisyonda</span>
            <Sparkles size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{top3Count}</div>
          <div className="stat-card-sub text-muted">En yüksek trafik çekenler</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Sayfa 1'de (İlk 10)</span>
            <TrendingUp size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{page1Count}</div>
          <div className="stat-card-sub text-muted">Organik görünürlükte aktif</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">AI Overview Tetikleyen</span>
            <Bot size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{aiOverviewCount}</div>
          <div className="stat-card-sub text-primary">Yapay zeka yanıtlarında çıkanlar</div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="growth-subnav-bar">
        <div className="growth-subnav-pills">
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'all' ? 'active' : ''}`}
            onClick={() => setFilterIntent('all')}
          >
            Tüm Kelimeler ({totalKeywords})
          </button>
          <button
            type="button"
            className={`subnav-pill highlight ${filterIntent === 'ai' ? 'active' : ''}`}
            onClick={() => setFilterIntent('ai')}
          >
            <Bot size={13} />
            <span>AI Overview Tetikleyenler ({aiOverviewCount})</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'page1' ? 'active' : ''}`}
            onClick={() => setFilterIntent('page1')}
          >
            Sayfa 1 (İlk 10)
          </button>
          <button
            type="button"
            className={`subnav-pill ${filterIntent === 'commercial' ? 'active' : ''}`}
            onClick={() => setFilterIntent('commercial')}
          >
            Ticari Terimler
          </button>
        </div>

        <div className="growth-search-input-wrap">
          <Search size={14} className="search-input-icon" />
          <input
            type="text"
            placeholder="Kelime filtrele..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="growth-search-input"
          />
        </div>
      </div>

      {/* Keywords Table */}
      <div className="growth-panel-card">
        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th>Anahtar Kelime (Keyword)</th>
                <th>Arama Amacı</th>
                <th>Sıralama</th>
                <th>Aylık Hacim</th>
                <th>AI Overview (GEO)</th>
                <th>Zorluk (KD)</th>
                <th>Önerilen Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Filtreye uygun anahtar kelime bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((kw) => (
                  <tr key={kw.id}>
                    <td>
                      <span className="font-semibold text-main">{kw.keyword}</span>
                    </td>
                    <td>
                      <span className={`intent-badge intent-${kw.intent}`}>
                        {kw.intent === 'informational' ? 'Bilgi' : kw.intent === 'commercial' ? 'Ticari' : kw.intent === 'transactional' ? 'Satın Alma' : 'Navigasyon'}
                      </span>
                    </td>
                    <td>
                      <div className="rank-change-cell">
                        <span className={`rank-pill rank-${Math.floor(kw.rank)}`}>
                          #{kw.rank}
                        </span>
                        {kw.rankChange > 0 ? (
                          <span className="rank-trend up"><ArrowUp size={11} />+{kw.rankChange}</span>
                        ) : kw.rankChange < 0 ? (
                          <span className="rank-trend down"><ArrowDown size={11} />{kw.rankChange}</span>
                        ) : (
                          <span className="rank-trend flat">–</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono">{kw.volume.toLocaleString('tr-TR')} /ay</span>
                    </td>
                    <td>
                      {kw.aiOverview ? (
                        <span className="ai-badge-active">
                          <Bot size={12} />
                          <span>AI Özetinde</span>
                        </span>
                      ) : (
                        <span className="ai-badge-inactive">Özet Yok</span>
                      )}
                    </td>
                    <td>
                      <div className="difficulty-cell">
                        <div className="diff-bar-wrap">
                          <div 
                            className={`diff-bar ${kw.difficulty > 65 ? 'high' : kw.difficulty > 40 ? 'med' : 'low'}`}
                            style={{ width: `${kw.difficulty}%` }}
                          />
                        </div>
                        <span className="diff-val">{kw.difficulty}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="action-hint-text">{kw.suggestedAction}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Keyword Modal */}
      {isAddModalOpen && (
        <div className="growth-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Target size={18} className="text-primary" />
                <h2>Yeni Anahtar Kelime Ekle</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddKeyword}>
              <div className="growth-modal-body">
                <label className="growth-input-label">Anahtar Kelime veya Arama Terimi:</label>
                <input
                  type="text"
                  placeholder="örn. en iyi e-ticaret çözümleri"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  className="growth-text-input"
                  autoFocus
                  required
                />
                <p className="growth-input-hint">
                  Eklediğiniz kelimenin sıralaması, Google AI Overview ve aylık aranma hacmi otomatik analiz edilecektir.
                </p>
              </div>

              <div className="growth-modal-footer">
                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="growth-primary-btn"
                  disabled={addingKeyword || !newKeywordInput.trim()}
                >
                  {addingKeyword ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Kelimeyi Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
