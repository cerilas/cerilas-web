import { useState, useEffect } from 'react';
import { 
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
  Cpu
} from 'lucide-react';
import './AiCrawlerCheckerSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is an AI crawler and how does it differ from a traditional search crawler?',
    a: 'An AI crawler is an automated HTTP robot operated by artificial intelligence laboratories (such as OpenAI, Anthropic, Perplexity, or Google) designed to fetch web content. Unlike traditional search crawlers like Googlebot—which index pages primarily to rank links in a 10-blue-links search results page—AI crawlers retrieve text either to synthesize direct natural-language answers (e.g. OAI-SearchBot, PerplexityBot) or to build foundational training corpora (e.g. GPTBot, ClaudeBot).'
  },
  {
    q: 'What is the critical difference between OAI-SearchBot and GPTBot?',
    a: 'OAI-SearchBot is OpenAI\'s real-time search and citation crawler. It discovers web pages so that ChatGPT can cite them as live sources with hyperlinked footnotes during user queries. GPTBot is OpenAI\'s model training crawler used to collect public internet datasets for future model architectures. Allowing OAI-SearchBot enables live visibility in ChatGPT search, while blocking GPTBot prevents your content from being ingested into foundation model weights.'
  },
  {
    q: 'Does blocking GPTBot or ClaudeBot hurt my visibility in ChatGPT or Claude search?',
    a: 'No. Both OpenAI and Anthropic have explicitly separated their search discovery crawlers from their model training bots. Blocking GPTBot (User-agent: GPTBot) does not prevent OAI-SearchBot from surfacing your articles in ChatGPT search experiences. Similarly, blocking ClaudeBot does not restrict Claude-SearchBot or Claude-User.'
  },
  {
    q: 'What is Google-Extended and does blocking it remove my site from Google Search?',
    a: 'Google-Extended is a robots.txt product token created by Google that allows publishers to manage whether their content is used to train Gemini models and power vertex generative AI features. Crucially, blocking Google-Extended does NOT affect your website’s ranking or indexing in traditional Google Search, which is governed independently by Googlebot.'
  },
  {
    q: 'Why can\'t I perform a fake HTTP request pretending to be Google-Extended?',
    a: 'Google-Extended is not an independent HTTP User-Agent string sent during network connections; it is strictly a robots.txt directive token parsed by Google\'s backend crawl infrastructure. Testing it requires evaluating your robots.txt file for directives under "User-agent: Google-Extended", rather than sending an HTTP request with that header.'
  },
  {
    q: 'What is the difference between automated indexing and user-initiated AI retrieval (Claude-User / Perplexity-User)?',
    a: 'Automated crawlers (such as Claude-SearchBot or PerplexityBot) traverse the internet autonomously on a scheduled basis to populate search indices. User-initiated retrieval agents (such as Claude-User or Perplexity-User) only fetch a specific web page when an end-user explicitly enters a URL or clicks a link inside a conversational AI session asking for a live summary.'
  },
  {
    q: 'Does allowing AI crawlers guarantee that my website will be cited or ranked by AI models?',
    a: 'No. A robots.txt permission is strictly a technical green light permitting network crawling. It does not predict ranking, citation frequency, or generative inclusion. AI platforms select citations based on retrieval relevance, semantic grounding, domain authority, and prompt alignment.'
  },
  {
    q: 'What is llms.txt and is it mandatory for AI visibility?',
    a: 'llms.txt is an emerging open markdown specification placed at /llms.txt that provides a curated, lightweight index of a website\'s most authoritative documentation and pages for LLM context windows. It is not mandatory, but adopting it provides a structured blueprint for AI agents and RAG pipelines.'
  }
];

const RELATED_TOOLS = [
  { name: 'AI Link Hallucination Checker', desc: 'Scan AI text for fabricated URLs, 404 links, and slopsquatting risks.', href: '#/tool/ai-link-hallucination-checker' },
  { name: 'AI Content Detector', desc: 'Enterprise multi-model detection evaluating burstiness and perplexity.', href: '#/tool/ai-content-detector' },
  { name: 'PDF → RAG Cleaner', desc: 'Clean headers, footers, and noise from PDFs for vector embeddings.', href: '#/tool/pdf-rag-cleaner' },
  { name: 'Webhook Tester', desc: 'Inspect real-time HTTP webhooks and payload headers with live tunnels.', href: '#/tool/webhook-tester' },
  { name: 'JSON Beautifier & Formatter', desc: 'Clean, validate, and format JSON structures with zero data leak.', href: '#/tool/json-beautifier' },
  { name: 'QR Code Generator', desc: 'Create permanent vector QR codes for URLs, WiFi, and vCards.', href: '#/tool/qr-code-generator' }
];

