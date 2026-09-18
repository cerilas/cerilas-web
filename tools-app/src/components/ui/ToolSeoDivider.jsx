import React from 'react';
import { BookOpen } from 'lucide-react';
import AdSlot from './AdSlot';
import './ToolHeader.css';

export default function ToolSeoDivider({ 
  label, 
  title, 
  showAd = true 
}) {
  const text = label || title || 'Documentation, Guides & Forensic Science';

  return (
    <div className="c-tool-seo-divider-container" style={{ width: '100%' }}>
      <div className="c-tool-seo-divider" aria-hidden="true">
        <div className="c-tool-seo-divider-line" />
        <span className="c-tool-seo-divider-badge">
          <BookOpen size={13} />
          <span>{text}</span>
        </span>
        <div className="c-tool-seo-divider-line" />
      </div>

      {showAd && (
        <AdSlot 
          format="in-article" 
          slotId="4093371757" 
        />
      )}
    </div>
  );
}

