import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { getToolSeo, getToolVariantSeo, getVariantsForTool } from '../seo/toolsSeoRegistry';
import SearchableHidden from './ui/SearchableHidden';
import './ToolSeoMesh.css';

const spaNavigate = (e, href) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export default function ToolSeoMesh({ slug, variantSlug = null }) {
  const [openFaq, setOpenFaq] = useState(0);

  if (!slug) return null;
  const toolSeo = getToolSeo(slug);
  if (!toolSeo) return null;

  const canonicalSlug = toolSeo.slug;
  const activeVariant =
    variantSlug && canonicalSlug !== 'eu-funding-opportunities'
      ? getToolVariantSeo(canonicalSlug, variantSlug)
      : null;

  const variants = getVariantsForTool(canonicalSlug);
  const relatedTools = (toolSeo.relatedTools || [])
    .map((relSlug) => getToolSeo(relSlug))
    .filter((rel) => rel && rel.slug !== canonicalSlug);

  return (
    <aside className="c-seo-mesh-wrapper" aria-label="Related workflows and tools">
      <div className="c-seo-mesh-inner">
        {activeVariant && (
          <section className="c-variant-dossier" id="variant-howto">
            {activeVariant.technicalSpec && (
              <div className="c-variant-spec-box">
                <span className="c-variant-spec-label">Specification</span>
                <span>{activeVariant.technicalSpec}</span>
              </div>
            )}

            {activeVariant.steps?.length > 0 && (
              <div>
                <h2 className="c-variant-section-title">How It Works: {activeVariant.name}</h2>
                <ol className="c-variant-steps-list">
                  {activeVariant.steps.map((step, idx) => (
                    <li key={idx} className="c-variant-step-card">
                      <span className="c-variant-step-num">Step {idx + 1}</span>
                      <h3 className="c-variant-step-name">{step.name}</h3>
                      <p className="c-variant-step-text">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {activeVariant.faq?.length > 0 && (
              <div>
                <h2 className="c-variant-section-title">Frequently Asked Questions — {activeVariant.name}</h2>
                <div className="c-variant-faq-list">
                  {activeVariant.faq.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} className="c-variant-faq-item">
                        <button
                          type="button"
                          className="c-variant-faq-btn"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={16}
                            style={{
                              flexShrink: 0,
                              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </button>
                        <SearchableHidden isOpen={isOpen} onReveal={() => setOpenFaq(idx)}>
                          <div className="c-variant-faq-answer-inner">{item.a}</div>
                        </SearchableHidden>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <a
                href={`/tool/${canonicalSlug}`}
                className="c-mesh-cat-link"
                onClick={(e) => spaNavigate(e, `/tool/${canonicalSlug}`)}
              >
                <span>Open full {toolSeo.name} overview &amp; complete documentation</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </section>
        )}

        {variants.length > 0 && (
          <section>
            <div className="c-mesh-section-header">
              <h2 className="c-mesh-heading">Popular {toolSeo.name} Workflows &amp; Specific Use Cases</h2>
              <a
                href={`/tool/${canonicalSlug}`}
                className="c-mesh-cat-link"
                onClick={(e) => spaNavigate(e, `/tool/${canonicalSlug}`)}
              >
                <span>Main {toolSeo.name}</span>
              </a>
            </div>
            <div className="c-mesh-workflows-grid">
              {variants.map((v) => {
                const href = `/tool/${canonicalSlug}/${v.variantSlug}`;
                const isActive = activeVariant?.variantSlug === v.variantSlug;
                return (
                  <a
                    key={v.variantSlug}
                    href={href}
                    className={`c-mesh-workflow-card ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => spaNavigate(e, href)}
                  >
                    <span className="c-mesh-workflow-title">{v.name}</span>
                    <ArrowRight size={15} style={{ flexShrink: 0, opacity: 0.65 }} />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {relatedTools.length > 0 && (
          <section>
            <div className="c-mesh-section-header">
              <h2 className="c-mesh-heading">Related Free {toolSeo.category || 'Web'} Utilities</h2>
              {toolSeo.categorySlug && (
                <a
                  href={`/${toolSeo.categorySlug}`}
                  className="c-mesh-cat-link"
                  onClick={(e) => spaNavigate(e, `/${toolSeo.categorySlug}`)}
                >
                  <span>Browse all {toolSeo.category}</span>
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
            <div className="c-mesh-related-grid">
              {relatedTools.map((rel) => {
                const href = `/tool/${rel.slug}`;
                return (
                  <a
                    key={rel.slug}
                    href={href}
                    className="c-mesh-related-card"
                    onClick={(e) => spaNavigate(e, href)}
                  >
                    <img
                      src={`/tool-icons/${rel.slug}.webp`}
                      alt=""
                      width={38}
                      height={38}
                      loading="lazy"
                      className="c-mesh-related-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="c-mesh-related-body">
                      <h3 className="c-mesh-related-name">{rel.name}</h3>
                      <p className="c-mesh-related-desc">{rel.shortDescription || rel.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <section className="c-mesh-growth-banner">
          <div className="c-mesh-growth-copy">
            <h3 className="c-mesh-growth-title">
              Does ChatGPT, Gemini, Perplexity, or Claude recommend your brand?
            </h3>
            <p className="c-mesh-growth-sub">
              Run a free instant AI Brand Visibility Audit or monitor daily Generative Engine Optimization (GEO) citations alongside Google Search Console in GrowthControl.
            </p>
          </div>
          <div className="c-mesh-growth-actions">
            {canonicalSlug !== 'ai-visibility-checker' && (
              <a
                href="/tool/ai-visibility-checker"
                className="c-mesh-btn-secondary"
                onClick={(e) => spaNavigate(e, '/tool/ai-visibility-checker')}
              >
                <span>Free AI Visibility Check</span>
              </a>
            )}
            <a
              href="/growth"
              className="c-mesh-btn-primary"
              onClick={(e) => spaNavigate(e, '/growth')}
            >
              <Sparkles size={14} />
              <span>Explore GrowthControl</span>
            </a>
          </div>
        </section>
      </div>
    </aside>
  );
}
