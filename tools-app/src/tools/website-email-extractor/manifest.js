export const websiteEmailExtractorManifest = {
  slug: 'website-email-extractor',
  title: 'Website Email & Department Extractor',
  shortDescription: 'Crawl any website to discover and organize email addresses by department, unit, and team member using deterministic DOM parsing without AI.',
  category: 'Web Tools',
  iconName: 'Mail',
  badge: 'Rule-Based Engine',
  isAi: false,
  targetUrl: '#/tool/website-email-extractor',
  features: [
    'Deterministic Non-AI Crawler: Uses high-performance HTML parsing, RFC 5322 regex, and DOM heuristics without relying on language models',
    'Automatic Department & Unit Mapping: Categorizes emails into Executive, Sales, HR, Engineering, Support, Finance, Legal, and Press',
    'Personnel & Role Detection: Identifies individual team member names from email prefixes and sibling heading elements',
    'Deep Subpage Crawler: Recursively crawls internal pages within the same domain with configurable depth and page limits',
    'Anti-Scrape & De-obfuscation: Detects obfuscated contact formats such as name [at] domain.com and HTML entities',
    'Noise Filtering: Automatically filters out placeholder domains, tracking beacons, image filenames, and system mailer addresses',
    'Multi-Format Contact Export: Copy contacts as clean comma-separated lists, newline strings, or download structured CSV and JSON spreadsheets',
    'SSRF & Privacy Protected: Zero server data storage, strict private subnet blocking, and 100% compliant deterministic execution'
  ],
  seo: {
    title: "Free Website Email & Department Extractor | Cerilas Tools",
    description: "Recursively crawl websites to extract and organize verified company emails by department. Deterministic DOM parsing with zero AI hallucinations or limits.",
    keywords: "website email extractor, site email crawler, find emails on website, extract emails from domain, email scraper no ai, department email finder, company email extractor, lead extractor",
    ogImage: 'https://tools.cerilas.com/tool-icons/website-email-extractor.webp',
    ogImageAlt: "Free Website Email & Department Extractor | Cerilas Tools",
    breadcrumbsName: "Website Email & Department Extractor",
    faq: [
        {
            "q": "How does deterministic DOM extraction avoid email hallucination?",
            "a": "It relies strictly on exact RFC 5322 regular expression matching and mailto: protocol parsing directly from HTML text, guaranteeing 100% verified existence on the target page."
        },
        {
            "q": "Does this crawler respect website rate limits and polite crawling standards?",
            "a": "Yes. The crawler restricts traversal to same-origin internal links, limits recursion depth, and throttles requests to prevent server strain."
        },
        {
            "q": "Can I export the extracted contact lists to CSV or JSON?",
            "a": "Yes. You can copy emails as comma-separated lists or download them as structured CSV and JSON files formatted with department tags."
        },
        {
            "q": "Which corporate departments are automatically categorized?",
            "a": "Executive, Sales, Human Resources, Engineering, Customer Support, Legal, and Press/Media based on page context and role prefix patterns."
        }
    ]
  }
};
