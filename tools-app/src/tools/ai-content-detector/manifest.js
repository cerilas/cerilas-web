export const aiContentDetectorManifest = {
  slug: 'ai-content-detector',
  title: 'AI Content Detector',
  shortDescription: 'Free AI text & PDF detector. Scores probability from 0 to 100% and analyzes pros & cons (AI vs Human markers, burstiness, and perplexity) with 100% in-browser PDF extraction.',
  category: 'AI Assisted',
  iconName: 'Cpu',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/ai-content-detector',
  features: [
    '0 to 100% Probability Scoring: Instant classification across Human-Written (0–25%), Mixed (26–65%), and Highly Likely AI (66–100%)',
    'Pros & Cons Indicator Breakdown: Compares Organic Human Writing Markers (pros) against Synthetic AI Markers (cons)',
    'Dual Input Modes: Direct text paste (up to 15,000 characters) or Drag & Drop PDF upload with local extraction',
    'Deep Linguistic Metrics: Evaluates Perplexity (vocabulary unpredictability) and Burstiness (sentence length cadence variance)',
    'Formulaic Pattern Detection: Spots repetitive ChatGPT/Claude transition clichés ("delve", "crucial", "testament", "tapestry")',
    'Sentence-Level Heatmap: Highlights suspect AI-generated sentences vs human-authored passages',
    '100% Client-Side PDF Parsing: PDF text extraction executes locally in browser memory without external document uploads',
    'Exportable Audit Report: One-click report download and clipboard copy for academic, editorial, and SEO verification'
  ],
  seo: {
    title: "Free AI Content Detector & Text Scanner | Cerilas Tools",
    description: "Scan text and PDF documents to detect AI-generated content from ChatGPT, Claude, and Gemini. View perplexity metrics, burstiness scores, and highlighted lines.",
    keywords: "ai content detector, detect chatgpt text, free ai detector, ai text scanner, claude detector, perplexity checker, check if text is ai, ai essay checker",
    ogImage: 'https://tools.cerilas.com/tool-icons/ai-content-detector.webp',
    ogImageAlt: "Free AI Content Detector & Text Scanner | Cerilas Tools",
    breadcrumbsName: "AI Content Detector",
    faq: [
        {
            "q": "Can AI content detectors achieve 100% detection accuracy?",
            "a": "No detector is infallible. Statistical models measure likelihood based on entropy and burstiness, which provides strong indicators but should be paired with human review."
        },
        {
            "q": "Can I upload full multi-page PDF documents for scanning?",
            "a": "Yes. The detector extracts text across all pages of uploaded PDF documents, providing paragraph-by-paragraph breakdown scores."
        },
        {
            "q": "Does Google penalize AI-generated content in search rankings?",
            "a": "Google prioritizes helpful, accurate, human-first content (E-E-A-T). Unedited AI content with low information gain and repetitive phrasing often suffers in ranking."
        },
        {
            "q": "What is the difference between perplexity and burstiness?",
            "a": "Perplexity measures how predictable words are in sequence (LLMs are predictable). Burstiness measures variance in sentence length and structure (humans are varied)."
        }
    ]
  }
};
