import React from 'react';
import { LayoutTemplate, BarChart3, Code, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Navbar({ activeTool, onNavigateHome, onOpenStats }) {
  const { t } = useTranslation();
  const isAi = activeTool && (activeTool.isAi || activeTool.badge === 'AI Assisted' || activeTool.badge === 'AI Powered' || activeTool.slug === 'ats-resume-checker');

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a 
          href="#/" 
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--text-main)',
            color: 'var(--bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LayoutTemplate size={16} />
          </div>
          <span style={{ fontWeight: '500' }}>{t('nav.brand')}</span>
        </a>

        {activeTool && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '400' }}>{activeTool.title}</span>
            {isAi && (
              <span style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginLeft: '0.2rem'
              }}>
                <Sparkles size={10} />
                <span>AI Assisted</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="nav-links">
        <button
          onClick={onOpenStats}
          className="nav-link"
          style={{
            background: 'rgba(150, 150, 150, 0.08)',
            border: '1px solid var(--card-border)',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            cursor: 'pointer'
          }}
          title={t('stats.title')}
        >
          <BarChart3 size={15} />
          <span>{t('nav.stats')}</span>
        </button>

        <a href="https://cerilas.com" className="nav-link" target="_blank" rel="noopener noreferrer">
          {t('nav.mainSite')}
        </a>
        <a href="https://github.com/cerilas" className="nav-link" target="_blank" rel="noopener noreferrer">
          <Code size={16} strokeWidth={1.5} /> {t('nav.github')}
        </a>
      </div>
    </nav>
  );
}
