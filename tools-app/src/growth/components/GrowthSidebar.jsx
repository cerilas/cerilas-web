import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Search, 
  BrainCircuit, 
  Radar, 
  ShieldCheck, 
  Network, 
  BarChart3, 
  SlidersHorizontal,
  Layers,
  Activity,
  MapPin,
  Plug,
  Mail
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'overview', label: 'Overview & Score', icon: LayoutDashboard },
      { id: 'action-feed', label: 'Action Feed (Priorities)', icon: ListTodo, badge: 'Priority' }
    ]
  },
  {
    title: 'SEARCH & TRAFFIC',
    items: [
      { id: 'search', label: 'Search Performance (GSC)', icon: Search, requiresSetup: true },
      { id: 'analytics', label: 'Web Analytics (GA4)', icon: Activity, requiresSetup: true }
    ]
  },
  {
    title: 'AI SEARCH (GEO)',
    items: [
      { id: 'ai-visibility', label: 'AI Visibility Engine', icon: BrainCircuit, requiresSetup: true },
      { id: 'google-business', label: 'Google Business Radar', icon: MapPin, requiresSetup: true }
    ]
  },
  {
    title: 'COMPETITORS & MARKET',
    items: [
      { id: 'competitors', label: 'Competitor Intelligence', icon: Radar }
    ]
  },
  {
    title: 'TECHNICAL & DISTRIBUTION',
    items: [
      { id: 'technical', label: 'Site Audit & Issues', icon: ShieldCheck },
      { id: 'directories', label: 'Directories & Distribution', icon: Network }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'reports', label: 'Executive Email Reports', icon: Mail },
      { id: 'settings', label: 'Workspace & Integrations', icon: SlidersHorizontal }
    ]
  }
];

export default function GrowthSidebar() {
  const { activeTab, setActiveTab, activeWorkspace } = useGrowth();
  const { token } = useAuth();

  const [integrations, setIntegrations] = useState({
    gsc: false,
    ga4: false,
    gbp: false
  });
  const [promptsCount, setPromptsCount] = useState(10);

  useEffect(() => {
    if (!activeWorkspace?.id || !token) return;

    fetch(`/api/growth/workspaces/${activeWorkspace.id}/integrations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setIntegrations(prev => ({
            ...prev,
            gsc: Boolean(res.data.gsc?.connected),
            ga4: Boolean(res.data.ga4?.connected)
          }));
        }
      })
      .catch(() => {});

    fetch(`/api/growth/workspaces/${activeWorkspace.id}/google-business`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.connected !== undefined) {
          setIntegrations(prev => ({
            ...prev,
            gbp: Boolean(res.connected)
          }));
        }
      })
      .catch(() => {});

    // Fetch tracked prompts count (needs 10 prompts for complete setup)
    fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (Array.isArray(res.data)) {
          setPromptsCount(res.data.length);
        }
      })
      .catch(() => {});
  }, [activeWorkspace?.id, token, activeTab]);

  // Reactive listener for prompt updates from any view
  useEffect(() => {
    const handlePromptsUpdated = (e) => {
      if (typeof e.detail?.count === 'number') {
        setPromptsCount(e.detail.count);
      } else if (activeWorkspace?.id && token) {
        fetch(`/api/growth/workspaces/${activeWorkspace.id}/prompts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(res => {
            if (Array.isArray(res.data)) setPromptsCount(res.data.length);
          })
          .catch(() => {});
      }
    };
    window.addEventListener('growth:prompts-updated', handlePromptsUpdated);
    return () => window.removeEventListener('growth:prompts-updated', handlePromptsUpdated);
  }, [activeWorkspace?.id, token]);

  const isSetupNeeded = (itemId) => {
    if (itemId === 'search') return !integrations.gsc;
    if (itemId === 'analytics') return !integrations.ga4;
    if (itemId === 'google-business') return !integrations.gbp;
    if (itemId === 'ai-visibility') return promptsCount < 10;
    return false;
  };

  return (
    <aside className="growth-app-sidebar">
      {/* Platform Branding Mini */}
      <div className="growth-sidebar-brand-box">
        <div className="growth-logo-glow-wrap">
          <Layers size={17} strokeWidth={2} />
        </div>
        <div className="growth-brand-titles">
          <span className="growth-app-title">Cerilas Growth</span>
          <span className="growth-app-tag">AI Intelligence v1.0</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="growth-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="growth-nav-group">
            <span className="growth-group-title">{group.title}</span>
            <div className="growth-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const needsSetup = item.requiresSetup && isSetupNeeded(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`growth-nav-item ${isActive ? 'is-active' : ''} ${needsSetup ? 'requires-setup' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (activeWorkspace) {
                        window.location.hash = `#/growth/${activeWorkspace.slug}/${item.id}`;
                      }
                    }}
                  >
                    <Icon size={16} strokeWidth={1.8} className="growth-nav-icon" />
                    <span className="growth-nav-label">{item.label}</span>
                    {needsSetup ? (
                      <span className="growth-nav-setup-tag" title="Setup / Connection Action Required">
                        <Plug size={11} strokeWidth={2.2} />
                        <span>Setup</span>
                      </span>
                    ) : (
                      <>
                        {item.badge && <span className="growth-nav-badge">{item.badge}</span>}
                        {item.isNew && <span className="growth-nav-new-badge">GEO</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer (Active workspace status card) */}
      {activeWorkspace && (
        <div className="growth-sidebar-footer">
          <div className="growth-footer-score-pill">
            <div className="growth-footer-dot" />
            <span>Score: {activeWorkspace.growth_score || 72}/100</span>
          </div>
          <span className="growth-footer-domain">{activeWorkspace.primary_domain}</span>
        </div>
      )}
    </aside>
  );
}
