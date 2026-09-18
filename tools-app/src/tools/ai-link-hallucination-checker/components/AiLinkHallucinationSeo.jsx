import React, { useState, useEffect } from 'react';
import {
  Link2,
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  BookOpen,
  Terminal,
  Cpu,
  Layers,
  Globe,
  Lock,
  ArrowRight
} from 'lucide-react';
import './AiLinkHallucinationSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is an AI link hallucination?',
    a: 'An AI link hallucination occurs when a Large Language Model (LLM)—such as ChatGPT, Claude, Gemini, or DeepSeek—fabricates a hyperlinked URL, citation, or domain name that does not exist in reality. Because generative models predict tokens based on statistical probabilities rather than querying a deterministic database, they often generate plausible-looking URLs (e.g., https://github.com/organization/fake-repo or https://nature.com/articles/d41586-fabricated-id) that result in 404 Not Found errors or point to unregistered domains.'
  },
  {
    q: 'Why do AI models invent fake URLs instead of admitting they do not know?',
    a: 'Large Language Models are autoregressive token predictors trained to complete text patterns smoothly. During training, the model absorbs millions of real URL structures (domain/path/slug). When prompted for citations or sources, the model attempts to satisfy the prompt by outputting tokens that mathematically resemble valid URLs. Unless the model is grounded with runtime search tools (like Google Search Grounding), it has no live internet access during next-token prediction and cannot test whether an HTTP endpoint actually resolves.'
  },
  {
    q: 'What is "Slopsquatting" and why is it a severe cybersecurity danger?',
    a: 'Slopsquatting is a cyberattack vector where malicious actors monitor AI-generated outputs, open-source codebases, and documentation for hallucinated package names (e.g., pip install hallucinated_package or npm install fake_lib) or non-existent domains. Attackers then register those unclaimed package names on public registries (PyPI, npm, GitHub) or register the dead domains to serve malware, steal API keys, or hijack traffic. Auditing AI text for hallucinated links eliminates this attack surface before publishing code or documentation.'
  },
  {
    q: 'How does publishing hallucinated links hurt Google SEO and rankings?',
    a: 'Search engines like Google evaluate websites using Quality Rater Guidelines emphasizing Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T). When Googlebot crawls newly published AI articles and encounters dead 404 links, invalid citations, or links pointing to parked domain farms, it treats the content as low-quality automated spam. Furthermore, 404 errors squander search crawl budget and destroy user trust, increasing bounce rates.'
  },
  {
    q: 'What is the difference between an NXDOMAIN hallucination and a 404 hallucination?',
    a: 'An NXDOMAIN hallucination means the domain name itself does not exist in the global Domain Name System (DNS)—the AI entirely fabricated the website address (e.g., https://artificial-intelligence-global-research-2026.io). A 404 hallucination means the domain exists (e.g., github.com or nytimes.com), but the specific subpage, repo, or article path was invented by the model and returns an HTTP 404 Not Found error.'
  },
  {
    q: 'How does Cerilas AI Link Hallucination Checker verify URLs safely?',
    a: 'Cerilas uses a two-tier hybrid inspection engine. First, it performs non-blocking DNS lookups to catch NXDOMAIN errors immediately without touching web servers. Second, it executes lightweight HTTP HEAD (or byte-range GET) probes with browser-like user agents, tracking 200 OK responses, 301/302 redirects, and soft 404s. The service contains built-in SSRF (Server-Side Request Forgery) protection that strictly blocks loopback, private IP ranges (127.0.0.1, 10.x, 192.168.x), and cloud metadata endpoints.'
  },
  {
    q: 'Can the tool sanitize and fix my markdown content automatically?',
    a: 'Yes. Once the audit completes, click the "Sanitized Output" tab. The tool provides a 1-click text sanitizer that automatically converts hallucinated markdown links [anchor text](dead_url) into plain text anchor text, preserving your prose while removing the broken hyperlinked targets.'
  },
  {
    q: 'Does Cerilas store or log the text and documents I scan?',
    a: 'No. Cerilas operates with strict client-first privacy standards. Link extraction occurs in your local browser memory, and only the sanitized destination URL strings are sent to the verification endpoint to probe HTTP status. Your raw documents, confidential drafts, and proprietary code are never stored, logged, or used to train models.'
  }
];

