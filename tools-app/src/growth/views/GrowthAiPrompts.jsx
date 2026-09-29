import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Plus, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Share2, 
  Layers,
  Search,
  MessageSquare,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';

export default function GrowthAiPrompts() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPromptId, setRunningPromptId] = useState(null);
  const [activeSimulationResult, setActiveSimulationResult] = useState(null);

  // Add Prompt Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTopic, setNewPromptTopic] = useState('Genel Marka ve Sektör Bilinirliği');
  const [addingPrompt, setAddingPrompt] = useState(false);

  const fetchPrompts = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setPrompts(json.data || []);
      }
    } catch (err) {
      console.error('Fetch prompts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [activeWorkspace?.id, token]);

  const handleRunSimulation = async (promptId) => {
    setRunningPromptId(promptId);
    setActiveSimulationResult(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setActiveSimulationResult(json.data);
        fetchPrompts();
      } else {
        alert(json.error || 'Simülasyon çalıştırılamadı.');
      }
    } catch (err) {
      console.error('Run prompt simulation error:', err);
      alert('Simülasyon çalıştırılırken bir hata oluştu.');
    } finally {
      setRunningPromptId(null);
    }
  };

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim() || !activeWorkspace?.id || !token) return;

    setAddingPrompt(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: newPromptText.trim(),
          topic: newPromptTopic.trim()
        })
      });
      if (res.ok) {
        setNewPromptText('');
        setIsAddOpen(false);
        fetchPrompts();
      }
    } catch (err) {
      console.error('Add prompt error:', err);
    } finally {
      setAddingPrompt(false);
    }
  };

  const totalPrompts = prompts.length;
  const testedCount = prompts.filter(p => p.run_count > 0).length;
  const mentionedCount = prompts.filter(p => p.last_brand_mentioned).length;
  const mentionRate = testedCount > 0 ? Math.round((mentionedCount / testedCount) * 100) : 0;

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Page Cover */}
      <GrowthPageCover
        badge="GEO Canlı Yanıt Simülatörü"
        badgeIcon={Cpu}
        title="Takip Edilen GEO Promptları & Simülatör"
        subtitle="Kullanıcıların ChatGPT, Gemini ve Perplexity'ye sorduğu kritik sektörel soruları takip edin ve markanızın bu yanıtlarda önerilip önerilmediğini canlı test edin."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={[
          { label: 'Takip Edilen', value: `${totalPrompts} Soru`, sub: 'Hedef sektörel sorgular' },
          { label: 'Bahsedilme Oranı', value: `%${mentionRate}`, sub: 'Canlı test sonucu' },
          { label: 'Test Edilen', value: `${testedCount} Prompt`, sub: 'Aktif sorgulanmış' }
        ]}
        actions={
          <button
            type="button"
            className="growth-primary-btn"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={15} />
            <span>Yeni Prompt Takibi Ekle</span>
          </button>
        }
      />

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Takip Edilen Prompt</span>
            <MessageSquare size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalPrompts}</div>
          <div className="stat-card-sub text-muted">Hedef sektörel sorgular</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">Marka Bahsedilme Oranı</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">%{mentionRate}</div>
          <div className="stat-card-sub text-muted">Test edilen sorgularda tavsiye edilme</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Test Edilen / Çalıştırılan</span>
            <Play size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value">{testedCount}</div>
          <div className="stat-card-sub text-muted">{totalPrompts - testedCount} tanesi beklemede</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Aktif AI Motoru</span>
            <Bot size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value font-mono text-base">Gemini 2.5</div>
          <div className="stat-card-sub text-muted">Google AI Search Grounding</div>
        </div>
      </div>

      {/* Active Simulation Result Spotlight */}
      {activeSimulationResult && (
        <div className="growth-simulation-result-card animate-fade">
          <div className="sim-result-header">
            <div className="sim-status-row">
              {activeSimulationResult.brand_mentioned ? (
                <div className="sim-status-pill success">
                  <CheckCircle2 size={16} />
                  <span>Markanız AI Yanıtında Tavsiye Edildi!</span>
                </div>
              ) : (
                <div className="sim-status-pill warning">
                  <XCircle size={16} />
                  <span>Markanız Bu Yanıtta Henüz Listelenmedi</span>
                </div>
              )}
              <span className="sim-model-tag">Model: {activeSimulationResult.model || 'Gemini 2.5 Flash'}</span>
            </div>

            <button 
              type="button" 
              className="sim-close-btn"
              onClick={() => setActiveSimulationResult(null)}
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="sim-result-body">
            <div className="sim-text-box">
              <span className="sim-box-title">Üretilen Canlı Yapay Zeka Yanıtı:</span>
              <p className="sim-answer-text">{activeSimulationResult.response_text}</p>
            </div>

            {/* Citations Detected */}
            {activeSimulationResult.citations && activeSimulationResult.citations.length > 0 && (
              <div className="sim-citations-box">
                <span className="sim-box-title">Tespit Edilen Alıntılar &amp; Kaynaklar (Citations):</span>
                <div className="sim-citations-list">
                  {activeSimulationResult.citations.map((cite, cIdx) => (
                    <a 
                      key={cIdx} 
                      href={cite.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="sim-cite-badge"
                    >
                      <Share2 size={11} />
                      <span>{cite.domain}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompt Library Table */}
      <div className="growth-panel-card">
        <div className="growth-card-header">
          <div className="card-header-titles">
            <h3 className="growth-card-title">İzlenen Prompt Kütüphanesi</h3>
            <span className="growth-card-sub">Her promptu dilediğiniz an tek tıkla canlı olarak test edebilirsiniz.</span>
          </div>
        </div>

        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th>İzlenen Arama Sorusu (Prompt)</th>
                <th>Kategori / Konu</th>
                <th>Son Durum</th>
                <th>Test Sayısı</th>
                <th>Canlı Simülasyon</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : prompts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Henüz izlenen prompt bulunmuyor. Yeni bir soru ekleyin.
                  </td>
                </tr>
              ) : (
                prompts.map((p) => {
                  const isRunning = runningPromptId === p.id;
                  const hasRun = p.run_count > 0;
                  const isMentioned = p.last_brand_mentioned;

                  return (
                    <tr key={p.id}>
                      <td style={{ maxWidth: '400px' }}>
                        <span className="font-medium text-main">"{p.prompt}"</span>
                      </td>
                      <td>
                        <span className="query-tag">{p.topic || 'Genel'}</span>
                      </td>
                      <td>
                        {!hasRun ? (
                          <span className="text-muted text-xs">Henüz Test Edilmedi</span>
                        ) : isMentioned ? (
                          <span className="ai-badge-active">
                            <CheckCircle2 size={12} />
                            <span>Önerildi</span>
                          </span>
                        ) : (
                          <span className="ai-badge-inactive">
                            <XCircle size={12} />
                            <span>Listede Yok</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono">{p.run_count || 0} kez</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="growth-simulate-run-btn"
                          onClick={() => handleRunSimulation(p.id)}
                          disabled={isRunning}
                        >
                          {isRunning ? (
                            <>
                              <Loader2 size={13} className="spin" />
                              <span>Simüle Ediliyor...</span>
                            </>
                          ) : (
                            <>
                              <Play size={13} />
                              <span>Şimdi Test Et</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Prompt Modal */}
      {isAddOpen && (
        <div className="growth-modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Bot size={18} className="text-primary" />
                <h2>Yeni GEO Promptu Ekle</h2>
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

            <form onSubmit={handleAddPrompt}>
              <div className="growth-modal-body">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Takip Edilecek Soru (Prompt):</label>
                  <textarea
                    rows={3}
                    placeholder="örn. En iyi Türk online araçlar ve yazılımlar hangileridir?"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="growth-text-input"
                    required
                    autoFocus
                  />
                  <span className="growth-input-hint">
                    Kullanıcıların yapay zeka asistanlarına markanızın sektörüyle ilgili sorduğu doğal soruları yazın.
                  </span>
                </div>

                <div className="form-group">
                  <label className="growth-input-label">Konu / Kategori:</label>
                  <input
                    type="text"
                    placeholder="örn. Sektörel Liderlik"
                    value={newPromptTopic}
                    onChange={(e) => setNewPromptTopic(e.target.value)}
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
                  İptal
                </button>
                <button
                  type="submit"
                  className="growth-primary-btn"
                  disabled={addingPrompt || !newPromptText.trim()}
                >
                  {addingPrompt ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Promptu Takibe Al</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
