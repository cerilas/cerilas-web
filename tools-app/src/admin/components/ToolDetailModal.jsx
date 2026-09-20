import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Sparkles, Activity, Users, Download, ShieldCheck, Tag } from 'lucide-react';

export default function ToolDetailModal({ tool, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tool) return null;

  const toolUrl = `https://tools.cerilas.com/tool/${tool.slug}`;

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(toolUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy URL:', e);
    }
  };

  const isAi = tool.category === 'AI Assisted' || (tool.keywords && tool.keywords.includes('ai'));

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div 
        className="c-modal-box admin-detail-modal-box" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="c-modal-header" style={{ borderBottom: '1px solid var(--card-border, rgba(0,0,0,0.06))', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img 
              src={`/tool-icons/${tool.slug}.webp`} 
              alt="" 
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }}
              onError={(e) => {
                if (!e.target.dataset.triedPng) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = `/tool-icons/${tool.slug}.png`;
                }
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="c-modal-title">{tool.title}</h3>
                {isAi && (
                  <span className="admin-status-pill admin-status-ai">
                    <Sparkles size={11} />
                    AI Tool
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                /{tool.slug}
              </span>
            </div>
          </div>
          <button type="button" className="c-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="c-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Metrics Bar */}
          <div className="admin-modal-metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            background: 'rgba(150, 150, 150, 0.05)',
            padding: '0.85rem 1rem',
            borderRadius: 14,
            border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={12} /> Visitors
              </span>
              <strong style={{ fontSize: '1.15rem', display: 'block', marginTop: '0.2rem' }}>
                {Number(tool.unique_visitors_count || 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Download size={12} /> Tasks Done
              </span>
              <strong style={{ fontSize: '1.15rem', display: 'block', marginTop: '0.2rem', color: '#10b981' }}>
                {Number((tool.download_count || 0) + (tool.copy_count || 0) + (tool.use_count || 0)).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Activity size={12} /> Conv. Rate
              </span>
              <strong style={{ fontSize: '1.15rem', display: 'block', marginTop: '0.2rem', color: '#3b82f6' }}>
                {tool.total_cvr || tool.download_cvr || 0}%
              </strong>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Summary & Purpose
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
              {tool.description || tool.short_description || tool.seo?.description || 'No description provided.'}
            </p>
          </div>

          {/* Categorization & Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(150, 150, 150, 0.04)', padding: '0.85rem', borderRadius: 12, border: '1px solid var(--card-border, rgba(0,0,0,0.06))' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Category
              </span>
              <div style={{ marginTop: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
                {tool.category || 'General Utility'}
              </div>
            </div>
            <div style={{ background: 'rgba(150, 150, 150, 0.04)', padding: '0.85rem', borderRadius: 12, border: '1px solid var(--card-border, rgba(0,0,0,0.06))' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Engine & Privacy
              </span>
              <div style={{ marginTop: '0.25rem', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} color="#10b981" />
                {isAi ? 'Server Gemini API + Rate Limit' : '100% Client WASM / Local'}
              </div>
            </div>
          </div>

          {/* Keywords */}
          {tool.keywords && tool.keywords.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Target Keywords & Tags
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {tool.keywords.map((kw, i) => (
                  <span 
                    key={i} 
                    style={{
                      fontSize: '0.74rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 999,
                      background: 'rgba(150, 150, 150, 0.08)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Direct Public URL */}
          <div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Public Web Access URL
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                readOnly 
                value={toolUrl} 
                style={{
                  flexGrow: 1,
                  padding: '0.55rem 0.85rem',
                  borderRadius: 10,
                  border: '1px solid var(--card-border, rgba(0,0,0,0.1))',
                  background: 'rgba(150, 150, 150, 0.05)',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem'
                }}
              />
              <button 
                type="button" 
                className="admin-action-btn"
                onClick={handleCopyUrl}
                title="Copy URL"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a 
                href={`/tool/${tool.slug}`} 
                target="_blank" 
                rel="noreferrer" 
                className="admin-action-btn primary"
              >
                <ExternalLink size={14} />
                <span>Open</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
