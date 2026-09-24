import { useState, useEffect } from 'react';
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
  Compass
} from 'lucide-react';
import './AiVisibilityCheckerSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is an AI Visibility Score and how is it calculated?',
    a: 'An AI Visibility Score measures the percentage of high-intent user queries where artificial intelligence models (such as Google Gemini, ChatGPT Search, and Perplexity) directly cite your website as an authoritative reference or name your brand in their synthesized answers. The score is computed by extracting the top 10 realistic search queries from your content, executing them with live search grounding, and grading your citation frequency from A+ (90%+ cited) down to F (0% presence).'
  },
  {
    q: 'What is Generative Engine Optimization (GEO) and why is it essential in 2026?',
    a: 'Generative Engine Optimization (GEO) is the practice of optimizing digital content so that Large Language Models (LLMs) and conversational search engines retrieve, trust, and cite your domain in AI-generated answers. With over 60% of modern informational and commercial queries answered directly by AI overviews without a traditional click to a search results page, GEO ensures your brand remains visible where user decisions are made.'
  },
  {
    q: 'How does Gemini AI decide which websites to cite in Google Search Grounding?',
    a: 'Google Gemini utilizes Google Search Grounding to anchor its neural responses in real-time web documents. The grounding algorithm favors pages that demonstrate high information gain, transparent author credentials, valid Schema.org structured data, direct answers to conversational questions, and consistent entity consensus across authoritative external platforms like Wikipedia and industry directories.'
  },
  {
    q: 'What is the difference between "Cited" and "Brand Mentioned"?',
    a: '"Cited" means the AI search engine explicitly included a clickable hyperlinked source pill or footnote leading directly to a specific URL on your domain within its grounding metadata chunks. "Brand Mentioned" means the AI recognized and named your company or service in the text of the answer, but cited a third-party aggregator, review platform, or directory instead of linking to your official site.'
  },
  {
    q: 'Why are competitor domains cited instead of my official website?',
    a: 'AI search engines frequently favor competitor websites or third-party review directories when those domains offer clearer structured data, concise bullet-point comparisons, transparent pricing tables, or stronger domain entity authority. Running an AI Visibility audit reveals the exact competitor domains that dominate your niche so you can replicate and surpass their content architecture.'
  },
  {
    q: 'How does Schema.org structured data affect AI search citations?',
    a: 'Schema.org JSON-LD markup (such as Organization, Product, FAQPage, MedicalBusiness, and Article) acts as an unambiguous translation layer for AI crawlers. It explicitly defines entities, attributes, relationships, pricing, and FAQs, eliminating ambiguities and dramatically increasing the probability that an LLM will select your page as a ground-truth citation source.'
  },
  {
    q: 'Can I test my website without providing a Gemini API key or registering an account?',
    a: 'Yes. Cerilas AI Visibility Checker is 100% free and requires zero registration or API key input. Raw website metadata extraction and live Google Gemini 3.8 Flash search grounding calls are handled securely server-side without user friction.'
  },
  {
    q: 'What is Answer Engine Optimization (AEO) and how does it relate to GEO?',
    a: 'Answer Engine Optimization (AEO) focuses specifically on structuring content into concise, direct answers (e.g., definitions, step-by-step lists, price summaries) so that conversational answer engines can extract them easily. Generative Engine Optimization (GEO) is the broader discipline encompassing AEO, brand entity verification, knowledge graph integration, and LLM citation mechanics.'
  },
  {
    q: 'How often should I run an AI Visibility audit on my website?',
    a: 'We recommend running an AI Visibility audit at least once per month or whenever you publish new flagship service pages, rebrand, or modify your Schema.org architecture. Because LLM search grounding indices update continuously, tracking citation fluctuations helps you proactively defend your organic brand footprint.'
  },
  {
    q: 'Does blocking AI crawlers in robots.txt prevent my site from being cited by AI search engines?',
    a: 'Yes. If your robots.txt file blocks search discovery crawlers like OAI-SearchBot (OpenAI) or PerplexityBot, or if you block Googlebot, AI search engines will not be able to retrieve your web pages during live retrieval-augmented generation (RAG) queries, reducing your citation rate to zero.'
  }
];

