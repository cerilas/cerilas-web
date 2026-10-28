import React, { useState, useEffect, useLayoutEffect, Suspense, useRef, useCallback } from 'react';
import { 
  Search, 
  ArrowRight, 
  Box, 
  QrCode, 
  Minimize2, 
  Image as ImageIcon, 
  Clock, 
  FileText, 
  FileCheck, 
  Sparkles, 
  SlidersHorizontal, 
  Database, 
  Cpu, 
  PenTool, 
  Video, 
  Webhook, 
  Braces, 
  Mail, 
  Users, 
  Activity,
  TrendingUp,
  RotateCcw,
  DollarSign,
  Scale,
  Link2,
  Unlink,
  ShieldAlert,
  Layers,
  Scissors,
  CalendarClock
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StatsModal from './components/StatsModal';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDashboard from './admin/AdminDashboard';
import LegalView from './legal/LegalView';
import PricingView from './pricing/PricingView';
import AuthModal from './components/auth/AuthModal';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import AccountDashboard from './components/account/AccountDashboard';
import GrowthApp from './growth/GrowthApp';
import { useAuth } from './context/AuthContext';
import useUserActivityTracking from './hooks/useUserActivityTracking';
import { useRevenueCat } from './context/RevenueCatContext';
import RevenueCatPaywallModal from './components/RevenueCatPaywallModal';
import RevenueCatCustomerCenterModal from './components/RevenueCatCustomerCenterModal';
import { LEGAL_DOCS } from './legal/legalContent';
import { toolsRegistry, getAllRegisteredTools, getRegisteredTool } from './tools/registry';
import { getToolSeo, getToolVariantSeo, CATEGORIES } from './seo/toolsSeoRegistry';
import { JSONLD_IDS, buildToolJsonLdBlocks, buildToolVariantJsonLdBlocks } from './seo/structuredData';
import { GROWTH_SEO, GROWTH_URL, buildGrowthJsonLd } from './seo/growthControlSeo';
import ToolSeoMesh from './components/ToolSeoMesh';
import { useTranslation } from './i18n';
import { getConversionCount, getConversionLabel, getShortConversionLabel } from './utils/toolMetrics';
import './index.css';

// Force instant scroll position to the very top (functional workspace)
const forceScrollToTop = () => {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch (e) {
    window.scrollTo(0, 0);
  }
  if (typeof document !== 'undefined') {
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
};

// Wrapper that guarantees scroll reset before and after tool component mounts
function ToolScrollResetWrapper({ slug, children }) {
  useLayoutEffect(() => {
    forceScrollToTop();
  }, [slug]);

  useEffect(() => {
    forceScrollToTop();
    const raf = requestAnimationFrame(forceScrollToTop);
    const t1 = setTimeout(forceScrollToTop, 50);
    const t2 = setTimeout(forceScrollToTop, 150);
    const t3 = setTimeout(forceScrollToTop, 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [slug]);

  return <div key={slug} className="tool-viewport-container">{children}</div>;
}

const ICON_MAP = {
  QrCode,
  Box,
  Minimize2,
  Image: ImageIcon,
  Clock,
  FileText,
  FileCheck,
  Sparkles,
  Database,
  Cpu,
  PenTool,
  Video,
  Webhook,
  Braces,
  Mail,
  TrendingUp,
  RotateCcw,
  DollarSign,
  Users,
  Scale,
  Activity,
  Link2,
  Unlink,
  ShieldAlert,
  Layers,
  Scissors,
  CalendarClock
};

const ToolCard = ({ tool, onSelect }) => {
  const { t, language } = useTranslation();
  const IconComponent = ICON_MAP[tool.icon_name] || Box;
  const isAi = tool.isAi || tool.badge === 'AI Assisted' || tool.badge === 'AI Powered' || tool.slug === 'ats-resume-checker';

  const conversionCount = getConversionCount(tool);
  const shortLabel = getShortConversionLabel(tool.slug, language || 'en');
  const visitorCount = tool.unique_visitors_count || 0;

  const visitorText = visitorCount > 0 
    ? `${visitorCount.toLocaleString()} visitors` 
    : 'New tool';

  return (
    <a 
      href={`/tool/${tool.slug}`}
      className="card" 
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          onSelect(tool.slug);
        }
      }}
      style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexDirection: 'row', flexWrap: 'nowrap' }}>
        <div className="icon-wrapper tool-logo-container" style={{ flexShrink: 0 }}>
          <img 
            src={`/tool-icons/${tool.slug}.webp`} 
            alt={tool.title}
            className="tool-apple-logo"
            width={46}
            height={46}
            loading="lazy"
            onError={(e) => {
              if (!e.target.dataset.triedSvg) {
                e.target.dataset.triedSvg = 'true';
                e.target.src = `/tool-icons/${tool.slug}.svg`;
              } else if (!e.target.dataset.triedPng) {
                e.target.dataset.triedPng = 'true';
                e.target.src = `/tool-icons/${tool.slug}.png`;
              } else {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
              }
            }}
          />
          <div className="icon-wrapper-fallback" style={{ display: 'none' }}>
            <IconComponent strokeWidth={1.5} size={28} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-end', flexDirection: 'column', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
          <span className="card-stat-pill" style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            background: 'rgba(150, 150, 150, 0.1)',
            color: 'var(--text-muted)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {tool.category || 'Tool'}
          </span>
          {conversionCount > 0 ? (
            <span className="card-stat-pill" style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontWeight: '600',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <Activity size={11} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{conversionCount.toLocaleString()} {shortLabel}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{tool.title}</h3>
        {isAi && (
          <span className="card-stat-pill" style={{
            fontSize: '0.68rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '999px',
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            fontWeight: '500',
            gap: '0.25rem'
          }}>
            <Sparkles size={10} />
            <span>AI Assisted</span>
          </span>
        )}
      </div>
      <p>{tool.short_description || tool.shortDescription || tool.description || tool.seo?.description || ''}</p>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--card-border)',
        minWidth: 0
      }}>
        <div className="card-footer-stats">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <Users size={12} strokeWidth={1.8} style={{ opacity: 0.7 }} />
            <span>{visitorText}</span>
          </span>
        </div>
        <div className="arrow" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
          <ArrowRight size={16} strokeWidth={1.5} />
        </div>
      </div>
    </a>
  );
};

