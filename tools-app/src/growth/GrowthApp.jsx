import React, { useEffect } from 'react';
import { GrowthProvider, useGrowth } from './GrowthContext';
import GrowthHeader from './components/GrowthHeader';
import GrowthSidebar from './components/GrowthSidebar';
import GrowthOnboardingModal from './components/GrowthOnboardingModal';
import GrowthOverview from './views/GrowthOverview';
import GrowthActionFeed from './views/GrowthActionFeed';
import GrowthAiVisibility from './views/GrowthAiVisibility';
import GrowthGoogleBusiness from './views/GrowthGoogleBusiness';
import GrowthTechnicalAudit from './views/GrowthTechnicalAudit';
import GrowthSearch from './views/GrowthSearch';
import GrowthAnalytics from './views/GrowthAnalytics';
import GrowthCompetitors from './views/GrowthCompetitors';
import GrowthDirectories from './views/GrowthDirectories';
import GrowthReports from './views/GrowthReports';
import GrowthSettings from './views/GrowthSettings';
import { useAuth } from '../context/AuthContext';
import { GrowthOverviewSkeleton } from './components/GrowthSkeleton';
import GrowthLandingPage from './components/GrowthLandingPage';
import GrowthConnectWebsitePrompt from './components/GrowthConnectWebsitePrompt';
import './GrowthApp.css';

