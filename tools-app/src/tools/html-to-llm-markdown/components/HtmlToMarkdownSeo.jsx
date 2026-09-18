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
  Code2,
  Zap,
  Sparkles
} from 'lucide-react';
import './HtmlToMarkdownSeo.css';

const FAQ_ITEMS = [
  {
    q: 'Why should I convert HTML to Markdown for LLMs and RAG pipelines?',
    a: 'Raw HTML from web pages contains massive amounts of noise: navigational bars, footer links, CSS styling, tracking scripts, cookie consent dialogs, and nested div wrappers. Feeding raw HTML into an LLM wastes between 60% and 90% of your prompt context window on non-semantic markup. Clean Markdown strips all visual chrome and isolates the pure semantic article structure, dramatically reducing token costs and preventing hallucination caused by irrelevant boilerplate.'
  },
  {
    q: 'How much token reduction can I expect from HTML-to-Markdown conversion?',
    a: 'On average, modern web pages achieve an 80% to 92% reduction in byte size and estimated LLM tokens. For example, a 150 KB article webpage typically compresses down to an 8 KB clean Markdown document, preserving 100% of headers, text paragraphs, code snippets, blockquotes, and tables.'
  },
  {
    q: 'How does the tool isolate the main article from website navigation and ads?',
    a: 'The engine uses semantic heuristics inspired by Mozilla Readability and modern web crawlers. It identifies priority containers such as <article>, <main>, and [role="main"], while stripping known noise containers like <header>, <nav>, <footer>, <aside>, <dialog>, and cookie modals.'
  },
  {
    q: 'Can I strip image tags and hyperlinks to save even more prompt tokens?',
    a: 'Yes. Our converter includes 1-click optimization toggles. If your AI task is pure text reasoning or summarization, enabling "Strip Images" and "Strip Hyperlinks" removes verbose image URLs and converts [anchor text](url) into clean plain text, maximizing available token budget for long-form reasoning.'
  },
  {
    q: 'How does this tool handle HTML tables and multi-column tabular data?',
    a: 'The converter translates HTML <table>, <tr>, <th>, and <td> elements into standard GitHub-Flavored Markdown (GFM) pipe tables (| Col 1 | Col 2 |) with aligned header delimiters. This structure is universally understood by Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro.'
  },
  {
    q: 'What is YAML Frontmatter and why is it useful for vector databases?',
    a: 'YAML frontmatter is a structured metadata block enclosed by triple dashes (---) placed at the top of a Markdown document. It records the document title, canonical source URL, date converted, word count, and token count. When ingesting documents into vector stores (like Pinecone, Qdrant, or pgvector), frontmatter provides essential metadata for retrieval filtering.'
  },
  {
    q: 'Is my URL scraping request secure and protected against SSRF?',
    a: 'Yes. Our backend enforces strict Server-Side Request Forgery (SSRF) filters. Requests to loopback addresses (127.0.0.1, localhost), private RFC 1918 subnets (10.x, 172.16-31.x, 192.168.x), and cloud metadata endpoints (169.254.169.254) are rejected immediately at both the hostname and DNS resolution levels.'
  },
  {
    q: 'Does this tool require an account, API key, or paid credits?',
    a: 'No. HTML to LLM Markdown Converter is 100% free and unlimited for all developers, researchers, and AI builders. You can convert as many URLs and HTML snippets as you need without signup.'
  }
];

