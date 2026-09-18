import { useState, useEffect } from 'react';
import { 
  FileText, 
  Bot, 
  Search, 
  ShieldCheck, 
  Terminal, 
  ChevronDown, 
  Layers, 
  AlertCircle, 
  ArrowUpRight,
  Globe,
  Database,
  Code2
} from 'lucide-react';
import './LlmsTxtSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is llms.txt and what problem does it solve?',
    a: 'llms.txt is an emerging open standard (llmstxt.org) designed to provide a lightweight, curated Markdown guide to a website\'s most useful resources for Large Language Model (LLM) agents and AI search systems. While robots.txt manages crawler access permissions and sitemap.xml dumps every URL on a domain, llms.txt provides a clean human- and machine-readable table of contents highlighting high-value documentation, product pages, and developer guides.'
  },
  {
    q: 'What is the current llms.txt v2 format specification?',
    a: 'Under the v2 specification, an llms.txt file begins with a single required H1 title (# Project Name), followed immediately by an optional blockquote summary (> Short summary of the project), optional explanatory markdown, and zero or more H2 sections (## Section Name). Each section contains a Markdown bullet list of links following the format: - [Title](URL): Optional description. Secondary or auxiliary resources may conventionally be placed under "## Optional".'
  },
  {
    q: 'What is the difference between llms.txt and robots.txt?',
    a: 'robots.txt and llms.txt solve entirely different problems and neither overrides the other. robots.txt specifies technical crawl permissions (Allow/Disallow) for search engines and web scrapers. llms.txt provides content orientation, telling AI agents which URLs are most authoritative, what each page covers, and where clean markdown documentation can be fetched.'
  },
  {
    q: 'What is the difference between llms.txt and sitemap.xml?',
    a: 'sitemap.xml is an exhaustive XML catalog intended to list all indexable URLs on a website for search engines. Dumping thousands of sitemap URLs into an llms.txt file is considered an anti-pattern because LLMs have finite context windows. llms.txt is intended to be a curated index of your 10 to 50 most essential resources.'
  },
  {
    q: 'Does llms.txt only belong at the domain root, or can it exist at subpaths?',
    a: 'llms.txt can exist both at the domain root (https://example.com/llms.txt) and at path levels (e.g. https://example.com/docs/llms.txt or https://example.com/api/llms.txt). A path-level file applies to content beneath that specific subpath. If multiple llms.txt files apply, AI agents treat the most specific path-level file as the authoritative guide for that section.'
  },
  {
    q: 'How do AI agents discover llms.txt on a website?',
    a: 'AI agents discover llms.txt in three primary ways: 1) by probing the standard root path /llms.txt; 2) via HTML <link rel="describedby" href="/llms.txt"> tags on the homepage; and 3) via HTTP Link headers (Link: </llms.txt>; rel="describedby").'
  },
  {
    q: 'What are Markdown Alternatives and how are they signaled?',
    a: 'Websites often provide clean, raw Markdown counterparts for documentation pages (stripping headers, sidebars, and ads). These are advertised in HTML using <link rel="alternate" type="text/markdown" href="/docs/page.md"> or HTTP Link headers. Agents encountering these links can fetch raw markdown directly for concise, token-efficient ingestion.'
  },
  {
    q: 'Does creating an llms.txt file guarantee AI search rankings or citations?',
    a: 'No. llms.txt is an emerging convention for helping AI agents discover and understand useful website resources. It does not guarantee indexing, citations, or search rankings by ChatGPT, Claude, Gemini, or Perplexity.'
  }
];

