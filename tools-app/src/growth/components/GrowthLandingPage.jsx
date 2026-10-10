import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
  Layers,
  RefreshCw,
  Star,
  Clock,
  Lock,
  ArrowUpRight,
  Cpu,
  Compass,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  PanelLeft,
  Send,
  Users,
  Paperclip,
  Link2,
  ExternalLink,
  Sliders,
  SlidersHorizontal,
  Bot,
  Database,
  Code2,
  Terminal,
  Share2,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGrowth } from '../GrowthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRevenueCat } from '../../context/RevenueCatContext';
import CloudCanvas from './CloudCanvas';
import './GrowthLandingPage.css';

const QUICK_TEST_DOMAINS = [
  'linear.app',
  'supabase.com',
  'posthog.com',
  'cerilas.com',
  'stripe.com'
];

const SCAN_STEPS = [
  { id: 'dns', label: 'Checking DNS, SSL & Server Response Time' },
  { id: 'crawlers', label: 'Verifying AI Crawler Permissions (GPTBot, Perplexity, Claude)' },
  { id: 'meta', label: 'Scanning Meta Tags, Schema.org & llms.txt Presence' },
  { id: 'intel', label: 'AI Brand Positioning & Competitor Citation Intelligence' }
];

// 24 Floating 3D Tiles for Multi-Model & Crawler Grounding Grid
const FORMATS_TILES = [
  { ext: 'ChatGPT', label: 'OpenAI GPT-4o', icon: Sparkles, tint: 'cl-tint-sky' },
  { ext: 'Perplexity', label: 'Sonar Live Search', icon: Globe, tint: 'cl-tint-cyan' },
  { ext: 'Claude', label: 'Anthropic Claude 3.7', icon: Bot, tint: 'cl-tint-stone' },
  { ext: 'Gemini', label: 'Google AI Overviews', icon: Cpu, tint: 'cl-tint-peach' },
  { ext: 'Copilot', label: 'Microsoft Bing AI', icon: Zap, tint: 'cl-tint-orange' },
  { ext: 'GSC API', label: 'Search Console Sync', icon: BarChart3, tint: 'cl-tint-sky' },
  { ext: 'DeepSeek', label: 'Reasoning R1 Models', icon: Terminal, tint: 'cl-tint-orange' },
  { ext: 'Mistral', label: 'Le Chat Search', icon: Compass, tint: 'cl-tint-rose' },
  { ext: 'Llama 3', label: 'Meta AI Assistant', icon: Share2, tint: 'cl-tint-rose' },
  { ext: 'Apple AI', label: 'Siri & Spotlight Search', icon: Award, tint: 'cl-tint-sand' },
  { ext: 'llms.txt', label: 'LLM Context Standard', icon: FileText, tint: 'cl-tint-mint' },
  { ext: 'JSON-LD', label: 'Schema.org Structured Data', icon: Code2, tint: 'cl-tint-mint' },
  { ext: 'robots.txt', label: 'Bot Crawl Directives', icon: Lock, tint: 'cl-tint-stone' },
  { ext: 'GPTBot', label: 'OpenAI Web Crawler', icon: Bot, tint: 'cl-tint-cyan' },
  { ext: 'ClaudeBot', label: 'Anthropic Web Crawler', icon: Database, tint: 'cl-tint-sand' },
  { ext: 'PerplexityBot', label: 'Real-time Indexer', icon: Globe, tint: 'cl-tint-peach' },
  { ext: 'Sitemap', label: 'XML Entity Index', icon: Layers, tint: 'cl-tint-sky' },
  { ext: 'OpenGraph', label: 'Entity Metadata Graph', icon: Activity, tint: 'cl-tint-stone' },
  { ext: 'Citations', label: 'Source Verification', icon: Link2, tint: 'cl-tint-rose' },
  { ext: 'Knowledge', label: 'Brand Knowledge Graph', icon: Database, tint: 'cl-tint-mint' },
  { ext: 'Voice Share', label: 'AI Recommendation %', icon: TrendingUp, tint: 'cl-tint-sand' },
  { ext: 'Markdown', label: 'Clean LLM Scrape', icon: FileText, tint: 'cl-tint-cyan' },
  { ext: 'REST API', label: 'Automated Webhooks', icon: SlidersHorizontal, tint: 'cl-tint-orange' },
  { ext: 'GA4 Sync', label: 'Organic Traffic Impact', icon: BarChart3, tint: 'cl-tint-peach' }
];

const TESTIMONIALS_DATA = [
  {
    quote: "We increased our ChatGPT source citations by 340% in 45 days after fixing the crawler permissions and structured Schema issues GrowthControl flagged.",
    name: "Alexandre Moreau",
    role: "Head of Organic Growth, FinTech SaaS",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&q=80&auto=format&fit=crop"
  },
  {
    quote: "Connecting Google Search Console with real-time AI visibility showed us our highest revenue queries were being answered by Gemini without citing our URL. GrowthControl gave us the playbook to win it back.",
    name: "Sarah Jenkins",
    role: "VP Marketing, Cloud Infrastructure",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&q=80&auto=format&fit=crop"
  },
  {
    quote: "Traditional SEO tools are completely blind to generative search. GrowthControl is our team's daily command center for the post-search era.",
    name: "Marcus Vance",
    role: "Founder & CMO, NextGen AI Studio",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&q=80&auto=format&fit=crop"
  }
];

const FAQS_DATA = [
  {
    q: 'What is Generative Engine Optimization (GEO) and why does it matter?',
    a: 'GEO is optimization designed to ensure your brand is cited, referenced as an authority, and linked directly in AI search engines like ChatGPT, Perplexity, Claude, and Gemini. While traditional SEO targeted 10 blue links, GEO ensures AI models understand your product facts and recommend you to high-intent searchers.'
  },
  {
    q: 'How does GrowthControl audit AI search engines?',
    a: 'We probe live AI models with real-world buyer prompts, analyze whether your brand is cited or recommended, scrape citation URLs in real time, benchmark against your competitors, and cross-reference permissions in your robots.txt and llms.txt files.'
  },
  {
    q: 'Is connecting Google Search Console safe?',
    a: 'Yes, 100%. GrowthControl uses Google OAuth with strict read-only permissions. Your search data is encrypted at rest and never shared with third parties or used for AI model training.'
  },
  {
    q: 'What is llms.txt and how do you help?',
    a: 'llms.txt is a new markdown-standard file placed on your domain to provide AI bots with clean, structured summaries of your site. GrowthControl audits whether you have one and generates optimized llms.txt code for your brand.'
  },
  {
    q: 'Can I manage multiple client domains or agency portfolios?',
    a: 'Yes! GrowthControl supports multiple workspace brands. You can seamlessly switch between client domains, generate white-labeled client reports, and assign team seats.'
  },
  {
    q: 'What happens after running the free domain audit?',
    a: 'You can immediately review your AI crawler permissions, technical health, and positioning. With one click, you can create a free account to monitor your domain weekly, track 50+ prompts, and receive prioritized action items.'
  }
];

