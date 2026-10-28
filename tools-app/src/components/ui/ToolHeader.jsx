import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getToolSeo, getToolVariantSeo } from '../../seo/toolsSeoRegistry';
import './ToolHeader.css';

const spaNavigate = (e, href, fallbackCb) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  if (href === '/' && typeof fallbackCb === 'function') {
    fallbackCb();
    return;
  }
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export default function ToolHeader({
  title,
  subtitle,
  description,
  onBack,
  backLabel = 'All Tools',
  badges = null,
  actions = null,
  center = false,
  className = '',
  slug = null,
  logo = null
}) {
  // Auto-detect tool slug & optional long-tail variant slug from URL
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const pathMatch = pathname.match(/^\/tools?\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/?$/);
  const hashMatch = hash.match(/tools?\/([a-zA-Z0-9_-]+)/);

  const currentUrlSlug = pathMatch?.[1] || hashMatch?.[1] || null;
  const effectiveSlug = slug || currentUrlSlug;
  const toolSeo = effectiveSlug ? getToolSeo(effectiveSlug) : null;
  const canonicalSlug = toolSeo?.slug || effectiveSlug;

  const candidateVariantSlug = pathMatch?.[2] || null;
  const activeVariant =
    canonicalSlug && candidateVariantSlug && canonicalSlug !== 'eu-funding-opportunities'
      ? getToolVariantSeo(canonicalSlug, candidateVariantSlug)
      : null;

  const displayTitle = activeVariant ? activeVariant.h1 : title;
  const displaySubtitle = activeVariant ? activeVariant.lead : (subtitle || description);
  const logoSrc = logo || (canonicalSlug ? `/tool-icons/${canonicalSlug}.webp` : null);

  return (
    <div className={`c-tool-header-wrapper ${className}`}>
      <div className="c-tool-nav">
        <div className="c-tool-nav-left">
          <a
            href="/"
            className="c-tool-back-btn"
            onClick={(e) => spaNavigate(e, '/', onBack)}
            aria-label={backLabel}
          >
            <ArrowLeft size={15} />
            <span>{backLabel}</span>
          </a>

          {toolSeo?.categorySlug && (
            <nav aria-label="Breadcrumb" className="c-tool-breadcrumb">
              <ChevronRight size={13} className="c-tool-breadcrumb-sep" aria-hidden="true" />
              <a
                href={`/${toolSeo.categorySlug}`}
                className="c-tool-breadcrumb-link"
                onClick={(e) => spaNavigate(e, `/${toolSeo.categorySlug}`)}
              >
                {toolSeo.category}
              </a>
              {activeVariant ? (
                <>
                  <ChevronRight size={13} className="c-tool-breadcrumb-sep" aria-hidden="true" />
                  <a
                    href={`/tool/${canonicalSlug}`}
                    className="c-tool-breadcrumb-link"
                    onClick={(e) => spaNavigate(e, `/tool/${canonicalSlug}`)}
                  >
                    {toolSeo.name}
                  </a>
                  <ChevronRight size={13} className="c-tool-breadcrumb-sep" aria-hidden="true" />
                  <span className="c-tool-breadcrumb-current" aria-current="page">
                    {activeVariant.name}
                  </span>
                </>
              ) : (
                <>
                  <ChevronRight size={13} className="c-tool-breadcrumb-sep" aria-hidden="true" />
                  <span className="c-tool-breadcrumb-current" aria-current="page">
                    {toolSeo.name}
                  </span>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="c-tool-nav-right">
          {badges && <div className="c-tool-header-badges">{badges}</div>}
          {actions && <div className="c-tool-header-actions">{actions}</div>}
        </div>
      </div>

      <div className={`c-tool-title-area ${center ? 'center' : ''}`}>
        <div 
          className={`c-tool-title-row ${center ? 'center' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            justifyContent: center ? 'center' : 'flex-start',
            marginBottom: '0.35rem'
          }}
        >
          {logoSrc && (
            <img 
              src={logoSrc} 
              alt="" 
              className="c-tool-header-apple-logo"
              width={42}
              height={42}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12))',
                flexShrink: 0
              }}
              onError={(e) => {
                if (!e.target.dataset.triedPng && canonicalSlug) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = `/tool-icons/${canonicalSlug}.png`;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          )}
          <h1 className="c-tool-title" style={{ margin: 0 }}>{displayTitle}</h1>
        </div>
        {displaySubtitle && <p className="c-tool-subtitle">{displaySubtitle}</p>}
      </div>
    </div>
  );
}
