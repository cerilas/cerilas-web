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
  className = ''
}) {
  const displaySubtitle = subtitle || description;

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
        <h1 className="c-tool-title">{title}</h1>
        {displaySubtitle && <p className="c-tool-subtitle">{displaySubtitle}</p>}
      </div>
    </div>
  );
}
