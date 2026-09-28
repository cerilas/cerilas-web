export const llmsTxtManifest = {
  slug: 'llms-txt',
  title: 'LLMs.txt Generator, Checker & Validator',
  shortDescription: 'All-in-one suite to create, inspect, and validate your llms.txt site guide under the latest v2 specification. Scan website resources, audit link health, and verify formatting.',
  category: 'AI Assisted',
  iconName: 'FileText',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/llms-txt',
  features: [
    '3-in-1 Integrated Suite: Includes LLMs.txt Generator, Checker, and RFC v2 Validator in a unified workspace',
    'Deterministic Website Scanner: Discovers sitemap URLs, navigation links, and generates curated markdown resource entries',
    'Specification v2 Compliance: Supports H1 titles, blockquote summaries, H2 resource lists, and path-level /docs/llms.txt',
    'Deep Link Health Auditor: Concurrently probes HTTP status, detects dead 404s, redirect chains, and rate limiting',
    'Advanced Discovery Checks: Inspects rel="describedby" headers and discovers <link rel="alternate" type="text/markdown"> variants',
    '3-Level Validation & Quality Score: Classifies issues into Errors, Warnings, and Recommendations with 0–100 Quality Score',
    '1-Click Auto-Fix & Diff Viewer: Automatically repairs bare URLs, syntax discrepancies, and missing metadata',
    'Privacy-Focused & Fast: Safe SSRF-protected server proxy, zero third-party API dependencies, and no login required'
  ],
  seo: {
    title: "Free LLMs.txt Generator & Validator (2026) | Cerilas Tools",
    description: "Generate and validate /llms.txt and /llms-full.txt files for your website. Enable AI search engines, Cursor, and LLMs to index your documentation cleanly.",
    keywords: "llms txt generator, llms txt validator, create llms txt, generative engine optimization, geo tools, cursor llms txt, ai agent documentation",
    ogImage: 'https://tools.cerilas.com/tool-icons/llms-txt.webp',
    ogImageAlt: "Free LLMs.txt Generator & Validator (2026) | Cerilas Tools",
    breadcrumbsName: "LLMs.txt Generator & Validator",
    faq: [
        {
            "q": "What is an llms.txt file and why does my website need one?",
            "a": "llms.txt is a standardized Markdown file placed in your root directory that provides AI search engines and LLM agents with a curated, concise guide to your website content."
        },
        {
            "q": "Where should I host the llms.txt and llms-full.txt files?",
            "a": "Host them at the root of your web domain: https://example.com/llms.txt and https://example.com/llms-full.txt, just like robots.txt."
        },
        {
            "q": "How does llms.txt improve Generative Engine Optimization (GEO)?",
            "a": "It removes HTML overhead, navigation noise, and scripts, providing AI search engines with clean token representations that are easily cited in answers."
        },
        {
            "q": "What is the difference between llms.txt and llms-full.txt?",
            "a": "llms.txt contains a curated index of links and summaries. llms-full.txt aggregates the full markdown text of all documentation pages into a single file for comprehensive agent context."
        }
    ]
  }
};