const SkeletonCard = () => (
  <div className="card skeleton-card">
    <div className="skeleton skeleton-icon"></div>
    <div className="skeleton skeleton-title"></div>
    <div className="skeleton-desc">
      <div className="skeleton skeleton-line"></div>
      <div className="skeleton skeleton-line short"></div>
    </div>
    <div className="skeleton skeleton-arrow"></div>
  </div>
);

export default function App() {
  const { t, language } = useTranslation();
  const { 
    isPaywallOpen, 
    setIsPaywallOpen, 
    paywallInitialProduct,
    paywallInitialCycle,
    isCustomerCenterOpen, 
    setIsCustomerCenterOpen 
  } = useRevenueCat();
  const [tools, setTools] = useState(() => getAllRegisteredTools());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentSlug, setCurrentSlug] = useState(null);
  const [currentVariantSlug, setCurrentVariantSlug] = useState(null);
  const [currentCategorySlug, setCurrentCategorySlug] = useState(null);
  const [currentLegalSlug, setCurrentLegalSlug] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    const h = window.location.hash;
    return p === '/admin' || p.startsWith('/admin/') || h === '#/admin' || h.startsWith('#/admin/');
  });
  const [isResetPassword] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/reset-password');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isPricing, setIsPricing] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    const h = window.location.hash;
    return p === '/pricing' || p.startsWith('/pricing/') || h === '#/pricing' || h.startsWith('#/pricing/');
  });
  const [isGrowthView, setIsGrowthView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    const h = window.location.hash;
    return p === '/growth' || p.startsWith('/growth/') || h === '#/growth' || h.startsWith('#/growth');
  });
  const { openAuthModal, token: authToken } = useAuth();
  useUserActivityTracking(isAdmin || isResetPassword ? null : authToken);
  const [isAccountView, setIsAccountView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    const h = window.location.hash;
    return p === '/account' || p.startsWith('/account/') ||
      p === '/profile' || p.startsWith('/profile/') ||
      p === '/billing' || p.startsWith('/billing/') ||
      h === '#/account' || h.startsWith('#/account') ||
      h === '#/profile' || h.startsWith('#/profile') ||
      h === '#/billing' || h.startsWith('#/billing');
  });
  const [accountTab, setAccountTab] = useState(() => {
    if (typeof window === 'undefined') return 'profile';
    const h = window.location.hash;
    if (h.includes('tab=package') || h.includes('tab=plan') || h.includes('package') || h.includes('plan')) return 'package';
    if (h.includes('billing')) return 'billing';
    return 'profile';
  });

  const heroBannerRef = useRef(null);
  const heroImgRef = useRef(null);
  const heroGlowRef = useRef(null);

  // Mouse parallax motion for catalog hero background photo
  const handleHeroMouseMove = useCallback((e) => {
    if (!heroBannerRef.current || !heroImgRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = heroBannerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Normalized offset from center: -0.5 to +0.5
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Smooth inverse translation (moves opposite to cursor creating genuine 3D depth behind search bar)
    const moveX = -(x * 32); // max ~16px left/right
    const moveY = -(y * 20); // max ~10px up/down
    const rotX = y * 2.5;    // subtle 3D tilt
    const rotY = -(x * 2.5);

    heroImgRef.current.style.transform = `perspective(1000px) translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.08)`;

    if (heroGlowRef.current) {
      const glowX = ((e.clientX - rect.left) / rect.width) * 100;
      const glowY = ((e.clientY - rect.top) / rect.height) * 100;
      heroGlowRef.current.style.background = `radial-gradient(circle 520px at ${glowX.toFixed(1)}% ${glowY.toFixed(1)}%, rgba(255, 255, 255, 0.08), transparent 70%)`;
    }
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    if (!heroImgRef.current) return;
    heroImgRef.current.style.transform = 'perspective(1000px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1.05)';
    if (heroGlowRef.current) {
      heroGlowRef.current.style.background = 'transparent';
    }
  }, []);

  // Sync hash and path routing for both SPA navigation and web crawler indexing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleLocationChange = () => {
      forceScrollToTop();
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (pathname === '/admin' || pathname.startsWith('/admin/') || hash === '#/admin' || hash.startsWith('#/admin/')) {
        setIsAdmin(true);
        setIsPricing(false);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        setCurrentLegalSlug(null);
        forceScrollToTop();
        return;
      }
      setIsAdmin(false);

      // 0. Growth route matching (/growth, #/growth)
      if (pathname === '/growth' || pathname.startsWith('/growth/') || hash === '#/growth' || hash.startsWith('#/growth')) {
        setIsGrowthView(true);
        setIsPricing(false);
        setIsAccountView(false);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        setCurrentLegalSlug(null);
        forceScrollToTop();
        return;
      }
      setIsGrowthView(false);

      // 0.1 Pricing route matching (/pricing, #/pricing)
      if (pathname === '/pricing' || pathname.startsWith('/pricing/') || hash === '#/pricing' || hash.startsWith('#/pricing/')) {
        setIsPricing(true);
        setIsGrowthView(false);
        setIsAccountView(false);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        setCurrentLegalSlug(null);
        forceScrollToTop();
        return;
      }
      setIsPricing(false);

      // 0.1 Account / User Portal routes (/account, #/account, /profile, #/profile, /billing, #/billing)
      const isAccount = 
        pathname === '/account' || pathname.startsWith('/account/') ||
        pathname === '/profile' || pathname.startsWith('/profile/') ||
        pathname === '/billing' || pathname.startsWith('/billing/') ||
        hash === '#/account' || hash.startsWith('#/account') ||
        hash === '#/profile' || hash.startsWith('#/profile') ||
        hash === '#/billing' || hash.startsWith('#/billing');

      if (isAccount) {
        setIsAccountView(true);
        setIsGrowthView(false);
        setIsPricing(false);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        setCurrentLegalSlug(null);
        if (hash.includes('tab=package') || hash.includes('tab=plan') || hash.includes('package') || hash.includes('plan')) {
          setAccountTab('package');
        } else if (hash.includes('tab=billing') || hash.includes('billing')) {
          setAccountTab('billing');
        } else {
          setAccountTab('profile');
        }
        forceScrollToTop();
        return;
      }
      setIsAccountView(false);

      if (hash === '#/login' || hash.startsWith('#/login')) {
        openAuthModal('login');
      } else if (hash === '#/register' || hash.startsWith('#/register')) {
        openAuthModal('register');
      } else if (hash === '#/forgot-password') {
        openAuthModal('forgot');
      }

      // 1. Legal compliance routes matching (/terms, /privacy, /refund, /cookies, /legal/:slug, #/legal/:slug)
      const legalAliasMap = {
        'terms': 'terms',
        'terms-of-service': 'terms',
        'privacy': 'privacy',
        'privacy-policy': 'privacy',
        'refund': 'refund',
        'refund-policy': 'refund',
        'cancellation-refund': 'refund',
        'cookies': 'cookies',
        'cookie-policy': 'cookies'
      };

      const legalHashMatch = hash.match(/^#\/legal\/([a-zA-Z0-9_-]+)\/?/);
      if (legalHashMatch && legalAliasMap[legalHashMatch[1].toLowerCase()]) {
        setCurrentLegalSlug(legalAliasMap[legalHashMatch[1].toLowerCase()]);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        forceScrollToTop();
        return;
      }

      const directHashLegalMatch = hash.match(/^#\/(terms(?:-of-service)?|privacy(?:-policy)?|refund(?:-policy)?|cancellation-refund|cookies(?:-policy)?)\/?$/i);
      if (directHashLegalMatch && legalAliasMap[directHashLegalMatch[1].toLowerCase()]) {
        setCurrentLegalSlug(legalAliasMap[directHashLegalMatch[1].toLowerCase()]);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        forceScrollToTop();
        return;
      }

      const legalPathMatch = pathname.match(/^\/legal\/([a-zA-Z0-9_-]+)\/?/);
      if (legalPathMatch && legalAliasMap[legalPathMatch[1].toLowerCase()]) {
        setCurrentLegalSlug(legalAliasMap[legalPathMatch[1].toLowerCase()]);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        forceScrollToTop();
        return;
      }

      const directPathLegalMatch = pathname.match(/^\/(terms(?:-of-service)?|privacy(?:-policy)?|refund(?:-policy)?|cancellation-refund|cookies(?:-policy)?)\/?$/i);
      if (directPathLegalMatch && legalAliasMap[directPathLegalMatch[1].toLowerCase()]) {
        setCurrentLegalSlug(legalAliasMap[directPathLegalMatch[1].toLowerCase()]);
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        forceScrollToTop();
        return;
      }

      setCurrentLegalSlug(null);

      // 2. Tool & Long-Tail Working Tool Variant routes matching (/tool/:slug and /tool/:slug/:variantSlug)
      const hashMatch = hash.match(/^#\/tools?\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/?/);
      if (hashMatch) {
        const slugVal = hashMatch[1];
        const subVal = hashMatch[2] || null;
        const resolvedSeo = getToolSeo(slugVal);
        const validVariant =
          subVal && resolvedSeo?.slug !== 'eu-funding-opportunities'
            ? getToolVariantSeo(resolvedSeo?.slug || slugVal, subVal)
            : null;
        setCurrentSlug(slugVal);
        setCurrentVariantSlug(validVariant ? validVariant.variantSlug : null);
        setCurrentCategorySlug(null);
        try {
          window.history.replaceState(
            {},
            '',
            validVariant ? `/tool/${resolvedSeo.slug}/${validVariant.variantSlug}` : `/tool/${slugVal}`
          );
        } catch (e) {}
        forceScrollToTop();
        return;
      }
      const pathMatch = window.location.pathname.match(/^\/tools?\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/?/);
      if (pathMatch) {
        const slugVal = pathMatch[1];
        const subVal = pathMatch[2] || null;
        const resolvedSeo = getToolSeo(slugVal);
        const validVariant =
          subVal && resolvedSeo?.slug !== 'eu-funding-opportunities'
            ? getToolVariantSeo(resolvedSeo?.slug || slugVal, subVal)
            : null;
        setCurrentSlug(slugVal);
        setCurrentVariantSlug(validVariant ? validVariant.variantSlug : null);
        setCurrentCategorySlug(null);
        forceScrollToTop();
        return;
      }
      const directLlmsMatch = window.location.pathname.match(/^\/(llms-txt(?:-(?:generator|checker|validator))?)\/?/);
      if (directLlmsMatch) {
        setCurrentSlug(directLlmsMatch[1]);
        setCurrentVariantSlug(null);
        setCurrentCategorySlug(null);
        forceScrollToTop();
        return;
      }
      const directHashLlmsMatch = hash.match(/^#\/(llms-txt(?:-(?:generator|checker|validator))?)\/?/);
      if (directHashLlmsMatch) {
        setCurrentSlug(directHashLlmsMatch[1]);
        setCurrentVariantSlug(null);
        setCurrentCategorySlug(null);
        try {
          window.history.replaceState({}, '', `/tool/llms-txt`);
        } catch (e) {}
        forceScrollToTop();
        return;
      }

      // 3. Category hub routes (/ai-tools, /seo-tools, /research-tools, etc.)
      const cleanCategoryPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (CATEGORIES[cleanCategoryPath]) {
        setCurrentCategorySlug(cleanCategoryPath);
        setSelectedCategory('All');
        setCurrentSlug(null);
        setCurrentVariantSlug(null);
        forceScrollToTop();
        return;
      }

      setCurrentCategorySlug(null);
      setCurrentSlug(null);
      setCurrentVariantSlug(null);
      forceScrollToTop();
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Guarantee scroll position is at the very top whenever active tool changes
  useEffect(() => {
    forceScrollToTop();
    const raf = requestAnimationFrame(forceScrollToTop);
    const t1 = setTimeout(forceScrollToTop, 50);
    const t2 = setTimeout(forceScrollToTop, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentSlug]);

  // Dynamic SEO Title, Open Graph, Twitter, Canonical & Breadcrumbs Management
  useEffect(() => {
    if (isResetPassword) return;
    const setMeta = (nameOrProp, keyAttr, value) => {
      let el = document.querySelector(`meta[${keyAttr}="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(keyAttr, nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    const setCanonical = (href) => {
      let el = document.querySelector('link[rel="canonical"]');
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    const activeRegistered = currentSlug ? getRegisteredTool(currentSlug) : null;
    const manifest = activeRegistered?.manifest;
    const toolSeo = currentSlug ? getToolSeo(currentSlug) : null;

    const ALL_JSONLD_IDS = [...Object.values(JSONLD_IDS), 'growth-jsonld', 'qr-breadcrumbs-jsonld'];
    const removeJsonLd = (keepIds = []) => {
      ALL_JSONLD_IDS.filter(id => !keepIds.includes(id)).forEach(id => {
        document.getElementById(id)?.remove();
      });
    };
    const upsertJsonLd = (id, data) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };
    const upsertJsonLdBlocks = (blocks) => {
      removeJsonLd(blocks.map(b => b.id));
      blocks.forEach(b => upsertJsonLd(b.id, b.data));
    };
    const cleanupToolJsonLd = () => removeJsonLd();

    setMeta('og:site_name', 'property', isGrowthView ? 'GrowthControl by Cerilas' : "Cerilas' Tools");
    setMeta('og:locale', 'property', 'en_US');

    if (isGrowthView) {
      const pageTitle = GROWTH_SEO.title;
      const pageDesc = GROWTH_SEO.description;
      const pageUrl = GROWTH_URL;
      const ogImgUrl = GROWTH_SEO.ogImage;

      document.title = pageTitle;
      setMeta('description', 'name', pageDesc);
      setMeta('keywords', 'name', GROWTH_SEO.keywords);
      setCanonical(pageUrl);

      setMeta('og:title', 'property', pageTitle);
      setMeta('og:description', 'property', pageDesc);
      setMeta('og:url', 'property', pageUrl);
      setMeta('og:image', 'property', ogImgUrl);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/png');
      setMeta('og:type', 'property', 'website');

      setMeta('twitter:card', 'name', 'summary_large_image');
      setMeta('twitter:title', 'name', pageTitle);
      setMeta('twitter:description', 'name', pageDesc);
      setMeta('twitter:image', 'name', ogImgUrl);

      removeJsonLd(['growth-jsonld']);
      upsertJsonLd('growth-jsonld', buildGrowthJsonLd());
      return;
    }

    if (isPricing) {
      const pageTitle = 'Pricing & Plans – Cerilas Tools | Transparent Zero-Surprise Pricing';
      const pageDesc = 'Explore flexible, transparent pricing plans for Cerilas Tools. Free forever tier, Pro with 5x higher limits, and Unlimited plans with 2 months free on annual billing.';
      const pageUrl = 'https://tools.cerilas.com/pricing';
      const ogImgUrl = 'https://tools.cerilas.com/og/growthcontrol.png';

      document.title = pageTitle;
      setMeta('description', 'name', pageDesc);
      setCanonical(pageUrl);

      // Open Graph
      setMeta('og:title', 'property', pageTitle);
      setMeta('og:description', 'property', pageDesc);
      setMeta('og:url', 'property', pageUrl);
      setMeta('og:image', 'property', ogImgUrl);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/png');
      setMeta('og:type', 'property', 'website');

      // Twitter Cards
      setMeta('twitter:card', 'name', 'summary_large_image');
      setMeta('twitter:title', 'name', pageTitle);
      setMeta('twitter:description', 'name', pageDesc);
      setMeta('twitter:image', 'name', ogImgUrl);
      cleanupToolJsonLd();
      return;
    }

    if (currentLegalSlug && LEGAL_DOCS[currentLegalSlug]) {
      const doc = LEGAL_DOCS[currentLegalSlug];
      const pageTitle = doc.seoTitle;
      const pageDesc = doc.seoDescription;
      const pageUrl = `https://tools.cerilas.com/legal/${currentLegalSlug}`;
      const ogImgUrl = 'https://tools.cerilas.com/og/growthcontrol.png';

      document.title = pageTitle;
      setMeta('description', 'name', pageDesc);
      setCanonical(pageUrl);

      // Open Graph
      setMeta('og:title', 'property', pageTitle);
      setMeta('og:description', 'property', pageDesc);
      setMeta('og:url', 'property', pageUrl);
      setMeta('og:image', 'property', ogImgUrl);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/png');

      // Twitter Card
      setMeta('twitter:title', 'name', pageTitle);
      setMeta('twitter:description', 'name', pageDesc);
      setMeta('twitter:url', 'name', pageUrl);
      setMeta('twitter:image', 'name', ogImgUrl);

      cleanupToolJsonLd();
      return;
    } else if (currentSlug && (toolSeo || manifest)) {
      // Preserve individual EU grant opportunity canonical & title on /tool/eu-funding-opportunities/:grantSlug
      const grantSubMatch = window.location.pathname.match(/^\/tools?\/eu-funding-opportunities\/([a-zA-Z0-9_-]+)\/?$/);
      if (grantSubMatch && grantSubMatch[1] && grantSubMatch[1] !== 'all') {
        const grantCanonical = `https://tools.cerilas.com/tool/eu-funding-opportunities/${grantSubMatch[1]}`;
        setCanonical(grantCanonical);
        setMeta('og:url', 'property', grantCanonical);
        setMeta('twitter:url', 'name', grantCanonical);
        return;
      }

      const canonicalSlug = toolSeo?.slug || manifest?.slug || currentSlug;
      const activeVariant = currentVariantSlug && toolSeo ? getToolVariantSeo(canonicalSlug, currentVariantSlug) : null;

      const pageTitle = activeVariant
        ? activeVariant.title
        : (toolSeo?.title || manifest?.seo?.title || `${manifest?.title || 'Tool'} | Cerilas Tools`);
      const pageDesc = activeVariant
        ? activeVariant.description
        : (toolSeo?.description || manifest?.seo?.description || manifest?.shortDescription || '');
      const pageKeywords = activeVariant
        ? (activeVariant.keywords || toolSeo?.keywords || '')
        : (toolSeo?.keywords || manifest?.seo?.keywords || '');
      const pageUrl = activeVariant
        ? `https://tools.cerilas.com/tool/${canonicalSlug}/${activeVariant.variantSlug}`
        : `https://tools.cerilas.com/tool/${canonicalSlug}`;
      const ogImgUrl = toolSeo?.ogImage || `https://tools.cerilas.com/og/${canonicalSlug}.png`;
      const ogImgAlt = pageTitle;

      document.title = pageTitle;
      setMeta('description', 'name', pageDesc);
      if (pageKeywords) setMeta('keywords', 'name', pageKeywords);
      setCanonical(pageUrl);

      // Open Graph
      setMeta('og:title', 'property', pageTitle);
      setMeta('og:description', 'property', pageDesc);
      setMeta('og:url', 'property', pageUrl);
      setMeta('og:image', 'property', ogImgUrl);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', ogImgUrl.endsWith('.png') ? 'image/png' : 'image/webp');
      setMeta('og:image:alt', 'property', ogImgAlt);

      // Twitter Card
      setMeta('twitter:card', 'name', 'summary_large_image');
      setMeta('twitter:title', 'name', pageTitle);
      setMeta('twitter:description', 'name', pageDesc);
      setMeta('twitter:url', 'name', pageUrl);
      setMeta('twitter:image', 'name', ogImgUrl);
      setMeta('twitter:image:alt', 'name', ogImgAlt);

      if (activeVariant && toolSeo) {
        upsertJsonLdBlocks(buildToolVariantJsonLdBlocks(toolSeo, activeVariant));
      } else {
        upsertJsonLdBlocks(buildToolJsonLdBlocks({
          ...(toolSeo || {}),
          slug: canonicalSlug,
          name: toolSeo?.name || manifest?.title,
          h1: toolSeo?.h1 || pageTitle,
          description: pageDesc,
          category: toolSeo?.category || manifest?.category || 'Utilities',
          faq: toolSeo?.faq || manifest?.faq || []
        }, { includeFaq: Boolean(toolSeo?.centralFaqSchema) }));
      }
    } else if (currentCategorySlug && CATEGORIES[currentCategorySlug]) {
      const cat = CATEGORIES[currentCategorySlug];
      const catUrl = `https://tools.cerilas.com/${cat.slug}`;
      const catOgImg = cat.ogImage || 'https://tools.cerilas.com/og/growthcontrol.png';

      document.title = cat.title;
      setMeta('description', 'name', cat.description);
      if (cat.keywords) setMeta('keywords', 'name', cat.keywords);
      setCanonical(catUrl);
      setMeta('og:title', 'property', cat.title);
      setMeta('og:description', 'property', cat.description);
      setMeta('og:url', 'property', catUrl);
      setMeta('og:image', 'property', catOgImg);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/png');
      setMeta('twitter:card', 'name', 'summary_large_image');
      setMeta('twitter:title', 'name', cat.title);
      setMeta('twitter:description', 'name', cat.description);
      setMeta('twitter:url', 'name', catUrl);
      setMeta('twitter:image', 'name', catOgImg);
      cleanupToolJsonLd();
    } else {
      const homeTitle = "Cerilas' Tools & GrowthControl | AI Visibility Tracker, GEO & Free Web Utilities";
      const homeDesc = 'Explore 30+ free, in-browser privacy-focused AI, SEO, developer, and file tools, plus GrowthControl — the AI visibility tracker and GEO platform for ChatGPT, Gemini, Perplexity & Claude.';
      const homeUrl = 'https://tools.cerilas.com/';
      const homeOgImg = 'https://tools.cerilas.com/og/growthcontrol.png';

      document.title = homeTitle;
      setMeta('description', 'name', homeDesc);
      setCanonical(homeUrl);
      setMeta('og:title', 'property', homeTitle);
      setMeta('og:description', 'property', homeDesc);
      setMeta('og:url', 'property', homeUrl);
      setMeta('og:image', 'property', homeOgImg);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/png');
      setMeta('twitter:title', 'name', homeTitle);
      setMeta('twitter:description', 'name', homeDesc);
      setMeta('twitter:url', 'name', homeUrl);
      setMeta('twitter:image', 'name', homeOgImg);

      cleanupToolJsonLd();
    }

    // Google Analytics (GA4) Page View tracking for SPA route transitions
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.hash
      });
    }
  }, [currentSlug, currentVariantSlug, currentCategorySlug, currentLegalSlug, isPricing, isGrowthView, tools, language]);

  // Fetch active tools from database
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) return;
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const registered = getAllRegisteredTools();
          const merged = registered.map((reg) => {
            const dbTool = result.data.find((d) => d.slug === reg.slug);
            if (!dbTool) return reg;
            const desc = dbTool.short_description || dbTool.description || reg.short_description || reg.shortDescription || '';
            return { 
              ...reg, 
              ...dbTool,
              title: reg.title || dbTool.title,
              short_description: desc,
              shortDescription: desc
            };
          });
          result.data.forEach((dbTool) => {
            if (!merged.find((m) => m.slug === dbTool.slug)) {
              const desc = dbTool.short_description || dbTool.description || '';
              merged.push({
                ...dbTool,
                short_description: desc,
                shortDescription: desc
              });
            }
          });
          setTools(merged);
        }
      } catch (error) {
        console.warn('Backend unavailable, using local tool registry:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, [currentSlug]);

  // Sync real-time updates when an analytics event occurs
  useEffect(() => {
    const handleStatsUpdated = (e) => {
      const { slug, stats } = e.detail || {};
      if (!slug || !stats) return;
      setTools((prev) => prev.map((item) => {
        if (item.slug === slug) {
          return {
            ...item,
            ...stats
          };
        }
        return item;
      }));
    };

    window.addEventListener('tool_stats_updated', handleStatsUpdated);
    return () => window.removeEventListener('tool_stats_updated', handleStatsUpdated);
  }, []);

  const navigateToPricing = () => {
    forceScrollToTop();
    setIsPricing(true);
    setIsGrowthView(false);
    setIsAccountView(false);
    setCurrentLegalSlug(null);
    setCurrentCategorySlug(null);
    setCurrentSlug(null);
    setCurrentVariantSlug(null);
    window.history.pushState({}, '', '/pricing');
    forceScrollToTop();
  };

  const navigateToGrowth = () => {
    forceScrollToTop();
    setIsGrowthView(true);
    setIsPricing(false);
    setIsAccountView(false);
    setCurrentLegalSlug(null);
    setCurrentCategorySlug(null);
    setCurrentSlug(null);
    setCurrentVariantSlug(null);
    window.history.pushState({}, '', '/growth');
    forceScrollToTop();
  };

  const navigateToTool = (slug) => {
    forceScrollToTop();
    setIsGrowthView(false);
    setIsPricing(false);
    setIsAccountView(false);
    setCurrentLegalSlug(null);
    setCurrentCategorySlug(null);
    setCurrentSlug(slug);
    setCurrentVariantSlug(null);
    window.history.pushState({}, '', `/tool/${slug}`);
    forceScrollToTop();
  };

  const navigateToHome = () => {
    forceScrollToTop();
    setIsGrowthView(false);
    setIsPricing(false);
    setIsAccountView(false);
    setCurrentLegalSlug(null);
    setCurrentCategorySlug(null);
    setCurrentSlug(null);
    setCurrentVariantSlug(null);
    window.history.pushState({}, '', '/');
    forceScrollToTop();
  };

  const navigateToAccount = (tab = 'package') => {
    forceScrollToTop();
    setIsGrowthView(false);
    setIsPricing(false);
    setIsAccountView(true);
    setAccountTab(tab);
    setCurrentLegalSlug(null);
    setCurrentSlug(null);
    setCurrentVariantSlug(null);
    window.location.hash = `#/account?tab=${tab}`;
    forceScrollToTop();
  };

  // Find active tool configuration from registry (supporting aliases)
  const activeRegistered = currentSlug ? getRegisteredTool(currentSlug) : null;
  const ActiveToolComponent = activeRegistered ? activeRegistered.component : null;
  const activeToolMeta = tools.find((tItem) => tItem.slug === currentSlug || tItem.slug === activeRegistered?.manifest?.slug) || activeRegistered?.manifest;

  // Dynamic categories list
  const categories = Array.from(new Set(['All', 'AI Assisted', ...tools.map((t) => t.category).filter(Boolean)]));

  // Filter tools for catalog search and selected category
  const filteredTools = tools.filter((tool) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tool.title.toLowerCase().includes(q) ||
      (tool.short_description && tool.short_description.toLowerCase().includes(q)) ||
      (tool.category && tool.category.toLowerCase().includes(q));

    let matchesCategory = true;
    if (selectedCategory === 'AI Assisted') {
      matchesCategory = tool.isAi || tool.badge?.includes('AI') || tool.slug === 'ats-resume-checker';
    } else if (selectedCategory !== 'All') {
      matchesCategory = tool.category === selectedCategory;
    } else if (currentCategorySlug && CATEGORIES[currentCategorySlug]) {
      matchesCategory = CATEGORIES[currentCategorySlug].toolSlugs.includes(tool.slug);
    }

    return matchesSearch && matchesCategory;
  });

  if (isAdmin) {
    return (
      <ErrorBoundary>
        <AdminDashboard />
      </ErrorBoundary>
    );
  }

  if (isResetPassword) {
    return (
      <ErrorBoundary>
        <ResetPasswordPage />
      </ErrorBoundary>
    );
  }

  if (isGrowthView) {
    return (
      <ErrorBoundary>
        <GrowthApp onBackToTools={navigateToHome} />
        <AuthModal />
        <RevenueCatPaywallModal 
          isOpen={isPaywallOpen}
          initialProductId={paywallInitialProduct}
          initialCycle={paywallInitialCycle}
          onClose={() => setIsPaywallOpen(false)}
        />
        <RevenueCatCustomerCenterModal
          isOpen={isCustomerCenterOpen}
          onClose={() => setIsCustomerCenterOpen(false)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="app-layout">
      <Navbar 
        activeTool={activeToolMeta} 
        onNavigateHome={navigateToHome}
        onOpenStats={() => setIsStatsOpen(true)}
        onSelectTool={navigateToTool}
      />

      <div className="main-content">
        {isPricing ? (
          <ErrorBoundary>
            <PricingView onBack={navigateToHome} />
          </ErrorBoundary>
        ) : isAccountView ? (
          <ErrorBoundary>
            <AccountDashboard initialTab={accountTab} onBack={navigateToHome} />
          </ErrorBoundary>
        ) : currentLegalSlug ? (
          <ErrorBoundary>
            <LegalView initialSlug={currentLegalSlug} onBack={navigateToHome} />
          </ErrorBoundary>
        ) : ActiveToolComponent ? (
          <ErrorBoundary>
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(150,150,150,0.2)', borderTopColor: 'var(--text-main)', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 300 }}>Loading workspace...</p>
              </div>
            }>
              <ToolScrollResetWrapper slug={currentVariantSlug ? `${currentSlug}/${currentVariantSlug}` : currentSlug}>
                <ActiveToolComponent onBack={navigateToHome} toolMeta={activeToolMeta} />
                <ToolSeoMesh slug={activeRegistered?.manifest?.slug || currentSlug} variantSlug={currentVariantSlug} />
              </ToolScrollResetWrapper>
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="home-catalog-root">
            <section 
              ref={heroBannerRef}
              className="catalog-hero-banner"
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
            >
              <div className="catalog-hero-bg">
                <img 
                  ref={heroImgRef}
                  src="/hero-bg.webp" 
                  alt="" 
                  fetchPriority="high"
                  className="catalog-hero-img"
                  onError={(e) => {
                    if (!e.target.dataset.triedJpg) {
                      e.target.dataset.triedJpg = 'true';
                      e.target.src = '/hero-bg.jpg';
                    }
                  }}
                />
                <div className="catalog-hero-overlay" />
                <div ref={heroGlowRef} className="catalog-hero-glow" />
              </div>

              <div className="catalog-hero-content">
                <header className="header hero-header">
                  <div className="hero-brand-badge">
                    <img 
                      src="/cgrowthlogo.svg" 
                      alt="Cerilas' Tools" 
                      className="hero-brand-logo"
                      onError={(e) => {
                        if (!e.target.dataset.triedFallback) {
                          e.target.dataset.triedFallback = 'true';
                          e.target.src = '/platform-logo.webp';
                        }
                      }}
                    />
                    <h1 className="hero-brand-title">
                      {currentCategorySlug && CATEGORIES[currentCategorySlug] ? (
                        CATEGORIES[currentCategorySlug].h1
                      ) : (
                        <>Cerilas' <span className="brand-bold-word">Tools</span></>
                      )}
                    </h1>
                  </div>
                  <p className="hero-brand-subtitle">
                    {currentCategorySlug && CATEGORIES[currentCategorySlug]
                      ? CATEGORIES[currentCategorySlug].shortDescription
                      : t('catalog.subtitle')}
                  </p>
                </header>

                <div className="search-container hero-search-container">
                  <div className="search-bar hero-search-bar">
                    <Search className="search-icon hero-search-icon" size={20} strokeWidth={1.5} />
                    <input 
                      type="text" 
                      className="search-input hero-search-input" 
                      placeholder={t('catalog.searchPlaceholder')}
                      spellCheck="false"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="container catalog-container">

            {/* Category Filter Bar for Scalable Navigation */}
            <div className="category-filter-bar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', margin: '1rem 0 2rem 0' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    border: selectedCategory === cat ? '1px solid var(--text-main)' : '1px solid var(--card-border)',
                    background: selectedCategory === cat ? 'var(--text-main)' : 'var(--card-bg)',
                    color: selectedCategory === cat ? 'var(--bg-color)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: selectedCategory === cat ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {cat === 'AI Assisted' && <Sparkles size={12} />}
                  {cat}
                </button>
              ))}
            </div>

            <main className="grid">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <ToolCard 
                    key={tool.id || tool.slug}
                    tool={tool}
                    onSelect={navigateToTool}
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {t('catalog.noResults')}
                </div>
              )}
            </main>
          </div>
        </div>
        )}
      </div>

      <Footer 
        onOpenStats={() => setIsStatsOpen(true)} 
        onNavigatePricing={navigateToPricing}
      />

      <StatsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
      />

      <AuthModal />
      <RevenueCatPaywallModal 
        isOpen={isPaywallOpen}
        initialProductId={paywallInitialProduct}
        initialCycle={paywallInitialCycle}
        onClose={() => setIsPaywallOpen(false)}
      />
      <RevenueCatCustomerCenterModal
        isOpen={isCustomerCenterOpen}
        onClose={() => setIsCustomerCenterOpen(false)}
      />
    </div>
  );
}
