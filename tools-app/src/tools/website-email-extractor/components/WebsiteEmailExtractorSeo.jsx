import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  Terminal,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Globe,
  Database,
  Code2,
  Zap,
  Users,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import './WebsiteEmailExtractorSeo.css';

const FAQ_ITEMS = [
  {
    q: 'How does this tool extract website emails without using AI or LLM models?',
    a: 'The engine uses a deterministic three-stage pipeline: First, it loads rendered HTML into Cheerio to isolate all anchor tags using the mailto: protocol. Second, it strips non-text scripts and media tags, running an RFC 5322 compliant regular expression over text nodes. Third, it executes rule-based de-obfuscation algorithms that recognize common obfuscation patterns like name [at] domain.com and HTML character entities, ensuring complete extraction without dispatching data to external AI models.'
  },
  {
    q: 'How are email addresses categorized into corporate departments and units?',
    a: 'Classification operates deterministically using structural and semantic heuristics. The engine first evaluates local-part prefix dictionaries (e.g. sales@, hr@, support@, ceo@, legal@, dev@). When prefixes are ambiguous, Cheerio examines surrounding DOM card containers, nearest headings (h2, h3), sibling role attributes, and page path slugs (/team, /contact, /kariyer, /leadership) to assign the contact to the correct corporate unit.'
  },
  {
    q: 'Does the crawler navigate across external domains or outgoing links?',
    a: 'No. The crawler operates under strict same-origin isolation. It only crawls internal hyperlinks matching the root hostname of your target URL. External domains, advertiser links, and third-party partner portals are filtered out to ensure privacy, speed, and polite network crawling.'
  },
  {
    q: 'What safeguards protect against Server-Side Request Forgery (SSRF)?',
    a: 'Our backend resolves the target domain via DNS and verifies that the resulting IP does not belong to private RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback addresses (127.0.0.1, localhost), link-local cloud metadata endpoints (169.254.169.254), or non-HTTP protocols.'
  },
  {
    q: 'How does the tool identify individual personnel names and roles?',
    a: 'If an email conforms to personal naming patterns (such as firstname.lastname@company.com or first_last@), the system automatically parses and capitalizes the individual\'s full name. Additionally, it reads sibling heading tags and CSS role descriptors (such as .title, .designation, or .role) within the containing team member card.'
  },
  {
    q: 'What export options are available for the discovered email addresses?',
    a: 'You can export discovered contacts with one click into comma-separated lists, newline-separated strings for email campaigns, structured CSV spreadsheets (including Name, Department, Role, Email, and Source URL), or raw JSON files for programmatic API pipelines.'
  },
  {
    q: 'Can this tool crawl JavaScript-heavy single page applications?',
    a: 'The crawler fetches HTML directly via HTTP requests with modern desktop browser headers. It extracts all emails present in server-rendered markup, static content, and standard HTML structures. For sites using pure client-side hydration, any emails embedded in initial HTML responses or metadata are fully discovered.'
  },
  {
    q: 'Is there a cost, sign-up requirement, or data retention policy?',
    a: 'No. The tool is 100% free with zero registration. Discovered contacts are processed in memory and delivered directly to your browser session; no scraped contacts or email addresses are stored in databases.'
  }
];

