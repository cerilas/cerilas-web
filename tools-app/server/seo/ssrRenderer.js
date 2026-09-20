import { getToolSeo, CATEGORIES, TOOLS_SEO_REGISTRY } from './toolsSeoRegistry.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips hardcoded default meta tags from raw HTML template to prevent duplicate tags
 */
export function stripOldMetaTags(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["'](description|keywords|title|robots)["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
}

/**
 * Pre-renders semantic HTML and dynamic SEO metadata for a tool page.
 */
export function renderToolPageHtml(templateHtml, slug) {
  const tool = getToolSeo(slug);
  const canonicalUrl = `https://tools.cerilas.com/tool/${tool.slug}`;
  const ogImg = `https://tools.cerilas.com/tool-icons/${tool.slug}.webp`;
  const fallbackOgImg = 'https://tools.cerilas.com/og-image.svg';

  // Build JSON-LD structured data
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    headline: tool.h1,
    description: tool.description,
    applicationCategory: tool.category || 'Utilities',
    operatingSystem: 'All (Modern Web Browser)',
    url: canonicalUrl,
    browserRequirements: 'Requires JavaScript and HTML5 Canvas / WebAssembly support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tool.rating || '4.9',
      ratingCount: tool.ratingCount || '1000',
      bestRating: '5',
      worstRating: '1'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Cerilas Tools',
        item: 'https://tools.cerilas.com/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.category,
        item: `https://tools.cerilas.com/${tool.categorySlug}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: canonicalUrl
      }
    ]
  };

  const faqSchema = tool.faq && tool.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  } : null;

  // Build Related Tools semantic links
  const relatedToolsHtml = (tool.relatedTools || [])
    .map(relSlug => {
      const relTool = getToolSeo(relSlug);
      return `
        <article class="ssr-related-card" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; background: rgba(255,255,255,0.02);">
          <h3 style="margin: 0 0 0.35rem 0; font-size: 1.05rem;">
            <a href="/tool/${relTool.slug}" style="color: inherit; text-decoration: none; font-weight: 600;">
              ${escapeHtml(relTool.name)} &rarr;
            </a>
          </h3>
          <p style="margin: 0; font-size: 0.88rem; color: #94a3b8; line-height: 1.4;">
            ${escapeHtml(relTool.shortDescription)}
          </p>
        </article>
      `;
    })
    .join('');

  // Assemble the pre-rendered SSR HTML body to be placed inside <div id="root">
  const ssrBodyHtml = `
    <div id="ssr-seo-content" class="ssr-seo-wrapper" style="max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; line-height: 1.6;">
      <nav aria-label="Breadcrumb" class="ssr-breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.85rem; color: #94a3b8;">
        <a href="/" style="color: #38bdf8; text-decoration: none;">Cerilas Tools</a>
        <span style="margin: 0 0.5rem;">/</span>
        <a href="/${tool.categorySlug}" style="color: #38bdf8; text-decoration: none;">${escapeHtml(tool.category)}</a>
        <span style="margin: 0 0.5rem;">/</span>
        <span aria-current="page" style="color: #cbd5e1;">${escapeHtml(tool.name)}</span>
      </nav>

      <header class="ssr-header" style="margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">
        <div style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">
          ${escapeHtml(tool.category)}
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 700; margin: 0 0 1rem 0; letter-spacing: -0.025em; line-height: 1.2;">
          ${escapeHtml(tool.h1)}
        </h1>
        <p class="ssr-short-desc" style="font-size: 1.15rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
          ${escapeHtml(tool.shortDescription)}
        </p>
      </header>

      <main class="ssr-main-article" style="display: grid; gap: 2.5rem;">
        <section class="ssr-section ssr-how-it-works">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #f8fafc;">How It Works</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 1rem; line-height: 1.65;">
            ${escapeHtml(tool.howItWorks)}
          </p>
        </section>

        ${tool.formula ? `
        <section class="ssr-section ssr-formula">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #f8fafc;">Formula &amp; Technical Methodology</h2>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1.25rem; margin-top: 0.5rem; overflow-x: auto;">
            <code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.95rem; color: #38bdf8; white-space: pre-wrap; word-break: break-word;">${escapeHtml(tool.formula)}</code>
          </div>
        </section>
        ` : ''}

        <section class="ssr-section ssr-when-to-use">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #f8fafc;">When Should You Use This Tool?</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 1rem; line-height: 1.65;">
            ${escapeHtml(tool.whenToUse)}
          </p>
        </section>

        ${tool.example ? `
        <section class="ssr-section ssr-example">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #f8fafc;">Practical Example</h2>
          <div style="background: rgba(56, 189, 248, 0.05); border-left: 3px solid #38bdf8; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
              ${escapeHtml(tool.example)}
            </p>
          </div>
        </section>
        ` : ''}

        <section class="ssr-section ssr-faq">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 1rem 0; color: #f8fafc;">Frequently Asked Questions</h2>
          <dl style="display: grid; gap: 1.25rem; margin: 0;">
            ${tool.faq.map(item => `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 1rem 1.25rem;">
                <dt style="font-weight: 600; color: #f1f5f9; font-size: 1.05rem; margin-bottom: 0.5rem;">${escapeHtml(item.q)}</dt>
                <dd style="margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.6;">${escapeHtml(item.a)}</dd>
              </div>
            `).join('')}
          </dl>
        </section>

        <section class="ssr-section ssr-related-tools">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 1rem 0; color: #f8fafc;">Related Tools</h2>
          <div class="ssr-related-list">
            ${relatedToolsHtml}
          </div>
        </section>
      </main>
    </div>
  `;

  // Clean out template default tags to eliminate duplicates
  let html = stripOldMetaTags(templateHtml);

  // Inject Title and Meta tags into <head>
  const metaTags = [
    `<title>${escapeHtml(tool.title)}</title>`,
    `<meta name="description" content="${escapeHtml(tool.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(tool.keywords)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(tool.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(tool.description)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(tool.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(tool.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(tool.description)}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`,
    `<script type="application/ld+json">\n${JSON.stringify(webAppSchema, null, 2)}\n</script>`,
    `<script type="application/ld+json">\n${JSON.stringify(breadcrumbSchema, null, 2)}\n</script>`,
    faqSchema ? `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>` : ''
  ].filter(Boolean).join('\n    ');

  html = html.replace('</head>', `    ${metaTags}\n  </head>`);

  // Inject pre-rendered SSR HTML body into <div id="root"></div>
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBodyHtml}</div>`);

  return html;
}

/**
 * Pre-renders semantic HTML and dynamic SEO metadata for a category page.
 */
export function renderCategoryPageHtml(templateHtml, categorySlug) {
  const category = CATEGORIES[categorySlug];
  if (!category) return null;

  const canonicalUrl = `https://tools.cerilas.com/${category.slug}`;
  const ogImg = 'https://tools.cerilas.com/og-image.svg';

  const categoryTools = category.toolSlugs
    .map(slug => getToolSeo(slug))
    .filter(Boolean);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Cerilas Tools',
        item: 'https://tools.cerilas.com/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.displayName,
        item: canonicalUrl
      }
    ]
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.displayName,
    description: category.description,
    url: canonicalUrl,
    hasPart: categoryTools.map(t => ({
      '@type': 'WebApplication',
      name: t.name,
      url: `https://tools.cerilas.com/tool/${t.slug}`
    }))
  };

  const toolsListHtml = categoryTools.map(t => `
    <article class="ssr-category-tool-card" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.25rem; background: rgba(255,255,255,0.02); margin-bottom: 1rem;">
      <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">
        <a href="/tool/${t.slug}" style="color: #38bdf8; text-decoration: none;">
          ${escapeHtml(t.name)} &rarr;
        </a>
      </h2>
      <p style="margin: 0 0 0.75rem 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5;">
        ${escapeHtml(t.shortDescription)}
      </p>
      <a href="/tool/${t.slug}" style="display: inline-block; font-size: 0.85rem; font-weight: 500; color: #38bdf8; text-decoration: none;">
        Launch Tool &rarr;
      </a>
    </article>
  `).join('');

  const ssrBodyHtml = `
    <div id="ssr-seo-content" class="ssr-seo-wrapper" style="max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; line-height: 1.6;">
      <nav aria-label="Breadcrumb" class="ssr-breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.85rem; color: #94a3b8;">
        <a href="/" style="color: #38bdf8; text-decoration: none;">Cerilas Tools</a>
        <span style="margin: 0 0.5rem;">/</span>
        <span aria-current="page" style="color: #cbd5e1;">${escapeHtml(category.displayName)}</span>
      </nav>

      <header class="ssr-header" style="margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">
        <h1 style="font-size: 2.25rem; font-weight: 700; margin: 0 0 1rem 0; letter-spacing: -0.025em;">
          ${escapeHtml(category.h1)}
        </h1>
        <p style="font-size: 1.15rem; color: #cbd5e1; margin: 0;">
          ${escapeHtml(category.shortDescription)}
        </p>
      </header>

      <main class="ssr-tools-grid">
        ${toolsListHtml}
      </main>

      <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: #94a3b8; font-size: 0.9rem;">
          Looking for other categories? Explore 
          <a href="/ai-tools" style="color: #38bdf8; text-decoration: none;">AI Tools</a>, 
          <a href="/research-tools" style="color: #38bdf8; text-decoration: none;">Research Tools</a>, 
          <a href="/seo-tools" style="color: #38bdf8; text-decoration: none;">SEO Tools</a>, 
          <a href="/developer-tools" style="color: #38bdf8; text-decoration: none;">Developer Tools</a>, 
          <a href="/file-tools" style="color: #38bdf8; text-decoration: none;">File Tools</a>, and 
          <a href="/finance-tools" style="color: #38bdf8; text-decoration: none;">Finance Tools</a>.
        </p>
      </footer>
    </div>
  `;

  let html = stripOldMetaTags(templateHtml);

  const metaTags = [
    `<title>${escapeHtml(category.title)}</title>`,
    `<meta name="description" content="${escapeHtml(category.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(category.keywords)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(category.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(category.description)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(category.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(category.description)}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`,
    `<script type="application/ld+json">\n${JSON.stringify(breadcrumbSchema, null, 2)}\n</script>`,
    `<script type="application/ld+json">\n${JSON.stringify(collectionSchema, null, 2)}\n</script>`
  ].join('\n    ');

  html = html.replace('</head>', `    ${metaTags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBodyHtml}</div>`);

  return html;
}

