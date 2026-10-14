import { CHECKER_SEO, CHECKER_FAQ } from '../../seo/aiVisibilityCheckerContent.js';

export const aiVisibilityCheckerManifest = {
  slug: 'ai-visibility-checker',
  title: CHECKER_SEO.h1,
  shortDescription: CHECKER_SEO.shortDescription,
  category: 'AI Assisted',
  iconName: 'Eye',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '/tool/ai-visibility-checker',
  features: [
    'Automated Content Scraping (Zero-AI Initial Extraction): Fetches title, meta tags, key headings, and main body text securely',
    'Top 10 High-Intent Search Query Extraction: Leverages advanced frontier AI models to model realistic commercial, informational, and local queries users ask AI search engines',
    'Live Search Grounding Probe: Queries advanced frontier AI with real-time web search grounding to audit real citation chunks',
    'Citation & Mention Detection: Differentiates between direct web backlinks, brand mentions, and missed queries',
    'Competitor Citation Mapping: Identifies which third-party domains and competitors are cited by AI instead of your site',
    'AI Visibility Score & Grade (A+ to F): Instant quantitative GEO (Generative Engine Optimization) score',
    'Powered by Advanced AI Infrastructure: Automated server-side frontier AI search grounding with zero manual API setup required',
    'Actionable AEO Recommendations: Concrete steps to optimize schema markup, Q&A architecture, and digital entity authority'
  ],
  seo: {
    title: CHECKER_SEO.title,
    description: CHECKER_SEO.description,
    keywords: CHECKER_SEO.keywords,
    ogImage: 'https://tools.cerilas.com/og/ai-visibility-checker.png',
    ogImageAlt: CHECKER_SEO.title,
    breadcrumbsName: CHECKER_SEO.name,
    faq: CHECKER_FAQ
  }
};