const RELATED_TOOLS = [
  { name: 'AI Crawler Checker', desc: 'Verify if ChatGPT, Claude, and Perplexity can crawl your site.', href: '#/tool/ai-crawler-checker' },
  { name: 'AI Link Hallucination Checker', desc: 'Scan AI drafts for fabricated URLs, 404 links, and slopsquatting risks.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'AI Content Detector', desc: 'Enterprise multi-model detection evaluating perplexity and burstiness.', href: '#/tool/ai-content-detector' },
  { name: 'PDF → RAG Cleaner', desc: 'Clean headers, footers, and noise from PDFs for vector embeddings.', href: '#/tool/pdf-rag-cleaner' },
  { name: 'JSON Beautifier & Formatter', desc: 'Validate, clean, and format JSON structures without data leaks.', href: '#/tool/json-beautifier' },
  { name: 'QR Code Generator', desc: 'Generate vector QR codes for websites, vCards, and credentials.', href: '#/tool/qr-code-generator' }
];

export default function LlmsTxtSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Cerilas LLMs.txt Generator, Checker & Validator',
      url: 'https://tools.cerilas.com/#/tool/llms-txt',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      description: 'Free online tool suite to create, inspect, and validate llms.txt files under the latest v2 specification. Test link health, detect rel=describedby discovery, and audit markdown alternatives.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'Automated sitemap crawling & resource classification for llms.txt',
        'RFC v2 specification compliance validator',
        'Link health checker probing 200 OK, 301 redirects, and 404 errors',
        'rel=describedby discovery and markdown alternative detection',
        'LLMs.txt Quality Score (0–100) with 1-click Auto-Fix'
      ]
    };

    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Generate and Validate an llms.txt File for AI Agents',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Scan Your Website',
          text: 'Enter your website domain in the Generator tab. The crawler inspects your sitemap and prioritizes high-value documentation and product pages.'
        },
        {
          '@type': 'HowToStep',
          name: 'Curate Recommended Resources',
          text: 'Review the classified resources across Documentation, Products, API, and Guides. Toggle links, edit descriptions, and adjust sections.'
        },
        {
          '@type': 'HowToStep',
          name: 'Check Live Implementation',
          text: 'Use the Checker tab to probe your deployed /llms.txt file, test link HTTP statuses, and verify rel="describedby" discovery tags.'
        },
        {
          '@type': 'HowToStep',
          name: 'Validate & Auto-Fix',
          text: 'Run the Validator to check H1 positioning, Markdown link syntax, and conciseness, then apply 1-click Auto-Fix if needed.'
        }
      ]
    };

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
    script.id = 'llms-txt-jsonld';
    script.text = JSON.stringify([webAppSchema, howToSchema, faqSchema]);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('llms-txt-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="llms-seo-wrapper">
      {/* 1. Core Technical Overview */}
      <section className="llms-seo-block">
        <div className="llms-seo-header">
          <span className="llms-seo-badge-tag">
            <FileText size={14} /> Comprehensive Specification Guide
          </span>
          <h2 className="llms-seo-title">What is llms.txt? The AI-Friendly Site Guide Convention</h2>
          <p className="llms-seo-desc">
            As autonomous AI agents, multi-turn reasoning models, and search engines navigate the modern web, they face a fundamental bottleneck: <strong>token economy and noise</strong>. Learn how <code>llms.txt</code> provides a streamlined, curated guide for LLM context windows.
          </p>
        </div>

        <div className="llms-feature-grid">
          <div className="llms-feature-card">
            <div className="llms-feature-icon-box">
              <Bot size={22} />
            </div>
            <h3 className="llms-feature-title">Curated Token Efficiency</h3>
            <p className="llms-feature-text">
              Websites are filled with JavaScript bundles, cookie banners, navigation menus, and repetitive boilerplate. An <code>llms.txt</code> file cuts through the noise, delivering clean Markdown pointers that agents can consume in under 1,000 tokens.
            </p>
          </div>

          <div className="llms-feature-card">
            <div className="llms-feature-icon-box">
              <Code2 size={22} />
            </div>
            <h3 className="llms-feature-title">Markdown Alternative Linking</h3>
            <p className="llms-feature-text">
              The v2 proposal encourages publishers to provide clean <code>.md</code> variants for key documentation pages, discoverable through <code>&lt;link rel="alternate" type="text/markdown"&gt;</code> headers for lightning-fast agent ingestion.
            </p>
          </div>

          <div className="llms-feature-card">
            <div className="llms-feature-icon-box">
              <Layers size={22} />
            </div>
            <h3 className="llms-feature-title">Path-Level Scoping</h3>
            <p className="llms-feature-text">
              Large documentation hubs can place specific <code>/docs/llms.txt</code> or <code>/api/llms.txt</code> files alongside their root guide. Path-level files govern subdirectories with specialized context and targeted resources.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Example Specification */}
      <section className="llms-seo-block">
        <div className="llms-seo-header">
          <span className="llms-seo-badge-tag">
            <Terminal size={14} /> Format Specification
          </span>
          <h2 className="llms-seo-title">The llms.txt v2 File Format Structure</h2>
          <p className="llms-seo-desc">
            An anatomically compliant llms.txt v2 document following llmstxt.org recommendations:
          </p>
        </div>

        <pre className="llms-code-box">
{`# Cerilas

> Cerilas develops technology products, AI tools and software solutions.

This file provides key resources for understanding Cerilas and its products.

## Products

- [Cerilas Tools](https://cerilas.com/tools): Browser-based productivity, developer and AI tools.
- [GISMO](https://cerilas.com/gismo): AI-powered desktop companion platform.

## Documentation

- [Developer Documentation](https://cerilas.com/docs): Technical documentation and implementation guides.
- [API Reference](https://cerilas.com/docs/api): REST and WebSocket endpoint specifications.

## Company

- [About Cerilas](https://cerilas.com/about): Information about Cerilas and its technology projects.

## Optional

- [Blog](https://cerilas.com/blog): Articles, release notes, and company engineering updates.`}
        </pre>
      </section>

      {/* 3. Comparison Matrix: llms.txt vs robots.txt vs sitemap.xml */}
      <section className="llms-seo-block">
        <div className="llms-seo-header">
          <span className="llms-seo-badge-tag">
            <Database size={14} /> Architectural Comparison
          </span>
          <h2 className="llms-seo-title">llms.txt vs. robots.txt vs. sitemap.xml</h2>
          <p className="llms-seo-desc">
            Understanding the distinct role of each web discovery standard:
          </p>
        </div>

        <div className="llms-table-container">
          <table className="llms-compare-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Primary Purpose</th>
                <th>Target Audience</th>
                <th>Typical Scope</th>
                <th>Enforcement Nature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>robots.txt</code></td>
                <td>Controls technical crawling and indexing permissions</td>
                <td>Search engine spiders & web bots</td>
                <td>Whole domain paths & user-agents</td>
                <td>Crawler access policy (RFC 9309)</td>
              </tr>
              <tr>
                <td><code>sitemap.xml</code></td>
                <td>Exhaustive list of all public canonical URLs</td>
                <td>Search engines (Google, Bing)</td>
                <td>Up to 50,000 URLs per file</td>
                <td>Discovery & crawl priority hint</td>
              </tr>
              <tr>
                <td><code>llms.txt</code></td>
                <td>Curated, token-efficient table of contents in Markdown</td>
                <td>LLM agents, RAG pipelines, AI search</td>
                <td>Top 10 to 50 high-value resources</td>
                <td>Content orientation convention</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Conservative Product Principle Callout */}
      <section className="llms-seo-block">
        <div className="llms-callout">
          <AlertCircle className="llms-callout-icon" size={26} />
          <div className="llms-callout-body">
            <h4>Important Convention Notice</h4>
            <p>
              <code>llms.txt</code> is an emerging convention for helping AI agents discover and understand useful website resources. It does <strong>not</strong> guarantee indexing, citations, or search rankings by ChatGPT, Claude, Gemini, or Perplexity. Always ensure your core accessibility, semantic HTML, and robots.txt permissions are properly aligned.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="llms-seo-block">
        <div className="llms-seo-header">
          <span className="llms-seo-badge-tag">
            <ChevronDown size={14} /> FAQ
          </span>
          <h2 className="llms-seo-title">Frequently Asked Questions</h2>
          <p className="llms-seo-desc">
            Expert answers regarding llms.txt v2 syntax, validator rules, discoverability tags, and best practices.
          </p>
        </div>

        <div className="llms-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="llms-faq-item">
                <button 
                  className="llms-faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`llms-faq-chevron ${isOpen ? 'open' : ''}`} size={18} />
                </button>
                {isOpen && (
                  <div className="llms-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Related Tools */}
      <section className="llms-seo-block">
        <div className="llms-seo-header">
          <span className="llms-seo-badge-tag">
            <Layers size={14} /> Ecosystem
          </span>
          <h2 className="llms-seo-title">Related Cerilas AI & Developer Tools</h2>
          <p className="llms-seo-desc">
            Complementary utilities to optimize, audit, and secure your web infrastructure.
          </p>
        </div>

        <div className="llms-related-grid">
          {RELATED_TOOLS.map((tool, idx) => (
            <a key={idx} href={tool.href} className="llms-related-card">
              <h4>
                <span>{tool.name}</span>
                <ArrowUpRight size={14} />
              </h4>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