/**
 * Pre-renders semantic HTML and crawlable links on the homepage.
 */
export function renderHomePageHtml(templateHtml) {
  const homeTitle = 'Cerilas Tools | Free In-Browser Privacy-Focused Utilities';
  const homeDesc = 'Explore 30+ free, in-browser privacy-focused developer, AI, research, and file tools. Zero sign-up, zero data collection, instant execution.';
  const canonicalUrl = 'https://tools.cerilas.com/';
  const ogImg = 'https://tools.cerilas.com/og-image.svg';

  const toolsArray = Object.values(TOOLS_SEO_REGISTRY);

  // Group tools by category for structured crawlability
  const categoriesHtml = Object.values(CATEGORIES).map(cat => {
    const catTools = cat.toolSlugs.map(s => TOOLS_SEO_REGISTRY[s]).filter(Boolean);
    return `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.35rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #f8fafc;">
          <a href="/${cat.slug}" style="color: inherit; text-decoration: none;">${escapeHtml(cat.displayName)} &rarr;</a>
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;">
          ${catTools.map(t => `
            <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.85rem; background: rgba(255,255,255,0.02);">
              <a href="/tool/${t.slug}" style="color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
                ${escapeHtml(t.name)}
              </a>
              <p style="margin: 0; color: #94a3b8; font-size: 0.82rem; line-height: 1.4;">
                ${escapeHtml(t.shortDescription)}
              </p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');

  const ssrBodyHtml = `
    <div id="ssr-seo-content" class="ssr-seo-wrapper" style="max-width: 1080px; margin: 0 auto; padding: 2rem 1.25rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; line-height: 1.6;">
      <header style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 0.75rem 0; letter-spacing: -0.03em;">
          Cerilas' <span style="color: #38bdf8;">Tools</span>
        </h1>
        <p style="font-size: 1.15rem; color: #94a3b8; max-width: 680px; margin: 0 auto;">
          Free, in-browser privacy-focused utilities for engineers, researchers, and creators. 100% client-side execution with zero data retention.
        </p>
      </header>

      <main>
        ${categoriesHtml}
      </main>
    </div>
  `;

  let html = stripOldMetaTags(templateHtml);

  const metaTags = [
    `<title>${escapeHtml(homeTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(homeDesc)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(homeTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(homeDesc)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(homeTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(homeDesc)}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`
  ].join('\n    ');

  html = html.replace('</head>', `    ${metaTags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBodyHtml}</div>`);

  return html;
}
