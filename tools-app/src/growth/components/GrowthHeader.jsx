import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  ExternalLink, 
  Sparkles, 
  ArrowLeft, 
  Building2, 
  Check, 
  Bell, 
  ShieldCheck,
  Calendar,
  Globe,
  Sun,
  Moon,
  User,
  Package,
  CreditCard,
  LogOut,
  Crown,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GrowthFavicon from './GrowthFavicon';
import GrowthDeleteWorkspaceModal from './GrowthDeleteWorkspaceModal';
import '../../components/NavbarAuth.css';

export default function GrowthHeader({ onBackToTools }) {
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    setIsOnboardingOpen,
    refreshWorkspaces
  } = useGrowth();
  const { user, isAuthenticated, logout, openAuthModal, token } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deleteTargetWs, setDeleteTargetWs] = useState(null);
  const dropdownRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuTimeoutRef = useRef(null);

  const isTr = typeof window !== 'undefined' && (localStorage.getItem('preferred_language') === 'tr' || navigator.language?.startsWith('tr'));

  const handleUserMenuMouseEnter = () => {
    if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
    setUserMenuOpen(true);
  };

  const handleUserMenuMouseLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 200);
  };

  const handleNavigateAccountTab = (tab) => {
    setUserMenuOpen(false);
    window.location.hash = `#/account?tab=${tab}`;
  };

  const userInitials = (user?.name || user?.first_name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentPlan = user?.plan || 'free';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
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

  return (
    <header className="growth-app-header">
      <div className="growth-header-left">
        {/* Back to Tools Button */}
        <button
          type="button"
          onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
          className="growth-header-back-btn"
          title="Return to Cerilas Tools Catalog"
        >
          <ArrowLeft size={16} />
          <span>Back to Tools</span>
        </button>

        <span className="growth-header-sep">/</span>

        {/* Global Workspace Switcher Dropdown */}
        <div className="growth-workspace-switcher" ref={dropdownRef}>
          <button
            type="button"
            className="growth-ws-select-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="growth-ws-btn-content">
              <GrowthFavicon
                src={activeWorkspace?.favicon_url}
                domain={activeWorkspace?.primary_domain}
                name={activeWorkspace?.name}
                size={22}
                className="growth-ws-fav"
              />
              <div className="growth-ws-titles">
                <span className="growth-ws-title">{activeWorkspace?.name || 'Select Workspace'}</span>
                <span className="growth-ws-sub">{activeWorkspace?.primary_domain || 'Workspace'}</span>
              </div>
            </div>
            <ChevronDown size={14} className={`growth-ws-chevron ${isDropdownOpen ? 'is-open' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="growth-ws-dropdown animate-fade">
              <div className="growth-ws-dropdown-header">
                <span>Registered Workspaces ({workspaces.length})</span>
              </div>

              <div className="growth-ws-list">
                {workspaces.map((ws) => {
                  const isSelected = activeWorkspace?.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      className={`growth-ws-item ${isSelected ? 'is-active' : ''}`}
                      onClick={() => {
                        switchWorkspace(ws);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="growth-ws-item-info">
                        <GrowthFavicon
                          src={ws.favicon_url}
                          domain={ws.primary_domain}
                          name={ws.name}
                          size={20}
                          className="growth-ws-item-fav"
                        />
                        <div className="growth-ws-item-titles">
                          <span className="growth-ws-item-name">{ws.name}</span>
                          <span className="growth-ws-item-domain">{ws.primary_domain}</span>
                        </div>
                      </div>

                      <div className="growth-ws-item-right">
                        <span className="growth-score-tag">{ws.growth_score || 70}</span>
                        <span className="growth-ws-check-slot">
                          {isSelected && <Check size={14} className="text-primary" />}
                        </span>
                        <button
                          type="button"
                          className="growth-ws-delete-quick-btn"
                          title={isTr ? `${ws.name} çalışma alanını sil` : `Delete ${ws.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetWs(ws);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="growth-ws-dropdown-footer">
                <button
                  type="button"
                  className="growth-add-ws-action-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsOnboardingOpen(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Add Brand / Website</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="growth-header-right">
        {/* External Link to Active Domain */}
        {activeWorkspace?.canonical_url && (
          <a
            href={activeWorkspace.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="growth-header-site-link"
          >
            <span>{activeWorkspace.primary_domain}</span>
            <ExternalLink size={12} />
          </a>
        )}

        {/* Date Filter Badge */}
        <div className="growth-header-date-badge">
          <Calendar size={13} />
          <span>Last 28 Days</span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="growth-header-theme-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Auth Section / Profile Dropdown */}
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
                  <button
                    type="button"
                    className="nav-dropdown-item nav-item-growth"
                    style={{ textDecoration: 'none' }}
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onBackToTools) onBackToTools();
                      else window.location.hash = '#/';
                    }}
                  >
                    <ArrowLeft size={16} className="nav-item-icon text-primary" />
                    <div className="nav-item-text-wrap">
                      <span className="nav-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Cerilas Tools
                      </span>
                      <span className="nav-item-sub">{isTr ? 'Araçlar Kataloğuna Dön' : 'All Tools Catalog'}</span>
                    </div>
                  </button>

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
            className="nav-login-btn"
            onClick={openAuthModal}
          >
            <User size={15} />
            <span>{isTr ? 'Giriş Yap' : 'Sign In'}</span>
          </button>
        )}
      </div>

      {/* Quick Delete Workspace Modal */}
      <GrowthDeleteWorkspaceModal
        isOpen={Boolean(deleteTargetWs)}
        onClose={() => setDeleteTargetWs(null)}
        workspace={deleteTargetWs}
        token={token}
        onSuccess={async () => {
          await refreshWorkspaces();
        }}
      />
    </header>
  );
}
