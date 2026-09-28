export const aiVisibilityCheckerManifest = {
  slug: 'ai-visibility-checker',
  title: 'AI Visibility Checker',
  shortDescription: 'Audit your website visibility in AI search engines (Gemini, ChatGPT, Perplexity). Automatically extracts top 10 search queries from your content and tests live citation grounding.',
  category: 'AI Assisted',
  iconName: 'Eye',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/ai-visibility-checker',
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
    title: "Free AI Visibility Checker – Gemini & ChatGPT | Cerilas Tools",
    description: "Audit if your brand and website are cited in AI search engines. Test live Gemini, ChatGPT, and Perplexity answer grounding with actionable GEO suggestions.",
    keywords: "ai visibility checker, geo audit tool, check if gemini cites my website, chatgpt search citation checker, perplexity citation audit, test ai search citations free, generative engine optimization tool",
    ogImage: 'https://tools.cerilas.com/tool-icons/ai-visibility-checker.webp',
    ogImageAlt: "Free AI Visibility Checker – Gemini & ChatGPT | Cerilas Tools",
    breadcrumbsName: "AI Visibility Checker",
    faq: [
        {
            "q": "What is an AI Visibility Score and how is it calculated?",
            "a": "It is a composite 0-100 metric measuring how frequently, prominently, and accurately your domain is cited when users ask conversational questions to AI search engines."
        },
        {
            "q": "What is Generative Engine Optimization (GEO)?",
            "a": "GEO is the modern evolution of SEO focused on optimizing content, structure, and entity authority so AI answer engines (ChatGPT, Gemini, Perplexity) cite your website."
        },
        {
            "q": "How does Gemini decide which websites to cite in Search Grounding?",
            "a": "Gemini evaluates top Google organic results, information gain, concise authoritative definitions, schema markup, and domain citation frequency across trusted web sources."
        },
        {
            "q": "Why are competitor domains cited instead of my official website?",
            "a": "Competitors frequently provide structured comparison tables, third-party review coverage, and direct answers to user pricing questions that AI models easily parse."
        },
        {
            "q": "Can a newer website with low domain authority still get cited by AI models?",
            "a": "Yes. If a new page offers unique proprietary data, original research, or the clearest direct answer to a long-tail query, AI models frequently cite it over legacy brands."
        },
        {
            "q": "How do AI search engines handle paywalled or gated content?",
            "a": "AI search crawlers generally ignore gated content, meaning paywalled assets cannot generate search citations. Providing summary excerpts ensures indexability."
        }
    ]
  }
};
