import React from 'react';
import { BookOpen } from 'lucide-react';
import './ToolHeader.css';

export default function ToolSeoDivider({ label = 'Documentation, Guides & Forensic Science' }) {
  return (
    <div className="c-tool-seo-divider" aria-hidden="true">
      <div className="c-tool-seo-divider-line" />
      <span className="c-tool-seo-divider-badge">
        <BookOpen size={13} />
        <span>{label}</span>
      </span>
      <div className="c-tool-seo-divider-line" />
    </div>
  );
}
