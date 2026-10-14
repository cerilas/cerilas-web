/**
 * GrowthControl landing (/growth): single source of truth for on-page copy,
 * server-rendered HTML and JSON-LD. Plain JS so both Vite and Node can import it.
 *
 * Keyword ownership: this page targets "AI visibility tracker / tracking software / GEO platform".
 * The free tool at /tool/ai-visibility-checker owns "AI visibility checker".
 */

export const SITE_ORIGIN = 'https://tools.cerilas.com';
export const GROWTH_URL = `${SITE_ORIGIN}/growth`;
export const CHECKER_URL = `${SITE_ORIGIN}/tool/ai-visibility-checker`;
export const TARGET_MARKETS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' }
];

export const AREA_SERVED = TARGET_MARKETS.map(m => ({ '@type': 'Country', name: m.name, identifier: m.code }));

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export const GROWTH_SEO = {
  url: GROWTH_URL,
  title: 'AI Visibility Tracker & GEO Platform | GrowthControl',
  description: 'Track your brand in ChatGPT, Gemini, Perplexity & Claude. Monitor AI citations, competitor share of voice and Search Console in one GEO dashboard.',
  keywords: 'ai visibility tracker, ai visibility tool, ai search visibility, llm visibility tracking, generative engine optimization platform, geo tool, ai brand monitoring, track brand mentions in chatgpt, chatgpt rank tracker, ai citation tracking',
  ogImage: `${SITE_ORIGIN}/og/growthcontrol.png`,
  h1: 'Is your website cited by AI search engines?',
  subtitle: 'GrowthControl is an AI visibility tracker that audits citations across ChatGPT, Perplexity, Claude and Gemini. Connect Google Search Console to fix gaps and turn AI recommendations into revenue.'
};

export const GROWTH_PLANS = [
  {
    name: 'Forever Free',
    price: '0',
    period: 'month',
    description: '1 workspace, 3 tracked AI prompts, daily action feed scan and competitor discovery.'
  },
  {
    name: 'Pro',
    price: '9.99',
    yearlyPrice: '99.90',
    period: 'month',
    description: '3 workspaces, 15 tracked AI prompts, 3 competitors, technical site audit and a daily executive email digest.'
  },
  {
    name: 'Unlimited',
    price: '14.99',
    yearlyPrice: '149.90',
    period: 'month',
    description: 'Unlimited workspaces and competitors, 30 tracked AI prompts and unlimited action feed scans for agencies and teams.'
  }
];

export const GROWTH_HOW_IT_WORKS = [
  {
    title: 'Add your domain',
    description: 'Enter your website and optionally connect Google Search Console and Google Analytics 4 with read-only OAuth. No code or tracking script required.'
  },
  {
    title: 'Audit AI answer engines',
    description: 'GrowthControl asks AI assistants the questions your buyers ask, then records who gets cited, who gets mentioned and which sources are linked.'
  },
  {
    title: 'Ship the fixes that matter',
    description: 'You get a ranked list of technical, content and schema fixes with ready-to-paste snippets, and a trend line that shows what is working.'
  }
];

export const GROWTH_FREE_TOOLS = [
  { name: 'AI Visibility Checker', href: '/tool/ai-visibility-checker', text: 'check if ChatGPT, Gemini and Perplexity cite your website.' },
  { name: 'AI Crawler Checker', href: '/tool/ai-crawler-checker', text: 'test robots.txt rules for GPTBot, ClaudeBot and PerplexityBot.' },
  { name: 'LLMs.txt Generator & Validator', href: '/tool/llms-txt', text: 'build and validate your /llms.txt file.' },
  { name: 'Google Marketing MCP', href: '/tool/google-marketing-mcp', text: 'connect ChatGPT and Claude to Google Analytics and Search Console.' }
];

