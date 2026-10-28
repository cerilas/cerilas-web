import SearchableHidden, { useSupportsUntilFound } from '../../../components/ui/SearchableHidden';
import { useState } from 'react';
import {
  Eye,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ArrowUpRight,
  Globe,
  Bot,
  Layers,
  HelpCircle,
  Database,
  Cpu,
  TrendingUp,
  CheckCircle2,
  FileCode,
  Building,
  Target,
  BarChart3,
  Compass,
  CheckSquare,
  Square,
  Copy,
  Check,
  Zap,
  BookOpen,
  ArrowRight,
  ListChecks
} from 'lucide-react';
import {
  CHECKER_FAQ,
  CHECKER_HOW_TO,
  CHECKER_RESULTS_GLOSSARY,
  CHECKER_VS_TRACKER
} from '../../../seo/aiVisibilityCheckerContent.js';
import './AiVisibilityCheckerSeo.css';

const CHECKLIST_ITEMS = [
  {
    id: 1,
    title: 'Schema.org JSON-LD Entity Disambiguation',
    desc: 'Organization, Product, MedicalBusiness, or SoftwareApplication markup with verified sameAs Wikidata and social links.'
  },
  {
    id: 2,
    title: 'High Information-Gain Benchmarks & Data',
    desc: 'Original statistical studies, proprietary price tables, and direct test metrics absent from competitor domains.'
  },
  {
    id: 3,
    title: 'Robots.txt AI Discovery Crawler Permissions',
    desc: 'Permitting GPTBot, OAI-SearchBot, PerplexityBot, and Google-Extended to fetch live web content without blocking.'
  },
  {
    id: 4,
    title: 'Semantic Direct Q&A Hierarchy',
    desc: 'Conversational H2/H3 question headers followed immediately by concise 40–70 word authoritative answer blocks.'
  },
  {
    id: 5,
    title: '/llms.txt AI Standard Deployed on Root',
    desc: 'Standardized markdown documentation at yourdomain.com/llms.txt guiding LLM context windows cleanly.'
  },
  {
    id: 6,
    title: 'Multi-Source Digital Entity Consensus',
    desc: 'Consistent brand citations across Trustpilot, G2, Wikipedia, LinkedIn, and authoritative industry directories.'
  }
];

