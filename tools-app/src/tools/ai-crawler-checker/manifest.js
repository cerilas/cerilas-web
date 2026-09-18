export const aiCrawlerCheckerManifest = {
  slug: 'ai-crawler-checker',
  title: 'AI Crawler Checker',
  shortDescription: 'Check whether ChatGPT, Claude, Perplexity, Gemini, and other AI systems can access your website. Analyze robots.txt, AI crawler permissions, sitemaps, and indexability for free.',
  category: 'AI Assisted',
  iconName: 'Radar',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/ai-crawler-checker',
  features: [
    'Comprehensive AI Crawler Audit: Tests OAI-SearchBot, Claude-SearchBot, PerplexityBot, GPTBot, ClaudeBot, and Google-Extended',
    'Clear Search vs. Training Differentiation: Isolates real-time AI search discovery permissions from foundation model training crawlers',
    'Deterministic RFC 9309 Parser: Evaluates exact User-agent blocks, longest-prefix matching, wildcard rules, and root accessibility',
    'Homepage Indexability & HTTP Diagnostics: Detects <meta name="robots">, X-Robots-Tag noindex directives, redirects, and WAF bot protections',
    'AI Search Accessibility Score (0–100): Technical audit evaluating crawl permissions, sitemap discovery, and indexability signals',
    'Emerging Standards Verification: Inspects /llms.txt and XML sitemap directives without third-party API dependencies',
    '1-Click AI-Friendly robots.txt Generator: Customize and download optimized robots.txt rules balancing search visibility with training protection',
    'Privacy-First & Fast: Zero tracking of proprietary website content, instant server-side diagnostics with SSRF security'
  ],
  seo: {
    title: 'AI Crawler Checker – Check ChatGPT, Claude & Perplexity Access | Cerilas Tools',
    description: 'Check whether ChatGPT, Claude, Perplexity and other AI crawlers can access your website. Analyze robots.txt, AI crawler permissions, sitemap and indexability for free.',
    keywords: 'ai crawler checker, chatgpt crawler checker, robots.txt ai checker, oai-searchbot allowed, perplexitybot robots.txt, claudebot vs claude-searchbot, check if chatgpt can crawl my site, gptbot allow or disallow, google-extended robots.txt, ai search accessibility score, llms.txt checker, ai seo audit free, cerilas tools',
    ogImage: 'https://tools.cerilas.com/tool-icons/ai-crawler-checker.png',
    ogImageAlt: 'Cerilas Free AI Crawler Checker & robots.txt Verification Suite',
    breadcrumbsName: 'AI Crawler Checker'
  }
};
