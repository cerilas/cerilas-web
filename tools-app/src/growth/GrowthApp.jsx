import React, { useEffect } from 'react';
import { GrowthProvider, useGrowth } from './GrowthContext';
import GrowthHeader from './components/GrowthHeader';
import GrowthSidebar from './components/GrowthSidebar';
import GrowthOnboardingModal from './components/GrowthOnboardingModal';
import GrowthOverview from './views/GrowthOverview';
import GrowthActionFeed from './views/GrowthActionFeed';
import GrowthAiVisibility from './views/GrowthAiVisibility';
import GrowthAiPrompts from './views/GrowthAiPrompts';
import GrowthTechnicalAudit from './views/GrowthTechnicalAudit';
import GrowthSearch from './views/GrowthSearch';
import GrowthKeywords from './views/GrowthKeywords';
import GrowthCompetitors from './views/GrowthCompetitors';
import GrowthContent from './views/GrowthContent';
import GrowthDirectories from './views/GrowthDirectories';
import GrowthReports from './views/GrowthReports';
import GrowthSettings from './views/GrowthSettings';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { GrowthOverviewSkeleton } from './components/GrowthSkeleton';
import './GrowthApp.css';

function GrowthInner({ onBackToTools }) {
  const { 
    activeWorkspace, 
    activeTab, 
    setActiveTab, 
    loading, 
    isOnboardingOpen, 
    setIsOnboardingOpen,
    workspaces
  } = useGrowth();
  const { isAuthenticated, openAuthModal } = useAuth();

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

  // If user is not signed in
  if (!isAuthenticated) {
    return (
      <div className="growth-guest-gate-page">
        <div className="growth-guest-content animate-fade">
          <div className="growth-guest-badge">
            <Sparkles size={14} className="text-primary" />
            <span>Cerilas Growth • Premium Intelligence</span>
          </div>

          <h1 className="growth-guest-title">
            Yapay Zeka Destekli Büyüme & Arama İstihbaratı
          </h1>

          <p className="growth-guest-desc">
            Markanızın Google ve ChatGPT/Perplexity/Gemini (GEO) aramalarındaki görünürlüğünü takip edin, teknik hataları düzeltin ve öncelikli aksiyonlarla organik trafiğinizi katlayın.
          </p>

          <div className="growth-guest-features">
            <div className="guest-feat-card">
              <h4>Aksiyon Haritası (Action Feed)</h4>
              <p>Rastgele grafikler yerine önceliklendirilmiş somut büyüme fırsatları.</p>
            </div>
            <div className="guest-feat-card">
              <h4>Yapay Zeka (GEO) Takibi</h4>
              <p>LLM modellerinin markanızı nasıl yanıtladığını ve alıntıladığını izleyin.</p>
            </div>
            <div className="guest-feat-card">
              <h4>Çoklu Marka & Çalışma Alanı</h4>
              <p>Tüm web sitelerinizi tek merkezden bağımsız marka panelleriyle yönetin.</p>
            </div>
          </div>

          <div className="growth-guest-cta-row">
            <button
              type="button"
              className="growth-primary-btn btn-lg"
              onClick={() => openAuthModal('register')}
            >
              <span>Ücretsiz Deneyin & Sitenizi Ekleyin</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="growth-secondary-btn btn-lg"
              onClick={() => openAuthModal('login')}
            >
              <span>Giriş Yap</span>
            </button>
          </div>

          <button
            type="button"
            className="growth-guest-back-link"
            onClick={onBackToTools || (() => { window.location.hash = '#/'; })}
          >
            <ArrowLeft size={14} style={{ marginRight: '6px' }} />
            <span>Cerilas Ücretsiz Araçlara Dön</span>
          </button>
        </div>
      </div>
    );
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
          ) : !activeWorkspace ? (
            <div className="growth-no-workspace-view">
              <Sparkles size={40} className="text-primary" />
              <h2>Henüz Bir Marka Eklenmedi</h2>
              <p>Sitenizin arama performansını ve AI görünürlüğünü takip etmek için ilk web sitenizi ekleyin.</p>
              <button
                type="button"
                className="growth-primary-btn"
                onClick={() => setIsOnboardingOpen(true)}
              >
                <span>İlk Markanızı Ekleyin</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <GrowthOverview />}
              {activeTab === 'action-feed' && <GrowthActionFeed />}
              {activeTab === 'search' && <GrowthSearch />}
              {activeTab === 'keywords' && <GrowthKeywords />}
              {activeTab === 'ai-visibility' && <GrowthAiVisibility />}
              {activeTab === 'ai-prompts' && <GrowthAiPrompts />}
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