export const GROWTH_DEFINITION = {
  eyebrow: 'AI Visibility Tracking',
  title: 'What is AI visibility tracking?',
  lead: 'AI visibility tracking measures how often AI assistants like ChatGPT, Gemini, Perplexity and Claude mention your brand, cite your website as a source, or recommend a competitor instead, across the questions your customers actually ask.',
  body: 'Classic rank trackers report a position on a results page. AI answers have no fixed position: the same question can produce a different answer, different brands and different sources each time. An AI visibility tracker runs your buyer questions on a schedule, stores every answer and its sources, and turns them into trends you can act on.',
  metrics: [
    {
      term: 'Brand mention rate',
      definition: 'The share of tracked prompts where the AI answer names your brand in its text.'
    },
    {
      term: 'Citation rate',
      definition: 'The share of tracked prompts where the AI links to a page on your own domain as a source.'
    },
    {
      term: 'AI share of voice',
      definition: 'How often you appear compared with the competitors you track, across the same set of prompts.'
    },
    {
      term: 'Cited sources',
      definition: 'The third-party domains AI engines rely on in your category: review sites, directories, media and rivals.'
    }
  ]
};

export const GROWTH_USE_CASES = {
  eyebrow: 'Who It Is For',
  title: 'Built for every team that needs to be recommended by AI.',
  description: 'From SaaS companies in San Francisco to agencies in London, Toronto and Sydney, GrowthControl helps English-speaking brands win the answers their buyers read.',
  items: [
    {
      title: 'SaaS & B2B software',
      text: 'See whether AI recommends you for "best tool for…" and "alternative to…" questions, and which comparison pages it trusts instead.'
    },
    {
      title: 'Marketing & SEO agencies',
      text: 'Run a separate workspace per client, track their prompts and competitors, and send a clear AI visibility report every month.'
    },
    {
      title: 'E-commerce & DTC brands',
      text: 'Find out which products AI suggests for buying-intent questions and which review sites shape those recommendations.'
    },
    {
      title: 'Local & service businesses',
      text: 'Track "near me" style questions, connect your Google Business Profile and see the review themes AI assistants pick up.'
    }
  ]
};

export const GROWTH_COMPARISON = {
  eyebrow: 'Why GrowthControl',
  title: 'AI visibility tracking vs. traditional rank tracking',
  description: 'Rank trackers were built for ten blue links. GrowthControl is built for answers.',
  columns: ['', 'Traditional rank tracker', 'GrowthControl'],
  rows: [
    ['What it measures', 'Keyword position on a results page', 'Brand mentions and citations inside AI answers'],
    ['Engines covered', 'Google and Bing results pages', 'ChatGPT, Gemini, Perplexity and Claude, plus Google Search Console'],
    ['Competitor view', 'Who ranks above you', 'Who AI recommends instead of you, and which sources it cites'],
    ['Technical checks', 'Crawlability for search bots', 'AI crawler access (GPTBot, ClaudeBot, PerplexityBot), llms.txt and schema'],
    ['Output', 'Position charts', 'A weekly, ranked list of fixes with ready-to-paste code']
  ]
};