const RELATED_TOOLS = [
  { name: 'AI Crawler Checker', desc: 'Inspect robots.txt directives and HTTP permissions for AI search crawlers.', href: '#/tool/ai-crawler-checker' },
  { name: 'LLMs.txt Tools & Validator', desc: 'Build and validate /llms.txt files for AI agents and LLM ingestion.', href: '#/tool/llms-txt' },
  { name: 'AI Link Hallucination Checker', desc: 'Detect fabricated URLs and 404 links generated by LLMs with live DNS checks.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'AI Content Detector', desc: 'Enterprise multi-model detection evaluating burstiness and perplexity.', href: '#/tool/ai-content-detector' },
  { name: 'HTML to Markdown Converter', desc: 'Convert web pages to clean, structured markdown for LLM context windows.', href: '#/tool/html-to-llm-markdown' },
  { name: 'Website Email Extractor', desc: 'Extract contact emails, phone numbers, and social links from company websites.', href: '#/tool/website-email-extractor' }
];

export default function AiVisibilityCheckerSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  useEffect(() => {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Cerilas AI Visibility Checker',
      url: 'https://tools.cerilas.com/#/tool/ai-visibility-checker',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      description: 'Free AI Visibility Checker and Generative Engine Optimization (GEO) audit suite. Evaluates live citations, brand mentions, and competitor rankings across Gemini AI and Google Search Grounding.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'Automated zero-AI website content scraping (title, meta, headings, clean body)',
        'Top 10 high-intent search query modeling powered by Gemini 3.8 Flash',
        'Live Google Search Grounding citation verification',
        'Direct citation backlink detection vs. brand-only mention attribution',
        'Quantitative AI Visibility Score & Grade (A+ to F)',
        'Competitor citation gap analysis and domain aggregation',
        'Generative Engine Optimization (GEO) and AEO action recommendations'
      ]
    };

    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Audit and Improve Your Website AI Search Visibility (GEO)',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Enter Target Domain URL',
          text: 'Type your website URL into the input field and click Audit AI Visibility.'
        },
        {
          '@type': 'HowToStep',
          name: 'Extract Raw Content & Model Real Queries',
          text: 'The server retrieves your clean text without AI bias, then models the top 10 questions real users ask AI models about your products or services.'
        },
        {
          '@type': 'HowToStep',
          name: 'Probe Live Search Grounding',
          text: 'Each query is executed against Gemini 3.8 Flash with live Google Search Grounding to evaluate retrieval-augmented generation (RAG) source chunks.'
        },
        {
          '@type': 'HowToStep',
          name: 'Review Citations & Competitor Gaps',
          text: 'Inspect your AI Visibility Score, review direct backlinks vs. brand mentions, and examine competitor domains cited in place of your site.'
        },
        {
          '@type': 'HowToStep',
          name: 'Apply GEO Recommendations',
          text: 'Implement Schema.org JSON-LD structured data and Q&A formatting to claim high-authority AI citations.'
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
    script.id = 'ai-visibility-checker-jsonld';
    script.text = JSON.stringify([webAppSchema, howToSchema, faqSchema]);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('ai-visibility-checker-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="aivc-seo-wrapper">
      {/* 1. Core Technical Pillar Overview */}
      <section className="aivc-seo-section">
        <div className="aivc-seo-header">
          <span className="aivc-seo-badge-tag">
            <Sparkles size={14} /> Definitive Technical Guide
          </span>
          <h2 className="aivc-seo-title">
            The Generative Engine Optimization (GEO) Revolution in 2026
          </h2>
          <p className="aivc-seo-lead">
            Traditional Search Engine Optimization (SEO) was built for a world of ten blue links on a desktop monitor. In 2026, 
            over half of all search queries are resolved directly inside <strong>generative AI answer engines</strong>—including 
            Google Gemini, ChatGPT Search, Perplexity AI, and Claude. To capture traffic, brands must shift from keyword density to 
            <strong> citation grounding authority</strong>.
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

      {/* 2. SEO vs AEO vs GEO Comparison Matrix */}
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

      {/* 3. Frontier AI Engines Citation Mechanics */}
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

      {/* 4. Industry Playbooks: What Real Users Ask AI */}
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
              "What is the most secure open-source alternative to [Competitor] for HIPAA compliance in 2026?"
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">E-Commerce &amp; DTC Brands</span>
            <h3 className="aivc-use-case-title">Curated Buying Recommendations</h3>
            <p className="aivc-use-case-desc">
              Shoppers consult conversational assistants to filter products by technical criteria, user reviews, and budget brackets.
            </p>
            <div className="aivc-use-case-example">
              "Best wireless noise-cancelling headphones for small ears under $150 with multipoint Bluetooth."
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">Healthcare &amp; Medical Clinics</span>
            <h3 className="aivc-use-case-title">Local Procedures &amp; Cost Audits</h3>
            <p className="aivc-use-case-desc">
              Patients research doctor qualifications, recovery timelines, and transparent out-of-pocket costs for specialized treatments.
            </p>
            <div className="aivc-use-case-example">
              "How much does sapphire FUE hair transplant cost in Istanbul 2026 and which clinics include doctor surgery?"
            </div>
          </div>

          <div className="aivc-use-case-card">
            <span className="aivc-use-case-badge">Legal &amp; Financial Services</span>
            <h3 className="aivc-use-case-title">High-Trust Regulatory Advisory</h3>
            <p className="aivc-use-case-desc">
              Founders and investors seek verified legal frameworks, tax incentive structures, and regional statutory compliance.
            </p>
            <div className="aivc-use-case-example">
              "Step-by-step Delaware C-Corp vs Wyoming LLC tax comparison for non-US SaaS founders."
            </div>
          </div>
        </div>
      </section>

      {/* 5. Strategic 5-Step Blueprint */}
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

      {/* 6. Strategic Takeaway Highlight Banner */}
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

      {/* 7. Comprehensive FAQ Accordion */}
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
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="aivc-faq-item">
              <button
                type="button"
                className="aivc-faq-question"
                onClick={() => toggleFaq(idx)}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`aivc-faq-chevron ${openFaq === idx ? 'open' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="aivc-faq-answer">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Curated Related Tools */}
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
