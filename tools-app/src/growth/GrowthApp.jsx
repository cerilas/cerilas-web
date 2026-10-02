import React, { useEffect } from 'react';
import { GrowthProvider, useGrowth } from './GrowthContext';
import GrowthHeader from './components/GrowthHeader';
import GrowthSidebar from './components/GrowthSidebar';
import GrowthOnboardingModal from './components/GrowthOnboardingModal';
import GrowthOverview from './views/GrowthOverview';
import GrowthActionFeed from './views/GrowthActionFeed';
import GrowthAiVisibility from './views/GrowthAiVisibility';
import GrowthAiPrompts from './views/GrowthAiPrompts';
import GrowthGoogleBusiness from './views/GrowthGoogleBusiness';
import GrowthTechnicalAudit from './views/GrowthTechnicalAudit';
import GrowthSearch from './views/GrowthSearch';
import GrowthAnalytics from './views/GrowthAnalytics';
import GrowthKeywords from './views/GrowthKeywords';
import GrowthCompetitors from './views/GrowthCompetitors';
import GrowthContent from './views/GrowthContent';
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

  // Handle URL hash changes like #/growth/myslug/ai-visibility
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/growth\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/);
      if (match) {
        if (match[2]) {
          setActiveTab(match[2]);
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
                refreshWorkspaces(data.data.slug);
                switchWorkspace(data.data);
                setActiveTab('overview');
              }
            })
            .catch(e => console.warn('Auto-provision workspace error:', e));
          }
        }
      } catch (e) {}
    }
  }, [isAuthenticated, token, refreshWorkspaces, switchWorkspace, setActiveTab]);

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
              {activeTab === 'keywords' && <GrowthKeywords />}
              {activeTab === 'ai-visibility' && <GrowthAiVisibility />}
              {activeTab === 'ai-prompts' && <GrowthAiPrompts />}
              {activeTab === 'google-business' && <GrowthGoogleBusiness />}
              {activeTab === 'competitors' && <GrowthCompetitors />}
              {activeTab === 'technical' && <GrowthTechnicalAudit />}
              {activeTab === 'content' && <GrowthContent />}
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
