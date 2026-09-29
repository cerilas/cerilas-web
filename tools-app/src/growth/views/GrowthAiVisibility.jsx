import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  ExternalLink, 
  Loader2, 
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';

export default function GrowthAiVisibility() {
  const { activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTopic, setNewPromptTopic] = useState('');
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [runningPromptId, setRunningPromptId] = useState(null);
  const [lastRunResult, setLastRunResult] = useState(null);

  const fetchPrompts = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Promptlar alınamadı.');
      setPrompts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [activeWorkspace?.id, token]);

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

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
          topic: newPromptTopic.trim() || 'Genel'
        })
      });
      if (res.ok) {
        setNewPromptText('');
        setNewPromptTopic('');
        fetchPrompts();
      }
    } catch (err) {
      console.error('Add prompt error:', err);
    } finally {
      setAddingPrompt(false);
    }
  };

  const handleRunPrompt = async (promptId) => {
    setRunningPromptId(promptId);
    setLastRunResult(null);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simülasyon çalıştırılamadı.');
      setLastRunResult(data.data);
      fetchPrompts();
    } catch (err) {
      console.error('Run prompt error:', err);
      alert(err.message);
    } finally {
      setRunningPromptId(null);
    }
  };

  return (
    <div className="growth-page-container animate-fade">
      {/* Hero Cover Banner */}
      <GrowthPageCover
        badge="Generative Engine Optimization (GEO)"
        badgeIcon={Bot}
        title="Yapay Zeka (GEO) Görünürlüğü & Alıntı Takibi"
        subtitle="ChatGPT, Google Gemini ve Perplexity gibi yapay zeka arama motorlarında markanızın anılma ve kaynak gösterilme oranı."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={[
          { label: 'GEO Hazırbulunuşluk', value: '75/100', positive: true, sub: 'Aktif Standartlar' },
          { label: 'Yapay Zeka Motorları', value: 'Gemini, GPT, Perplexity' }
        ]}
      />


      {/* GEO Readiness Indicators Card */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Yapay Zeka Arama Hazırbulunuşluk Standartları</h3>
            <p className="growth-panel-desc">
              AI crawler botlarının sitenizi anlamlandırması ve güvenilir bir kaynak olarak alıntılaması için gereken temel yapılar.
            </p>
          </div>
          <span className="growth-score-badge">GEO Skoru: 75/100</span>
        </div>

        <div className="growth-geo-standards-grid">
          <div className="geo-standard-item is-verified">
            <CheckCircle2 size={18} className="text-success" />
            <div>
              <span className="standard-name">Robots.txt AI Bot İzinleri</span>
              <span className="standard-sub">GPTBot, PerplexityBot ve Google-Extended taranabilir.</span>
            </div>
          </div>

          <div className="geo-standard-item">
            <AlertCircle size={18} className="text-warning" />
            <div>
              <span className="standard-name">/llms.txt Standardı</span>
              <span className="standard-sub">Yapay zeka modelleri için yapılandırılmış özet dosyası.</span>
            </div>
          </div>

          <div className="geo-standard-item is-verified">
            <CheckCircle2 size={18} className="text-success" />
            <div>
              <span className="standard-name">Organization Şeması</span>
              <span className="standard-sub">Varlık (Entity) tanımlaması ve Knowledge Graph desteği.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Tracked Prompt */}
      <div className="growth-panel-card">
        <h3 className="growth-panel-title">Yeni Arama Sorusu (Prompt) Takip Et</h3>
        <p className="growth-panel-desc">
          Müşterilerinizin sektörünüz hakkında yapay zekaya sorabileceği kritik soruları ekleyin.
        </p>

        <form onSubmit={handleAddPrompt} className="growth-prompt-add-form">
          <div className="prompt-input-row">
            <input
              type="text"
              required
              className="growth-field-input flex-2"
              placeholder="Örnek: En iyi B2B pazarlama araçları hangileri?"
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
            />
            <input
              type="text"
              className="growth-field-input flex-1"
              placeholder="Kategori (örn. Rakip Karşılaştırma)"
              value={newPromptTopic}
              onChange={(e) => setNewPromptTopic(e.target.value)}
            />
            <button type="submit" disabled={addingPrompt || !newPromptText.trim()} className="growth-primary-btn">
              {addingPrompt ? <Loader2 size={15} className="auth-spinner" /> : <Plus size={15} />}
              <span>Prompt Ekle</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live AI Visibility Simulation Modal / Result Drawer */}
      {lastRunResult && (
        <div className="growth-ai-run-result-banner animate-fade">
          <div className="ai-result-header">
            <div className="ai-result-title-row">
              <Sparkles size={18} className="text-primary" />
              <h4>Canlı Yapay Zeka Test Sonucu (Gemini 2.5)</h4>
            </div>
            <button type="button" onClick={() => setLastRunResult(null)} className="ai-result-close" aria-label="Kapat">
              <X size={16} />
            </button>
          </div>

          <div className="ai-result-stats-row">
            <div className="ai-stat-box">
              <span className="ai-stat-label">Marka Anıldı mı?</span>
              <span className={`ai-stat-val ${lastRunResult.brand_mentioned ? 'text-success' : 'text-danger'}`}>
                {lastRunResult.brand_mentioned ? 'EVET, ANILDI' : 'HAYIR'}
              </span>
            </div>
            <div className="ai-stat-box">
              <span className="ai-stat-label">Model</span>
              <span className="ai-stat-val text-muted">{lastRunResult.model || 'gemini-2.5-flash'}</span>
            </div>
          </div>

          <div className="ai-result-text-box">
            <span className="ai-box-sub">Yapay Zeka Tarafından Üretilen Yanıt:</span>
            <p className="ai-response-content">{lastRunResult.response_text}</p>
          </div>

          {lastRunResult.citations && lastRunResult.citations.length > 0 && (
            <div className="ai-citations-box">
              <span className="ai-box-sub">Alıntılanan Kaynaklar & Siteler:</span>
              <div className="citations-list">
                {lastRunResult.citations.map((c, cIdx) => (
                  <a key={cIdx} href={c.url} target="_blank" rel="noopener noreferrer" className="citation-pill">
                    <Globe size={12} />
                    <span>{c.domain}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracked Prompts List */}
      <div className="growth-panel-card">
        <div className="growth-panel-header">
          <div>
            <h3 className="growth-panel-title">Takip Edilen Promptlar ({prompts.length})</h3>
            <p className="growth-panel-desc">
              Düzenli aralıklarla test edilen arama sorguları ve en son anılma durumu.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="growth-loading-inline">
            <Loader2 size={20} className="auth-spinner" />
            <span>Promptlar yükleniyor...</span>
          </div>
        ) : prompts.length === 0 ? (
          <div className="growth-empty-card">
            <MessageSquare size={32} className="text-muted" />
            <h4>Henüz Takip Edilen Prompt Yok</h4>
            <p>Yukarıdaki formu kullanarak ilk arama sorunuzu ekleyin.</p>
          </div>
        ) : (
          <div className="growth-prompts-table">
            {prompts.map((p) => {
              const isRunning = runningPromptId === p.id;
              return (
                <div key={p.id} className="prompt-table-row">
                  <div className="prompt-info-col">
                    <span className="prompt-text">"{p.prompt}"</span>
                    <div className="prompt-meta-row">
                      <span className="prompt-topic-tag">{p.topic}</span>
                      <span className="prompt-runs-tag">{p.run_count || 0} Test Yapıldı</span>
                    </div>
                  </div>

                  <div className="prompt-actions-col">
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleRunPrompt(p.id)}
                      className="growth-run-test-btn"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 size={14} className="auth-spinner" />
                          <span>Analiz Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          <span>Simülasyonu Çalıştır</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
