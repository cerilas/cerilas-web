import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
  Languages,
  X,
  Trash2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import GrowthPageCover from '../components/GrowthPageCover';
import AiEngineBadge, { AiEngineGroup } from '../components/AiEngineBadge';
import { SkeletonBlock } from '../components/GrowthSkeleton';
import AiVisibilityDropdown from '../../tools/ai-visibility-checker/components/AiVisibilityDropdown';
import FlagIcon from '../../tools/ai-visibility-checker/components/FlagIcon';
import { MARKET_OPTIONS, LANGUAGE_OPTIONS, getMarketOption, getLanguageOption } from '../../tools/ai-visibility-checker/options';

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
  const [newPromptTopic, setNewPromptTopic] = useState('General Brand & Industry Awareness');
  const [selectedCountry, setSelectedCountry] = useState('TR');
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [addingPrompt, setAddingPrompt] = useState(false);

  // AI Prompt Generator Modal State
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [generatingAiPrompts, setGeneratingAiPrompts] = useState(false);
  const [aiGeneratedSuggestions, setAiGeneratedSuggestions] = useState([]);
  const [savingAiPrompts, setSavingAiPrompts] = useState(false);
  const [aiGenError, setAiGenError] = useState('');

  // Delete Prompt Modal State
  const [deleteTargetPrompt, setDeleteTargetPrompt] = useState(null);
  const [deletingPromptId, setDeletingPromptId] = useState(null);

  const fetchPrompts = async () => {
    if (!activeWorkspace?.id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        const list = json.data || [];
        setPrompts(list);
        try {
          window.dispatchEvent(new CustomEvent('growth:prompts-updated', { detail: { count: list.length } }));
        } catch {}
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

  // AI Prompt Generator Handlers
  const handleOpenAiModal = () => {
    if (prompts.length >= 10) {
      alert('Maximum limit of 10 tracked prompts already reached (10/10).');
      return;
    }
    setIsAiGenModalOpen(true);
    setAiGenError('');
    setAiGeneratedSuggestions([]);
    fetchAiPromptSuggestions();
  };

  const fetchAiPromptSuggestions = async () => {
    if (!activeWorkspace?.id || !token) return;
    setGeneratingAiPrompts(true);
    setAiGenError('');
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate prompt suggestions.');
      const suggestions = (data.suggestions || []).map(s => ({ ...s, selected: true }));
      setAiGeneratedSuggestions(suggestions);
    } catch (err) {
      console.error('Fetch AI prompt suggestions error:', err);
      setAiGenError(err.message || 'An error occurred while generating queries with AI.');
    } finally {
      setGeneratingAiPrompts(false);
    }
  };

  const handleToggleSuggestion = (index) => {
    setAiGeneratedSuggestions(prev => prev.map((item, idx) => idx === index ? { ...item, selected: !item.selected } : item));
  };

  const handleToggleSelectAllSuggestions = () => {
    const allSelected = aiGeneratedSuggestions.every(s => s.selected);
    setAiGeneratedSuggestions(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const handleSaveSelectedAiPrompts = async () => {
    const selectedItems = aiGeneratedSuggestions.filter(s => s.selected);
    if (selectedItems.length === 0 || !activeWorkspace?.id || !token) return;

    setSavingAiPrompts(true);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompts: selectedItems.map(s => ({ prompt: s.prompt, topic: s.topic })),
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add queries.');
      setIsAiGenModalOpen(false);
      setAiGeneratedSuggestions([]);
      fetchPrompts();
    } catch (err) {
      console.error('Save AI prompts error:', err);
      alert(err.message || 'An error occurred while adding queries.');
    } finally {
      setSavingAiPrompts(false);
    }
  };

  // Delete Prompt Handler
  const handleConfirmDeletePrompt = async () => {
    if (!deleteTargetPrompt || !activeWorkspace?.id || !token) return;
    const promptId = deleteTargetPrompt.id;
    setDeletingPromptId(promptId);
    try {
      const res = await fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts/${promptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove prompt.');
      setDeleteTargetPrompt(null);
      fetchPrompts();
    } catch (err) {
      console.error('Delete prompt error:', err);
      alert(err.message || 'Failed to remove prompt.');
    } finally {
      setDeletingPromptId(null);
    }
  };

  // Lock body scroll & listen for Escape key when modal is open
  useEffect(() => {
    if (!isAddOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsAddOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isAddOpen]);

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
        alert(json.error || 'Simulation could not be executed.');
      }
    } catch (err) {
      console.error('Run prompt simulation error:', err);
      alert('An error occurred while running simulation.');
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
          topic: newPromptTopic.trim(),
          country: selectedCountry || 'TR',
          language: selectedLanguage || 'tr'
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
        badge="GEO Live Response Simulator"
        badgeIcon={Cpu}
        title="Tracked GEO Prompts &amp; Simulator"
        subtitle="Monitor key industry queries asked by users on ChatGPT, Gemini, and Perplexity, and test live whether your brand gets recommended."
        coverImage="/growth-covers/geo-cover.jpg"
        stats={[
          { label: 'Tracked Prompts', value: `${totalPrompts} Queries`, sub: 'Target industry queries' },
          { label: 'Mention Rate', value: `${mentionRate}%`, sub: 'Live test result' },
          { label: 'Tested', value: `${testedCount} Prompts`, sub: 'Actively queried' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="growth-primary-btn ai-generate-magic-btn"
              onClick={handleOpenAiModal}
              disabled={prompts.length >= 10}
            >
              <Sparkles size={14} />
              <span>Generate Queries with AI</span>
            </button>
            <button
              type="button"
              className="growth-secondary-btn"
              onClick={() => setIsAddOpen(true)}
              disabled={prompts.length >= 10}
            >
              <Plus size={14} />
              <span>Add Manual Query</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Metrics */}
      <div className="growth-stats-grid four-col">
        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tracked Prompts</span>
            <MessageSquare size={16} className="stat-card-icon" />
          </div>
          <div className="stat-card-value">{totalPrompts}</div>
          <div className="stat-card-sub text-muted">Target industry queries</div>
        </div>

        <div className="growth-stat-card highlight-geo">
          <div className="stat-card-header">
            <span className="stat-card-title">Brand Mention Rate</span>
            <Sparkles size={16} className="stat-card-icon text-primary" />
          </div>
          <div className="stat-card-value text-primary">{mentionRate}%</div>
          <div className="stat-card-sub text-muted">Recommended in tested queries</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tested / Queried</span>
            <Play size={16} className="stat-card-icon text-success" />
          </div>
          <div className="stat-card-value">{testedCount}</div>
          <div className="stat-card-sub text-muted">{totalPrompts - testedCount} pending</div>
        </div>

        <div className="growth-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active AI Engine</span>
            <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 17, height: 17 }} />
          </div>
          <div className="stat-card-value font-mono text-base" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 22, height: 22 }} />
            <span>Gemini 2.5 Flash</span>
          </div>
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
                  <span>Your Brand Was Recommended in AI Response!</span>
                </div>
              ) : (
                <div className="sim-status-pill warning">
                  <XCircle size={16} />
                  <span>Your Brand Is Not Yet Listed in This Response</span>
                </div>
              )}
              <span className="sim-model-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 14, height: 14 }} />
                <span>Model: {activeSimulationResult.model || 'Google Gemini 2.5 Flash'}</span>
              </span>
            </div>

            <button 
              type="button" 
              className="sim-close-btn"
              onClick={() => setActiveSimulationResult(null)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="sim-result-body">
            <div className="sim-text-box">
              <span className="sim-box-title">Generated Live AI Response:</span>
              <p className="sim-answer-text">{activeSimulationResult.response_text}</p>
            </div>

            {/* Citations Detected */}
            {activeSimulationResult.citations && activeSimulationResult.citations.length > 0 && (
              <div className="sim-citations-box">
                <span className="sim-box-title">Detected Citations &amp; Sources:</span>
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

      {/* Setup Status & Progress Notification */}
      {prompts.length < 10 && (
        <div className="growth-prompt-setup-banner">
          <div className="setup-banner-left">
            <div className="setup-banner-icon-box">
              <AlertCircle size={22} color="#f59e0b" />
            </div>
            <div className="setup-banner-text">
              <div className="setup-banner-title-row">
                <h4 className="setup-banner-title">Setup Incomplete (Track 10 Queries)</h4>
                <span className="setup-banner-badge">{prompts.length} / 10 Queries ({prompts.length * 10}%)</span>
              </div>
              <p className="setup-banner-desc">
                For a consistent GEO visibility score, define at least 10 search questions. Add the remaining <strong>{10 - prompts.length}</strong> manually or click <strong>Generate Queries with AI</strong> to auto-generate.
              </p>
              <div className="setup-progress-track">
                <div className="setup-progress-fill" style={{ width: `${(prompts.length / 10) * 100}%` }} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAiModal}
            className="growth-primary-btn setup-banner-cta-btn"
          >
            <Sparkles size={14} />
            <span>Complete with AI ({10 - prompts.length} Queries)</span>
          </button>
        </div>
      )}

      {prompts.length >= 10 && (
        <div className="growth-prompt-completed-banner">
          <CheckCircle2 size={16} color="#10b981" />
          <span><strong>Setup Complete:</strong> 10 search queries are actively monitored. You can simulate any query live at any time or scan all of them at once from the GEO Visibility tab.</span>
        </div>
      )}

      {/* Prompt Library Table */}
      <div className="growth-panel-card">
        <div className="growth-card-header">
          <div className="card-header-titles">
            <h3 className="growth-card-title">Tracked Prompts Library</h3>
            <span className="growth-card-sub">Test any prompt live with a single click at any time.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`growth-badge ${prompts.length >= 10 ? 'green' : 'warning'}`}>
              {prompts.length >= 10 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {prompts.length} / 10 Queries
            </span>
          </div>
        </div>

        <div className="growth-table-wrap">
          <table className="growth-table">
            <thead>
              <tr>
                <th>Tracked Search Query (Prompt)</th>
                <th>Category / Topic</th>
                <th>Latest Status</th>
                <th>Test Count</th>
                <th>Action &amp; Simulation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><SkeletonBlock width="85%" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="120px" height="14px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="80px" height="22px" borderRadius="999px" /></td>
                    <td><SkeletonBlock width="40px" height="16px" borderRadius="4px" /></td>
                    <td><SkeletonBlock width="95px" height="28px" borderRadius="6px" /></td>
                  </tr>
                ))
              ) : prompts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ maxWidth: 440, margin: '0 auto' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.92rem' }}>
                        No tracked prompts yet. Define 10 queries to start GEO visibility analysis.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAiModal}
                        className="growth-primary-btn ai-generate-magic-btn"
                        style={{ margin: '0 auto', display: 'inline-flex' }}
                      >
                        <Sparkles size={14} />
                        <span>Generate Queries with AI</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                prompts.map((p) => {
                  const isRunning = runningPromptId === p.id;
                  const hasRun = p.run_count > 0;
                  const isMentioned = p.last_brand_mentioned;

                    const marketOpt = getMarketOption(p.country || 'TR');
                    const langOpt = getLanguageOption(p.language || 'tr');

                    return (
                      <tr key={p.id}>
                        <td style={{ maxWidth: '400px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="font-medium text-main">"{p.prompt}"</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span className="prompt-meta-badge" title={`Target Market: ${marketOpt.label}`}>
                                {marketOpt.icon}
                                <span>{marketOpt.code || p.country || 'TR'}</span>
                              </span>
                              <span className="prompt-meta-badge lang" title={`Query Language: ${langOpt.label}`}>
                                <Languages size={11} color="#8b5cf6" />
                                <span>{langOpt.code || (p.language || 'TR').toUpperCase()}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                      <td>
                        <span className="query-tag">{p.topic || 'General'}</span>
                      </td>
                      <td>
                        {!hasRun ? (
                          <span className="text-muted text-xs">Not Yet Tested</span>
                        ) : isMentioned ? (
                          <span className="ai-badge-active">
                            <CheckCircle2 size={12} />
                            <span>Recommended</span>
                          </span>
                        ) : (
                          <span className="ai-badge-inactive">
                            <XCircle size={12} />
                            <span>Not Listed</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono">{p.run_count || 0} runs</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className="growth-simulate-run-btn"
                            onClick={() => handleRunSimulation(p.id)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <>
                                <Loader2 size={13} className="spin" />
                                <span>Scanning Gemini...</span>
                              </>
                            ) : (
                              <>
                                <img src="/AI-logos/gemini-color.svg" alt="Gemini" style={{ width: 13, height: 13 }} />
                                <span>Test with Gemini</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="prompt-row-delete-btn"
                            onClick={() => setDeleteTargetPrompt(p)}
                            title="Remove from Tracking"
                            disabled={isRunning}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
      {isAddOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => setIsAddOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="growth-guide-modal modal-sm animate-scale" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div className="modal-title-wrap">
                <Bot size={18} className="text-primary" />
                <h2>Add New GEO Prompt</h2>
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

            <form onSubmit={handleAddPrompt}>
              <div className="growth-modal-body">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Search Query to Track (Prompt):</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. What are the best online collaboration and workflow tools?"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="growth-text-input"
                    required
                    autoFocus
                  />
                  <span className="growth-input-hint">
                    Enter natural questions users ask AI assistants regarding your industry and products.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="growth-input-label">Topic / Category:</label>
                  <input
                    type="text"
                    placeholder="e.g. Industry Leadership"
                    value={newPromptTopic}
                    onChange={(e) => setNewPromptTopic(e.target.value)}
                    className="growth-text-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <AiVisibilityDropdown
                      id="modal-prompt-country"
                      label="Target Market / Country"
                      icon={<Globe size={13} color="#3b82f6" />}
                      options={MARKET_OPTIONS}
                      value={selectedCountry}
                      onChange={setSelectedCountry}
                      disabled={addingPrompt}
                    />
                  </div>
                  <div>
                    <AiVisibilityDropdown
                      id="modal-prompt-language"
                      label="Query Language"
                      icon={<Languages size={13} color="#8b5cf6" />}
                      options={LANGUAGE_OPTIONS}
                      value={selectedLanguage}
                      onChange={setSelectedLanguage}
                      disabled={addingPrompt}
                    />
                  </div>
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
                  disabled={addingPrompt || !newPromptText.trim()}
                >
                  {addingPrompt ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  <span>Track Prompt</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* AI Prompt Generator Modal */}
      {isAiGenModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop" 
          onClick={() => !savingAiPrompts && !generatingAiPrompts && setIsAiGenModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-gen-modal-prompts-title"
        >
          <div className="growth-modal-card ai-gen-modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="growth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="ai-gen-modal-header-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 id="ai-gen-modal-prompts-title" className="ai-gen-modal-title">
                    Generate Search Queries (Prompts) with AI
                  </h2>
                  <p className="ai-gen-modal-subtitle">
                    Gemini analyzes your domain <strong>{activeWorkspace?.primary_domain || activeWorkspace?.name}</strong> and industry to generate GEO-focused queries.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="growth-modal-close"
                onClick={() => setIsAiGenModalOpen(false)}
                disabled={savingAiPrompts || generatingAiPrompts}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="growth-modal-body">
              {generatingAiPrompts ? (
                <div className="ai-gen-loading-box">
                  <div className="ai-gen-pulse-circle">
                    <Loader2 size={32} className="spin text-primary" style={{ color: '#8b5cf6' }} />
                  </div>
                  <h4 className="ai-gen-loading-title">
                    Generating AI Search Queries...
                  </h4>
                  <p className="ai-gen-loading-desc">
                    Google Gemini models your website's target audience, industry, and critical questions users ask AI.
                  </p>
                </div>
              ) : aiGenError ? (
                <div className="growth-alert-card warning" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.86rem' }}>
                    <strong>Error:</strong> {aiGenError}
                  </div>
                  <button
                    type="button"
                    onClick={fetchAiPromptSuggestions}
                    className="growth-secondary-btn"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : aiGeneratedSuggestions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No suggested queries found.
                </div>
              ) : (
                <div className="ai-gen-suggestions-wrap">
                  <div className="ai-gen-suggestions-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="ai-gen-count-badge">
                        {aiGeneratedSuggestions.filter(s => s.selected).length} / {aiGeneratedSuggestions.length} Queries Selected
                      </span>
                      <span className="ai-gen-info-count">
                        (Total when added: {Math.min(10, prompts.length + aiGeneratedSuggestions.filter(s => s.selected).length)}/10)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllSuggestions}
                      className="ai-gen-toggle-all-btn"
                    >
                      {aiGeneratedSuggestions.every(s => s.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="ai-gen-list">
                    {aiGeneratedSuggestions.map((item, idx) => (
                      <label key={idx} className={`ai-gen-item ${item.selected ? 'is-selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSuggestion(idx)}
                          className="ai-gen-checkbox"
                        />
                        <div className="ai-gen-item-content">
                          <span className="ai-gen-prompt-text">"{item.prompt}"</span>
                          <div className="ai-gen-item-meta">
                            <span className="ai-gen-topic-pill">{item.topic || 'Industry Leadership'}</span>
                            <span className="ai-gen-engine-tag">
                              <Sparkles size={10} color="#8b5cf6" />
                              <span>GEO Targeted</span>
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="growth-modal-footer">
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setIsAiGenModalOpen(false)}
                disabled={savingAiPrompts}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSelectedAiPrompts}
                disabled={generatingAiPrompts || savingAiPrompts || aiGeneratedSuggestions.filter(s => s.selected).length === 0}
                className="growth-primary-btn ai-gen-save-btn"
              >
                {savingAiPrompts ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Add Selected to Tracking ({aiGeneratedSuggestions.filter(s => s.selected).length} Queries)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Custom UI */}
      {deleteTargetPrompt && typeof document !== 'undefined' && createPortal(
        <div 
          className="growth-modal-backdrop"
          onClick={() => !deletingPromptId && setDeleteTargetPrompt(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-prompt-modal-prompts-title"
        >
          <div 
            className="growth-modal-card comp-delete-modal-card animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="growth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="comp-delete-modal-icon">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 id="delete-prompt-modal-prompts-title" className="ai-gen-modal-title">
                    Remove Query from Tracking
                  </h2>
                  <p className="ai-gen-modal-subtitle">
                    This query will be removed from tracking, freeing up a slot in your list.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="growth-modal-close"
                onClick={() => setDeleteTargetPrompt(null)}
                disabled={Boolean(deletingPromptId)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="growth-modal-body">
              <div className="delete-target-preview-box">
                <p className="delete-target-preview-text">
                  "{deleteTargetPrompt.prompt}"
                </p>
                <div className="delete-target-preview-meta">
                  <span className="prompt-topic-tag">{deleteTargetPrompt.topic || 'General'}</span>
                  <span>{deleteTargetPrompt.run_count || 0} Tests Run</span>
                </div>
              </div>
              <div className="delete-modal-explain-box">
                <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Removing this query will free up 1 slot in your 10-query tracking limit. Do you confirm?</span>
              </div>
            </div>

            <div className="growth-modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="growth-secondary-btn"
                onClick={() => setDeleteTargetPrompt(null)}
                disabled={Boolean(deletingPromptId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="comp-delete-confirm-btn"
                onClick={handleConfirmDeletePrompt}
                disabled={Boolean(deletingPromptId)}
              >
                {deletingPromptId ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Remove from Tracking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
