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
  Globe
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

export default function GrowthHeader({ onBackToTools }) {
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    setIsOnboardingOpen 
  } = useGrowth();
  const { user } = useAuth();

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
          title="Cerilas Araçlar Ana Sayfasına Dön"
        >
          <ArrowLeft size={16} />
          <span>Araçlara Dön</span>
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
              {activeWorkspace?.favicon_url ? (
                <img src={activeWorkspace.favicon_url} alt="" className="growth-ws-fav" />
              ) : (
                <div className="growth-ws-fallback-icon">
                  <Globe size={14} />
                </div>
              )}
              <div className="growth-ws-titles">
                <span className="growth-ws-title">{activeWorkspace?.name || 'Marka Seçin'}</span>
                <span className="growth-ws-sub">{activeWorkspace?.primary_domain || 'Çalışma alanı'}</span>
              </div>
            </div>
            <ChevronDown size={14} className={`growth-ws-chevron ${isDropdownOpen ? 'is-open' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="growth-ws-dropdown animate-fade">
              <div className="growth-ws-dropdown-header">
                <span>Kayıtlı Markalar ({workspaces.length})</span>
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
                        {ws.favicon_url ? (
                          <img src={ws.favicon_url} alt="" className="growth-ws-item-fav" />
                        ) : (
                          <div className="growth-ws-item-icon">
                            <Building2 size={13} />
                          </div>
                        )}
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
                  <span>Yeni Marka / Web Sitesi Ekle</span>
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
          <span>Son 28 Gün</span>
        </div>

        {/* User Avatar */}
        <div className="growth-header-user">
          <span className="growth-user-name">{user?.first_name || user?.name || 'Üye'}</span>
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
