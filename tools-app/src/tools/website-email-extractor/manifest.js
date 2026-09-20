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
    title: 'Free Website Email & Department Extractor – Crawl Sites & Extract Team Emails | Cerilas Tools',
    description: 'Recursively crawl any website to extract verified email addresses categorized by department, unit, and team member. Fast, rule-based DOM extraction with zero AI and instant CSV export.',
    keywords: 'website email extractor, site email crawler, find emails on website, extract emails from domain, email scraper no ai, department email finder, company email extractor, team email finder, website contact scraper, crawl website for emails, free email extractor online, b2b email finder, rfc email regex scraper',
    ogImage: 'https://tools.cerilas.com/tool-icons/website-email-extractor.png',
    ogImageAlt: 'Cerilas Free Website Email & Department Extractor',
    breadcrumbsName: 'Email Extractor'
  }
};
