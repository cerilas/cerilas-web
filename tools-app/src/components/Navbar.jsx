import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Sun, 
  Moon, 
  User, 
  ChevronDown, 
  Package, 
  CreditCard, 
  LogOut, 
  Crown,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PersonaMenu from './PersonaMenu/PersonaMenu';
import './NavbarAuth.css';

export default function Navbar({ activeTool, onNavigateHome, onOpenStats, onSelectTool }) {
  const { t, language } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuTimeoutRef = useRef(null);

  const isAi = activeTool && (activeTool.isAi || activeTool.badge === 'AI Assisted' || activeTool.badge === 'AI Powered' || activeTool.slug === 'ats-resume-checker');
  const isTr = language === 'tr';

  const handleUserMenuMouseEnter = () => {
    if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
    setUserMenuOpen(true);
  };

  const handleUserMenuMouseLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 200);
  };

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
    };
  }, []);

  const handleNavigateAccountTab = (tab) => {
    setUserMenuOpen(false);
    window.location.hash = `#/account?tab=${tab}`;
  };

  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentPlan = user?.plan || 'free';

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

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div 
              className="nav-user-dropdown-wrap" 
              ref={userMenuRef}
              onMouseEnter={handleUserMenuMouseEnter}
              onMouseLeave={handleUserMenuMouseLeave}
            >
              <button
                type="button"
                className={`nav-user-trigger-btn ${userMenuOpen ? 'is-active' : ''}`}
                onClick={() => setUserMenuOpen(prev => !prev)}
                aria-expanded={userMenuOpen}
              >
                <div className="nav-user-avatar-mini">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="nav-avatar-mini-img" />
                  ) : (
                    <span className="nav-avatar-mini-text">{userInitials}</span>
                  )}
                  <span className="nav-avatar-online-dot" />
                </div>
                <span className="nav-user-display-name">
                  {user.first_name || user.name || (user.email ? user.email.split('@')[0] : 'Kullanıcı')}
                </span>
                <ChevronDown size={14} className={`nav-user-chevron ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="nav-user-menu-dropdown animate-scale">
                  {/* Dropdown Header */}
                  <div className="nav-dropdown-header">
                    <div className="nav-dropdown-user-info">
                      <span className="nav-dropdown-user-name">{user.name || user.email}</span>
                      <span className="nav-dropdown-user-email">{user.email}</span>
                    </div>
                    <span className={`nav-dropdown-plan-pill pill-${currentPlan}`}>
                      <Crown size={11} />
                      <span>{currentPlan === 'pro' ? 'Pro' : currentPlan === 'enterprise' ? 'Enterprise' : 'Free'}</span>
                    </span>
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* Main Portal Links */}
                  <div className="nav-dropdown-items">
                    <a
                      href="#/growth"
                      className="nav-dropdown-item nav-item-growth"
                      style={{ textDecoration: 'none' }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <TrendingUp size={16} className="nav-item-icon text-primary" />
                      <div className="nav-item-text-wrap">
                        <span className="nav-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Cerilas Growth
                          <span className="nav-growth-pill-sm">PREMIUM</span>
                        </span>
                        <span className="nav-item-sub">{isTr ? 'Büyüme & AI Arama Paneli' : 'AI Visibility & SEO Suite'}</span>
                      </div>
                    </a>

                    <button
                      type="button"
                      className="nav-dropdown-item"
                      onClick={() => handleNavigateAccountTab('profile')}
                    >
                      <User size={16} className="nav-item-icon" />
                      <div className="nav-item-text-wrap">
                        <span className="nav-item-title">{isTr ? 'Profil' : 'Profile'}</span>
                        <span className="nav-item-sub">
                          {user.phone_verified ? (
                            <span className="verified-text">
                              <CheckCircle2 size={11} />
                              <span>Phone Verified</span>
                            </span>
                          ) : (
                            <span className="unverified-text">
                              <AlertCircle size={11} />
                              <span>{isTr ? 'Telefon Doğrula' : 'Verify Phone'}</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="nav-dropdown-item"
                      onClick={() => handleNavigateAccountTab('package')}
                    >
                      <Package size={16} className="nav-item-icon" />
                      <div className="nav-item-text-wrap">
                        <span className="nav-item-title">{isTr ? 'Plan' : 'Plan'}</span>
                        <span className="nav-item-sub">
                          {currentPlan === 'pro' ? 'Pro Developer' : currentPlan === 'enterprise' ? 'Enterprise' : (isTr ? 'Ücretsiz Başlangıç' : 'Free Starter')}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="nav-dropdown-item"
                      onClick={() => handleNavigateAccountTab('billing')}
                    >
                      <CreditCard size={16} className="nav-item-icon" />
                      <div className="nav-item-text-wrap">
                        <span className="nav-item-title">Billing</span>
                        <span className="nav-item-sub">{isTr ? 'Fatura & Ödeme' : 'Invoices & Tax Info'}</span>
                      </div>
                    </button>
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    className="nav-dropdown-item nav-item-logout"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>{isTr ? 'Çıkış Yap' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="nav-login-btn"
              title={isTr ? 'Giriş Yap / Kayıt Ol' : 'Sign In / Register'}
            >
              <User size={14} />
              <span>{isTr ? 'Giriş Yap' : 'Sign In'}</span>
            </button>
          )}

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
