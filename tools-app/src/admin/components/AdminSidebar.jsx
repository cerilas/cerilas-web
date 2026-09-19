import React from 'react';
import { 
  Box, 
  LayoutDashboard, 
  TrendingUp, 
  Cpu, 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  Globe,
  X
} from 'lucide-react';

export default function AdminSidebar({ 
  currentTab, 
  onSelectTab, 
  isOpen, 
  onClose,
  totalToolsCount = 30,
  activeToolsCount = 30
}) {
  const navItems = [
    {
      id: 'tools',
      label: 'Tools',
      icon: Box,
      badge: totalToolsCount
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'analytics',
      label: 'Analytics & Events',
      icon: TrendingUp
    },
    {
      id: 'system',
      label: 'System Health',
      icon: Cpu
    }
  ];

  const handleNavClick = (id) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand-wrapper">
          <a href="/admin" className="admin-sidebar-brand" onClick={(e) => { e.preventDefault(); handleNavClick('tools'); }}>
            <img 
              src="/platform-logo.webp" 
              alt="Cerilas" 
              className="admin-brand-icon"
              onError={(e) => {
                if (!e.target.dataset.triedPng) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = '/platform-logo.png';
                }
              }}
            />
            <div className="admin-brand-info">
              <span className="admin-brand-title">Cerilas Tools</span>
              <span className="admin-brand-badge">Admin Suite</span>
            </div>
          </a>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="admin-sidebar-scroll">
          {/* Navigation Menu (Tools #1) */}
          <nav className="admin-nav">
            <span className="admin-nav-section-title">Navigation</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <div className="admin-nav-btn-content">
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="admin-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Funding & Matcher Tool Section */}
          <nav className="admin-nav" style={{ marginTop: '1.25rem' }}>
            <span className="admin-nav-section-title">Funding & Matcher Tool</span>
            <button
              type="button"
              className={`admin-nav-btn ${currentTab === 'scrapers' ? 'active' : ''}`}
              onClick={() => handleNavClick('scrapers')}
            >
              <div className="admin-nav-btn-content">
                <Globe size={18} strokeWidth={currentTab === 'scrapers' ? 2.2 : 1.75} />
                <span>Scrappers</span>
              </div>
              <span className="admin-nav-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 600 }}>
                Live
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          {/* Quick Platform Status */}
          <div style={{
            background: 'rgba(150, 150, 150, 0.05)',
            borderRadius: 12,
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--card-border, rgba(0,0,0,0.06))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <Zap size={13} color="#eab308" />
              <span>Active Services</span>
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#10b981' }}>
              {activeToolsCount}/{totalToolsCount}
            </span>
          </div>

          {/* Return to Public Website */}
          <button 
            type="button" 
            className="admin-back-btn"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <ArrowLeft size={15} />
            <span>Public Catalog</span>
          </button>
        </div>
      </aside>
    </>
  );
}
