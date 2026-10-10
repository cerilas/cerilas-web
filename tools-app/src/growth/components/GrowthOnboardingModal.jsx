import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Globe,
  Plus, 
  Trash2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Bot,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';
import GrowthFavicon from './GrowthFavicon';
import './GrowthOnboardingModal.css';

const STAGES = [
  { id: 'dns', title: 'DNS & SSL Handshake' },
  { id: 'robots', title: 'Crawler Permissions (GPTBot, Perplexity)' },
  { id: 'meta', title: 'Meta, OpenGraph & Schema Architecture' },
  { id: 'intel', title: 'Brand & Competitor Mapping' }
];

const BUSINESS_MODELS = [
  'B2B',
  'B2C',
  'SaaS',
  'E-Commerce',
  'Marketplace',
  'Digital Agency',
  'Other'
];

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim().toLowerCase();
  str = str.replace(/^https?:\/\//i, '');
  str = (str.split('/')[0] || '').split('?')[0].split('#')[0];
  str = (str.split(':')[0] || '');
  str = str.replace(/^www\./i, '');
  return str.trim();
}

export default function GrowthOnboardingModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const { 
    workspaces, 
    refreshWorkspaces, 
    switchWorkspace,
    canAddWorkspace,
    promptPaywall,
    plan
  } = useGrowth();

  const [step, setStep] = useState(1); // 1: URL input, 2: Scanning, 3: Review & Launch
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStages, setScanStages] = useState(
    STAGES.map((s, idx) => ({ ...s, status: idx === 0 ? 'active' : 'pending' }))
  );
  const [scanProgressPct, setScanProgressPct] = useState(20);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Editable Brand Fields
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessModel, setBusinessModel] = useState('B2B');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [creating, setCreating] = useState(false);

  // Realtime duplicate domain validation (subdomains allowed, exact match prohibited)
  const currentNormalizedDomain = normalizeDomain(url);
  const matchingExistingWs = currentNormalizedDomain
    ? workspaces?.find(w => normalizeDomain(w.primary_domain || w.canonical_url) === currentNormalizedDomain)
    : null;
  const isDuplicateDomain = Boolean(matchingExistingWs);

  const handleClose = () => {
    setUrl('');
    setError('');
    setStep(1);
    setScanResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleStartScan = async (e) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError('Please enter your website URL.');
      return;
    }

    if (!canAddWorkspace) {
      setError('You have reached your workspace (website) limit. Please upgrade your plan to add more websites.');
      promptPaywall({ plan: plan === 'free' ? 'pro' : 'unlimited' });
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const targetDomain = normalizeDomain(cleanUrl);
    if (!targetDomain) {
      setError('Please enter a valid website address.');
      return;
    }

    // Check if domain is already registered (subdomains allowed, exact match prohibited)
    const existingWs = workspaces?.find(w => normalizeDomain(w.primary_domain || w.canonical_url) === targetDomain);
    if (existingWs) {
      setError(`"${targetDomain}" is already registered under "${existingWs.name}". Duplicate root domains cannot be added (subdomains like blog.${targetDomain} are allowed).`);
      return;
    }

    setError('');
    setScanning(true);
    setStep(2);
    setScanProgressPct(25);
    setScanStages(STAGES.map((s, idx) => ({ ...s, status: idx === 0 ? 'active' : 'pending' })));

    const stageTimer1 = setTimeout(() => {
      setScanProgressPct(50);
      setScanStages(prev => prev.map((s, idx) => {
        if (idx === 0) return { ...s, status: 'done' };
        if (idx === 1) return { ...s, status: 'active' };
        return s;
      }));
    }, 600);

    const stageTimer2 = setTimeout(() => {
      setScanProgressPct(75);
      setScanStages(prev => prev.map((s, idx) => {
        if (idx <= 1) return { ...s, status: 'done' };
        if (idx === 2) return { ...s, status: 'active' };
        return s;
      }));
    }, 1300);

    const stageTimer3 = setTimeout(() => {
      setScanProgressPct(90);
      setScanStages(prev => prev.map((s, idx) => {
        if (idx <= 2) return { ...s, status: 'done' };
        if (idx === 3) return { ...s, status: 'active' };
        return s;
      }));
    }, 2000);

    try {
      const res = await fetch('/api/growth/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Audit scan failed.');
      }

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      setScanProgressPct(100);
      setScanStages(STAGES.map(s => ({ ...s, status: 'done' })));

      const { scan, brand } = data.data;
      setScanResult(scan);
      setBrandName(brand.brandName || scan.domain || '');
      setIndustry(brand.industry || 'Technology & Digital Services');
      setBusinessModel(brand.businessModel || 'B2B');
      setDescription(brand.description || scan.meta?.metaDescription || '');
      setTargetAudience(brand.targetAudience || '');
      setKeywords(Array.isArray(brand.primaryKeywords) ? brand.primaryKeywords : []);
      setCompetitors(Array.isArray(brand.suggestedCompetitors) ? brand.suggestedCompetitors : []);

      setTimeout(() => {
        setStep(3);
        setScanning(false);
      }, 400);
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan website. Please check the domain address.');
      setStep(1);
      setScanning(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleAddCompetitor = () => {
    if (competitorDomain && typeof competitorDomain === 'string' && competitorDomain.trim()) {
      const clean = competitorDomain.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
      if (clean && !competitors.some(c => (typeof c === 'string' ? c : (c?.domain || c?.name)) === clean)) {
        setCompetitors([...competitors, { name: clean, domain: clean }]);
      }
      setCompetitorDomain('');
    }
  };

  const handleRemoveCompetitor = (idx) => {
    setCompetitors(competitors.filter((_, i) => i !== idx));
  };

  const handleCreateWorkspace = async () => {
    if (!brandName.trim()) {
      setError('Please specify a brand name.');
      return;
    }

    if (!canAddWorkspace) {
      setError('You have reached your workspace (website) limit. Please upgrade your plan to add more websites.');
      promptPaywall({ plan: plan === 'free' ? 'pro' : 'unlimited' });
      return;
    }

    const targetDomain = normalizeDomain(scanResult?.url || url);
    const existingWs = workspaces?.find(w => normalizeDomain(w.primary_domain || w.canonical_url) === targetDomain);
    if (existingWs) {
      setError(`"${targetDomain}" is already registered under "${existingWs.name}". Duplicate domains cannot be added.`);
      return;
    }

    setCreating(true);
    setError('');

    try {
      const payload = {
        name: brandName.trim(),
        url: scanResult?.url || url.trim(),
        industry,
        business_model: businessModel,
        description,
        target_audience: targetAudience,
        primary_keywords: keywords,
        competitors,
        initial_scan: scanResult
      };

      const res = await fetch('/api/growth/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          promptPaywall({ plan: plan === 'free' ? 'pro' : 'unlimited' });
        }
        throw new Error(data.error || 'Failed to create workspace.');
      }

      const created = data.data?.workspace || data.data;
      if (created?.slug) {
        await refreshWorkspaces(created.slug);
        switchWorkspace(created);
      } else {
        await refreshWorkspaces();
      }
      handleClose();
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="growth-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div 
        className={`growth-modal-container ${step === 3 ? 'growth-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Visual Banner */}
        <div className="growth-modal-banner-cover">
          <img 
            src="/growth-covers/modal-cover.jpg" 
            alt="" 
            className="growth-modal-cover-img"
          />
          <div className="growth-modal-cover-gradient" />
          
          {/* Close Button on Banner */}
          <button 
            type="button" 
            className="growth-modal-close-btn" 
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>

          {/* Stepper Header */}
          <div className="growth-modal-stepper-row">
            <div className={`modal-step-tag ${step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}`}>
              <span className="step-tag-num">{step > 1 ? <CheckCircle2 size={12} /> : '1'}</span>
              <span>Website</span>
            </div>
            <div className="modal-step-sep" />
            <div className={`modal-step-tag ${step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}`}>
              <span className="step-tag-num">{step > 2 ? <CheckCircle2 size={12} /> : '2'}</span>
              <span>Analyze</span>
            </div>
            <div className="modal-step-sep" />
            <div className={`modal-step-tag ${step === 3 ? 'is-active' : ''}`}>
              <span className="step-tag-num">3</span>
              <span>Brand Profile</span>
            </div>
          </div>

          {/* Banner Titles (Clean, direct, no essays) */}
          <div className="growth-modal-hero-titles">
            <h2 className="growth-modal-main-title">
              {step === 1 && 'Add Your Website'}
              {step === 2 && 'Analyzing Website'}
              {step === 3 && 'Brand Analysis Complete'}
            </h2>
            <p className="growth-modal-main-sub">
              {step === 1 && 'Enter your domain to initialize SEO and AI search (GEO) visibility.'}
              {step === 2 && 'Scanning server response, search crawler directives, and AI agent permissions.'}
              {step === 3 && 'Review discovered insights and launch your dedicated growth workspace.'}
            </p>
          </div>
        </div>

        {/* Modal Inner Body */}
        <div className="growth-modal-content-body">
          {error && (
            <div className="growth-alert-banner alert-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Simplified URL Input & Compact Badges */}
          {step === 1 && (
            <div className="growth-modal-step1">
              {!canAddWorkspace && (
                <div className="growth-modal-limit-warning">
                  <div className="limit-warning-left">
                    <Lock size={15} className="limit-warning-icon" />
                    <span className="limit-warning-text">
                      You have reached your workspace limit ({workspaces?.length || 0} websites). Upgrade your plan to add more websites.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => promptPaywall({ plan: plan === 'free' ? 'pro' : 'unlimited' })}
                    className="limit-warning-cta-btn"
                  >
                    Upgrade
                  </button>
                </div>
              )}
              <form onSubmit={handleStartScan} className="growth-url-form">
                <div className={`growth-url-bar-wrap ${isDuplicateDomain ? 'is-duplicate' : ''}`}>
                  <div className="growth-url-protocol">https://</div>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="growth-url-input"
                    placeholder="ornekmarka.com"
                    value={url.replace(/^https?:\/\//i, '')}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError('');
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={scanning || !url.trim() || isDuplicateDomain} 
                    className="growth-url-action-btn"
                  >
                    <span>Analyze</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {isDuplicateDomain && (
                  <div className="growth-duplicate-hint">
                    <AlertCircle size={15} className="text-amber" />
                    <span>
                      <strong>{currentNormalizedDomain}</strong> is already registered under "{matchingExistingWs.name}". Duplicate domains cannot be added (subdomains like <code>blog.{currentNormalizedDomain}</code> are allowed).
                    </span>
                  </div>
                )}
              </form>

              {/* 3 Compact Feature Pills (No paragraphs, strictly simple) */}
              <div className="growth-quick-feature-pills">
                <div className="quick-pill">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Technical SEO &amp; Speed</span>
                </div>
                <div className="quick-pill">
                  <Bot size={14} className="text-indigo" />
                  <span>GEO &amp; AI Bot Scan</span>
                </div>
                <div className="quick-pill">
                  <Layers size={14} className="text-blue" />
                  <span>Automated Brand Profile</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Minimalist Live Telemetry Checklist */}
          {step === 2 && (
            <div className="growth-modal-step2">
              <div className="growth-telemetry-top">
                <div className="telemetry-domain-row">
                  <Globe size={15} />
                  <span>{url}</span>
                </div>
                <span className="telemetry-pct-num">{scanProgressPct}%</span>
              </div>

              <div className="telemetry-bar-bg">
                <div className="telemetry-bar-fill" style={{ width: `${scanProgressPct}%` }} />
              </div>

              <div className="telemetry-simple-list">
                {scanStages.map((stage) => {
                  const isDone = stage.status === 'done';
                  const isActive = stage.status === 'active';
                  return (
                    <div key={stage.id} className={`telemetry-item ${isDone ? 'is-done' : isActive ? 'is-active' : ''}`}>
                      <div className="telemetry-icon-box">
                        {isDone && <CheckCircle2 size={15} className="text-emerald" />}
                        {isActive && <Loader2 size={15} className="telemetry-spinner" />}
                        {!isDone && !isActive && <span className="telemetry-dot" />}
                      </div>
                      <span className="telemetry-item-title">{stage.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Spacious 2-Column Review (Only essentials, no wall of text) */}
          {step === 3 && (
            <div className="growth-modal-step3">
              <div className="growth-step3-grid">
                {/* Left Column: Domain & 2 Score Cards */}
                <div className="step3-left-col">
                  {/* Domain Badge */}
                  <div className="step3-domain-card">
                    <div className="step3-domain-top">
                      <div className="step3-domain-avatar">
                        <GrowthFavicon
                          src={scanResult?.meta?.faviconUrl}
                          domain={scanResult?.domain}
                          name={brandName || scanResult?.domain}
                          size={28}
                        />
                      </div>
                      <div className="step3-domain-titles">
                        <h4 className="step3-domain-name">{scanResult?.domain || 'domain.com'}</h4>
                        <a 
                          href={scanResult?.url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="step3-domain-anchor"
                        >
                          <span>{scanResult?.url}</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    <div className="step3-domain-tags">
                      <span className="step3-tag-status">
                        <Lock size={10} />
                        <span>{scanResult?.meta?.hasSsl ? 'HTTPS Secure' : 'HTTP'}</span>
                      </span>
                      <span className="step3-tag-status">
                        <span>HTTP {scanResult?.statusCode || 200}</span>
                      </span>
                      {scanResult?.loadTimeMs && (
                        <span className="step3-tag-status">
                          <span>{scanResult.loadTimeMs}ms</span>
                        </span>
                      )}
                    </div>

                    {scanResult?.meta?.title && (
                      <div className="step3-title-preview">
                        <span className="preview-label">Title:</span>
                        <span className="preview-text">{scanResult.meta.title}</span>
                      </div>
                    )}
                  </div>

                  {/* 2 Clean Diagnostic Score Bars */}
                  <div className="step3-scores-row">
                    <div className="step3-score-box">
                      <div className="score-box-header">
                        <ShieldCheck size={15} className="text-emerald" />
                        <span>Technical SEO</span>
                        <strong className="score-val">{scanResult?.technicalScore || 85}/100</strong>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill emerald" style={{ width: `${scanResult?.technicalScore || 85}%` }} />
                      </div>
                    </div>

                    <div className="step3-score-box">
                      <div className="score-box-header">
                        <Bot size={15} className="text-indigo" />
                        <span>GEO Readiness</span>
                        <strong className="score-val">{scanResult?.geoScore || 75}/100</strong>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill indigo" style={{ width: `${scanResult?.geoScore || 75}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Clean Form Fields */}
                <div className="step3-right-col">
                  <div className="step3-fields-stack">
                    {/* Row 1: Brand Name & Business Model */}
                    <div className="step3-row-2col">
                      <div className="step3-field">
                        <label className="step3-label">Brand Name</label>
                        <input
                          type="text"
                          required
                          className="step3-input"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                        />
                      </div>

                      <div className="step3-field">
                        <label className="step3-label">Business Model</label>
                        <select
                          className="step3-select"
                          value={businessModel}
                          onChange={(e) => setBusinessModel(e.target.value)}
                        >
                          {BUSINESS_MODELS.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Industry */}
                    <div className="step3-field">
                      <label className="step3-label">Industry</label>
                      <input
                        type="text"
                        className="step3-input"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      />
                    </div>

                    {/* Row 3: Description */}
                    <div className="step3-field">
                      <label className="step3-label">Short Description</label>
                      <textarea
                        rows={2}
                        className="step3-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Row 4: Keywords */}
                    <div className="step3-field">
                      <div className="step3-label-row">
                        <label className="step3-label">Primary Keywords</label>
                        <span className="step3-pill-count">{keywords.length}</span>
                      </div>
                      <div className="step3-tags-container">
                        <div className="step3-tags-list">
                          {keywords.map((kw) => (
                            <span key={kw} className="step3-tag-item">
                              <span>{kw}</span>
                              <button type="button" onClick={() => handleRemoveKeyword(kw)} aria-label="Remove">
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="step3-inline-add">
                          <input
                            type="text"
                            placeholder="Add keyword + Enter"
                            className="step3-inline-input"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddKeyword();
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            className="step3-inline-btn"
                            onClick={handleAddKeyword}
                            disabled={!keywordInput.trim()}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Competitors */}
                    <div className="step3-field">
                      <div className="step3-label-row">
                        <label className="step3-label">Competitors to Track</label>
                        <span className="step3-pill-count">{competitors.length}</span>
                      </div>
                      <div className="step3-competitors-container">
                        {competitors.length > 0 && (
                          <div className="step3-comp-pills-list">
                            {competitors.map((comp, idx) => {
                              const compLabel = typeof comp === 'string'
                                ? comp
                                : (typeof comp?.domain === 'string' ? comp.domain : (typeof comp?.name === 'string' ? comp.name : 'Competitor'));
                              return (
                                <div key={idx} className="step3-comp-pill">
                                  <span>{compLabel}</span>
                                  <button type="button" onClick={() => handleRemoveCompetitor(idx)} aria-label="Remove">
                                    <X size={11} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="step3-comp-add-bar">
                          <input
                            type="text"
                            placeholder="competitor.com"
                            className="step3-input"
                            value={competitorDomain}
                            onChange={(e) => setCompetitorDomain(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCompetitor();
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            className="step3-comp-btn"
                            onClick={handleAddCompetitor}
                            disabled={!competitorDomain.trim()}
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="step3-footer-actions">
                <button
                  type="button"
                  className="step3-back-btn"
                  onClick={() => setStep(1)}
                  disabled={creating}
                >
                  <ArrowLeft size={15} />
                  <span>Scan Different Site</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateWorkspace}
                  disabled={creating || !brandName.trim()}
                  className="step3-submit-btn"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="telemetry-spinner" />
                      <span>Provisioning Workspace...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Launch Workspace</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