const RELATED_TOOLS = [
  { name: 'HTML to LLM Markdown', desc: 'Convert webpages into clean, token-efficient Markdown for RAG and AI prompts.', href: '#/tool/html-to-llm-markdown' },
  { name: 'AI Crawler Checker', desc: 'Audit whether ChatGPT, Claude, and Perplexity bots can crawl your website.', href: '#/tool/ai-crawler-checker' },
  { name: 'AI Link Hallucination Checker', desc: 'Verify URLs and detect broken or hallucinated links in generated content.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'LLMs.txt Tools', desc: 'Generate and validate /llms.txt manifests for AI search indexing.', href: '#/tool/llms-txt' },
  { name: 'Webhook Tester', desc: 'Inspect and debug real-time HTTP webhooks and payload headers.', href: '#/tool/webhook-tester' },
  { name: 'JSON Beautifier', desc: 'Format, validate, and clean JSON payloads for developer workflows.', href: '#/tool/json-beautifier' }
];

export default function WebsiteEmailExtractorSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'email-extractor-faq-schema';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('email-extractor-faq-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="wee-seo-wrapper">
      {/* 1. Value Proposition Pillars */}
      <section className="wee-seo-section">
        <div className="wee-seo-header">
          <span className="wee-seo-badge">
            <ShieldCheck size={13} /> Deterministic Contact Discovery
          </span>
          <h2 className="wee-seo-title">Why Use a Rule-Based Email &amp; Department Extractor?</h2>
          <p className="wee-seo-desc">
            Unlike expensive cloud scrapers or slow AI prompts, our deterministic crawler navigates website subpages, extracts RFC-compliant emails, and categorizes company departments without AI costs or data leaks.
          </p>
        </div>

        <div className="wee-features-grid">
          <div className="wee-feature-card">
            <div className="wee-feature-icon">
              <Layers size={20} />
            </div>
            <h3>100% Deterministic (Zero AI)</h3>
            <p>
              Executes through RFC 5322 regex matching, HTML mailto extraction, and Cheerio DOM parsing. No language model hallucinations, zero API token costs, and 100% repeatable output.
            </p>
          </div>

          <div className="wee-feature-card">
            <div className="wee-feature-icon">
              <Building2 size={20} />
            </div>
            <h3>Automated Department Mapping</h3>
            <p>
              Instantly maps discovered contacts into Sales, Human Resources, Engineering, Executive, Customer Support, Finance, and Legal units using structural DOM heuristics and prefix dictionaries.
            </p>
          </div>

          <div className="wee-feature-card">
            <div className="wee-feature-icon">
              <ShieldCheck size={20} />
            </div>
            <h3>SSRF Defense &amp; Privacy Isolation</h3>
            <p>
              Enforces strict same-origin subpage exploration and blocks private IP ranges, loopback endpoints, and internal cloud metadata servers. No data is stored on remote servers.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Technical Comparison Table */}
      <section className="wee-seo-section">
        <h3 className="wee-section-heading">
          <Layers size={18} /> Comparison: Conventional Scrapers vs. AI Prompts vs. Cerilas Extractor
        </h3>
        <p className="wee-seo-desc">
          How our deterministic engine outperforms commercial scraping tools and generative AI workflows:
        </p>

        <div className="wee-compare-card">
          <table className="wee-compare-table">
            <thead>
              <tr>
                <th>Feature / Dimension</th>
                <th>Cloud Scraper Subscriptions</th>
                <th>Generative AI Web Prompts</th>
                <th>Cerilas Deterministic Extractor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pricing Model</strong></td>
                <td>$49 to $299 monthly subscription</td>
                <td>Per-token API fees (high cost)</td>
                <td>100% Free &amp; Unlimited</td>
              </tr>
              <tr>
                <td><strong>AI Hallucination Risk</strong></td>
                <td>None (Regex based)</td>
                <td>High (May fabricate contacts)</td>
                <td>Zero (Strict RFC &amp; DOM parsing)</td>
              </tr>
              <tr>
                <td><strong>Department Categorization</strong></td>
                <td>Raw email dump only</td>
                <td>Unpredictable formatting</td>
                <td>Automated corporate unit classification</td>
              </tr>
              <tr>
                <td><strong>Subpage Crawling</strong></td>
                <td>Consumes per-page credits</td>
                <td>Limited to single prompt context</td>
                <td>Configurable BFS crawler (up to 50 pages)</td>
              </tr>
              <tr>
                <td><strong>Privacy &amp; Data Security</strong></td>
                <td>Target domains logged to vendors</td>
                <td>Website text sent to LLM providers</td>
                <td>Zero data storage, ephemeral in-memory processing</td>
              </tr>
              <tr>
                <td><strong>Export Flexibility</strong></td>
                <td>Restricted behind paywall</td>
                <td>Manual copy-pasting</td>
                <td>1-click CSV, JSON, and newline copy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Developer FAQ Section */}
      <section className="wee-seo-section">
        <h3 className="wee-section-heading">
          <Terminal size={18} /> Frequently Asked Questions
        </h3>
        <div className="wee-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={`wee-faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaq(isOpen ? null : index)}
              >
                <button
                  type="button"
                  className="wee-faq-question"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={16} className={`wee-chevron ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="wee-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Related AI & Developer Tools */}
      <section className="wee-seo-section">
        <h3 className="wee-section-heading">
          <Terminal size={18} /> Related Developer &amp; Web Infrastructure Tools
        </h3>
        <div className="wee-tools-grid">
          {RELATED_TOOLS.map((tool, index) => (
            <a
              key={index}
              href={tool.href}
              className="wee-tool-card"
            >
              <div className="wee-tool-top">
                <h4>{tool.name}</h4>
                <ArrowUpRight size={14} className="wee-tool-arrow" />
              </div>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
