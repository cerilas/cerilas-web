import React, { useState } from 'react';
import { 
  Globe, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  TrendingUp, 
  Plus, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { useGrowth } from '../GrowthContext';
import './GrowthConnectWebsitePrompt.css';

export default function GrowthConnectWebsitePrompt() {
  const { setIsOnboardingOpen } = useGrowth();
  const [domainInput, setDomainInput] = useState('');

  const handleLaunchWithDomain = (e) => {
    e.preventDefault();
    const clean = domainInput.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (clean) {
      try {
        sessionStorage.setItem('cerilas_onboarding_domain', clean);
      } catch (err) {}
    }
    setIsOnboardingOpen(true);
  };

  return (
    <div className="growth-empty-setup-container">
      <div className="growth-empty-setup-card">
        {/* Glow ambient background */}
        <div className="growth-empty-glow" />

        {/* Top Eyebrow Badge */}
        <div className="growth-empty-badge">
          <Sparkles size={14} className="text-amber" />
          <span>Generative Engine Optimization (GEO) & Search Intelligence</span>
        </div>

        {/* Hero Title */}
        <div className="growth-empty-hero-icon-wrap">
          <div className="growth-empty-hero-icon">
            <Globe size={36} color="#6366f1" />
          </div>
        </div>

        <h1 className="growth-empty-title">
          Connect Your First Website
        </h1>

        <p className="growth-empty-subtitle">
          Add your domain to initialize AI Search Visibility (GEO), ChatGPT and Perplexity citation tracking, robots.txt crawler directives, and organic search performance.
        </p>

        {/* Quick Launch Action Form */}
        <form onSubmit={handleLaunchWithDomain} className="growth-empty-form">
          <div className="growth-empty-input-group">
            <span className="growth-empty-protocol">https://</span>
            <input
              type="text"
              className="growth-empty-input"
              placeholder="yourbrand.com"
              value={domainInput.replace(/^https?:\/\//i, '')}
              onChange={(e) => setDomainInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="growth-empty-submit-btn"
            >
              <span>Add Website</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div className="growth-empty-or-divider">
          <span>or launch full onboarding setup wizard</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOnboardingOpen(true)}
          className="growth-empty-secondary-btn"
        >
          <Plus size={16} />
          <span>Open Website Setup Wizard</span>
        </button>

        {/* Highlight Feature Badges */}
        <div className="growth-empty-highlights-grid">
          <div className="growth-empty-highlight-card">
            <div className="growth-empty-hl-icon">
              <Bot size={18} color="#10b981" />
            </div>
            <div className="growth-empty-hl-info">
              <h4>AI Search (GEO) Visibility</h4>
              <p>Audit whether live AI models recommend your product facts.</p>
            </div>
          </div>

          <div className="growth-empty-highlight-card">
            <div className="growth-empty-hl-icon">
              <ShieldCheck size={18} color="#38bdf8" />
            </div>
            <div className="growth-empty-hl-info">
              <h4>Crawler & LLM Directives</h4>
              <p>Audit GPTBot, ClaudeBot permissions and validate llms.txt standard.</p>
            </div>
          </div>

          <div className="growth-empty-highlight-card">
            <div className="growth-empty-hl-icon">
              <TrendingUp size={18} color="#a855f7" />
            </div>
            <div className="growth-empty-hl-info">
              <h4>Growth Action Feed</h4>
              <p>Prioritized weekly tactical organic checklist to outrank competitors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