const RELATED_TOOLS = [
  { name: 'LLMs.txt Tools', desc: 'Create, check, and validate your /llms.txt site guide for AI agents.', href: '#/tool/llms-txt' },
  { name: 'PDF → RAG Cleaner', desc: 'Transform raw, messy PDFs into clean Markdown and structured RAG chunks.', href: '#/tool/pdf-rag-cleaner' },
  { name: 'AI Crawler Checker', desc: 'Verify if ChatGPT, Claude, and Perplexity can access your website.', href: '#/tool/ai-crawler-checker' },
  { name: 'AI Link Hallucination Checker', desc: 'Audit AI drafts for fabricated URLs and broken link risks.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'JSON Beautifier & Formatter', desc: 'Format, repair, and convert JSON structures for developer APIs.', href: '#/tool/json-beautifier' },
  { name: 'AI Content Detector', desc: 'Detect AI-generated text using burstiness and perplexity analysis.', href: '#/tool/ai-content-detector' }
];

export default function HtmlToMarkdownSeo() {
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
    script.id = 'html-markdown-faq-schema';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('html-markdown-faq-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="htm-seo-wrapper">
      {/* 1. Value Proposition Pillars */}
      <section className="htm-seo-section">
        <div className="htm-seo-header">
          <span className="htm-seo-badge">
            <Sparkles size={13} /> Token-Optimized Web Ingestion
          </span>
          <h2 className="htm-seo-title">Why Convert Webpages &amp; HTML to LLM-Friendly Markdown?</h2>
          <p className="htm-seo-desc">
            Raw HTML was engineered for web browsers, not neural context windows. Extracting clean, semantic Markdown drastically reduces token costs while improving retrieval accuracy in RAG systems.
          </p>
        </div>

        <div className="htm-features-grid">
          <div className="htm-feature-card">
            <div className="htm-feature-icon">
              <Zap size={20} />
            </div>
            <h3>80%+ Context Window Token Savings</h3>
            <p>
              By eliminating CSS rules, script bundles, cookie notices, and deep nested div wrappers, token consumption drops by an average of 85%. Feed more high-signal context into Claude, GPT-4o, and Gemini.
            </p>
          </div>

          <div className="htm-feature-card">
            <div className="htm-feature-icon">
              <Bot size={20} />
            </div>
            <h3>Zero-Hallucination RAG Ingestion</h3>
            <p>
              Navigational menus and unrelated sidebar links confuse embedding models. Extracting only the semantic article body ensures vector databases index genuine knowledge rather than website boilerplate.
            </p>
          </div>

          <div className="htm-feature-card">
            <div className="htm-feature-icon">
              <ShieldCheck size={20} />
            </div>
            <h3>Enterprise SSRF Protection</h3>
            <p>
              Safely fetch live webpages without exposing your network. Our backend enforces multi-stage DNS resolution and IP verification to block loopback, RFC 1918, and AWS/GCP cloud metadata endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Technical Comparison: Raw HTML vs Clean Markdown */}
      <section className="htm-seo-section">
        <h3 className="htm-section-heading">
          <Layers size={18} /> Raw HTML vs. LLM-Friendly Markdown Comparison
        </h3>
        <p className="htm-seo-desc">
          How our deterministic conversion engine parses, transforms, and optimizes web content for language model consumption:
        </p>

        <div className="htm-compare-card">
          <table className="htm-compare-table">
            <thead>
              <tr>
                <th>Feature / Dimension</th>
                <th>Raw Webpage HTML</th>
                <th>Cerilas LLM Markdown</th>
                <th>Impact on AI Models</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Token Density</strong></td>
                <td>Low (10–25% content / 75–90% tags)</td>
                <td>High (95%+ pure semantic content)</td>
                <td>Up to 8x more documents fit in the context window</td>
              </tr>
              <tr>
                <td><strong>Boilerplate &amp; Noise</strong></td>
                <td>Contains nav, ads, footers, trackers</td>
                <td>Automatically stripped</td>
                <td>Eliminates confusion and irrelevant link hallucination</td>
              </tr>
              <tr>
                <td><strong>Table Representation</strong></td>
                <td>Deeply nested &lt;table&gt; &lt;tr&gt; &lt;td&gt;</td>
                <td>Clean GFM Pipe Tables (| A | B |)</td>
                <td>Easier for LLMs to reason across tabular data</td>
              </tr>
              <tr>
                <td><strong>Metadata &amp; Provenance</strong></td>
                <td>Scattered across &lt;meta&gt; and &lt;head&gt;</td>
                <td>Structured YAML Frontmatter Header</td>
                <td>Ready-to-use metadata for vector database filtering</td>
              </tr>
              <tr>
                <td><strong>Links &amp; Images</strong></td>
                <td>Bulky inline attributes and tracker URLs</td>
                <td>Configurable (Retained, Plain-Text, or Stripped)</td>
                <td>Full user control over link and token budget</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Developer FAQ Section */}
      <section className="htm-seo-section">
        <h3 className="htm-section-heading">
          <FileText size={18} /> Frequently Asked Questions
        </h3>
        <div className="htm-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={`htm-faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaq(isOpen ? null : index)}
              >
                <button
                  type="button"
                  className="htm-faq-question"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={16} className={`htm-chevron ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="htm-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Related AI & Developer Tools */}
      <section className="htm-seo-section">
        <h3 className="htm-section-heading">
          <Terminal size={18} /> Related AI &amp; Developer Tools
        </h3>
        <div className="htm-tools-grid">
          {RELATED_TOOLS.map((tool, index) => (
            <a
              key={index}
              href={tool.href}
              className="htm-tool-card"
            >
              <div className="htm-tool-top">
                <h4>{tool.name}</h4>
                <ArrowUpRight size={14} className="htm-tool-arrow" />
              </div>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