const SCHEMA_SNIPPET = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://yourdomain.com/#organization",
      "name": "YourBrand Technologies",
      "url": "https://yourdomain.com",
      "logo": "https://yourdomain.com/brand-logo.png",
      "sameAs": [
        "https://www.wikidata.org/wiki/Q12345678",
        "https://www.linkedin.com/company/yourbrand"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://yourdomain.com/pricing#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the exact pricing for YourBrand in 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "YourBrand plans start at $29/month for Starter and $99/month for Pro with unlimited API requests and zero setup fees."
          }
        }
      ]
    }
  ]
}`;

const RELATED_TOOLS = [
  { name: 'GrowthControl AI Visibility Tracker', desc: 'Track the same AI questions every week, monitor competitors and connect Search Console.', href: '/growth' },
  { name: 'AI Crawler Checker', desc: 'Test whether robots.txt lets GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot read your site.', href: '/tool/ai-crawler-checker' },
  { name: 'LLMs.txt Tools & Validator', desc: 'Build and validate an /llms.txt file so AI systems find your canonical pages.', href: '/tool/llms-txt' },
  { name: 'AI Link Hallucination Checker', desc: 'Find fabricated or broken links in AI-generated answers with live HTTP checks.', href: '/tool/ai-link-hallucination-checker' },
  { name: 'HTML to Markdown Converter', desc: 'Convert web pages to clean Markdown for LLM context windows.', href: '/tool/html-to-llm-markdown' },
  { name: 'Connect ChatGPT to Search Console (MCP)', desc: 'Ask ChatGPT or Claude about your GA4 and Search Console data with read-only access.', href: '/tool/google-marketing-mcp' }
];

export default function AiVisibilityCheckerSeo() {
  const supportsUntilFound = useSupportsUntilFound();
  const [openFaq, setOpenFaq] = useState(null);
  const [checkedPillars, setCheckedPillars] = useState([1, 3]);
  const [copiedCode, setCopiedCode] = useState(false);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const togglePillar = (id) => {
    setCheckedPillars((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SCHEMA_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const scorePercentage = Math.round((checkedPillars.length / CHECKLIST_ITEMS.length) * 100);

  const getScoreTier = () => {
    if (scorePercentage >= 80) {
      return {
        label: 'Frontier AI Citation Ready (A+ Tier)',
        class: 'tier-high',
        text: 'Your domain architecture demonstrates exceptional readiness for Gemini and ChatGPT Search grounding. Maintain fresh content and monitor monthly citation audits.'
      };
    }
    if (scorePercentage >= 45) {
      return {
        label: 'Moderate AI Retrieval Potential (B Tier)',
        class: 'tier-med',
        text: 'Your website has foundational signals, but lacks structured Schema.org graphs or /llms.txt standards. Competitors may capture primary citation links.'
      };
    }
    return {
      label: 'Critical AI Invisibility Risk (C/D Tier)',
      class: 'tier-low',
      text: 'AI search engines are likely synthesizing answers without citing your domain. Implement direct Q&A blocks and enable AI crawler permissions immediately.'
    };
  };

  const scoreTier = getScoreTier();

  return (
    <div className="aivc-seo-wrapper">
      {/* How to check (answer-first, mirrors the HowTo schema) */}
      <section className="aivc-seo-section" aria-labelledby="aivc-howto-heading">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <ListChecks size={14} /> Step by Step
          </span>
          <h2 id="aivc-howto-heading" className="aivc-seo-title">{CHECKER_HOW_TO.title}</h2>
          <p className="aivc-seo-lead">{CHECKER_HOW_TO.lead}</p>
        </div>

        <ol className="aivc-steps-timeline aivc-steps-ordered">
          {CHECKER_HOW_TO.steps.map((step, idx) => (
            <li key={step.name} className="aivc-step-row">
              <div className="aivc-step-num">{idx + 1}</div>
              <div className="aivc-step-content">
                <h3 className="aivc-step-title">{step.name}</h3>
                <p className="aivc-step-desc">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Results glossary */}
      <section className="aivc-seo-section" aria-labelledby="aivc-results-heading">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <BarChart3 size={14} /> Reading Your Report
          </span>
          <h2 id="aivc-results-heading" className="aivc-seo-title">{CHECKER_RESULTS_GLOSSARY.title}</h2>
          <p className="aivc-seo-lead">{CHECKER_RESULTS_GLOSSARY.lead}</p>
        </div>

        <dl className="aivc-seo-grid aivc-glossary">
          {CHECKER_RESULTS_GLOSSARY.items.map((item) => (
            <div key={item.term} className="aivc-seo-card">
              <dt className="aivc-card-icon-title"><span>{item.term}</span></dt>
              <dd><p>{item.definition}</p></dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Checker vs tracker: hands ongoing-tracking intent to GrowthControl */}
      <section className="aivc-seo-section" aria-labelledby="aivc-vs-heading">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <TrendingUp size={14} /> Snapshot vs. Monitoring
          </span>
          <h2 id="aivc-vs-heading" className="aivc-seo-title">{CHECKER_VS_TRACKER.title}</h2>
          <p className="aivc-seo-lead">{CHECKER_VS_TRACKER.lead}</p>
        </div>

        <div className="aivc-table-container">
          <table className="aivc-compare-table">
            <thead>
              <tr>
                {CHECKER_VS_TRACKER.columns.map((col, idx) => (
                  <th key={idx} scope="col">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHECKER_VS_TRACKER.rows.map(([label, checker, tracker]) => (
                <tr key={label}>
                  <th scope="row"><strong>{label}</strong></th>
                  <td>{checker}</td>
                  <td>{tracker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a href={CHECKER_VS_TRACKER.ctaHref} className="aivc-seo-cta-link">
          <span>{CHECKER_VS_TRACKER.ctaLabel}</span>
          <ArrowRight size={16} />
        </a>
      </section>

      {/* 1. Core Technical Pillar Overview */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Eye size={14} /> Free AI Search Visibility &amp; Citations Audit
          </span>
          <h2 className="aivc-seo-title">
            Why AI visibility matters: Generative Engine Optimization (GEO)
          </h2>
          <p className="aivc-seo-lead">
            Traditional SEO was built for ten blue links. Today a growing share of questions is answered directly inside{' '}
            <strong>generative AI answer engines</strong> such as Google Gemini and AI Overviews, ChatGPT Search, Perplexity and Claude.
            When the answer is written for the user, the brands that get named and linked are the ones that win the click, so
            GEO focuses on <strong>being cited as a source</strong>, not just ranking.
          </p>
        </div>

        <div className="aivc-seo-grid">
          <div className="aivc-seo-card">
            <div className="aivc-card-icon-title">
              <div className="aivc-card-icon-wrap">
                <Search size={18} />
              </div>
              <span>Live Search Grounding Probing</span>
            </div>
            <p>
              Frontier LLMs do not rely solely on static training weights. Through Retrieval-Augmented Generation (RAG) and 
              Google Search Grounding, models query the live internet to cite fresh, verifiable source URLs in footnote citations.
            </p>
          </div>

          <div className="aivc-seo-card">
            <div className="aivc-card-icon-title">
              <div className="aivc-card-icon-wrap">
                <Database size={18} />
              </div>
              <span>Entity Authority &amp; Knowledge Graph</span>
            </div>
            <p>
              AI engines cite websites recognized as unambiguous digital entities. Robust Schema.org JSON-LD markup and Wikidata 
              anchoring establish verifiable brand credibility across neural retrieval pipelines.
            </p>
          </div>

          <div className="aivc-seo-card">
            <div className="aivc-card-icon-title">
              <div className="aivc-card-icon-wrap">
                <Target size={18} />
              </div>
              <span>Information Gain &amp; Direct Q&amp;A</span>
            </div>
            <p>
              Generic content is synthesized without attribution. High information-gain content—containing unique benchmark data, 
              original pricing statistics, and direct Q&amp;A answers—is cited directly to back up AI claims.
            </p>
          </div>

          <div className="aivc-seo-card">
            <div className="aivc-card-icon-title">
              <div className="aivc-card-icon-wrap">
                <BarChart3 size={18} />
              </div>
              <span>Competitor Citation Gap Analysis</span>
            </div>
            <p>
              When your domain is absent from AI answers, third-party aggregators and niche competitors harvest that high-intent traffic. 
              Auditing citations reveals who AI trusts in your category and why.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Interactive GEO Readiness Scorecard */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <CheckSquare size={14} /> Interactive Diagnostic
          </span>
          <h2 className="aivc-seo-title">
            Interactive AI Citation Readiness Scorecard
          </h2>
          <p className="aivc-seo-lead">
            Select the technical optimization signals currently implemented on your website to calculate your instant GEO Readiness Score:
          </p>
        </div>

        <div className="aivc-scorecard-box">
          <div className="aivc-scorecard-header">
            <div className="aivc-scorecard-title-wrap">
              <h3>Technical GEO Infrastructure Checklist</h3>
              <p>Click checkboxes to simulate your domain's citation retrieval probability</p>
            </div>
            <div className="aivc-score-display">
              <span className="aivc-score-number">{scorePercentage}%</span>
              <span className="aivc-score-max">/ 100</span>
            </div>
          </div>

          <div className="aivc-progress-track">
            <div
              className="aivc-progress-fill"
              style={{
                width: `${scorePercentage}%`,
                background:
                  scorePercentage >= 80
                    ? '#10b981'
                    : scorePercentage >= 45
                    ? '#3b82f6'
                    : '#f59e0b'
              }}
            />
          </div>

          <div className="aivc-checklist-grid">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedPillars.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`aivc-checklist-card ${isChecked ? 'checked' : ''}`}
                  onClick={() => togglePillar(item.id)}
                >
                  <div className="aivc-checkbox-icon">
                    {isChecked ? (
                      <CheckSquare size={19} color="#10b981" />
                    ) : (
                      <Square size={19} />
                    )}
                  </div>
                  <div className="aivc-checklist-content">
                    <span className="aivc-checklist-title">{item.title}</span>
                    <p className="aivc-checklist-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`aivc-score-recommendation ${scoreTier.class}`}>
            <Sparkles size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>{scoreTier.label}: </strong>
              <span>{scoreTier.text}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEO vs AEO vs GEO Comparison Matrix */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Layers size={14} /> Paradigm Shift
          </span>
          <h2 className="aivc-seo-title">
            Traditional SEO vs. Answer Engine Optimization (AEO) vs. Generative Engine Optimization (GEO)
          </h2>
          <p className="aivc-seo-lead">
            Understanding the distinction between traditional search ranking, voice-answer snippet extraction, and generative AI citation grounding:
          </p>
        </div>

        <div className="aivc-table-container">
          <table className="aivc-compare-table">
            <thead>
              <tr>
                <th>Optimization Dimension</th>
                <th>Legacy SEO (2010–2023)</th>
                <th>Answer Engine Optimization (AEO)</th>
                <th>Generative Engine Optimization (GEO 2026)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Target</strong></td>
                <td>Google / Bing 10 Blue Links</td>
                <td>Featured Snippets &amp; Voice Assistants</td>
                <td>Gemini, ChatGPT Search, Perplexity, Claude</td>
              </tr>
              <tr>
                <td><strong>Core Metric</strong></td>
                <td>Keyword Rank, CTR &amp; Organic Clicks</td>
                <td>Position Zero (Featured Snippet)</td>
                <td><span className="aivc-tag-pill green">AI Citation Rate &amp; Brand Inclusion</span></td>
              </tr>
              <tr>
                <td><strong>Content Architecture</strong></td>
                <td>Keyword-stuffed long-form articles (2,000+ words)</td>
                <td>40–60 word concise direct answer snippets</td>
                <td><span className="aivc-tag-pill blue">High Information-Gain, Q&amp;A Modules &amp; Entity Graphs</span></td>
              </tr>
              <tr>
                <td><strong>Technical Signal</strong></td>
                <td>Backlink volume &amp; PageRank</td>
                <td>Basic FAQ &amp; HowTo Schema</td>
                <td><span className="aivc-tag-pill purple">Nested JSON-LD Graph, /llms.txt &amp; Grounding Consensus</span></td>
              </tr>
              <tr>
                <td><strong>User Experience</strong></td>
                <td>User clicks link, browses website</td>
                <td>User reads quick answer at top of SERP</td>
                <td><span className="aivc-tag-pill amber">Conversational answer synthesized with linked source pills</span></td>
              </tr>
              <tr>
                <td><strong>Risk of Inaction</strong></td>
                <td>Drop in SERP rankings</td>
                <td>Loss of featured snippet spot</td>
                <td><strong>Total brand invisibility</strong> in zero-click AI search</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Frontier AI Engines Citation Mechanics */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Cpu size={14} /> Technical Specifications
          </span>
          <h2 className="aivc-seo-title">
            How Frontier AI Engines Select and Cite Web Sources
          </h2>
          <p className="aivc-seo-lead">
            Every major generative search engine applies distinct retrieval-augmented generation (RAG) and citation protocols:
          </p>
        </div>

        <div className="aivc-table-container">
          <table className="aivc-compare-table">
            <thead>
              <tr>
                <th>Engine</th>
                <th>Retrieval Backbone</th>
                <th>Citation Format</th>
                <th>Key Inclusion Criteria</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Google Gemini &amp; AI Overviews</strong></td>
                <td>Google Search Grounding &amp; Vertex AI Search</td>
                <td>Interactive numbered footnote pills with site favicons</td>
                <td>Freshness, Schema.org validation, factual consensus with Knowledge Graph</td>
              </tr>
              <tr>
                <td><strong>ChatGPT Search</strong></td>
                <td>Bing Index + OAI-SearchBot live crawler</td>
                <td>In-line hyperlinked source pill tags and sidebar link drawer</td>
                <td>Domain authority, robots.txt permission for OAI-SearchBot, clean HTML</td>
              </tr>
              <tr>
                <td><strong>Perplexity AI</strong></td>
                <td>Multi-index live web crawlers (Sonar / PerplexityBot)</td>
                <td>Numbered citation brackets referencing primary domain URLs</td>
                <td>Data richness, direct statistics, absence of intrusive paywalls</td>
              </tr>
              <tr>
                <td><strong>Claude Search</strong></td>
                <td>Anthropic web retrieval pipelines (Claude-SearchBot)</td>
                <td>Contextual hyperlinked attribution in synthesized response</td>
                <td>Authoritative technical documentation, neutrality, clear topic hierarchy</td>
              </tr>
              <tr>
                <td><strong>Microsoft Copilot</strong></td>
                <td>Prometheus Engine &amp; Bing Web Graph</td>
                <td>Direct footnote links &amp; hover card previews</td>
                <td>Bing Webmaster verification, semantic structured data, fast TTFB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Real-World Case Study: Before vs. After GEO */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <BookOpen size={14} /> Illustrative Example
          </span>
          <h2 className="aivc-seo-title">
            Example: a pricing page before and after GEO
          </h2>
          <p className="aivc-seo-lead">
            An illustrative B2B SaaS example showing which page patterns AI engines tend to skip and which they cite:
          </p>
        </div>

        <div className="aivc-case-grid">
          <div className="aivc-case-card before">
            <span className="aivc-case-badge">Before: Legacy Keyword Architecture</span>
            <h3 className="aivc-case-title">Keyword-Dense Blog Post with Hidden Pricing</h3>
            <p className="aivc-case-desc">
              A 2,500-word SEO article targeting "enterprise cloud backup pricing" with generic marketing copy, requiring 
              users to fill out a "Contact Sales" form to receive pricing details. Lacked Schema.org JSON-LD.
            </p>
            <div className="aivc-case-metrics">
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Citation Frequency:</span>
                <span className="aivc-metric-val bad">Rarely cited</span>
              </div>
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Footnote Source:</span>
                <span className="aivc-metric-val bad">Review Aggregators &amp; G2</span>
              </div>
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Referral Clicks:</span>
                <span className="aivc-metric-val bad">Clicks go to aggregators</span>
              </div>
            </div>
          </div>

          <div className="aivc-case-card after">
            <span className="aivc-case-badge">After: Modern GEO Architecture</span>
            <h3 className="aivc-case-title">Transparent Q&amp;A Chunks + Nested JSON-LD</h3>
            <p className="aivc-case-desc">
              The same page rebuilt with an explicit H2 ("How much does cloud backup cost?"), a transparent pricing comparison table, 
              concise 50-word answer block, and nested <code>Product</code> + <code>FAQPage</code> Schema.org graphs.
            </p>
            <div className="aivc-case-metrics">
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Citation Frequency:</span>
                <span className="aivc-metric-val good">Cited as a primary source</span>
              </div>
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Footnote Source:</span>
                <span className="aivc-metric-val good">Direct Official Domain URL</span>
              </div>
              <div className="aivc-case-metric-row">
                <span className="aivc-metric-label">AI Referral Clicks:</span>
                <span className="aivc-metric-val good">Clicks land on the official site</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Technical Blueprint: Schema.org Graph */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <FileCode size={14} /> Production Code
          </span>
          <h2 className="aivc-seo-title">
            The Optimal Schema.org Graph for Search Grounding Engines
          </h2>
          <p className="aivc-seo-lead">
            Deploy this clean, interconnected JSON-LD template into your page <code>&lt;head&gt;</code> to maximize AI citation confidence:
          </p>
        </div>

        <div className="aivc-code-container">
          <div className="aivc-code-header">
            <span>application/ld+json (Multi-Entity Graph)</span>
            <button
              type="button"
              className="aivc-code-copy"
              onClick={handleCopyCode}
            >
              {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Schema'}</span>
            </button>
          </div>
          <pre className="aivc-code-body">
            <code>{SCHEMA_SNIPPET}</code>
          </pre>
        </div>
      </section>

      {/* 7. Industry Playbooks: What Real Users Ask AI */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Building size={14} /> High-Intent Query Modeling
          </span>
          <h2 className="aivc-seo-title">
            Industry Playbooks: The Exact Queries Potential Customers Ask AI
          </h2>
          <p className="aivc-seo-lead">
            Users interact with AI conversationally, phrasing queries with high specificity, comparative intent, and local context:
          </p>
        </div>

        <div className="aivc-use-cases-grid">
          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">B2B SaaS &amp; Cloud Software</span>
            <h3 className="aivc-use-case-title">Comparative &amp; Pricing Queries</h3>
            <p className="aivc-use-case-desc">
              Buyers ask AI to compare software tiers, identify enterprise API limitations, and find cost-effective alternatives.
            </p>
            <div className="aivc-use-case-example">
              "What is the most secure open-source alternative to [Competitor] for HIPAA compliance?"
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">E-Commerce &amp; DTC Brands</span>
            <h3 className="aivc-use-case-title">Curated Buying Recommendations</h3>
            <p className="aivc-use-case-desc">
              Shoppers consult conversational assistants to filter products by technical criteria, user reviews, and budget brackets.
            </p>
            <div className="aivc-use-case-example">
              "Best wireless noise-cancelling headphones under AU$250 for small ears, shipped in Australia?"
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">Healthcare &amp; Medical Clinics</span>
            <h3 className="aivc-use-case-title">Local Procedures &amp; Cost Audits</h3>
            <p className="aivc-use-case-desc">
              Patients research doctor qualifications, recovery timelines, and transparent out-of-pocket costs for specialized treatments.
            </p>
            <div className="aivc-use-case-example">
              "How much does Invisalign cost in Toronto, and which orthodontists offer free consultations?"
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">Legal &amp; Financial Services</span>
            <h3 className="aivc-use-case-title">High-Trust Regulatory Advisory</h3>
            <p className="aivc-use-case-desc">
              Founders and investors seek verified legal frameworks, tax incentive structures, and regional statutory compliance.
            </p>
            <div className="aivc-use-case-example">
              "Best small business accountant in Manchester for VAT returns and Making Tax Digital?"
            </div>
          </div>
        </div>
      </section>

      {/* 8. Strategic 5-Step Blueprint */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <TrendingUp size={14} /> Actionable Methodology
          </span>
          <h2 className="aivc-seo-title">
            The 5-Step Strategic Blueprint to Boost Your AI Citation Rate
          </h2>
          <p className="aivc-seo-lead">
            A battle-tested workflow to transform your website from an invisible domain into a primary AI citation reference:
          </p>
        </div>

        <div className="aivc-steps-timeline">
          <div className="aivc-step-row">
            <div className="aivc-step-num">1</div>
            <div className="aivc-step-content">
              <h3 className="aivc-step-title">Discover High-Intent Conversational Queries</h3>
              <p className="aivc-step-desc">
                Stop targeting disjointed 2-word keywords. Use the AI Visibility Checker to uncover the natural-language questions 
                real customers ask AI search engines about your products, pricing, and differentiators.
              </p>
            </div>
          </div>

          <div className="aivc-step-row">
            <div className="aivc-step-num">2</div>
            <div className="aivc-step-content">
              <h3 className="aivc-step-title">Inject Complete Schema.org JSON-LD Graphs</h3>
              <p className="aivc-step-desc">
                Provide unambiguous machine-readable metadata. Add <code>Organization</code>, <code>Product</code>, <code>FAQPage</code>, 
                and <code>ItemAvailability</code> schemas so search grounding engines parse your entity parameters with 100% certainty.
              </p>
            </div>
          </div>

          <div className="aivc-step-row">
            <div className="aivc-step-num">3</div>
            <div className="aivc-step-content">
              <h3 className="aivc-step-title">Structure High Information-Gain Q&amp;A Modules</h3>
              <p className="aivc-step-desc">
                AI engines ignore boilerplate copy. Format key sections with direct H2/H3 question headers followed immediately by 
                concise, authoritative, fact-dense answers containing original data and transparent metrics.
              </p>
            </div>
          </div>

          <div className="aivc-step-row">
            <div className="aivc-step-num">4</div>
            <div className="aivc-step-content">
              <h3 className="aivc-step-title">Neutralize Competitor Citation Dominance</h3>
              <p className="aivc-step-desc">
                Examine which directories, Wikipedia articles, or rival domains Gemini cites in your audit. Build presence on those 
                exact authoritative hubs to establish entity consensus across the broader web.
              </p>
            </div>
          </div>

          <div className="aivc-step-row">
            <div className="aivc-step-num">5</div>
            <div className="aivc-step-content">
              <h3 className="aivc-step-title">Ensure Crawler Accessibility &amp; Deploy /llms.txt</h3>
              <p className="aivc-step-desc">
                Verify in your <code>robots.txt</code> that search crawlers like <code>OAI-SearchBot</code> and <code>PerplexityBot</code> 
                are permitted. Publish a clean <code>/llms.txt</code> file to guide AI context windows directly to your canonical assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Strategic Takeaway Highlight Banner */}
      <div className="aivc-highlight-box">
        <div className="aivc-highlight-title">
          <CheckCircle2 size={24} color="#10b981" />
          <span>The Zero-Click Search Defense: Be the Source, Not Just the Page</span>
        </div>
        <p className="aivc-highlight-desc">
          When an AI assistant synthesizes an answer, users rarely click unless they seek verified primary evidence or a direct purchase transaction. 
          Securing a clickable citation link transforms zero-click AI summaries from a threat into your most qualified source of inbound organic traffic.
        </p>
      </div>

      {/* 10. Comprehensive FAQ Accordion */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <HelpCircle size={14} /> Knowledge Base
          </span>
          <h2 className="aivc-seo-title">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="aivc-seo-lead">
            Expert answers to critical questions about AI search citations, generative engine optimization, and Google search grounding:
          </p>
        </div>

        <div className="aivc-faq-list">
          {CHECKER_FAQ.map((item, idx) => (
            <div key={idx} className="aivc-faq-item">
              <h3 className="aivc-faq-heading">
                <button
                  type="button"
                  className="aivc-faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx || !supportsUntilFound}
                  aria-controls={`aivc-faq-answer-${idx}`}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`aivc-faq-chevron ${openFaq === idx ? 'open' : ''}`}
                  />
                </button>
              </h3>
              <SearchableHidden id={`aivc-faq-answer-${idx}`} isOpen={openFaq === idx} onReveal={() => setOpenFaq(idx)}>
                <div className="aivc-faq-answer">
                  {item.a}
                </div>
              </SearchableHidden>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Curated Related Tools */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Compass size={14} /> Ecosystem
          </span>
          <h2 className="aivc-seo-title">
            Complementary AI &amp; Web Infrastructure Utilities
          </h2>
          <p className="aivc-seo-lead">
            Optimize every stage of your digital footprint with Cerilas' suite of free, privacy-first developer and SEO utilities:
          </p>
        </div>

        <div className="aivc-tools-grid">
          {RELATED_TOOLS.map((tool, idx) => (
            <a key={idx} href={tool.href} className="aivc-tool-link-card">
              <div className="aivc-tool-card-head">
                <span>{tool.name}</span>
                <ArrowUpRight size={16} color="var(--text-muted)" />
              </div>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
