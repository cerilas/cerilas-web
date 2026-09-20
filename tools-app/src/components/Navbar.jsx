import React from 'react';
import { BarChart3, Sparkles, Sun, Moon, CreditCard } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import PersonaMenu from './PersonaMenu/PersonaMenu';

export default function Navbar({ activeTool, onNavigateHome, onOpenStats, onSelectTool, onNavigatePricing }) {
  const { t, language } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
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

          <a
            href="#/pricing"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigatePricing) onNavigatePricing();
              else window.location.hash = '#/pricing';
            }}
            className="nav-link nav-pricing-btn"
            title="Pricing & Plans"
          >
            <CreditCard size={15} />
            <span className="nav-pricing-label">Pricing</span>
          </a>

          <button
            onClick={toggleTheme}
            className="nav-theme-toggle-btn"
            title={isDark ? (language === 'tr' ? 'Açık Tema' : 'Switch to Light Mode') : (language === 'tr' ? 'Koyu Tema' : 'Switch to Dark Mode')}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
