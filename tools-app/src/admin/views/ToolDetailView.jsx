import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Download, 
  Activity, 
  Eye, 
  Tag, 
  CheckCircle2, 
  Code, 
  Globe, 
  Share2, 
  Layers,
  Calendar,
  Zap,
  Info
} from 'lucide-react';

export default function ToolDetailView({ tool, onBack }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'seo' | 'json'

  if (!tool) {
    return (
      <div className="admin-body">
        <button type="button" className="admin-action-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Tools</span>
        </button>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Tool not found.
        </div>
      </div>
    );
  }

  const liveUrl = `https://tools.cerilas.com/tool/${tool.slug}`;
  const isAi = tool.category === 'AI Assisted' || (tool.keywords && tool.keywords.includes('ai'));
  const totalTasks = (tool.download_count || 0) + (tool.copy_count || 0) + (tool.use_count || 0);

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(liveUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {}
  };

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(tool, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="admin-body">
      {/* Top Navigation & Actions */}
      <div className="admin-detail-top-nav">
        <button 
          type="button" 
          className="admin-action-btn"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <ArrowLeft size={15} />
          <span>All Tools</span>
        </button>

        <div className="admin-detail-actions">
          <button 
            type="button" 
            className="admin-action-btn"
            onClick={handleCopyUrl}
          >
            {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span className="admin-btn-text-desktop">{copiedUrl ? 'Copied URL' : 'Copy Live URL'}</span>
            <span className="admin-btn-text-mobile">{copiedUrl ? 'Copied' : 'Copy'}</span>
          </button>
          <a 
            href={`/tool/${tool.slug}`} 
            target="_blank" 
            rel="noreferrer" 
            className="admin-action-btn primary"
          >
            <ExternalLink size={14} />
            <span className="admin-btn-text-desktop">Open Tool Live</span>
            <span className="admin-btn-text-mobile">Open</span>
          </a>
        </div>
      </div>

      {/* Tool Header Hero Card */}
      <div className="admin-detail-hero">
        <div className="admin-detail-hero-top">
          <div className="admin-detail-hero-left">
            <img 
              src={`/tool-icons/${tool.slug}.webp`} 
              alt="" 
              className="admin-detail-hero-icon"
              onError={(e) => {
                if (!e.target.dataset.triedPng) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = `/tool-icons/${tool.slug}.png`;
                }
              }}
            />
            <div className="admin-detail-hero-info">
              <div className="admin-detail-title-row">
                <h1 className="admin-detail-title-text">
                  {tool.title}
                </h1>
                <div className="admin-detail-status-pills">
                  <span className="admin-status-pill admin-status-active">
                    <CheckCircle2 size={11} />
                    Active
                  </span>
                  {isAi ? (
                    <span className="admin-status-pill admin-status-ai">
                      <Sparkles size={11} />
                      Gemini AI
                    </span>
                  ) : (
                    <span className="admin-status-pill admin-status-active">
                      <ShieldCheck size={11} />
                      Client WASM
                    </span>
                  )}
                </div>
              </div>
              <div className="admin-detail-meta-row">
                <span className="admin-detail-slug-text">tools.cerilas.com/tool/{tool.slug}</span>
                <span>•</span>
                <span>{tool.category || 'General'}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="admin-detail-desc">
          {tool.description || tool.short_description || tool.seo?.description || 'No detailed description available.'}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="admin-kpi-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Unique Visitors</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{Number(tool.unique_visitors_count || 0).toLocaleString()}</div>
          <div className="admin-kpi-sub">
            <span>Verified browser devices</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Views</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Eye size={16} />
            </div>
          </div>
          <div className="admin-kpi-val">{Number(tool.view_count || 0).toLocaleString()}</div>
          <div className="admin-kpi-sub">
            <span>Page loads & navigations</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Tasks Executed</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Download size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>
            {totalTasks.toLocaleString()}
          </div>
          <div className="admin-kpi-sub">
            <span>Downloads, copies & generations</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Conversion (CVR)</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="admin-kpi-val" style={{ color: '#3b82f6' }}>
            {tool.cvr || tool.total_cvr || 0}%
          </div>
          <div className="admin-kpi-sub">
            <span>Visitor to task conversion</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher for Detail Sections */}
      <div className="admin-detail-tabs">
        <button
          type="button"
          className={`admin-filter-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Capabilities
        </button>
        <button
          type="button"
          className={`admin-filter-pill ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO & SERP Preview
        </button>
        <button
          type="button"
          className={`admin-filter-pill ${activeTab === 'json' ? 'active' : ''}`}
          onClick={() => setActiveTab('json')}
        >
          Raw Manifest JSON
        </button>
      </div>

      {/* Tab 1: Overview & Capabilities */}
      {activeTab === 'overview' && (
        <div className="admin-detail-panels-grid">
          {/* Features List */}
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
            borderRadius: 18,
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Features & Capabilities</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block' }}>
              Functional offerings defined in manifest
            </span>

            {Array.isArray(tool.features) && tool.features.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tool.features.map((feat, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.86rem', lineHeight: 1.45 }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Standard utility features active.
              </div>
            )}
          </div>

          {/* Infrastructure & Privacy */}
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
            borderRadius: 18,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Engine Architecture</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Runtime environment specifications
              </span>
            </div>

            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(150, 150, 150, 0.04)', border: '1px solid var(--card-border, rgba(0,0,0,0.06))' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                {isAi ? 'Server-Side Gemini 2.5 AI' : 'Client-Side In-Browser Engine'}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {isAi 
                  ? 'Processes payload through encrypted server endpoints using Google GenAI SDK with device quota rate limiting.'
                  : 'Zero bytes uploaded to remote servers. All computing executes directly inside the user’s browser via WebAssembly and Web Workers.'}
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(150, 150, 150, 0.04)', border: '1px solid var(--card-border, rgba(0,0,0,0.06))' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                Privacy & Compliance
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                100% GDPR compliant. No confidential documents or files are persisted in databases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SEO & Google SERP Preview */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Google SERP Preview Card */}
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
            borderRadius: 18,
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Google Search Snippet Preview</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block' }}>
              How Googlebot indexes and presents this tool in search engine results
            </span>

            <div className="admin-serp-preview-box">
              <div style={{ fontSize: '0.78rem', color: '#1a0dab', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>https://tools.cerilas.com › tool › {tool.slug}</span>
              </div>
              <div style={{ fontSize: '1.15rem', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginBottom: '0.35rem', cursor: 'pointer' }}>
                {tool.seo_title || tool.seo?.title || tool.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {tool.seo_description || tool.seo?.description || tool.description || tool.short_description}
              </div>
            </div>
          </div>

          {/* Keywords & Tags */}
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
            borderRadius: 18,
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Target Keywords ({Array.isArray(tool.keywords) ? tool.keywords.length : 0})</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block' }}>
              Organic search index keywords targeted for programmatic SEO
            </span>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {Array.isArray(tool.keywords) && tool.keywords.map((kw, i) => (
                <span 
                  key={i}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 999,
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    border: '1px solid rgba(59, 130, 246, 0.15)'
                  }}
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Raw Manifest JSON */}
      {activeTab === 'json' && (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Manifest JSON Payload</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Registered schema definition
              </span>
            </div>
            <button 
              type="button" 
              className="admin-action-btn"
              onClick={handleCopyJson}
            >
              {copiedJson ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="admin-json-code-block">
            {JSON.stringify(tool, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
