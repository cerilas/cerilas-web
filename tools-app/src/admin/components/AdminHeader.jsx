import React from 'react';
import { Menu, Sun, Moon, ExternalLink, ArrowRight, ShieldCheck, User, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AdminHeader({ 
  currentTab, 
  onToggleSidebar, 
  liveVisitors = 1,
  selectedToolTitle = null,
  onBackToTools = null,
  authUser = null,
  onLogout = null
}) {
  const { isDark, toggleTheme } = useTheme();

  const getSectionTitle = () => {
    if (selectedToolTitle) {
      return selectedToolTitle;
    }
    switch (currentTab) {
      case 'tools':
        return 'Tools Management';
      case 'overview':
        return 'Executive Overview';
      case 'analytics':
        return 'Analytics & Conversions';
      case 'system':
        return 'System & API Health';
      case 'scrapers':
        return 'Funding & Matcher Scrappers';
      default:
        return 'Admin Suite';
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button 
          type="button" 
          className="admin-menu-toggle" 
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div className="admin-header-title-wrap">
          <h2>{getSectionTitle()}</h2>
          <div className="admin-header-breadcrumbs">
            <span>Admin</span>
            <span>/</span>
            {selectedToolTitle ? (
              <>
                <button 
                  type="button"
                  onClick={onBackToTools}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'inherit', 
                    cursor: 'pointer', 
                    font: 'inherit',
                    textDecoration: 'underline'
                  }}
                >
                  Tools
                </button>
                <span>/</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {selectedToolTitle}
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--text-main)', fontWeight: 500, textTransform: 'capitalize' }}>
                {currentTab}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Real-time 30-min Live Visitors Badge */}
        <div className="admin-live-badge" title="Active users on Cerilas Tools within the last 30 minutes">
          <span className="admin-pulse-dot" />
          <span className="admin-live-text">{Number(liveVisitors || 1).toLocaleString()} Live Visitors</span>
          <span className="admin-live-text-mobile">{Number(liveVisitors || 1).toLocaleString()}</span>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          className="admin-theme-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Public Catalog Link */}
        <a 
          href="/" 
          className="admin-action-btn primary admin-live-site-btn"
          title="Open Public User Catalog"
        >
          <span className="admin-live-site-text">Live Site</span>
          <ExternalLink size={13} />
        </a>

        {/* Authenticated Admin Profile & Logout */}
        {authUser && (
          <div className="admin-user-profile-badge" title={`Oturum: ${authUser.email}`}>
            <div className="admin-user-avatar">
              <User size={13} />
            </div>
            <span className="admin-user-email">{authUser.email}</span>
            {onLogout && (
              <button
                type="button"
                className="admin-user-logout-btn"
                onClick={onLogout}
                title="Güvenli Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut size={13} />
                <span className="admin-logout-text">Çıkış</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