function GrowthInner({ onBackToTools }) {
  const { 
    activeWorkspace, 
    activeTab, 
    setActiveTab, 
    loading: growthLoading, 
    isOnboardingOpen, 
    setIsOnboardingOpen,
    workspaces,
    refreshWorkspaces,
    switchWorkspace
  } = useGrowth();
  const { isAuthenticated, openAuthModal, token, loading: authLoading } = useAuth();

  const VALID_TABS = [
    'overview', 'action-feed', 'search', 'analytics',
    'ai-visibility', 'google-business', 'competitors',
    'technical', 'directories', 'reports', 'settings'
  ];

  // Handle URL hash changes like #/growth/technical or #/growth/myslug/technical
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/growth' || hash === '#/growth/' || hash === '#/growth/landing') {
        if (activeWorkspace?.slug) {
          setActiveTab('overview');
          window.location.hash = `#/growth/${activeWorkspace.slug}/overview`;
        } else {
          setActiveTab('overview');
        }
        return;
      }
      const match = hash.match(/^#\/growth\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/);
      if (match) {
        const target = match[2] || match[1];
        if (target === 'ai-prompts') {
          setActiveTab('ai-visibility');
        } else if (target === 'keywords') {
          setActiveTab('search');
        } else if (target === 'content' || target === 'landing') {
          setActiveTab('overview');
        } else if (match[2] && VALID_TABS.includes(match[2])) {
          setActiveTab(match[2]);
        } else if (match[1] && VALID_TABS.includes(match[1])) {
          setActiveTab(match[1]);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setActiveTab, activeWorkspace]);

  // Ensure active tab is never 'landing' when inside the platform
  useEffect(() => {
    if (activeTab === 'landing' || !VALID_TABS.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, setActiveTab]);

  // Automatically prompt to add website if authenticated user has no website yet
  useEffect(() => {
    if (isAuthenticated && !growthLoading && (!workspaces || workspaces.length === 0)) {
      setIsOnboardingOpen(true);
    }
  }, [isAuthenticated, growthLoading, workspaces?.length, setIsOnboardingOpen]);

  // Handle post-login redirection to Growth Dashboard / Onboarding
  useEffect(() => {
    if (isAuthenticated && !growthLoading) {
      const postAction = sessionStorage.getItem('cerilas_post_login_action');
      if (postAction === 'growth_dashboard') {
        sessionStorage.removeItem('cerilas_post_login_action');
        if (activeWorkspace || (workspaces && workspaces.length > 0)) {
          const ws = activeWorkspace || workspaces[0];
          switchWorkspace(ws, 'overview');
          setActiveTab('overview');
          window.location.hash = ws.slug ? `#/growth/${ws.slug}/overview` : '#/growth/overview';
        } else {
          setIsOnboardingOpen(true);
        }
      }
    }
  }, [isAuthenticated, growthLoading, activeWorkspace, workspaces, switchWorkspace, setActiveTab, setIsOnboardingOpen]);

  // Auto-provision pending scan if user just authenticated with a pending scan from landing
  useEffect(() => {
    if (isAuthenticated && token) {
      try {
        const pending = sessionStorage.getItem('cerilas_pending_growth_scan');
        if (pending) {
          const { scanResult, brandProfile } = JSON.parse(pending);
          if (scanResult && brandProfile) {
            sessionStorage.removeItem('cerilas_pending_growth_scan');
            fetch('/api/growth/workspaces', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: brandProfile.brandName || scanResult.domain,
                url: scanResult.url,
                industry: brandProfile.industry || 'Technology & Digital Services',
                business_model: brandProfile.businessModel || 'B2B',
                description: brandProfile.description || scanResult.meta?.metaDescription || '',
                target_audience: brandProfile.targetAudience || '',
                primary_keywords: brandProfile.primaryKeywords || [],
                competitors: brandProfile.suggestedCompetitors || [],
                initial_scan: scanResult
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data?.data) {
                const ws = data.data.workspace || data.data;
                if (ws?.slug) {
                  refreshWorkspaces(ws.slug);
                  switchWorkspace(ws);
                } else {
                  refreshWorkspaces();
                }
                setActiveTab('overview');
              }
            })
            .catch(e => console.warn('Auto-provision workspace error:', e));
          }
        }
      } catch (e) {}
    }
  }, [isAuthenticated, token, refreshWorkspaces, switchWorkspace, setActiveTab]);

  // Dynamically update document title based on active tab and brand workspace
  useEffect(() => {
    const tabTitles = {
      overview: 'Overview & Authority Score',
      'action-feed': 'Action Feed & Priorities',
      search: 'Search Performance (GSC)',
      analytics: 'Web Analytics (GA4)',
      'ai-visibility': 'AI Visibility Engine (GEO)',
      'google-business': 'Google Business Radar',
      competitors: 'Competitor Intelligence',
      technical: 'Technical SEO & Audit',
      directories: 'Directories & Distribution',
      reports: 'Executive Email Reports',
      settings: 'Workspace & Integrations'
    };
    const currentTabName = tabTitles[activeTab] || 'Dashboard';
    const wsPrefix = (activeWorkspace?.name || activeWorkspace?.primary_domain)
      ? `${activeWorkspace?.name || activeWorkspace?.primary_domain} • `
      : '';
    document.title = `${wsPrefix}${currentTabName} | GrowthControl – Cerilas`;
  }, [activeTab, activeWorkspace]);

  // 1. While auth status is loading (verifying existing session token), display clean skeleton, NEVER landing
  if (authLoading) {
    return <GrowthOverviewSkeleton />;
  }

  // 2. If user is NOT signed in, show the premier landing page with instant domain audit
  if (!isAuthenticated) {
    return (
      <>
        <GrowthLandingPage onBackToTools={onBackToTools} />
        <GrowthOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      </>
    );
  }

  // 3. Authenticated users: ALWAYS open the platform shell, NEVER the sales landing page!
  return (
    <div className="growth-app-shell">
      {/* Top Application Header with Brand Switcher */}
      <GrowthHeader onBackToTools={onBackToTools} />

      <div className="growth-app-body">
        {/* Persistent Left Sidebar */}
        <GrowthSidebar />

        {/* Dynamic Main Workspace Content */}
        <main className="growth-main-viewport">
          {growthLoading ? (
            <GrowthOverviewSkeleton />
          ) : !activeWorkspace && (!workspaces || workspaces.length === 0) ? (
            <GrowthConnectWebsitePrompt />
          ) : (
            <>
              {activeTab === 'overview' && <GrowthOverview />}
              {activeTab === 'action-feed' && <GrowthActionFeed />}
              {activeTab === 'search' && <GrowthSearch />}
              {activeTab === 'analytics' && <GrowthAnalytics />}
              {activeTab === 'ai-visibility' && <GrowthAiVisibility />}
              {activeTab === 'google-business' && <GrowthGoogleBusiness />}
              {activeTab === 'competitors' && <GrowthCompetitors />}
              {activeTab === 'technical' && <GrowthTechnicalAudit />}
              {activeTab === 'directories' && <GrowthDirectories />}
              {activeTab === 'reports' && <GrowthReports />}
              {activeTab === 'settings' && <GrowthSettings />}
            </>
          )}
        </main>
      </div>

      {/* Onboarding Wizard Modal */}
      <GrowthOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}

export default function GrowthApp({ onBackToTools }) {
  return (
    <GrowthProvider>
      <GrowthInner onBackToTools={onBackToTools} />
    </GrowthProvider>
  );
}
