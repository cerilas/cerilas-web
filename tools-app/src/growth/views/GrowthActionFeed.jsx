import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Sparkles, 
  Wrench, 
  Bot, 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Layers,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthActionFeed() {
  const { activeWorkspace, setActiveTab } = useGrowth();
  const { token } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeGuideOpp, setActiveGuideOpp] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOpportunities = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setOpportunities(json.data || []);
      }
    } catch (err) {
      console.error('Fetch opportunities error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [activeWorkspace?.id, token]);

  const handleUpdateStatus = async (oppId, newStatus) => {
    setUpdatingId(oppId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = opportunities.filter(opp => {
    const matchesCat = filterCategory === 'all' 
      ? true 
      : filterCategory === 'quick_wins' 
        ? opp.effort_score <= 40 && opp.impact_score >= 70
        : opp.category === filterCategory;
    
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : opp.status === filterStatus;

    const matchesSearch = searchQuery.trim() === ''
      ? true
      : opp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesStatus && matchesSearch;
  });

  const totalCount = opportunities.length;
  const openCount = opportunities.filter(o => o.status === 'open').length;
  const quickWinsCount = opportunities.filter(o => o.effort_score <= 40 && o.impact_score >= 70 && o.status !== 'completed').length;
  const completedCount = opportunities.filter(o => o.status === 'completed').length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="growth-page-container animate-fade">
      {/* Header */}
      <div className="growth-page-header">
        <div>
          <div className="growth-title-row">
            <Zap size={22} className="text-primary" />
            <h1 className="growth-page-title">Öncelikli Aksiyon Listesi (Action Feed)</h1>
          </div>
          <p className="growth-page-subtitle">
            Karmaşık grafikler yerine, sitenizin Google ve Yapay Zeka (GEO) görünürlüğünü doğrudan artıracak önceliklendirilmiş somut büyüme adımları.
          </p>
        </div>

        <div className="growth-page-actions">
          <button 
            type="button" 
            onClick={fetchOpportunities}
            className="growth-secondary-btn"
          >
            Listeyi Yenile
          </button>
        </div>
      </div>

      {/* Top Impact Metrics Cards */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Toplam Fırsat</span>
            <Layers size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalCount}</div>
          <div className="stat-card-sub">{openCount} tanesi beklemede</div>
        </div>

        <div className="growth-stat-card highlight-quickwin">
          <div className="stat-card-header">
            <span className="stat-card-title">Hızlı Kazanımlar</span>
            <Zap size={16} className="stat-card-icon text-warning" />
          </div>
          <div className="stat-card-value text-warning">{quickWinsCount}</div>
          <div className="stat-card-sub">Düşük eforla en yüksek etki</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tamamlananlar</span>
            <CheckCircle2 size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value text-success">{completedCount}</div>
          <div className="stat-card-sub">Çözüme kavuşturulmuş adımlar</div>
        </div>

        <div className="growth-stat-card highlight-growth">
          <div className="stat-card-header">
            <span className="stat-card-title">Tahmini Büyüme Etkisi</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">+%25–40</div>
          <div className="stat-card-sub">Tüm adımlar uygulandığında</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="growth-action-filters-bar">
        <div className="growth-filter-chips">
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tümü ({totalCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'quick_wins' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('quick_wins')}
          >
            ⚡ Hızlı Kazanımlar ({quickWinsCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'ai_visibility' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('ai_visibility')}
          >
            <Bot size={13} />
            <span>GEO & AI</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'technical' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('technical')}
          >
            <Wrench size={13} />
            <span>Teknik SEO</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'content' ? 'is-active' : ''}`}
            onClick={() => setFilterCategory('content')}
          >
            <FileText size={13} />
            <span>İçerik & CTR</span>
          </button>
        </div>

        <div className="growth-filter-right">
          <div className="growth-search-input-wrap">
            <Search size={14} className="search-input-icon" />
            <input
              type="text"
              placeholder="Fırsatlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="growth-search-input"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="growth-select"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="open">Açık / Bekleyen</option>
            <option value="in_progress">İşlemde</option>
            <option value="completed">Tamamlandı</option>
            <option value="dismissed">Ertelenen</option>
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="growth-action-feed-list">
        {loading ? (
          <div className="growth-loading-view">
            <Loader2 size={32} className="growth-spinner" />
            <span>Aksiyonlar önceliklendiriliyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="growth-empty-card">
            <CheckCircle size={44} className="text-success" />
            <h3>Seçilen Kriterde Aksiyon Bulunmuyor</h3>
            <p>Tüm yüksek öncelikli görevler tamamlanmış veya seçilen filtreye uygun kayıt yok.</p>
            <button
              type="button"
              className="growth-secondary-btn"
              onClick={() => { setFilterCategory('all'); setFilterStatus('all'); setSearchQuery(''); }}
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          filtered.map((opp) => {
            const isExpanded = expandedId === opp.id;
            const isCompleted = opp.status === 'completed';
            const actionSteps = Array.isArray(opp.action_steps) ? opp.action_steps : [];

            return (
              <div 
                key={opp.id} 
                className={`growth-action-card ${isCompleted ? 'is-completed' : ''} ${opp.priority_score >= 90 ? 'is-high-priority' : ''}`}
              >
                <div className="growth-action-main-row">
                  {/* Status Toggle Circle */}
                  <button
                    type="button"
                    className={`growth-action-toggle-circle ${isCompleted ? 'is-checked' : ''}`}
                    onClick={() => handleUpdateStatus(opp.id, isCompleted ? 'open' : 'completed')}
                    title={isCompleted ? 'Açık duruma geri al' : 'Tamamlandı olarak işaretle'}
                    disabled={updatingId === opp.id}
                  >
                    {updatingId === opp.id ? (
                      <Loader2 size={13} className="spin" />
                    ) : isCompleted ? (
                      <Check size={14} />
                    ) : (
                      <div className="inner-dot" />
                    )}
                  </button>

                  {/* Body Content */}
                  <div className="growth-action-info-col" onClick={() => setExpandedId(isExpanded ? null : opp.id)}>
                    <div className="growth-action-tags-row">
                      <span className={`opp-cat-pill cat-${opp.category}`}>
                        {opp.category === 'ai_visibility' ? 'Yapay Zeka (GEO)' : opp.category === 'technical' ? 'Teknik SEO' : 'İçerik Stratejisi'}
                      </span>
                      
                      {opp.effort_score <= 40 && opp.impact_score >= 70 && (
                        <span className="opp-quickwin-pill">
                          <Zap size={11} />
                          <span>Hızlı Kazanım</span>
                        </span>
                      )}

                      <span className="opp-score-pill">
                        Öncelik Skoru: <strong>{opp.priority_score}/100</strong>
                      </span>
                      
                      {opp.estimated_traffic_upside && (
                        <span className="opp-traffic-upside-pill">
                          <Sparkles size={11} />
                          <span>{opp.estimated_traffic_upside}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="growth-action-title">{opp.title}</h3>
                    <p className="growth-action-desc">{opp.description}</p>
                  </div>

                  {/* Right Action Trigger */}
                  <div className="growth-action-ctrl-col">
                    <button
                      type="button"
                      className="growth-guide-btn"
                      onClick={() => setActiveGuideOpp(opp)}
                    >
                      <HelpCircle size={14} />
                      <span>Nasıl Çözülür?</span>
                    </button>

                    <button
                      type="button"
                      className="growth-action-expand-btn"
                      onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="growth-action-expanded-drawer animate-fade">
                    {/* Diagnostic Evidence */}
                    {opp.evidence && (
                      <div className="growth-evidence-box">
                        <AlertCircle size={15} className="text-warning" />
                        <div>
                          <strong>Tespit Edilen Durum:</strong>{' '}
                          <span>{opp.evidence.reason || 'Denetim sırasında tespit edildi.'}</span>
                        </div>
                      </div>
                    )}

                    {/* Step by step checklist */}
                    {actionSteps.length > 0 && (
                      <div className="growth-steps-checklist">
                        <span className="steps-checklist-title">Uygulanacak Aksiyon Adımları:</span>
                        <div className="steps-list">
                          {actionSteps.map((step, sIdx) => (
                            <div key={sIdx} className="step-item-row">
                              <span className="step-num">{sIdx + 1}</span>
                              <span className="step-text">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Changer Bar */}
                    <div className="growth-action-status-bar">
                      <span className="status-bar-label">Durumu Güncelle:</span>
                      <div className="status-buttons-row">
                        <button
                          type="button"
                          className={`status-btn ${opp.status === 'open' ? 'active' : ''}`}
                          onClick={() => handleUpdateStatus(opp.id, 'open')}
                        >
                          Beklemede
                        </button>
                        <button
                          type="button"
                          className={`status-btn ${opp.status === 'in_progress' ? 'active' : ''}`}
                          onClick={() => handleUpdateStatus(opp.id, 'in_progress')}
                        >
                          İşlemde
                        </button>
                        <button
                          type="button"
                          className={`status-btn ${opp.status === 'completed' ? 'active' : ''}`}
                          onClick={() => handleUpdateStatus(opp.id, 'completed')}
                        >
                          Tamamlandı
                        </button>
                        <button
                          type="button"
                          className={`status-btn ${opp.status === 'dismissed' ? 'active' : ''}`}
                          onClick={() => handleUpdateStatus(opp.id, 'dismissed')}
                        >
                          Ertele / Gizle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* How to Fix (Nasıl Çözülür?) Modal / Drawer */}
      {activeGuideOpp && (
        <div className="growth-modal-backdrop" onClick={() => setActiveGuideOpp(null)}>
          <div className="growth-guide-modal animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-category-tag">{activeGuideOpp.category}</span>
                <h2>{activeGuideOpp.title}</h2>
              </div>
              <button 
                type="button" 
                className="growth-modal-close" 
                onClick={() => setActiveGuideOpp(null)}
              >
                ✕
              </button>
            </div>

            <div className="growth-modal-body">
              <p className="guide-intro">{activeGuideOpp.description}</p>

              {activeGuideOpp.type === 'llms_txt_readiness' && (
                <div className="guide-code-section">
                  <div className="code-header">
                    <span>Örnek /llms.txt Dosyası (Sitenizin kök dizinine ekleyin):</span>
                    <button 
                      type="button" 
                      className="copy-code-btn"
                      onClick={() => copyToClipboard(`# ${activeWorkspace.name}\n> ${activeWorkspace.description || 'Yenilikçi dijital çözümler.'}\n\n## Ana Ürünler ve Hizmetler\n- ${activeWorkspace.primary_domain}: Resmi web sitesi\n\n## Belgeler ve Referanslar\n- /robots.txt: Arama botları rehberi\n- /hakkimizda: Şirket künyesi`)}
                    >
                      {copiedCode ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                    </button>
                  </div>
                  <pre className="code-block">
{`# ${activeWorkspace.name}
> ${activeWorkspace.description || 'Yenilikçi dijital çözümler.'}

## Ana Ürünler ve Hizmetler
- ${activeWorkspace.primary_domain}: Resmi web sitesi

## Belgeler ve Referanslar
- /robots.txt: Arama botları rehberi
- /hakkimizda: Şirket künyesi`}
                  </pre>
                </div>
              )}

              {activeGuideOpp.type === 'schema_markup' && (
                <div className="guide-code-section">
                  <div className="code-header">
                    <span>Örnek JSON-LD Schema.org İşaretlemesi (&lt;head&gt; içine ekleyin):</span>
                    <button 
                      type="button" 
                      className="copy-code-btn"
                      onClick={() => copyToClipboard(`<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${activeWorkspace.name}",\n  "url": "https://${activeWorkspace.primary_domain}",\n  "description": "${activeWorkspace.description || ''}"\n}\n</script>`)}
                    >
                      {copiedCode ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                    </button>
                  </div>
                  <pre className="code-block">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${activeWorkspace.name}",
  "url": "https://${activeWorkspace.primary_domain}",
  "description": "${activeWorkspace.description || ''}"
}
</script>`}
                  </pre>
                </div>
              )}

              <div className="guide-steps-list">
                <h4>Adım Adım Uygulama Rehberi:</h4>
                <ol>
                  {(activeGuideOpp.action_steps || []).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setActiveGuideOpp(null)}
              >
                Kapat
              </button>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={() => {
                  handleUpdateStatus(activeGuideOpp.id, 'completed');
                  setActiveGuideOpp(null);
                }}
              >
                <Check size={15} />
                <span>Uyguladım, Tamamlandı İşaretle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
