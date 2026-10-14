/**
 * JSON-LD builders shared by the server renderer and the SPA head manager.
 * Each block carries a stable DOM id so the client updates the server-rendered
 * script in place instead of appending a duplicate.
 */
import { SITE_ORIGIN, ORGANIZATION_ID, WEBSITE_ID, AREA_SERVED } from './growthControlSeo.js';

export const JSONLD_IDS = {
  webApp: 'tool-webapp-jsonld',
  breadcrumbs: 'tool-breadcrumbs-jsonld',
  faq: 'tool-faq-jsonld',
  howTo: 'tool-howto-jsonld'
};

/**
 * In the browser most tool components inject their own FAQPage graph that
 * mirrors the FAQ they render, so pass includeFaq: false there to avoid two
 * conflicting FAQPage entities. The server always includes it because the
 * pre-rendered body shows exactly this FAQ.
 */
export function buildToolJsonLdBlocks(tool, { includeFaq = true } = {}) {
  if (!tool) return [];
  const url = `${SITE_ORIGIN}/tool/${tool.slug}`;
  const blocks = [];

  blocks.push({
    id: JSONLD_IDS.webApp,
    data: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${url}#app`,
      name: tool.name,
      headline: tool.h1,
      description: tool.description,
      url,
      applicationCategory: tool.category || 'Utilities',
      operatingSystem: 'Web',
      inLanguage: 'en',
      isAccessibleForFree: true,
      areaServed: AREA_SERVED,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      publisher: {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Cerilas',
        url: 'https://cerilas.com',
        logo: `${SITE_ORIGIN}/platform-logo.png`
      },
      isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, url: `${SITE_ORIGIN}/`, name: "Cerilas' Tools" }
    }
  });

  blocks.push({
    id: JSONLD_IDS.breadcrumbs,
    data: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: "Cerilas' Tools", item: `${SITE_ORIGIN}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: tool.category || 'Tools',
          item: tool.categorySlug ? `${SITE_ORIGIN}/${tool.categorySlug}` : `${SITE_ORIGIN}/`
        },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url }
      ]
    }
  });

  if (includeFaq && tool.faq && tool.faq.length > 0) {
    blocks.push({
      id: JSONLD_IDS.faq,
      data: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: tool.faq.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      }
    });
  }

  if (tool.howTo && tool.howTo.steps?.length) {
    blocks.push({
      id: JSONLD_IDS.howTo,
      data: {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: tool.howTo.title,
        description: tool.howTo.lead,
        totalTime: 'PT2M',
        tool: { '@type': 'HowToTool', name: tool.name },
        step: tool.howTo.steps.map((step, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: step.name,
          text: step.text,
          url: `${url}#aivc-howto-heading`
        }))
      }
    });
  }

  return blocks;
}