// Helper Section Framing Rail with Guide Lines
function Rail({ children, id, className = '', innerClassName = '', divider = false, fadeTop = false, fadeBottom = false, 'aria-labelledby': ariaLabelledBy }) {
  return (
    <section id={id} aria-labelledby={ariaLabelledBy} className={`cl-rail-section ${divider ? 'with-divider' : ''} ${className}`}>
      <div className="cl-rail-container">
        <div className={`cl-rail-relative ${innerClassName}`}>
          <span aria-hidden="true" className={`cl-rail-line left ${fadeTop ? 'fade-top' : ''} ${fadeBottom ? 'fade-bottom' : ''}`} />
          <span aria-hidden="true" className={`cl-rail-line right ${fadeTop ? 'fade-top' : ''} ${fadeBottom ? 'fade-bottom' : ''}`} />
          {children}
        </div>
      </div>
    </section>
  );
}

// Section Heading Helper
function SectionHeading({ id, eyebrow, eyebrowHref, title, description, align = 'center', className = '' }) {
  return (
    <div className={`cl-section-heading ${align === 'center' ? 'center' : ''} ${className}`}>
      {eyebrow && (
        <a href={eyebrowHref || '#'} className="cl-eyebrow">
          <span>{eyebrow}</span>
          <ChevronRight size={14} />
        </a>
      )}
      <h2 id={id} className="cl-h2-title">{title}</h2>
      {description && <p className="cl-h2-desc">{description}</p>}
    </div>
  );
}

