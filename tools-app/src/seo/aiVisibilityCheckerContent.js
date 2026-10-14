/**
 * Free AI Visibility Checker (/tool/ai-visibility-checker): shared copy for the
 * visible page, server-rendered HTML and JSON-LD. Plain JS for Vite + Node.
 *
 * Keyword ownership: this page targets "AI visibility checker" (free, one-off check).
 * Ongoing tracking intent is handed off to GrowthControl at /growth.
 */

export const CHECKER_SEO = {
  slug: 'ai-visibility-checker',
  name: 'AI Visibility Checker',
  h1: 'Free AI Visibility Checker',
  title: 'Free AI Visibility Checker: ChatGPT, Gemini & Perplexity',
  description: 'Check if ChatGPT, Gemini and Perplexity cite your website. Free AI visibility checker: enter a URL to get your AI visibility score, citations and fixes.',
  shortDescription: 'Check whether ChatGPT, Gemini and Perplexity cite your website, mention your brand, or recommend competitors instead. Free, no sign-up, results in about a minute.',
  keywords: 'ai visibility checker, free ai visibility checker, check ai visibility, ai search visibility checker, chatgpt visibility checker, is my website cited by chatgpt, ai citation checker, llm visibility checker, geo audit tool, generative engine optimization checker'
};

export const CHECKER_HOW_TO = {
  title: 'How to check your AI visibility in 3 steps',
  lead: 'To check your AI visibility, enter your website URL, let the checker test the questions your customers ask AI, and review which answers cite your site, mention your brand or send users to a competitor.',
  steps: [
    {
      name: 'Enter your website URL',
      text: 'Type your domain and choose your target country, for example the United States, Canada, the United Kingdom or Australia. No account or API key is needed.'
    },
    {
      name: 'Let the checker test real buyer questions',
      text: 'The checker reads your homepage, writes 10 realistic questions a customer would ask an AI assistant about your products or services, and runs each one with live web search.'
    },
    {
      name: 'Review your score, citations and fixes',
      text: 'See your AI visibility score and grade, which questions cite your site, which only mention your brand, which competitor domains were cited instead, and what to fix first.'
    }
  ]
};

export const CHECKER_RESULTS_GLOSSARY = {
  title: 'What your AI visibility results mean',
  lead: 'Every question in your report gets one of three outcomes. Together they form your AI visibility score.',
  items: [
    {
      term: 'Cited',
      definition: 'The AI answer links to a page on your domain as a source. This is the strongest signal: users can click through, and the engine treats your page as evidence.'
    },
    {
      term: 'Brand mentioned',
      definition: 'The answer names your brand but links to someone else, usually a review site, directory or news article. Good for awareness, but the click goes elsewhere.'
    },
    {
      term: 'Not visible',
      definition: 'Your brand is neither named nor cited. The cited domains for that question show you exactly who AI trusts instead.'
    },
    {
      term: 'AI visibility score',
      definition: 'A 0–100 score and A+ to F grade based on how many of the tested questions cite or mention you. Use it as a baseline and re-check after you ship fixes.'
    }
  ]
};

export const CHECKER_VS_TRACKER = {
  title: 'AI visibility checker vs. AI visibility tracker',
  lead: 'A checker gives you a one-time snapshot. A tracker re-runs your questions over time so you can see whether fixes work and when competitors overtake you.',
  columns: ['', 'Free AI Visibility Checker', 'GrowthControl AI Visibility Tracker'],
  rows: [
    ['Best for', 'A quick baseline before you invest', 'Ongoing monitoring and reporting'],
    ['Questions tested', '10 generated from your homepage', 'Your own prompt library, by country and language'],
    ['History', 'Single snapshot', 'Every answer and source stored over time'],
    ['Competitors', 'Domains cited instead of you', 'Tracked competitors and AI share of voice'],
    ['Extras', 'GEO recommendations', 'Search Console, GA4, site audit and a weekly action feed'],
    ['Price', 'Free, no sign-up', 'Free plan, paid plans from $9.99/month']
  ],
  ctaLabel: 'Track your AI visibility with GrowthControl',
  ctaHref: '/growth'
};

export const CHECKER_FAQ = [
  {
    q: 'What is an AI visibility checker?',
    a: 'An AI visibility checker tests whether AI search engines such as ChatGPT, Gemini and Perplexity mention your brand or cite your website when people ask questions about your products or services. It returns a score, the list of questions tested and the sources each answer relied on.'
  },
  {
    q: 'Is this AI visibility checker free?',
    a: 'Yes. The AI Visibility Checker is free to use, with no sign-up and no API key, subject to a fair-use hourly limit. If you want to track the same questions every week, GrowthControl offers a free plan and paid plans from $9.99 per month.'
  },
  {
    q: 'How do I know if ChatGPT cites my website?',
    a: 'Enter your domain in the checker. For each question it shows whether the answer linked to your site (cited), named your brand without a link (mentioned), or did neither. The cited sources column shows which domains were used instead.'
  },
  {
    q: 'What is a good AI visibility score?',
    a: 'Most websites start below 30 because AI engines favor review sites, directories and large publishers. A score above 50 means you are cited or mentioned in at least half of the questions buyers ask; above 80 means AI treats you as a primary source in your niche.'
  },
  {
    q: 'What is the difference between "cited" and "brand mentioned"?',
    a: '"Cited" means the AI answer links to a page on your domain as a source. "Brand mentioned" means the answer names your company but links to a third-party page such as a review platform or directory instead of your official site.'
  },
  {
    q: 'What is Generative Engine Optimization (GEO)?',
    a: 'Generative Engine Optimization (GEO) is the practice of making your content easy for AI answer engines to retrieve, trust and cite. It builds on SEO with answer-first content, structured data, open access for AI crawlers, an llms.txt file and consistent mentions on trusted third-party sites.'
  },
  {
    q: 'Why does AI cite my competitors instead of my website?',
    a: 'AI engines favor pages that answer the question directly and are easy to verify: comparison tables, transparent pricing, clear definitions and strong third-party coverage. The checker lists the domains cited in your place so you can see what those pages do better.'
  },
  {
    q: 'How can I improve my AI visibility?',
    a: 'Allow AI crawlers such as GPTBot, OAI-SearchBot, PerplexityBot and Google-Extended in robots.txt, add Schema.org structured data, answer key buyer questions in short paragraphs under clear headings, publish an llms.txt file, and earn mentions on the review sites and directories AI already cites in your category.'
  },
  {
    q: 'Does blocking AI crawlers in robots.txt stop my site from being cited?',
    a: 'Usually, yes. If robots.txt blocks crawlers like OAI-SearchBot, PerplexityBot or Googlebot, those engines cannot fetch your pages during live search, so they cite other sources instead. Use the free AI Crawler Checker to test your rules.'
  },
  {
    q: 'Can a new website get cited by AI search engines?',
    a: 'Yes. AI engines care more about whether a page answers the question clearly and accurately than about domain age. A new site with the clearest pricing table, definition or original data for a specific question can be cited ahead of older, larger sites.'
  },
  {
    q: 'Can I check AI visibility for a specific country?',
    a: 'Yes. Choose a target country before you run the check, for example the United States, Canada, the United Kingdom or Australia, and the questions are written and tested for buyers in that market.'
  },
  {
    q: 'How often should I check my AI visibility?',
    a: 'Check at least once a month and after major changes such as a redesign, new pricing page or new product launch. AI answers change frequently, so for weekly monitoring and history use GrowthControl.'
  }
];
