export const htmlToMarkdownManifest = {
  slug: 'html-to-llm-markdown',
  title: 'HTML to LLM Markdown Converter',
  shortDescription: 'Convert any webpage or raw HTML into clean, token-efficient GitHub-Flavored Markdown optimized for ChatGPT, Claude, Gemini, and RAG pipelines.',
  category: 'AI Assisted',
  iconName: 'FileCode',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/html-to-llm-markdown',
  features: [
    'Dual Input Engines: Convert live webpages via URL or paste raw HTML snippets directly',
    'Boilerplate & Noise Elimination: Automatically removes navbars, footers, cookie banners, tracking scripts, and modals',
    'Article Isolation: Intelligently isolates primary <article> and <main> content for maximum signal-to-noise',
    'Token Budget Optimization: Option to convert hyperlinks to plain text and strip non-essential images to maximize prompt context',
    'Clean GFM Tables: Translates complex nested HTML tables into clean GitHub-Flavored Markdown syntax',
    'YAML Frontmatter Generator: Injects metadata header with title, canonical URL, date, word count, and token metrics',
    'Real-time Token & Savings Analytics: Instant metrics on original HTML vs Markdown size and token compression percentage',
    'Prompt Wrapper Presets: 1-click prompt wrap for summarization, fact extraction, and RAG system queries',
    '100% Free & SSRF-Safe: Unlimited conversions with strict IP security and zero sign-up required'
  ],
  seo: {
    title: "HTML to Clean Markdown Converter for LLM & RAG | Cerilas Tools",
    description: "Convert raw HTML, web pages, and articles into clean, noise-free Markdown. Strips scripts, ads, and navbars to produce high-token-efficiency LLM context.",
    keywords: "html to markdown, convert html to md, clean markdown for llm, html to llm markdown, strip html for rag, html to text ai prompt, reduce token cost",
    ogImage: 'https://tools.cerilas.com/tool-icons/html-to-llm-markdown.webp',
    ogImageAlt: "HTML to Clean Markdown Converter for LLM & RAG | Cerilas Tools",
    breadcrumbsName: "HTML to LLM Markdown",
    faq: [
        {
            "q": "Does this converter preserve Markdown tables and syntax-highlighted code blocks?",
            "a": "Yes. HTML tables are converted into clean GitHub-flavored Markdown tables, and pre/code tags retain their language identifiers."
        },
        {
            "q": "Why should web scraping HTML be converted to Markdown for LLMs?",
            "a": "HTML contains bloated tags, classes, and scripts that waste precious token context windows and confuse LLM attention mechanisms. Markdown is clean and high-signal."
        },
        {
            "q": "Does it remove cookie banners, navigation menus, and advertisement blocks?",
            "a": "Yes. The extraction algorithm isolates the primary article container and discards navigation chrome, footers, and advertisement containers."
        },
        {
            "q": "Can I copy or download the converted Markdown file directly?",
            "a": "Yes. You can copy the clean Markdown with one click or download it as a .md file ready for your knowledge base or RAG vector database."
        }
    ]
  }
};
