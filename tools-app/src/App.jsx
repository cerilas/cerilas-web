import React, { useState, useEffect, Suspense } from 'react';
import { Search, ArrowRight, Box, QrCode, Minimize2, Image as ImageIcon, Clock, FileText, FileCheck, Sparkles, SlidersHorizontal, Database, Cpu, PenTool, Video, Webhook, Braces, Mail, Users, Activity } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StatsModal from './components/StatsModal';
import AdSlot from './components/ui/AdSlot';
import ErrorBoundary from './components/ErrorBoundary';
import { toolsRegistry, getAllRegisteredTools, getRegisteredTool } from './tools/registry';
import { useTranslation } from './i18n';
import { getConversionCount, getConversionLabel, getShortConversionLabel } from './utils/toolMetrics';
import './index.css';

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
  Mail
};

const ToolCard = ({ tool, onSelect }) => {
  const { t, language } = useTranslation();
  const IconComponent = ICON_MAP[tool.icon_name] || Box;
  const isAi = tool.isAi || tool.badge === 'AI Assisted' || tool.badge === 'AI Powered' || tool.slug === 'ats-resume-checker';

  const conversionCount = getConversionCount(tool);
  const shortLabel = getShortConversionLabel(tool.slug, language || 'en');
  const visitorCount = tool.unique_visitors_count || 0;

  const visitorText = visitorCount > 0 
    ? `${visitorCount.toLocaleString()} ${language === 'tr' ? 'ziyaretçi' : 'visitors'}` 
    : (language === 'tr' ? 'Yeni araç' : 'New tool');

  return (
    <div 
      className="card" 
      onClick={() => onSelect(tool.slug)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div className="icon-wrapper" style={{ flexShrink: 0 }}>
          <IconComponent strokeWidth={1.5} size={28} />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
          <span className="card-stat-pill" style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            background: 'rgba(150, 150, 150, 0.1)',
            color: 'var(--text-muted)'
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
              fontWeight: '600'
            }}>
              <Activity size={11} strokeWidth={2.2} />
              <span>{conversionCount.toLocaleString()} {shortLabel}</span>
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
      <p>{tool.short_description}</p>
      
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
    </div>
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
  const { t } = useTranslation();
  const [tools, setTools] = useState(() => getAllRegisteredTools());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentSlug, setCurrentSlug] = useState(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Sync hash and path routing for both SPA navigation and web crawler indexing
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const hashMatch = hash.match(/^#\/tools?\/([a-zA-Z0-9_-]+)\/?/);
      if (hashMatch) {
        setCurrentSlug(hashMatch[1]);
        return;
      }
      const pathMatch = window.location.pathname.match(/^\/tools?\/([a-zA-Z0-9_-]+)\/?/);
      if (pathMatch) {
        setCurrentSlug(pathMatch[1]);
        return;
      }
      setCurrentSlug(null);
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Dynamic SEO Title, Open Graph, Twitter, Canonical & Breadcrumbs Management
  useEffect(() => {
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

    if (manifest && manifest.seo) {
      const seo = manifest.seo;
      const pageTitle = seo.title || `${manifest.title} | Cerilas Tools`;
      const pageDesc = seo.description || manifest.shortDescription;
      const pageKeywords = seo.keywords || '';
      const pageUrl = window.location.pathname.startsWith('/tool/')
        ? `https://tools.cerilas.com${window.location.pathname}`
        : `https://tools.cerilas.com/#/tool/${currentSlug}`;
      const ogImgUrl = seo.ogImage || 'https://tools.cerilas.com/og-image.svg';
      const ogImgAlt = seo.ogImageAlt || pageTitle;

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
      setMeta('og:image:type', 'property', 'image/svg+xml');
      setMeta('og:image:alt', 'property', ogImgAlt);

      // Twitter Card
      setMeta('twitter:title', 'name', pageTitle);
      setMeta('twitter:description', 'name', pageDesc);
      setMeta('twitter:url', 'name', pageUrl);
      setMeta('twitter:image', 'name', ogImgUrl);
      setMeta('twitter:image:alt', 'name', ogImgAlt);

      // Breadcrumbs Structured Data
      let bcScript = document.getElementById('tool-breadcrumbs-jsonld');
      if (!bcScript) {
        bcScript = document.createElement('script');
        bcScript.id = 'tool-breadcrumbs-jsonld';
        bcScript.type = 'application/ld+json';
        document.head.appendChild(bcScript);
      }
      bcScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Cerilas Tools',
            'item': 'https://tools.cerilas.com/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': manifest.category || 'Utilities',
            'item': 'https://tools.cerilas.com/#/'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': seo.breadcrumbsName || manifest.title,
            'item': pageUrl
          }
        ]
      });
    } else {
      const homeTitle = 'Cerilas Tools | Free QR Code Generator & Advanced Utilities';
      const homeDesc = 'Minimalist, privacy-focused web tools and utilities built by Cerilas High Tech.';
      const homeUrl = 'https://tools.cerilas.com/';
      const homeOgImg = 'https://tools.cerilas.com/og-image.svg';

      document.title = homeTitle;
      setMeta('description', 'name', homeDesc);
      setCanonical(homeUrl);
      setMeta('og:title', 'property', homeTitle);
      setMeta('og:description', 'property', homeDesc);
      setMeta('og:url', 'property', homeUrl);
      setMeta('og:image', 'property', homeOgImg);
      setMeta('og:image:width', 'property', '1200');
      setMeta('og:image:height', 'property', '630');
      setMeta('og:image:type', 'property', 'image/svg+xml');
      setMeta('twitter:title', 'name', homeTitle);
      setMeta('twitter:description', 'name', homeDesc);
      setMeta('twitter:url', 'name', homeUrl);
      setMeta('twitter:image', 'name', homeOgImg);

      const bcScript = document.getElementById('tool-breadcrumbs-jsonld');
      if (bcScript) bcScript.remove();
      const oldBc = document.getElementById('qr-breadcrumbs-jsonld');
      if (oldBc) oldBc.remove();
    }
  }, [currentSlug]);

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
            return dbTool ? { ...reg, ...dbTool } : reg;
          });
          result.data.forEach((dbTool) => {
            if (!merged.find((m) => m.slug === dbTool.slug)) {
              merged.push(dbTool);
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

  const navigateToTool = (slug) => {
    window.location.hash = `#/tool/${slug}`;
  };

  const navigateToHome = () => {
    window.location.hash = '#/';
  };

  // Find active tool configuration from registry
  const activeRegistered = currentSlug ? toolsRegistry[currentSlug] : null;
  const ActiveToolComponent = activeRegistered ? activeRegistered.component : null;
  const activeToolMeta = tools.find((tItem) => tItem.slug === currentSlug) || activeRegistered?.manifest;

  // Dynamic categories list
  const categories = ['All', 'AI Assisted', ...new Set(tools.map((t) => t.category).filter(Boolean))];

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
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-layout">
      <Navbar 
        activeTool={activeToolMeta} 
        onNavigateHome={navigateToHome}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      <div className="main-content">
        {ActiveToolComponent ? (
          <ErrorBoundary>
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(150,150,150,0.2)', borderTopColor: 'var(--text-main)', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 300 }}>Loading workspace...</p>
              </div>
            }>
              <ActiveToolComponent onBack={navigateToHome} toolMeta={activeToolMeta} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="container">
            <header className="header">
              <h1>{t('catalog.title')}</h1>
              <p>{t('catalog.subtitle')}</p>
            </header>

            <div className="search-container">
              <div className="search-bar">
                <Search className="search-icon" size={20} strokeWidth={1.5} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder={t('catalog.searchPlaceholder')}
                  spellCheck="false"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

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

            {/* Google AdSense Slot: Top Leaderboard (728x90 / 320x50) */}
            <AdSlot format="leaderboard" slotId="ad-catalog-top-leaderboard" />

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

            {/* Google AdSense Slot: Bottom Billboard / Responsive */}
            <AdSlot format="billboard" slotId="ad-catalog-bottom-billboard" />
          </div>
        )}
      </div>

      <Footer />

      <StatsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
      />
    </div>
  );
}
