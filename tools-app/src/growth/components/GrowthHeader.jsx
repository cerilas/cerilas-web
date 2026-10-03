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
  Moon
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GrowthFavicon from './GrowthFavicon';

export default function GrowthHeader({ onBackToTools }) {
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    setIsOnboardingOpen 
  } = useGrowth();
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
                        <div>
                          <span className="growth-ws-item-name">{ws.name}</span>
                          <span className="growth-ws-item-domain">{ws.primary_domain}</span>
                        </div>
                      </div>

                      <div className="growth-ws-item-right">
                        <span className="growth-score-tag">{ws.growth_score || 70}</span>
                        {isSelected && <Check size={14} className="text-primary" />}
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

        {/* User Avatar */}
        <div className="growth-header-user">
          <span className="growth-user-name">{user?.first_name || user?.name || 'Member'}</span>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user?.name} className="growth-user-avatar" />
          ) : (
            <div className="growth-user-fallback">
              {(user?.first_name?.[0] || user?.email?.[0] || 'C').toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
