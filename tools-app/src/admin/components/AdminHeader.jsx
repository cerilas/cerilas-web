import React from 'react';
import { Menu, Sun, Moon, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AdminHeader({ 
  currentTab, 
  onToggleSidebar, 
  liveVisitors = 1 
}) {
  const { isDark, toggleTheme } = useTheme();

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'tools':
        return 'Tools Management';
      case 'overview':
        return 'Executive Overview';
      case 'analytics':
        return 'Analytics & Conversions';
      case 'system':
        return 'System & API Health';
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
            <span style={{ color: 'var(--text-main)', fontWeight: 500, textTransform: 'capitalize' }}>
              {currentTab}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Real-time 30-min Live Visitors Badge */}
        <div className="admin-live-badge" title="Active users on Cerilas Tools within the last 30 minutes">
          <span className="admin-pulse-dot" />
          <span>{Number(liveVisitors || 1).toLocaleString()} Live Visitors</span>
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
          className="admin-action-btn primary"
          title="Open Public User Catalog"
          style={{ padding: '0.45rem 0.85rem' }}
        >
          <span>Live Site</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </header>
  );
}
