import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './ToolHeader.css';

export default function ToolHeader({
  title,
  subtitle,
  description,
  onBack,
  backLabel = 'All Tools',
  badges = null,
  actions = null,
  center = false,
  className = '',
  slug = null,
  logo = null
}) {
  const displaySubtitle = subtitle || description;

  // Auto-detect tool slug from URL hash/path if not explicitly provided
  const currentUrlSlug = typeof window !== 'undefined' 
    ? (window.location.hash.match(/tool\/([a-zA-Z0-9_-]+)/)?.[1] || window.location.pathname.match(/\/tool\/([a-zA-Z0-9_-]+)/)?.[1])
    : null;
  const effectiveSlug = slug || currentUrlSlug;
  const logoSrc = logo || (effectiveSlug ? `/tool-icons/${effectiveSlug}.webp` : null);

  return (
    <div className={`c-tool-header-wrapper ${className}`}>
      <div className="c-tool-nav">
        {onBack && (
          <button className="c-tool-back-btn" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </button>
        )}
        <div className="c-tool-nav-right">
          {badges && <div className="c-tool-header-badges">{badges}</div>}
          {actions && <div className="c-tool-header-actions">{actions}</div>}
        </div>
      </div>

      <div className={`c-tool-title-area ${center ? 'center' : ''}`}>
        <div 
          className={`c-tool-title-row ${center ? 'center' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            justifyContent: center ? 'center' : 'flex-start',
            marginBottom: '0.35rem'
          }}
        >
          {logoSrc && (
            <img 
              src={logoSrc} 
              alt="" 
              className="c-tool-header-apple-logo"
              width={42}
              height={42}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12))',
                flexShrink: 0
              }}
              onError={(e) => {
                if (!e.target.dataset.triedPng && effectiveSlug) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = `/tool-icons/${effectiveSlug}.png`;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          )}
          <h1 className="c-tool-title" style={{ margin: 0 }}>{title}</h1>
        </div>
        {displaySubtitle && <p className="c-tool-subtitle">{displaySubtitle}</p>}
      </div>
    </div>
  );
}