// 3D Perspective Tilting Grid Component
function Formats3DGrid() {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0.5, y: 0.5, active: false });
  const [cols, setCols] = useState(8);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setCols(4);
      else if (window.innerWidth < 960) setCols(6);
      else setCols(8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalRows = Math.ceil(FORMATS_TILES.length / cols);

  const handlePointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCoords({ x: nx, y: ny, active: true });
  };

  const handlePointerLeave = () => {
    setCoords({ x: 0.5, y: 0.5, active: false });
  };

  const rotateX = coords.active ? 42 - (coords.y - 0.5) * 8 : 42;
  const rotateY = coords.active ? (coords.x - 0.5) * 10 : 0;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="cl-formats-perspective-container"
    >
      <ul
        className="cl-formats-grid"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        }}
        aria-label="Supported AI Engines, Crawlers and GEO Signals"
      >
        {FORMATS_TILES.map((tile, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cx = (col + 0.5) / cols;
          const cy = (row + 0.5) / totalRows;

          const dist = Math.hypot((coords.x - cx) * 1.6, coords.y - cy);
          const c = coords.active ? Math.max(0, 1 - dist / 0.35) : 0;
          const z = 44 * c;
          const scale = 1 + 0.08 * c;
          const shadowElev = 8 + 22 * c;

          const IconComponent = tile.icon;

          return (
            <li
              key={tile.ext + idx}
              className={`cl-format-tile ${tile.tint}`}
              style={{
                transform: `translateZ(${z}px) scale(${scale})`,
                boxShadow: `0 ${shadowElev}px ${24 + 30 * c}px -14px rgba(16, 42, 67, ${0.18 + 0.2 * c})`
              }}
              title={tile.label}
            >
              <IconComponent size={22} strokeWidth={2} />
              <span className="cl-tile-ext">{tile.ext}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function GrowthLandingPage({ onBackToTools, initialDomain = '' }) {
  const { isAuthenticated, openAuthModal, token } = useAuth();
  const { setActiveTab } = useGrowth();
  const { toggleTheme, isDark } = useTheme();
  const { isPro, isUnlimited, presentPaywall, openCustomerCenter } = useRevenueCat() || {};

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Audit Form & Scan State
  const [inputUrl, setInputUrl] = useState(initialDomain);
  const [scanning, setScanning] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [error, setError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // Capabilities Active Tab
  const [activeCapabilityTab, setActiveCapabilityTab] = useState(0);

  // Pricing Toggle (false: monthly, true: yearly)
  const [isYearly, setIsYearly] = useState(true);

  // Testimonial Active Slide
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  // FAQ Accordion State
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  // Testimonial auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonialIdx(prev => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  // Restore pending scan from session if present
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cerilas_pending_growth_scan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scanResult && parsed.brandProfile) {
          setScanResult(parsed.scanResult);
          setBrandProfile(parsed.brandProfile);
          setInputUrl(parsed.scanResult.url || parsed.scanResult.domain || '');
        }
      }
    } catch {}
  }, []);

  const handleStartScan = async (targetDomain) => {
    const raw = (targetDomain || inputUrl || '').trim();
    if (!raw) {
      setError('Please enter a website domain to audit.');
      inputRef.current?.focus();
      return;
    }

    let urlToScan = raw;
    if (!urlToScan.startsWith('http://') && !urlToScan.startsWith('https://')) {
      urlToScan = 'https://' + urlToScan;
    }

    setError('');
    setScanning(true);
    setActiveStepIdx(0);
    setScanResult(null);
    setBrandProfile(null);
    setSaveSuccessMsg('');

    const stepInterval = setInterval(() => {
      setActiveStepIdx(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 850);

    try {
      const res = await fetch('/api/growth/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: urlToScan })
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error(data.error || 'An error occurred while auditing domain.');
      }

      setScanResult(data.data.scan);
      setBrandProfile(data.data.brand);
      setActiveStepIdx(SCAN_STEPS.length - 1);

      try {
        sessionStorage.setItem('cerilas_pending_growth_scan', JSON.stringify({
          scanResult: data.data.scan,
          brandProfile: data.data.brand
        }));
      } catch {}

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Audit could not be completed. Please check your domain.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!scanResult || !brandProfile) return;

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('cerilas_pending_growth_scan', JSON.stringify({
          scanResult,
          brandProfile
        }));
      } catch {}
      openAuthModal('register');
      return;
    }

    setIsSavingWorkspace(true);
    setError('');

    try {
      const payload = {
        name: brandProfile.brandName || scanResult.domain,
        url: scanResult.url,
        industry: brandProfile.industry || 'Technology & Digital Services',
        business_model: brandProfile.businessModel || 'B2B',
        description: brandProfile.description || scanResult.meta?.metaDescription || '',
        target_audience: brandProfile.targetAudience || '',
        primary_keywords: brandProfile.primaryKeywords || [],
        competitors: brandProfile.suggestedCompetitors || [],
        initial_scan: scanResult
      };

      const res = await fetch('/api/growth/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save brand to workspace.');
      }

      setSaveSuccessMsg('Brand workspace initialized successfully! Redirecting...');
      setTimeout(() => {
        setActiveTab('overview');
      }, 700);
    } catch (e) {
      setError(e.message || 'Error creating workspace.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  return (
    <div className="cl-landing-root">
      {/* ==========================================================================
          1. HERO SECTION (ISOLATED 24PX ROUNDED BOX)
          ========================================================================== */}
      <section id="hero" aria-label="Hero" className="cl-hero">
        <div className="cl-hero-fallback-bg" />
        <CloudCanvas isDark={isDark} />
        <span aria-hidden="true" className="cl-hero-border-overlay" />

        {/* Header Navbar */}
        <header className="cl-header">
          <div className="cl-header-grid">
            <a href="#hero" className="cl-logo-link" aria-label="GrowthControl home">
              <div className="cl-logo-badge">
                <Sparkles size={16} />
              </div>
              <span>GrowthControl</span>
            </a>

            <ul className="cl-nav-list">
              <li><a href="#features" className="cl-nav-link">Features</a></li>
              <li><a href="#capabilities" className="cl-nav-link">Capabilities</a></li>
              <li><a href="#formats" className="cl-nav-link">GEO Engine</a></li>
              <li><a href="#benchmarks" className="cl-nav-link">Benchmarks</a></li>
              <li><a href="#pricing" className="cl-nav-link">Pricing</a></li>
            </ul>

            <div className="cl-header-actions">
              <button
                type="button"
                onClick={toggleTheme}
                className="cl-theme-btn"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle color theme"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {onBackToTools && (
                <button
                  type="button"
                  onClick={onBackToTools}
                  className="cl-btn-secondary max-sm:hidden"
                >
                  All Tools
                </button>
              )}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="cl-btn-primary"
                >
                  <span>Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="cl-btn-secondary max-sm:hidden"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      inputRef.current?.focus();
                      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="cl-btn-primary"
                  >
                    Audit Domain Free
                  </button>
                </>
              )}

              {/* Mobile hamburger menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="cl-mobile-menu-btn"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile slide-down drawer */}
          {mobileMenuOpen && (
            <div className="cl-mobile-drawer">
              <nav className="cl-mobile-nav">
                <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
                <a href="#formats" onClick={() => setMobileMenuOpen(false)}>GEO Engine</a>
                <a href="#benchmarks" onClick={() => setMobileMenuOpen(false)}>Benchmarks</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <a href="#help" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="cl-btn-secondary"
                    style={{ justifyContent: 'flex-start', paddingLeft: 0 }}
                  >
                    Sign in to Account
                  </button>
                )}
                {onBackToTools && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBackToTools();
                    }}
                    className="cl-btn-secondary"
                    style={{ justifyContent: 'flex-start', paddingLeft: 0 }}
                  >
                    All Cerilas Tools
                  </button>
                )}
              </nav>
            </div>
          )}
        </header>

        {/* Hero Body Content */}
        <div className="cl-hero-body">
          <div>
            <a href="#formats" className="cl-pill-badge">
              <span>Now with Generative Engine Optimization (GEO) 2.0</span>
              <ChevronRight size={13} />
            </a>
          </div>

          <h1 className="cl-hero-title">
            Win citations across AI search,<br />
            grow your organic future.
          </h1>

          <p className="cl-hero-subtitle">
            Audit citations across ChatGPT, Perplexity, Claude, and Gemini.
            Connect Google Search Console to fix gaps and turn AI recommendations into revenue.
          </p>

          <div className="cl-hero-cta-row">
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="cl-btn-hero-primary"
            >
              <span>Run Free Audit</span>
              <ArrowRight size={16} />
            </button>
            <a href="#features" className="cl-btn-hero-glass">
              <span>See How It Works</span>
            </a>
          </div>

          {/* Interactive Mac OS App Window Mockup */}
          <div className="cl-app-preview-wrap">
            <div className="cl-app-window">
              <div className="cl-app-grid">
                {/* Left Sidebar */}
                <aside className="cl-app-sidebar">
                  <div className="cl-window-dots">
                    <span className="cl-dot cl-dot-red" />
                    <span className="cl-dot cl-dot-yellow" />
                    <span className="cl-dot cl-dot-green" />
                  </div>

                  <div className="cl-sidebar-brand">
                    <div className="cl-logo-badge" style={{ width: '20px', height: '20px' }}>
                      <Sparkles size={11} />
                    </div>
                    <span>GrowthControl</span>
                    <ChevronDown size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </div>

                  <p className="cl-sidebar-section-title">Favorites</p>
                  <ul className="cl-sidebar-nav-list">
                    <li className="cl-sidebar-item active">
                      <Clock size={14} />
                      <span>Recent Audits</span>
                    </li>
                    <li className="cl-sidebar-item">
                      <Sparkles size={14} />
                      <span>AI Citation Radar</span>
                      <span className="cl-sidebar-badge">4</span>
                    </li>
                    <li className="cl-sidebar-item">
                      <BarChart3 size={14} />
                      <span>Search Console</span>
                    </li>
                    <li className="cl-sidebar-item">
                      <Star size={14} />
                      <span>Starred Queries</span>
                    </li>
                  </ul>

                  <p className="cl-sidebar-section-title">Workspaces</p>
                  <ul className="cl-sidebar-nav-list">
                    <li 
                      className="cl-sidebar-item"
                      onClick={() => {
                        setInputUrl('cerilas.com');
                        handleStartScan('cerilas.com');
                      }}
                    >
                      <span className="cl-dot" style={{ background: '#38bdf8' }} />
                      <span>cerilas.com</span>
                    </li>
                    <li 
                      className="cl-sidebar-item"
                      onClick={() => {
                        setInputUrl('linear.app');
                        handleStartScan('linear.app');
                      }}
                    >
                      <span className="cl-dot" style={{ background: '#f59e0b' }} />
                      <span>linear.app</span>
                    </li>
                    <li 
                      className="cl-sidebar-item"
                      onClick={() => {
                        setInputUrl('supabase.com');
                        handleStartScan('supabase.com');
                      }}
                    >
                      <span className="cl-dot" style={{ background: '#f43f5e' }} />
                      <span>supabase.com</span>
                    </li>
                    <li 
                      className="cl-sidebar-item"
                      onClick={() => {
                        setInputUrl('posthog.com');
                        handleStartScan('posthog.com');
                      }}
                    >
                      <span className="cl-dot" style={{ background: '#10b981' }} />
                      <span>posthog.com</span>
                    </li>
                  </ul>

                  <div style={{ marginTop: 'auto', padding: '0.4rem 0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--cl-muted-fg)' }}>
                      <span>84 of 100 AI queries</span>
                      <span>84%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(150,150,150,0.18)', borderRadius: '999px', marginTop: '0.35rem', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', background: 'var(--cl-fg)', borderRadius: '999px' }} />
                    </div>
                  </div>
                </aside>

                {/* Right Main Pane */}
                <div className="cl-app-main-pane">
                  <div className="cl-app-topbar">
                    <div className="cl-topbar-search">
                      <Search size={14} />
                      <span>Search queries, competitors, or AI citations</span>
                    </div>
                    <span className="cl-topbar-avatar">M</span>
                  </div>

                  <div className="cl-app-inner-content">
                    {/* Center Composer */}
                    <div className="cl-audit-composer-wrap">
                      <div className="cl-composer-icon">
                        <Compass size={24} />
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleStartScan();
                        }}
                        className="cl-composer-input-bar"
                      >
                        <Globe size={18} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          placeholder="Enter domain to audit: e.g. linear.app or stripe.com"
                          className="cl-composer-input"
                          disabled={scanning}
                        />
                        <button
                          type="submit"
                          disabled={scanning || !inputUrl.trim()}
                          className="cl-composer-btn"
                        >
                          {scanning ? (
                            <>
                              <Loader2 size={15} className="spin" />
                              <span>Auditing...</span>
                            </>
                          ) : (
                            <>
                              <span>Audit Domain</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </form>

                      {error && (
                        <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>
                      )}

                      <div className="cl-composer-presets-row">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={12} color="#3b82f6" />
                          Try quick demo domain:
                        </span>
                        <div className="cl-preset-chips">
                          {QUICK_TEST_DOMAINS.map((domain) => (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => {
                                setInputUrl(domain);
                                handleStartScan(domain);
                              }}
                              className="cl-preset-chip"
                              disabled={scanning}
                            >
                              {domain}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Scanning Step Indicator */}
                      {scanning && (
                        <div className="cl-scan-overlay">
                          <div className="cl-scan-header">
                            <Loader2 size={18} className="spin" color="#3b82f6" />
                            <strong style={{ fontSize: '0.92rem' }}>
                              Analyzing {inputUrl}...
                            </strong>
                          </div>
                          <ul className="cl-scan-steps-list">
                            {SCAN_STEPS.map((step, idx) => {
                              const isCompleted = idx < activeStepIdx;
                              const isActive = idx === activeStepIdx;
                              return (
                                <li
                                  key={step.id}
                                  className={`cl-scan-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 size={16} color="#10b981" />
                                  ) : isActive ? (
                                    <Loader2 size={16} className="spin" color="#3b82f6" />
                                  ) : (
                                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--cl-border)', display: 'inline-block' }} />
                                  )}
                                  <span>{step.label}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recent Citations Preview Grid */}
                    <div className="cl-recent-audits-section">
                      <p className="cl-recent-audits-title">Recent AI citation intelligence</p>
                      <div className="cl-recent-audits-grid">
                        <div className="cl-audit-preview-card">
                          <div className="cl-audit-card-body">
                            <span className="cl-audit-card-badge">Cited in 86% of prompts</span>
                            <p className="cl-audit-card-domain">linear.app</p>
                            <p className="cl-audit-card-meta">ChatGPT & Perplexity · #1 Issue Tracker</p>
                          </div>
                          <div className="cl-audit-card-thumb">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.75 }}>
                              <Bot size={28} color="#3b82f6" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Top Cited Source</span>
                            </div>
                          </div>
                        </div>

                        <div className="cl-audit-preview-card">
                          <div className="cl-audit-card-body">
                            <span className="cl-audit-card-badge">Top Source · 92% Citation</span>
                            <p className="cl-audit-card-domain">supabase.com</p>
                            <p className="cl-audit-card-meta">Gemini & Claude · Postgres BaaS</p>
                          </div>
                          <div className="cl-audit-card-thumb">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.75 }}>
                              <Database size={28} color="#10b981" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Entity Grounding</span>
                            </div>
                          </div>
                        </div>

                        <div className="cl-audit-preview-card">
                          <div className="cl-audit-card-body">
                            <span className="cl-audit-card-badge">Perplexity Featured Snippet</span>
                            <p className="cl-audit-card-domain">posthog.com</p>
                            <p className="cl-audit-card-meta">Live Search Radar · Product Analytics</p>
                          </div>
                          <div className="cl-audit-card-thumb">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.75 }}>
                              <TrendingUp size={28} color="#f59e0b" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Organic Lift +240%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          AUDIT RESULTS DRAWER / HUB (APPEARS WHEN SCAN IS PERFORMED)
          ========================================================================== */}
      {scanResult && brandProfile && (
        <Rail id="audit-results" divider={true}>
          <div ref={resultsRef} className="cl-audit-results-hub">
            <div className="cl-results-topbar">
              <div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Audit Completed
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.15rem 0 0' }}>
                  {scanResult.domain}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleSaveToWorkspace}
                  disabled={isSavingWorkspace}
                  className="cl-btn-primary"
                >
                  {isSavingWorkspace ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  <span>{isAuthenticated ? 'Add Brand to Workspace' : 'Claim Free Workspace'}</span>
                </button>
              </div>
            </div>

            <div className="cl-results-body">
              {saveSuccessMsg && (
                <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}>
                  {saveSuccessMsg}
                </div>
              )}

              <div className="cl-metrics-row">
                <div className="cl-metric-stat-box">
                  <span className="cl-metric-stat-title">Overall Authority Score</span>
                  <div className="cl-metric-stat-val" style={{ color: scanResult.scores?.overall >= 70 ? '#10b981' : '#f59e0b' }}>
                    {scanResult.scores?.overall || 78}/100
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cl-muted-fg)' }}>Derived from GEO & tech signals</span>
                </div>

                <div className="cl-metric-stat-box">
                  <span className="cl-metric-stat-title">AI Crawler Permission</span>
                  <div className="cl-metric-stat-val" style={{ color: '#10b981' }}>
                    {scanResult.crawlers?.gptBot?.allowed ? 'Allowed' : 'Blocked'}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cl-muted-fg)' }}>GPTBot & Perplexity in robots.txt</span>
                </div>

                <div className="cl-metric-stat-box">
                  <span className="cl-metric-stat-title">llms.txt Standard</span>
                  <div className="cl-metric-stat-val" style={{ color: scanResult.signals?.hasLlmsTxt ? '#10b981' : '#f59e0b' }}>
                    {scanResult.signals?.hasLlmsTxt ? 'Detected' : 'Missing'}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cl-muted-fg)' }}>Context manifest for LLMs</span>
                </div>

                <div className="cl-metric-stat-box">
                  <span className="cl-metric-stat-title">Schema.org Structured Data</span>
                  <div className="cl-metric-stat-val" style={{ color: scanResult.signals?.hasSchemaOrg ? '#10b981' : '#3b82f6' }}>
                    {scanResult.signals?.hasSchemaOrg ? 'Configured' : 'Basic'}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cl-muted-fg)' }}>JSON-LD entities present</span>
                </div>
              </div>

              {brandProfile.description && (
                <div style={{ padding: '1.25rem', borderRadius: '1rem', background: 'var(--cl-muted)', marginBottom: '1.5rem' }}>
                  <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '0.35rem' }}>AI Brand Positioning Summary</strong>
                  <p style={{ fontSize: '0.92rem', color: 'var(--cl-muted-fg)', margin: 0 }}>{brandProfile.description}</p>
                </div>
              )}

              {brandProfile.suggestedCompetitors && brandProfile.suggestedCompetitors.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>Detected Competitors:</span>
                  {brandProfile.suggestedCompetitors.map((comp, idx) => {
                    const compLabel = typeof comp === 'string'
                      ? comp
                      : (comp?.name ? (comp.domain && comp.domain !== comp.name ? `${comp.name} (${comp.domain})` : comp.name) : comp?.domain || 'Competitor');
                    return (
                      <span key={idx} style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--cl-muted)', fontSize: '0.78rem' }}>
                        {compLabel}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Rail>
      )}

      {/* ==========================================================================
          2. MANIFESTO & RADAR (FEATURES)
          ========================================================================== */}
      <Rail id="features" fadeTop={true}>
        <div className="cl-manifesto-grid">
          <div>
            <a href="#capabilities" className="cl-eyebrow">
              <span>Introducing GrowthControl</span>
              <ChevronRight size={14} />
            </a>
          </div>

          <div className="cl-manifesto-text">
            <p>
              <strong>Traditional SEO is stuck in 2012.</strong>{' '}
              Rank trackers only watch 10 blue links on desktop search, while millions of buyers now make purchasing decisions inside ChatGPT, Perplexity, and Gemini answers.
            </p>
            <p>
              <strong>GrowthControl puts AI search and Google data in one command center.</strong>{' '}
              Audit citations across every major LLM, sync Google Search Console with zero manual spreadsheets, and turn algorithm shifts into prioritized weekly action feeds.
            </p>
          </div>
        </div>

        {/* Sub-block: A radar that remembers every citation */}
        <div className="cl-radar-sub-block">
          <SectionHeading
            id="radar-heading"
            align="left"
            title="A radar that remembers every AI citation."
            description="Every prompt your market asks is kept, benchmarked, and versioned. Ask 'Which CRM is best for enterprise sales?' and see your exact citation share, competitor mentions, and direct source links."
          />

          <div className="cl-radar-preview-layout">
            <div className="cl-radar-prompt-bubble">
              "Find which AI prompts cite our domain as a primary recommendation vs. Linear and Notion"
            </div>

            <div className="cl-radar-app-card">
              <div className="cl-radar-card-header">
                <span>AI Citation Radar</span>
                <span className="cl-radar-search-pill">
                  <Search size={12} />
                  <span>"fastest issue tracker" · ChatGPT 4o · citations</span>
                </span>
              </div>

              <ul className="cl-radar-items-list">
                <li className="cl-radar-item-row">
                  <span className="cl-radar-item-thumb">
                    <Sparkles size={20} color="#3b82f6" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="cl-radar-item-title">Best modern issue tracker for engineers</span>
                    <span className="cl-radar-item-desc">Cited in 94% of answers · Direct source link</span>
                  </div>
                  <button type="button" className="cl-radar-action-btn">
                    <Link2 size={12} />
                    <span>Re-check</span>
                  </button>
                </li>

                <li className="cl-radar-item-row">
                  <span className="cl-radar-item-thumb">
                    <Globe size={20} color="#10b981" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="cl-radar-item-title">Top Postgres backend alternatives</span>
                    <span className="cl-radar-item-desc">Perplexity Grounding · Ranked #1 source</span>
                  </div>
                  <button type="button" className="cl-radar-action-btn">
                    <Link2 size={12} />
                    <span>Re-check</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          3. CAPABILITIES (PILL TABS)
          ========================================================================== */}
      <Rail id="capabilities" divider={true}>
        <div className="cl-capabilities-wrap">
          <SectionHeading
            id="capabilities-heading"
            eyebrow="Unified Growth Platform"
            title="Audit it, track it, dominate it. One tool."
            description="Replace disjointed SEO software with an integrated platform built specifically for generative search and first-party search telemetry."
          />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cl-pill-tabs-bar" role="tablist" aria-label="Core Capabilities">
              {[
                '1. AI Search Radar (GEO)',
                '2. Search Console (GSC)',
                '3. Weekly Action Feed'
              ].map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={activeCapabilityTab === idx}
                  onClick={() => setActiveCapabilityTab(idx)}
                  className={`cl-pill-tab-btn ${activeCapabilityTab === idx ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="cl-capability-display-card">
            {activeCapabilityTab === 0 && (
              <>
                <div className="cl-capability-info">
                  <h3>Generative Engine Optimization (GEO) Radar</h3>
                  <p>
                    Probe ChatGPT, Perplexity, Claude, and Gemini with hundreds of localized commercial queries.
                    Discover which URLs are cited as references, understand sentiment, and measure your AI share of voice.
                  </p>
                  <ul className="cl-feature-bullets">
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Real-time citation verification across 4 top LLM engines</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Competitor citation gap analysis and source comparison</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Automated weekly drift detection and loss alerts</span>
                    </li>
                  </ul>
                </div>
                <div className="cl-capability-preview-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>AI Citation Share</span>
                    <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600 }}>+34% this month</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { name: 'Your Brand', pct: '86%', color: '#3b82f6' },
                      { name: 'Competitor A', pct: '52%', color: '#94a3b8' },
                      { name: 'Competitor B', pct: '38%', color: '#cbd5e1' }
                    ].map((row, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                          <span>{row.name}</span>
                          <span style={{ fontWeight: 600 }}>{row.pct}</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--cl-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: row.pct, height: '100%', background: row.color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeCapabilityTab === 1 && (
              <>
                <div className="cl-capability-info">
                  <h3>Google Search Console Deep Sync</h3>
                  <p>
                    Connect your Search Console with 1-click read-only authentication.
                    Uncover high-impression queries falling off page 1, detect cannibalization, and cross-reference which Google queries are being swallowed by AI Overviews.
                  </p>
                  <ul className="cl-feature-bullets">
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Zero-friction OAuth setup with strictly read-only scopes</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Automated query clustering and CTR opportunity discovery</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Alerts when search impressions rise but clicks drop due to AI</span>
                    </li>
                  </ul>
                </div>
                <div className="cl-capability-preview-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>GSC Performance Telemetry</span>
                    <span style={{ color: '#3b82f6', fontSize: '0.82rem', fontWeight: 600 }}>Live Sync</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.85rem', background: 'var(--cl-muted)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cl-muted-fg)' }}>Total Clicks</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0' }}>142.8K</p>
                    </div>
                    <div style={{ padding: '0.85rem', background: 'var(--cl-muted)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cl-muted-fg)' }}>Avg. Position</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0', color: '#10b981' }}>4.8</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeCapabilityTab === 2 && (
              <>
                <div className="cl-capability-info">
                  <h3>Weekly Prioritized Action Feed</h3>
                  <p>
                    No more endless dashboards or vanity metrics.
                    Every Monday morning, GrowthControl analyzes your AI visibility and Search Console signals to deliver a ranked checklist of actionable engineering and content fixes.
                  </p>
                  <ul className="cl-feature-bullets">
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Prioritized by estimated organic traffic and citation impact</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Ready-to-copy Schema.org JSON-LD and robots.txt snippets</span>
                    </li>
                    <li className="cl-feature-bullet">
                      <span className="cl-bullet-check"><Check size={12} strokeWidth={3} /></span>
                      <span>Executive summary email sent directly to your stakeholders</span>
                    </li>
                  </ul>
                </div>
                <div className="cl-capability-preview-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Top Priority This Week</span>
                    <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>High Impact</span>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'var(--cl-muted)', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Add Product Schema & llms.txt to /pricing</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--cl-muted-fg)', margin: '0.25rem 0 0' }}>
                      ChatGPT 4o is failing to cite exact tier prices. Implementing structured JSON-LD will recover ~820 high-intent visitors/mo.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          4. FORMATS & CRAWLERS (3D PERSPECTIVE TILTING GRID)
          ========================================================================== */}
      <Rail id="formats" divider={true}>
        <div className="cl-formats-wrap">
          <SectionHeading
            id="formats-heading"
            eyebrow="Multi-Engine & Crawler Grounding"
            title="Whatever your brand publishes, it travels as is."
            description="GrowthControl doesn't compress or hallucinate your data. We ensure every AI crawler parses your true domain entities, structured Schema, and clean text exactly as intended."
          />

          {/* Interactive 3D Tilting Perspective Grid */}
          <Formats3DGrid />

          <div style={{ maxWidth: '760px', margin: '2rem auto 0', textAlign: 'center' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--cl-muted-fg)' }}>
              From OpenAI's GPTBot to Anthropic's ClaudeBot and Perplexity's live web crawler,
              GrowthControl monitors every gateway into modern search. Masters stay masters, code stays code,
              and AI citations point directly to your verified domain.
            </p>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          5. SECURITY & RELIABILITY
          ========================================================================== */}
      <Rail id="security" divider={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="security-heading"
            eyebrow="Enterprise Reliability"
            title="Safe enough for the brands that matter."
            description="Designed from day one with strict data isolation, zero write permissions to your production infrastructure, and dedicated privacy safeguards."
          />

          <div className="cl-cards-3-grid">
            <div className="cl-feature-card">
              <div className="cl-card-icon-slot">
                <Lock size={20} />
              </div>
              <h4>Strict Read-Only Scopes</h4>
              <p>
                Google Search Console integration connects via official OAuth with strictly read-only permissions.
                We can never edit, delete, or modify your Google accounts.
              </p>
            </div>

            <div className="cl-feature-card">
              <div className="cl-card-icon-slot">
                <ShieldCheck size={20} />
              </div>
              <h4>Zero AI Hallucination Guard</h4>
              <p>
                All citation claims are verified with live DOM parsing and real search engine responses,
                preventing false positives and phantom ranking reports.
              </p>
            </div>

            <div className="cl-feature-card">
              <div className="cl-card-icon-slot">
                <Cpu size={20} />
              </div>
              <h4>No LLM Training on Your Data</h4>
              <p>
                Your private search queries, competitor watchlists, and internal URLs are never used to train public machine learning models.
              </p>
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          6. BENCHMARKS
          ========================================================================== */}
      <Rail id="benchmarks" divider={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="benchmarks-heading"
            eyebrow="Speed & Coverage Benchmarks"
            title="The fastest way from audit to citation."
            description="See how GrowthControl stacks up against legacy SEO rank trackers and slow manual prompt testing."
          />

          <div className="cl-benchmark-block">
            <div className="cl-bench-row">
              <div className="cl-bench-label-row">
                <span>GrowthControl (Automated Multi-LLM Probing)</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>4.2s · 10 Engines</span>
              </div>
              <div className="cl-bench-bar-track">
                <div className="cl-bench-bar-fill" style={{ width: '92%', background: '#10b981' }} />
              </div>
            </div>

            <div className="cl-bench-row">
              <div className="cl-bench-label-row">
                <span>Legacy SEO Trackers (Semrush / Ahrefs)</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>0 LLM Citations (10 Blue Links Only)</span>
              </div>
              <div className="cl-bench-bar-track">
                <div className="cl-bench-bar-fill" style={{ width: '22%', background: '#f59e0b' }} />
              </div>
            </div>

            <div className="cl-bench-row" style={{ marginBottom: 0 }}>
              <div className="cl-bench-label-row">
                <span>Manual Prompt Copy-Pasting</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>180s+ per query · Incomplete</span>
              </div>
              <div className="cl-bench-bar-track">
                <div className="cl-bench-bar-fill" style={{ width: '12%', background: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          7. TEAMS & MULTI-BRAND WORKSPACES
          ========================================================================== */}
      <Rail id="teams" divider={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="teams-heading"
            eyebrow="Built for Growth Teams & Agencies"
            title="One space per brand, not one spreadsheet per client."
            description="Manage client brand portfolios with isolated workspaces, shareable executive links, and automated team delegation."
          />

          <div style={{ marginTop: '3rem', maxWidth: '820px', marginInline: 'auto' }}>
            <div className="cl-feature-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Users size={20} color="#3b82f6" />
                  <strong style={{ fontSize: '1.05rem' }}>Portfolio Workspace Switcher</strong>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'var(--cl-muted)', fontWeight: 600 }}>
                  Active Brand: Linear
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--cl-card-border)', borderRadius: '10px', background: 'var(--cl-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="cl-dot" style={{ background: '#38bdf8' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>linear.app</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>86% Citation Share</span>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--cl-card-border)', borderRadius: '10px', background: 'var(--cl-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="cl-dot" style={{ background: '#f59e0b' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>supabase.com</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>92% Citation Share</span>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--cl-card-border)', borderRadius: '10px', background: 'var(--cl-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="cl-dot" style={{ background: '#10b981' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>cerilas.com</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Primary Workspace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          8. TESTIMONIALS (STORIES)
          ========================================================================== */}
      <Rail id="stories" divider={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="stories-heading"
            eyebrow="Customer Stories"
            title="Less guessing. More delivering."
            description="See how forward-thinking growth teams protect their brand citations in AI search."
          />

          <div className="cl-testimonial-card">
            <p className="cl-quote-text">
              "{TESTIMONIALS_DATA[activeTestimonialIdx].quote}"
            </p>

            <div className="cl-quote-author-row">
              <img
                src={TESTIMONIALS_DATA[activeTestimonialIdx].avatar}
                alt={TESTIMONIALS_DATA[activeTestimonialIdx].name}
                className="cl-author-avatar"
              />
              <div className="cl-author-info">
                <span className="cl-author-name">{TESTIMONIALS_DATA[activeTestimonialIdx].name}</span>
                <span className="cl-author-title">{TESTIMONIALS_DATA[activeTestimonialIdx].role}</span>
              </div>
            </div>

            <div className="cl-testimonial-nav-dots">
              {TESTIMONIALS_DATA.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonialIdx(idx)}
                  className={`cl-nav-dot ${activeTestimonialIdx === idx ? 'active' : ''}`}
                  aria-label={`Show testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          9. PRICING (SYNCHRONIZED WITH REVENUECAT REAL BILLING)
          ========================================================================== */}
      <Rail id="pricing" divider={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="pricing-heading"
            eyebrow="Simple, Predictable Plans"
            title="Start free. Scale when you see results."
            description="Transparent pricing backed by RevenueCat & Stripe. Free tools remain free forever, with higher allowances for automated AI radar tests."
          />

          <div className="cl-pricing-toggle-wrap">
            <div className="cl-pricing-toggle">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={`cl-toggle-btn ${!isYearly ? 'active' : ''}`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={`cl-toggle-btn ${isYearly ? 'active' : ''}`}
              >
                Annual Billing
              </button>
            </div>
            {isYearly && <span className="cl-discount-pill">2 Months Free</span>}
          </div>

          <div className="cl-pricing-grid">
            {/* Plan 1: Forever Free */}
            <div className="cl-price-card">
              <span className="cl-plan-name">Forever Free</span>
              <p className="cl-plan-desc">Free tools free forever, with limited free token allowance for AI utilities.</p>
              <div className="cl-plan-price-row">
                <span className="cl-plan-price">$0</span>
                <span className="cl-plan-period">/ month</span>
              </div>
              <ul className="cl-plan-features">
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>1 Workspace:</strong> Dedicated website growth dashboard</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>3 Target GEO Prompts:</strong> Search query library</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>1 Daily Action Feed AI Scan:</strong> AI growth task synthesis</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>1 Daily AI Competitor Discovery:</strong> Scan niche market rivals</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Free Tools Forever:</strong> 100% In-Browser Privacy & Local execution</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) setActiveTab('overview');
                  else openAuthModal('register');
                }}
                className="cl-plan-cta-btn"
              >
                {!isPro && !isUnlimited ? 'Current Plan (Free)' : 'Explore Free Tools'}
              </button>
            </div>

            {/* Plan 2: Pro (Real: $9.99/mo or $99.90/yr) */}
            <div className="cl-price-card featured">
              <span className="cl-popular-badge">Popular Choice</span>
              <span className="cl-plan-name">Pro</span>
              <p className="cl-plan-desc">For growing startups and businesses optimizing organic and AI visibility.</p>
              <div className="cl-plan-price-row">
                <span className="cl-plan-price">{isYearly ? '$99.90' : '$9.99'}</span>
                <span className="cl-plan-period">
                  {isYearly ? '/ year ($8.33/mo)' : '/ month'}
                </span>
              </div>
              <ul className="cl-plan-features">
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>3 Workspaces:</strong> Multi-website management</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>5 Addable &amp; 5 Trackable Prompts:</strong> Live Gemini &amp; ChatGPT telemetry</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>3 Competitors in Radar:</strong> Benchmark market visibility &amp; gaps</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Technical Site Audit &amp; Issues:</strong> Automated crawler &amp; health checks</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Daily Executive Email Digest:</strong> 09:00 AM automated executive digest</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>3 Daily Action Feed AI Scans:</strong> Continuous growth task synthesis</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>3 Daily AI Competitor Discoveries:</strong> Radar expansion assistant</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (isPro && openCustomerCenter) {
                    openCustomerCenter();
                  } else if (presentPaywall) {
                    presentPaywall({ defaultPackageId: 'pro', cycle: isYearly ? 'annual' : 'monthly' });
                  } else {
                    window.location.hash = '#/pricing';
                  }
                }}
                className="cl-plan-cta-btn"
              >
                {isPro ? 'Active Plan (Manage)' : 'Subscribe to Pro'}
              </button>
            </div>

            {/* Plan 3: Unlimited (Real: $14.99/mo or $149.90/yr) */}
            <div className="cl-price-card">
              <span className="cl-plan-name">Unlimited</span>
              <p className="cl-plan-desc">For agencies, portfolios, and marketing teams needing maximum capacity.</p>
              <div className="cl-plan-price-row">
                <span className="cl-plan-price">{isYearly ? '$149.90' : '$14.99'}</span>
                <span className="cl-plan-period">
                  {isYearly ? '/ year ($12.49/mo)' : '/ month'}
                </span>
              </div>
              <ul className="cl-plan-features">
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Unlimited Workspaces:</strong> Scale holding companies &amp; client portals</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>10 Addable &amp; 10 Trackable Prompts:</strong> Maximum GEO query tracking</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Unlimited Competitors in Radar:</strong> Full competitive radar monitoring</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Technical Site Audit &amp; Issues:</strong> Full crawler &amp; health telemetry</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Daily Executive Email Digest:</strong> 09:00 AM automated email reports</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Unlimited Action Feed AI Scans:</strong> Real-time on-demand synthesis</span>
                </li>
                <li className="cl-plan-feature-item">
                  <Check size={16} color="#10b981" />
                  <span><strong>Unlimited AI Competitor Discoveries:</strong> Continuous market expansion</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (isUnlimited && openCustomerCenter) {
                    openCustomerCenter();
                  } else if (presentPaywall) {
                    presentPaywall({ defaultPackageId: 'unlimited', cycle: isYearly ? 'annual' : 'monthly' });
                  } else {
                    window.location.hash = '#/pricing';
                  }
                }}
                className="cl-plan-cta-btn"
              >
                {isUnlimited ? 'Active Plan (Manage)' : 'Get Unlimited'}
              </button>
            </div>
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          10. FAQ ACCORDION (GEO OPTIMIZED WITH DIRECT ANSWERS)
          ========================================================================== */}
      <Rail id="help" divider={true} fadeBottom={true}>
        <div style={{ padding: '5rem 1.25rem' }}>
          <SectionHeading
            id="faq-heading"
            eyebrow="Frequently Asked Questions"
            title="Everything people ask before switching."
            description="Clear answers about how GrowthControl audits AI search, handles data privacy, and drives organic traffic."
          />

          <div className="cl-faq-list">
            {FAQS_DATA.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="cl-faq-item">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="cl-faq-question"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`cl-faq-icon ${isOpen ? 'open' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="cl-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Rail>

      {/* ==========================================================================
          11. FINAL CTA (TRY FREE)
          ========================================================================== */}
      <section id="try-free" className="cl-final-cta-section">
        <div className="cl-final-cta-card">
          <div className="cl-hero-fallback-bg" />
          <CloudCanvas isDark={isDark} />
          <span aria-hidden="true" className="cl-hero-border-overlay" />

          <div className="cl-final-cta-content">
            <h2 className="cl-final-cta-title">
              Built for teams that move fast.<br />
              Start dominating AI search today.
            </h2>
            <p className="cl-final-cta-desc">
              Audit your domain for free in seconds. See where ChatGPT and Perplexity cite your brand, and turn AI discovery into steady organic revenue.
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartScan();
                }}
                className="cl-composer-input-bar"
                style={{ width: '100%', maxWidth: '520px' }}
              >
                <Globe size={18} style={{ opacity: 0.5, flexShrink: 0 }} />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Enter website domain: e.g. linear.app"
                  className="cl-composer-input"
                  disabled={scanning}
                />
                <button
                  type="submit"
                  disabled={scanning || !inputUrl.trim()}
                  className="cl-composer-btn"
                >
                  <span>Run Audit</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          12. FOOTER
          ========================================================================== */}
      <footer className="cl-footer">
        <div className="cl-footer-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="cl-logo-badge" style={{ width: '22px', height: '22px' }}>
              <Sparkles size={12} />
            </div>
            <strong style={{ color: 'var(--cl-fg)' }}>GrowthControl by Cerilas</strong>
            <span>© 2026 Cerilas • All rights reserved.</span>
          </div>

          <div className="cl-footer-links">
            <a href="#features">Features</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#formats">GEO Engine</a>
            <a href="#benchmarks">Benchmarks</a>
            <a href="#pricing">Pricing</a>
            <a href="#help">FAQ</a>
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                style={{ background: 'none', border: 'none', color: 'var(--cl-muted-fg)', cursor: 'pointer', padding: 0, font: 'inherit' }}
              >
                Tools Directory
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
