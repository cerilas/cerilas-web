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
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { GrowthOverviewSkeleton } from './components/GrowthSkeleton';
import GrowthLandingPage from './components/GrowthLandingPage';
import './GrowthApp.css';

function GrowthInner({ onBackToTools }) {
  const { 
    activeWorkspace, 
    activeTab, 
    setActiveTab, 
    loading, 
    isOnboardingOpen, 
    setIsOnboardingOpen,
    workspaces,
    refreshWorkspaces,
    switchWorkspace
  } = useGrowth();
  const { isAuthenticated, openAuthModal, token } = useAuth();

  // Handle URL hash changes like #/growth/technical or #/growth/myslug/technical
  useEffect(() => {
    const VALID_TABS = [
      'overview', 'landing', 'action-feed', 'search', 'analytics',
      'ai-visibility', 'google-business', 'competitors',
      'technical', 'directories', 'reports', 'settings'
    ];

    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/growth\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/);
      if (match) {
        const target = match[2] || match[1];
        if (target === 'ai-prompts') {
          setActiveTab('ai-visibility');
        } else if (target === 'keywords') {
          setActiveTab('search');
        } else if (target === 'content') {
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
  }, [setActiveTab]);

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
      landing: 'AI Search Visibility & GEO Audit',
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

  // If user is not signed in, show the premier landing page with instant domain audit
  if (!isAuthenticated) {
    return <GrowthLandingPage onBackToTools={onBackToTools} />;
  }

  // If user is signed in, but has no workspace yet and isn't loading, show the landing page so they can immediately audit & add their first domain
  if (!loading && !activeWorkspace && (!workspaces || workspaces.length === 0)) {
    return <GrowthLandingPage onBackToTools={onBackToTools} />;
  }

  return (
    <div className="growth-app-shell">
      {/* Top Application Header with Brand Switcher */}
      <GrowthHeader onBackToTools={onBackToTools} />

      <div className="growth-app-body">
        {/* Persistent Left Sidebar */}
        <GrowthSidebar />

        {/* Dynamic Main Workspace Content */}
        <main className="growth-main-viewport">
          {loading && !activeWorkspace ? (
            <GrowthOverviewSkeleton />
          ) : (
            <>
              {activeTab === 'landing' && <GrowthLandingPage onBackToTools={onBackToTools} />}
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
