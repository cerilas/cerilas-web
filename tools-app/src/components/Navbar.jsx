import React from 'react';
import { BarChart3, Code, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import PersonaMenu from './PersonaMenu/PersonaMenu';

export default function Navbar({ activeTool, onNavigateHome, onOpenStats, onSelectTool }) {
  const { t } = useTranslation();
  const isAi = activeTool && (activeTool.isAi || activeTool.badge === 'AI Assisted' || activeTool.badge === 'AI Powered' || activeTool.slug === 'ats-resume-checker');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className={`nav-left-group ${activeTool ? 'nav-has-tool' : ''}`}>
          <a 
            href="#/" 
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
          >
            <img 
              src="/platform-logo.webp" 
              alt="Cerilas' Tools" 
              className="nav-platform-logo"
              width={28}
              height={28}
              onError={(e) => {
                if (!e.target.dataset.triedPng) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = '/platform-logo.png';
                }
              }}
            />
            <span className="nav-brand-text">Cerilas' <span className="brand-bold-word">Tools</span></span>
          </a>

          {/* Persona Menu: I'm a ... */}
          <PersonaMenu onSelectTool={onSelectTool} onNavigateHome={onNavigateHome} />

          {activeTool && (
            <div className="nav-active-breadcrumb">
              <span className="nav-breadcrumb-divider">/</span>
              <img 
                src={`/tool-icons/${activeTool.slug}.webp`} 
                alt="" 
                className="nav-breadcrumb-icon"
                onError={(e) => {
                  if (!e.target.dataset.triedPng) {
                    e.target.dataset.triedPng = 'true';
                    e.target.src = `/tool-icons/${activeTool.slug}.png`;
                  } else {
                    e.target.style.display = 'none';
                  }
                }}
              />
              <span className="nav-breadcrumb-title">{activeTool.title}</span>
              {isAi && (
                <span className="nav-breadcrumb-ai-badge">
                  <Sparkles size={10} />
                  <span>AI</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="nav-links">
          <button
            onClick={onOpenStats}
            className="nav-link nav-stats-btn"
            title={t('stats.title')}
          >
            <BarChart3 size={15} />
            <span className="nav-stats-label">{t('nav.stats')}</span>
          </button>

          <a href="https://cerilas.com" className="nav-link nav-external-link" target="_blank" rel="noopener noreferrer">
            {t('nav.mainSite')}
          </a>
          <a href="https://github.com/cerilas" className="nav-link nav-external-link" target="_blank" rel="noopener noreferrer">
            <Code size={16} strokeWidth={1.5} /> <span className="nav-github-label">{t('nav.github')}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
