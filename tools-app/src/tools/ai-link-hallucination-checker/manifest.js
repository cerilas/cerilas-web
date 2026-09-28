export const aiLinkHallucinationCheckerManifest = {
  slug: 'ai-link-hallucination-checker',
  title: 'AI Link Hallucination Checker',
  shortDescription: 'Scan AI-generated text, articles, and research papers for fake URLs, fabricated domains, 404 broken links, and slopsquatting security threats with live verification.',
  category: 'AI Assisted',
  iconName: 'Link2',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/ai-link-hallucination-checker',
  features: [
    'Automated Multi-Format URL Extraction: Detects Markdown [links](url), HTML <a href>, raw URLs, DOI academic citations, and package references',
    'Real-Time DNS & HTTP Probing: Differentiates between non-existent domains (NXDOMAIN), dead 404 paths, redirects, and verified 200 OK links',
    'AI Hallucination Risk Score (0–100%): Instant classification into Pristine (0%), Low Risk (1–30%), Moderate Risk (31–70%), and Critical Hallucination (71–100%)',
    'In-Text Context Highlighter: Shows the exact sentence and paragraph where each link occurred so you can review false claims in context',
    'Slopsquatting & Domain Risk Warning: Flags unregistered or parked domains prone to malicious package or URL hijacking',
    '1-Click Text Sanitizer: Automatically strips broken or hallucinated links from your article or converts them into plain text',
    'Export Audit Reports: Download comprehensive audit summaries in Markdown, JSON, or CSV for editorial and compliance archives',
    '100% Privacy Focused: Text parsing and link checks are sanitized without storing your sensitive document contents'
  ],
  seo: {
    title: "AI Link Hallucination Checker & URL Verifier | Cerilas Tools",
    description: "Audit AI-generated articles for hallucinated, fake, or broken URLs. Verify HTTP status codes, DNS records, and redirect chains before publishing content.",
    keywords: "ai link hallucination checker, broken link checker, verify ai links, detect fake urls, check llm citations, ai seo link audit, hallucinated url detector",
    ogImage: 'https://tools.cerilas.com/tool-icons/ai-link-hallucination-checker.webp',
    ogImageAlt: "AI Link Hallucination Checker & URL Verifier | Cerilas Tools",
    breadcrumbsName: "AI Link Hallucination Checker",
    faq: [
        {
            "q": "Why do LLMs frequently hallucinate fake URLs and citations?",
            "a": "LLMs generate text probabilistically based on pattern matching rather than live web lookups, frequently inventing plausible-sounding domain names and article slugs that do not exist."
        },
        {
            "q": "How does publishing hallucinated links damage website SEO?",
            "a": "Linking to broken 404 pages or dead domains signals poor editorial quality to Google's Helpful Content algorithm, eroding domain authority and user trust."
        },
        {
            "q": "Which HTTP status codes and redirect chains are inspected?",
            "a": "The tool verifies 200 OK statuses, traces 301/302 redirect loops to final destinations, and flags 403 Forbidden, 404 Not Found, and 500 server errors."
        },
        {
            "q": "Can I verify links from ChatGPT, Claude, and Gemini outputs?",
            "a": "Yes. Paste raw text, Markdown, or HTML from any AI assistant or chatbot to audit all embedded references."
        }
    ]
  }
};
