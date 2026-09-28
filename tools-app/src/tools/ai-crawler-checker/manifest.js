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
    title: "Free AI Crawler Checker – Test GPTBot & ClaudeBot | Cerilas Tools",
    description: "Audit robots.txt and HTTP headers for AI bot accessibility. Verify whether GPTBot, ClaudeBot, PerplexityBot, and Google-Extended are blocked or permitted.",
    keywords: "ai crawler checker, test gptbot access, claudebot robots txt, perplexitybot blocker, ai seo audit, robots txt ai bots, generative engine optimization",
    ogImage: 'https://tools.cerilas.com/tool-icons/ai-crawler-checker.webp',
    ogImageAlt: "Free AI Crawler Checker – Test GPTBot & ClaudeBot | Cerilas Tools",
    breadcrumbsName: "AI Crawler Checker",
    faq: [
        {
            "q": "Which AI crawlers should I allow if I want citations in AI search engines?",
            "a": "Allow search grounding bots like ChatGPT-User, PerplexityBot, and Claude-Web. Blocking them completely removes your website from AI search answer citations."
        },
        {
            "q": "What is the difference between GPTBot and ChatGPT-User?",
            "a": "GPTBot crawls the web to train future OpenAI foundation models. ChatGPT-User executes live on-demand browsing when a user submits a query in ChatGPT."
        },
        {
            "q": "How does Google-Extended differ from standard Googlebot?",
            "a": "Googlebot crawls for standard Google Search indexing. Google-Extended specifically controls whether your content is used to train Gemini models without hurting Google Search rankings."
        },
        {
            "q": "Can this tool generate corrected robots.txt rules for my website?",
            "a": "Yes. The tool provides ready-to-paste robots.txt snippets tailored to your preference for search citations versus training protection."
        }
    ]
  }
};