export default function AiCrawlerCheckerSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Cerilas AI Crawler Checker',
      url: 'https://tools.cerilas.com/#/tool/ai-crawler-checker',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      description: 'Free online tool to check whether ChatGPT, Claude, Perplexity, Gemini, and other AI systems can access your website. Evaluates robots.txt, sitemaps, indexability, and crawler permissions.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'Real-time robots.txt parsing under RFC 9309 standards',
        'Separation of AI search crawlers (OAI-SearchBot, Claude-SearchBot) from training bots (GPTBot, ClaudeBot)',
        'Google-Extended product token evaluation',
        'Homepage indexability and <meta name="robots"> diagnostic',
        'AI Search Accessibility Score (0–100)',
        '/llms.txt and XML sitemap presence detection',
        'Deterministic robots.txt rule generator'
      ]
    };

    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Audit and Manage AI Crawler Access on Your Website',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Enter Domain URL',
          text: 'Type your website address into the input field (e.g. example.com) and click Check AI Crawlers.'
        },
        {
          '@type': 'HowToStep',
          name: 'Inspect robots.txt & Header Directives',
          text: 'The server retrieves your robots.txt, homepage meta tags, and sitemaps through a secure SSRF-protected proxy.'
        },
        {
          '@type': 'HowToStep',
          name: 'Review AI Search vs. Training Permissions',
          text: 'Review itemized cards for ChatGPT Search (OAI-SearchBot), Claude Search, Perplexity, GPTBot, and Google-Extended.'
        },
        {
          '@type': 'HowToStep',
          name: 'Generate AI-Friendly Rules',
          text: 'Use the robots.txt generator to permit AI search indexing while safeguarding proprietary assets from model training.'
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
    script.id = 'ai-crawler-checker-jsonld';
    script.text = JSON.stringify([webAppSchema, howToSchema, faqSchema]);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('ai-crawler-checker-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="acc-seo-wrapper">
      {/* 1. Core Technical Overview */}
      <section className="acc-seo-block">
        <div className="acc-seo-header">
          <span className="acc-seo-badge-tag">
            <Bot size={14} /> Definitive Technical Guide
          </span>
          <h2 className="acc-seo-title">Understanding AI Crawlers: The New Architecture of Search & Retrieval</h2>
          <p className="acc-seo-desc">
            The web search landscape has bifurcated. Understanding the architectural divide between <strong>AI Search Discovery</strong> and <strong>Model Training Crawlers</strong> is critical for digital publishers, enterprise engineers, and SEO specialists.
          </p>
        </div>

        <div className="acc-feature-grid">
          <div className="acc-feature-card">
            <div className="acc-feature-icon-box">
              <Search size={22} />
            </div>
            <h3 className="acc-feature-title">AI Search & Discovery Crawlers</h3>
            <p className="acc-feature-text">
              Crawlers such as <code>OAI-SearchBot</code>, <code>Claude-SearchBot</code>, and <code>PerplexityBot</code> crawl the live web to populate indices for generative conversational answers. Allowing these crawlers enables your content to be cited with real-time links and traffic attribution.
            </p>
          </div>

          <div className="acc-feature-card">
            <div className="acc-feature-icon-box">
              <Database size={22} />
            </div>
            <h3 className="acc-feature-title">Foundation Model Training Crawlers</h3>
            <p className="acc-feature-text">
              Crawlers like <code>GPTBot</code> and <code>ClaudeBot</code> scrape the internet to construct large-scale training datasets for next-generation frontier models. Blocking training crawlers preserves your copyright without hurting real-time search discovery.
            </p>
          </div>

          <div className="acc-feature-card">
            <div className="acc-feature-icon-box">
              <Cpu size={22} />
            </div>
            <h3 className="acc-feature-title">On-Demand User Retrieval Agents</h3>
            <p className="acc-feature-text">
              Agents like <code>Claude-User</code> and <code>Perplexity-User</code> act on direct user instructions when someone pastes your URL into a chat session. Blocking them prevents users from summarizing your articles inside their personal AI workflows.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Comparison Table */}
      <section className="acc-seo-block">
        <div className="acc-seo-header">
          <span className="acc-seo-badge-tag">
            <Layers size={14} /> Crawler Matrix
          </span>
          <h2 className="acc-seo-title">Leading AI Crawlers, User-Agents, and Operational Purposes</h2>
          <p className="acc-seo-desc">
            Exact technical specifications for frontier AI web crawlers and robots.txt product tokens:
          </p>
        </div>

        <div className="acc-table-container">
          <table className="acc-compare-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>User-Agent Token</th>
                <th>Primary Purpose</th>
                <th>Search Visibility Impact</th>
                <th>Training Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>OpenAI</strong></td>
                <td><code>OAI-SearchBot</code></td>
                <td>ChatGPT Search discovery & live citations</td>
                <td>Critical for ChatGPT citations</td>
                <td>None (separate from training)</td>
              </tr>
              <tr>
                <td><strong>OpenAI</strong></td>
                <td><code>GPTBot</code></td>
                <td>Foundation model training (GPT-4o, GPT-5)</td>
                <td>None (blocking does not hurt search)</td>
                <td>Inclusion in model weights</td>
              </tr>
              <tr>
                <td><strong>Anthropic</strong></td>
                <td><code>Claude-SearchBot</code></td>
                <td>Claude search discovery & web indexing</td>
                <td>Direct citation inside Claude answers</td>
                <td>None</td>
              </tr>
              <tr>
                <td><strong>Anthropic</strong></td>
                <td><code>ClaudeBot</code></td>
                <td>Model development and training datasets</td>
                <td>None</td>
                <td>Inclusion in Anthropic models</td>
              </tr>
              <tr>
                <td><strong>Anthropic</strong></td>
                <td><code>Claude-User</code></td>
                <td>User-triggered URL browsing in Claude chat</td>
                <td>On-demand session retrieval</td>
                <td>None</td>
              </tr>
              <tr>
                <td><strong>Perplexity</strong></td>
                <td><code>PerplexityBot</code></td>
                <td>Perplexity conversational search indexing</td>
                <td>Perplexity answer cards & citations</td>
                <td>None</td>
              </tr>
              <tr>
                <td><strong>Google</strong></td>
                <td><code>Google-Extended</code></td>
                <td>Robots.txt token for Gemini training / Vertex</td>
                <td>Zero (Google Search uses Googlebot)</td>
                <td>Controls Gemini AI training</td>
              </tr>
              <tr>
                <td><strong>Google</strong></td>
                <td><code>Googlebot</code></td>
                <td>Traditional organic Google Search ranking</td>
                <td>Required for Google Search results</td>
                <td>Separate traditional index</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Callout Box for Product Principle */}
      <section className="acc-seo-block">
        <div className="acc-callout">
          <AlertCircle className="acc-callout-icon" size={26} />
          <div className="acc-callout-body">
            <h4>Critical Principle: Crawl Permission vs. AI Visibility</h4>
            <p>
              Allowing an AI crawler in your <code>robots.txt</code> simply grants technical crawl permission. It does <strong>not</strong> guarantee that your site will be indexed, cited, or ranked favorably by AI models. AI citation relies on content clarity, semantic relevance, structured schemas, fast TTFB, and domain authority.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Engineering Blueprint: How to configure robots.txt */}
      <section className="acc-seo-block">
        <div className="acc-seo-header">
          <span className="acc-seo-badge-tag">
            <Terminal size={14} /> Implementation Guide
          </span>
          <h2 className="acc-seo-title">How to Configure an AI-Friendly robots.txt File</h2>
          <p className="acc-seo-desc">
            Recommended policy configurations depending on your organization’s strategy:
          </p>
        </div>

        <div className="acc-feature-grid">
          <div className="acc-feature-card">
            <div className="acc-feature-icon-box">
              <ShieldCheck size={22} />
            </div>
            <h3 className="acc-feature-title">Strategy A: Maximize AI Citations (Allow Search, Block Training)</h3>
            <p className="acc-feature-text">
              The optimal configuration for digital publications and SaaS blogs seeking referral traffic from ChatGPT and Claude while protecting intellectual property:
            </p>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', overflowX: 'auto' }}>
{`# Allow AI Search & Citations
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Block AI Foundation Training
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /`}
            </pre>
          </div>

          <div className="acc-feature-card">
            <div className="acc-feature-icon-box">
              <Globe size={22} />
            </div>
            <h3 className="acc-feature-title">Strategy B: Full Open Access (Open Source & Public Docs)</h3>
            <p className="acc-feature-text">
              Ideal for open-source libraries, public technical documentation, and academic repositories that desire maximal dissemination across both search and model capabilities:
            </p>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', overflowX: 'auto' }}>
{`User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml`}
            </pre>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="acc-seo-block">
        <div className="acc-seo-header">
          <span className="acc-seo-badge-tag">
            <ChevronDown size={14} /> FAQ
          </span>
          <h2 className="acc-seo-title">Frequently Asked Questions</h2>
          <p className="acc-seo-desc">
            Direct answers to common questions about robots.txt rules, AI crawler management, and search indexability.
          </p>
        </div>

        <div className="acc-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="acc-faq-item">
                <button 
                  className="acc-faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`acc-faq-chevron ${isOpen ? 'open' : ''}`} size={18} />
                </button>
                {isOpen && (
                  <div className="acc-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Related Tools */}
      <section className="acc-seo-block">
        <div className="acc-seo-header">
          <span className="acc-seo-badge-tag">
            <Layers size={14} /> Ecosystem
          </span>
          <h2 className="acc-seo-title">Related Cerilas Developer & AI Tools</h2>
          <p className="acc-seo-desc">
            Complementary utilities to audit, clean, and optimize your web applications and AI data pipelines.
          </p>
        </div>

        <div className="acc-related-grid">
          {RELATED_TOOLS.map((tool, idx) => (
            <a key={idx} href={tool.href} className="acc-related-card">
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