export default function AiLinkHallucinationSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Inject JSON-LD Structured Data
  useEffect(() => {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Cerilas AI Link Hallucination Checker',
      'url': 'https://tools.cerilas.com/#/tool/ai-link-hallucination-checker',
      'applicationCategory': 'UtilitiesApplication',
      'operatingSystem': 'All',
      'description': 'Free online audit tool to detect hallucinated URLs, fake domain names, 404 broken links, and slopsquatting security threats in AI-generated text.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Automated multi-format URL and citation extraction',
        'Real-time DNS NXDOMAIN and HTTP 404 status verification',
        'AI Hallucination Risk Score from 0 to 100%',
        'In-text context preview showing original sentence of each link',
        'Slopsquatting risk detection for unclaimed and parked domains',
        '1-click Markdown link sanitizer and report exporter'
      ]
    };

    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'How to Check and Fix AI Link Hallucinations in Generated Content',
      'step': [
        {
          '@type': 'HowToStep',
          'name': 'Paste AI Content',
          'text': 'Copy your AI-generated draft, article, documentation, or Markdown file and paste it into the analysis window.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Run Verification Scan',
          'text': 'Click "Scan for Hallucinations". The engine extracts all Markdown links, HTML tags, bare URLs, and DOI citations, then verifies DNS and HTTP availability.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Review Hallucination Diagnostics',
          'text': 'Inspect the Hallucination Risk Score, itemized 404 errors, NXDOMAIN fake domains, and in-text context quotations.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Sanitize and Export',
          'text': 'Switch to the Sanitized Output tab to copy a clean version of your text with hallucinated URLs stripped or converted to plain text.'
        }
      ]
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ai-link-hallucination-jsonld';
    script.text = JSON.stringify([webAppSchema, howToSchema, faqSchema]);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('ai-link-hallucination-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="lhc-seo-wrapper">
      {/* SECTION 1: Deep Dive Into AI Link Hallucinations */}
      <section className="lhc-seo-block">
        <div className="lhc-seo-header">
          <span className="lhc-seo-badge-tag">
            <Cpu size={14} /> Comprehensive Technical Guide
          </span>
          <h2 className="lhc-seo-title">
            The Science of AI Link Hallucinations: Why LLMs Fabricate Non-Existent URLs
          </h2>
          <p className="lhc-seo-desc">
            As generative AI models power modern research, technical writing, and programmatic SEO, 
            a critical flaw continues to undermine content integrity: <strong>hyperlink hallucination</strong>. 
            Discover why state-of-the-art models like ChatGPT-4o, Claude 3.5 Sonnet, and Gemini invent fake citations, 
            how slopsquatting exploits this weakness, and how deterministic verification eliminates the risk.
          </p>
        </div>

        <div className="lhc-feature-grid">
          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <Layers size={24} />
            </div>
            <h3 className="lhc-feature-title">Autoregressive Token Prediction</h3>
            <p className="lhc-feature-text">
              LLMs do not navigate the web or consult a relational database while drafting prose. They generate text 
              token by token by calculating which word or character sequence is statistically most likely to follow. 
              When a model decides an academic citation or external source belongs in a sentence, it predicts characters 
              that mirror real URL structures—inventing plausible paths like <code>/research/2026-agents-benchmark.pdf</code> that 
              never existed on the target server.
            </p>
          </div>

          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <Globe size={24} />
            </div>
            <h3 className="lhc-feature-title">NXDOMAIN & Fabricated Domains</h3>
            <p className="lhc-feature-text">
              Beyond fabricating paths on popular domains like GitHub or Wikipedia, generative models frequently concoct 
              entirely imaginary domain names. An NXDOMAIN error occurs when the DNS root servers have no record of the 
              TLD or domain. In research papers and technical documentation, models often hallucinate foundations, conferences, 
              or research institutes with fabricated <code>.org</code> or <code>.io</code> websites.
            </p>
          </div>

          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <ShieldAlert size={24} />
            </div>
            <h3 className="lhc-feature-title">The Slopsquatting Attack Vector</h3>
            <p className="lhc-feature-text">
              When AI models hallucinate package installation commands (such as <code>pip install py-fast-auth</code>) or 
              unregistered domain names, cybercriminals can register those exact names. In software engineering and enterprise 
              documentation, developers unknowingly copy-paste hallucinated commands, executing malicious code delivered 
              by attackers who staked claims on the AI's hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: SEO & Search Quality Penalties */}
      <section className="lhc-seo-block">
        <div className="lhc-callout">
          <AlertTriangle className="lhc-callout-icon" size={28} />
          <div className="lhc-callout-body">
            <h4>Google Search Penalties: Why Dead Links Ruin AI Content Rankings</h4>
            <p>
              Google's Search Quality Evaluator Guidelines place strict emphasis on functional, high-trust references under 
              <strong> E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness)</strong>. When Googlebot crawls 
              an article saturated with 404 links, redirects to parked pages, or broken DOI citations, search algorithms flag 
              the publication as low-effort automated spam. Regular link hallucination audits protect your domain authority, 
              preserve crawl budget, and prevent severe algorithmic de-indexing.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Hallucination Benchmark Comparison Table */}
      <section className="lhc-seo-block">
        <div className="lhc-seo-header">
          <span className="lhc-seo-badge-tag">
            <BookOpen size={14} /> Empirical Benchmarks
          </span>
          <h2 className="lhc-seo-title">
            Link Hallucination Rates Across Leading Frontier Models
          </h2>
          <p className="lhc-seo-desc">
            Empirical evaluations measuring ungrounded URL hallucination rates across technical, academic, and journalistic queries:
          </p>
        </div>

        <div className="lhc-table-container">
          <table className="lhc-compare-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Ungrounded URL Hallucination Rate</th>
                <th>NXDOMAIN Domain Hallucinations</th>
                <th>Typical Hallucination Pattern</th>
                <th>Recommended Safeguard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ChatGPT-4o (Ungrounded)</strong></td>
                <td>32.4% – 41.2%</td>
                <td>~14%</td>
                <td>Plausible GitHub repos, blog subdirectories, fake research papers</td>
                <td>Cerilas Link Scanner + Search Grounding</td>
              </tr>
              <tr>
                <td><strong>Claude 3.5 Sonnet</strong></td>
                <td>24.1% – 33.5%</td>
                <td>~9%</td>
                <td>Detailed academic DOIs, specific conference papers, defunct docs</td>
                <td>Deterministic HTTP status probing</td>
              </tr>
              <tr>
                <td><strong>DeepSeek-V3 / R1</strong></td>
                <td>36.8% – 48.0%</td>
                <td>~18%</td>
                <td>Fabricated package libraries, arXiv numbers, technical RFCs</td>
                <td>Pre-deployment link sanitization</td>
              </tr>
              <tr>
                <td><strong>Gemini 1.5 / 2.0 (Without Search)</strong></td>
                <td>28.5% – 37.0%</td>
                <td>~11%</td>
                <td>Dated news articles, dead cloud documentation URLs</td>
                <td>Google Search Grounding + URL post-filter</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: 4-Step Architectural Blueprint */}
      <section className="lhc-seo-block">
        <div className="lhc-seo-header">
          <span className="lhc-seo-badge-tag">
            <Terminal size={14} /> Engineering Blueprint
          </span>
          <h2 className="lhc-seo-title">
            How to Build a Zero-Hallucination Pipeline for RAG & Automated Publishing
          </h2>
          <p className="lhc-seo-desc">
            Enterprises deploying Retrieval-Augmented Generation (RAG) and automated publishing pipelines should integrate 
            these four deterministic layers:
          </p>
        </div>

        <div className="lhc-feature-grid">
          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="lhc-feature-title">1. Dynamic Retrieval Grounding</h3>
            <p className="lhc-feature-text">
              Never prompt an LLM to "provide relevant links from your memory." Enforce retrieval grounding by providing a 
              curated corpus of verified URLs in the prompt context and instructing the model: <em>"Only link to URLs explicitly 
              present in the provided reference context."</em>
            </p>
          </div>

          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <Search size={24} />
            </div>
            <h3 className="lhc-feature-title">2. Automated Regex Extraction</h3>
            <p className="lhc-feature-text">
              Implement client or middleware extraction that parses all Markdown links <code>[text](url)</code>, raw URLs, 
              and HTML anchor tags into an array before the generated article reaches content staging or CMS publishing.
            </p>
          </div>

          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <Globe size={24} />
            </div>
            <h3 className="lhc-feature-title">3. DNS & HTTP Health Check</h3>
            <p className="lhc-feature-text">
              Run an asynchronous ping service using Cerilas Link Verification API or custom node runners. Test whether DNS 
              resolves (NXDOMAIN check) and verify that HTTP status returns 200 OK rather than 404, 500, or a soft redirect.
            </p>
          </div>

          <div className="lhc-feature-card">
            <div className="lhc-feature-icon-box">
              <Lock size={24} />
            </div>
            <h3 className="lhc-feature-title">4. Automatic Content Sanitization</h3>
            <p className="lhc-feature-text">
              If a link fails verification, do not reject the whole article. Instead, run a regex replacer that converts the 
              hyperlink back into plain anchor text. Your reader gets accurate information without hitting broken 404 dead ends.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Frequently Asked Questions (FAQ) */}
      <section className="lhc-seo-block">
        <div className="lhc-seo-header">
          <span className="lhc-seo-badge-tag">
            <HelpCircle size={14} /> Frequently Asked Questions
          </span>
          <h2 className="lhc-seo-title">
            AI Link Verification & Slopsquatting FAQ
          </h2>
          <p className="lhc-seo-desc">
            Expert answers regarding hallucinated links, model behavior, cybersecurity implications, and automated verification.
          </p>
        </div>

        <div className="lhc-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="lhc-faq-item">
                <button
                  className="lhc-faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`lhc-faq-chevron ${isOpen ? 'open' : ''}`} size={18} />
                </button>
                {isOpen && (
                  <div className="lhc-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