export const GROWTH_FAQ = [
  {
    q: 'What is an AI visibility tracker?',
    a: 'An AI visibility tracker is software that repeatedly asks AI assistants such as ChatGPT, Gemini, Perplexity and Claude the questions your customers ask, then records whether your brand is mentioned, whether your website is cited as a source, and which competitors appear instead. GrowthControl stores every answer so you can follow your AI visibility over time.'
  },
  {
    q: 'What is Generative Engine Optimization (GEO)?',
    a: 'Generative Engine Optimization (GEO) is the practice of making your brand easy for AI answer engines to understand, trust and cite. It combines clear, answer-first content, structured data (Schema.org), open access for AI crawlers, an llms.txt file and consistent mentions on the third-party sites AI relies on.'
  },
  {
    q: 'How is AI visibility different from SEO rankings?',
    a: 'SEO rankings show where a page sits in a list of results. AI visibility shows whether an assistant names or links to you inside its answer. You can rank well on Google and still be missing from ChatGPT answers, which is why GrowthControl tracks both Search Console data and AI citations side by side.'
  },
  {
    q: 'Which AI engines does GrowthControl track?',
    a: 'GrowthControl tracks AI answers from ChatGPT, Google Gemini, Perplexity and Claude, and audits access for their crawlers, including GPTBot, ClaudeBot, PerplexityBot and Google-Extended. It also connects to Google Search Console and Google Analytics 4 with read-only access.'
  },
  {
    q: 'How do I check if ChatGPT mentions my brand?',
    a: 'Start with the free AI Visibility Checker: enter your domain and it tests realistic buyer questions and shows whether your site is cited or only mentioned. To track it continuously, add your prompts to GrowthControl and it re-runs them for you and alerts you to changes.'
  },
  {
    q: 'Does GrowthControl work for businesses in the US, Canada, the UK and Australia?',
    a: 'Yes. You can set the target country and language for every tracked prompt, so a brand selling in the United States, Canada, the United Kingdom or Australia sees the answers local customers would see.'
  },
  {
    q: 'Is connecting Google Search Console safe?',
    a: 'Yes. GrowthControl uses Google OAuth with read-only permissions, so it can never change your Search Console or Analytics settings. Access tokens are encrypted at rest, and you can disconnect at any time from Workspace & Integrations.'
  },
  {
    q: 'What is llms.txt and do I need one?',
    a: 'llms.txt is a Markdown file at the root of your domain that gives AI systems a clean summary of your most important pages. It is not required, but it helps AI tools find your canonical content. GrowthControl checks whether you have one and can generate a starting version for you.'
  },
  {
    q: 'Can agencies manage multiple client websites?',
    a: 'Yes. Each client gets its own workspace with separate prompts, competitors, integrations and reports. The Unlimited plan removes the workspace limit, which suits agencies and multi-brand companies.'
  },
  {
    q: 'How much does GrowthControl cost?',
    a: 'There is a free plan with 1 workspace and 3 tracked prompts. Pro costs $9.99 per month (or $99.90 per year) for 3 workspaces and 15 tracked prompts, and Unlimited costs $14.99 per month (or $149.90 per year) for unlimited workspaces and 30 tracked prompts. Prices are in USD.'
  },
  {
    q: 'How quickly can I improve my AI visibility?',
    a: 'Technical fixes such as unblocking AI crawlers, adding structured data or publishing llms.txt can be picked up as soon as engines recrawl your site. Content and reputation changes usually take several weeks. GrowthControl shows the trend so you can see what is working.'
  },
  {
    q: 'What happens after the free audit?',
    a: 'The free audit shows your AI crawler permissions, technical health and positioning. Create a free account to save the workspace, track your first prompts and receive a prioritized action feed.'
  }
];

export function buildGrowthJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Cerilas',
        legalName: 'CERİLAS Yüksek Teknoloji San. ve Tic. AŞ',
        url: 'https://cerilas.com',
        logo: `${SITE_ORIGIN}/platform-logo.png`,
        email: 'support@cerilas.com'
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_ORIGIN}/`,
        name: "Cerilas' Tools",
        inLanguage: 'en',
        publisher: { '@id': ORGANIZATION_ID }
      },
      {
        '@type': 'WebPage',
        '@id': `${GROWTH_URL}#webpage`,
        url: GROWTH_URL,
        name: GROWTH_SEO.title,
        description: GROWTH_SEO.description,
        inLanguage: 'en',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': `${GROWTH_URL}#software` },
        breadcrumb: { '@id': `${GROWTH_URL}#breadcrumb` }
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${GROWTH_URL}#software`,
        name: 'GrowthControl',
        alternateName: 'GrowthControl AI Visibility Tracker',
        url: GROWTH_URL,
        description: GROWTH_SEO.description,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI Visibility Tracking & Generative Engine Optimization',
        operatingSystem: 'Web',
        inLanguage: 'en',
        areaServed: AREA_SERVED,
        publisher: { '@id': ORGANIZATION_ID },
        featureList: [
          'AI citation and brand mention tracking for ChatGPT, Gemini, Perplexity and Claude',
          'Competitor AI share of voice',
          'Google Search Console and Google Analytics 4 read-only integration',
          'AI crawler access audit (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)',
          'llms.txt and Schema.org checks',
          'Weekly prioritized action feed with ready-to-paste fixes',
          'Google Business Profile review radar'
        ],
        offers: GROWTH_PLANS.map(plan => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.price,
          priceCurrency: 'USD',
          description: plan.description,
          availability: 'https://schema.org/InStock',
          url: `${GROWTH_URL}#pricing`
        }))
      },
      {
        '@type': 'FAQPage',
        '@id': `${GROWTH_URL}#faq`,
        mainEntity: GROWTH_FAQ.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${GROWTH_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: "Cerilas' Tools", item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'GrowthControl', item: GROWTH_URL }
        ]
      }
    ]
  };
}
