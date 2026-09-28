import { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Globe,
  Bot,
  Layers,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  FileCode,
  DollarSign,
  Activity,
  Terminal,
  Lock,
  Zap,
  BarChart3,
  Copy,
  Check,
  Cpu,
  Share2,
  Sliders,
  ExternalLink,
  TableProperties
} from 'lucide-react';
import './GoogleMarketingMcpSeo.css';

const FAQ_ITEMS = [
  {
    q: 'How do I connect my ChatGPT to Google Analytics?',
    a: 'Connecting ChatGPT to Google Analytics is seamless with the Model Context Protocol (MCP) or OpenAI Custom Actions. First, authenticate your Google account above with read-only permissions. Next, copy the 1-Click Agentic Setup Prompt or your personal remote SSE endpoint. In ChatGPT, navigate to Settings > Connected Apps > Add MCP Server (or create a Custom GPT with Actions) and paste the configuration. ChatGPT will instantly discover your Google Analytics 4 and Search Console tools.'
  },
  {
    q: 'Can ChatGPT analyze both Google Analytics 4 and Google Search Console together?',
    a: 'Yes. The Cerilas MCP server bridges both Google Analytics 4 (GA4) and Google Search Console (GSC) inside a single conversational session. You can ask ChatGPT to correlate pre-click organic search behavior (impressions, query CTR, ranking positions from GSC) with post-click user actions (engagement time, bounce rate, e-commerce conversions from GA4).'
  },
  {
    q: 'How is connecting ChatGPT via MCP different from uploading CSV files?',
    a: 'Uploading CSV files is slow, manual, produces stale snapshots, and is restricted by ChatGPT token context windows. By connecting via the Model Context Protocol (MCP), ChatGPT directly queries Google\'s live reporting APIs in under 400ms. You can inspect live active visitors right now, filter date ranges dynamically, and switch between dozens of properties without exporting spreadsheets.'
  },
  {
    q: 'Can ChatGPT see multiple GA4 properties and Search Console websites?',
    a: 'Yes. If your Google Account has access to multiple GA4 properties or verified Search Console domains, the MCP server automatically discovers all of them. You can ask ChatGPT to list your connected properties, run cross-domain comparisons, or focus queries on a specific website property by domain name or Measurement ID.'
  },
  {
    q: 'Do I need ChatGPT Plus or Team to connect to Google Analytics?',
    a: 'For ChatGPT native MCP (Connected Apps / Developer Mode) and Custom GPT Actions, an active ChatGPT Plus, Team, or Enterprise subscription is currently required by OpenAI. However, the Cerilas MCP server is universal: you can also use it 100% free with Claude Desktop, Cursor AI, Windsurf, Antigravity, or open-source MCP clients.'
  },
  {
    q: 'Is my Google Analytics data used to train AI models?',
    a: 'No, absolutely not. The MCP server operates as an ephemeral, stateless proxy. Query parameters and returned metric tables are transmitted strictly inside your private chat session and are never logged, persisted, or used to train OpenAI, Anthropic, or third-party AI models.'
  },
  {
    q: 'Can ChatGPT make changes to or delete my Google Analytics data?',
    a: 'No. The Google OAuth 2.0 connection uses strict read-only scopes (analytics.readonly and webmasters.readonly). The MCP server has zero write or delete permissions, guaranteeing that your live marketing configurations and historical data remain 100% safe and unalterable.'
  },
  {
    q: 'How can I revoke ChatGPT\'s access to my Google Account?',
    a: 'You maintain full control. You can revoke access at any moment with a single click in the dashboard above, or directly within your Google Account Security settings under "Third-party apps with account access". Once revoked, all tokens are instantly invalidated.'
  }
];

const PROMPT_TEMPLATES = [
  {
    category: 'GA4 Traffic Diagnosis',
    prompt: 'Check Google Analytics 4: Compare organic search sessions from the last 14 days against the previous period. Which landing pages suffered the largest drop in active users?'
  },
  {
    category: 'SEO High-Opportunity Queries',
    prompt: 'Analyze Google Search Console: Find search queries with more than 1,000 impressions but a CTR below 2% in the last 28 days. Suggest optimized title tags and meta descriptions to boost clicks.'
  },
  {
    category: 'Real-Time Active Visitors',
    prompt: 'Query GA4 real-time active users right now: What are the top 5 pages currently being viewed, and what are the main referrer sources driving this traffic?'
  },
  {
    category: 'Keyword Cannibalization',
    prompt: 'Inspect Search Console for keyword cannibalization: Identify queries where two or more distinct URLs on our domain are competing for the same organic impressions and search rankings.'
  },
  {
    category: 'Google Ads Wasted Spend',
    prompt: 'Review Google Ads performance for the last 30 days: List all search terms that spent over $50 but generated zero conversions. Highlight recommended negative keywords.'
  },
  {
    category: 'Executive Marketing Synthesis',
    prompt: 'Generate an executive weekly digital marketing report: Combine GA4 conversions and bounce rates, top 5 Search Console ranking improvements, and Google Ads blended ROAS.'
  }
];

const COMPARISON_ROWS = [
  {
    feature: 'Setup Time',
    mcp: '60 Seconds (1-Click OAuth & Prompt)',
    looker: '2 to 6 Hours (Schema wiring)',
    csv: 'Manual & repetitive every time',
    script: 'Days of custom Python/API coding'
  },
  {
    feature: 'Conversational Analysis',
    mcp: 'Full Natural Language (ChatGPT & Claude)',
    looker: 'None (Static charts & filters)',
    csv: 'Limited by static prompt context',
    script: 'Requires programming commands'
  },
  {
    feature: 'Data Freshness',
    mcp: 'Live Real-Time API Telemetry (<400ms)',
    looker: 'Delayed caching & quota limits',
    csv: 'Stale snapshot from export time',
    script: 'Dependent on cron/sync frequency'
  },
  {
    feature: 'Cross-Platform Correlation',
    mcp: 'GSC + GA4 + Ads combined in 1 prompt',
    looker: 'Complex blending & joined keys',
    csv: 'Manual VLOOKUP in spreadsheets',
    script: 'Custom data pipeline required'
  },
  {
    feature: 'Data Privacy & Training',
    mcp: '100% Read-Only, Zero Model Training',
    looker: 'Cloud BI storage dependencies',
    csv: 'Unencrypted files on local disk',
    script: 'API keys stored in plain text'
  }
];

export default function GoogleMarketingMcpSeo() {
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);

  useEffect(() => {
    let script = document.getElementById('gmcp-structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'gmcp-structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': 'Cerilas Google Marketing MCP Server',
          'alternateName': 'Connect ChatGPT to Google Analytics & Search Console',
          'applicationCategory': 'BusinessApplication, DeveloperApplication, MarketingApplication',
          'operatingSystem': 'Any (Cloud SSE, macOS, Windows, Linux)',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'description': 'Connect your ChatGPT, Claude Desktop, and Cursor to Google Analytics 4, Google Search Console, and Google Ads in 60 seconds via Model Context Protocol (MCP).',
          'publisher': {
            '@type': 'Organization',
            'name': 'Cerilas High Tech',
            'url': 'https://cerilas.com'
          }
        },
        {
          '@type': 'HowTo',
          'name': 'How to Connect Your ChatGPT to Google Analytics & Search Console',
          'description': 'Step-by-step tutorial to connect ChatGPT, Claude Desktop, or Cursor to Google Analytics 4 and Google Search Console via Model Context Protocol (MCP).',
          'totalTime': 'PT1M',
          'step': [
            {
              '@type': 'HowToStep',
              'name': 'Sign In with Google (Read-Only OAuth)',
              'text': 'Click "Sign in with Google" to grant strict read-only access (analytics.readonly, webmasters.readonly) to your GA4 properties and Search Console websites.'
            },
            {
              '@type': 'HowToStep',
              'name': 'Copy the 1-Click Setup Prompt or SSE Endpoint',
              'text': 'Copy your unique AI Agent Setup Prompt or your personal remote Server-Sent Events (SSE) connection URL.'
            },
            {
              '@type': 'HowToStep',
              'name': 'Add to ChatGPT or Claude Desktop',
              'text': 'Paste the prompt into your ChatGPT project, or add the SSE endpoint under ChatGPT Settings > Connected Apps > Add MCP Server (or Claude Desktop config).'
            },
            {
              '@type': 'HowToStep',
              'name': 'Ask Questions in Plain English',
              'text': 'Start asking ChatGPT about real-time active users, top organic search queries, CTR drops, or conversion performance.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          'mainEntity': FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.a
            }
          }))
        }
      ]
    };

    script.textContent = JSON.stringify(structuredData);

    return () => {
      const el = document.getElementById('gmcp-structured-data');
      if (el) el.remove();
    };
  }, []);

  const handleCopyPrompt = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(idx);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  return (
    <div className="gmcp-seo-root">
      {/* 1. Hero Guide: Connect Your ChatGPT to Google Analytics */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Bot size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Complete Integration Guide</span>
            <h2 className="gmcp-seo-h2">Connect Your ChatGPT to Google Analytics 4 & Google Search Console</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          Are you tired of manually exporting CSV reports from Google Analytics 4 and Google Search Console every time you want to analyze traffic trends? 
          With the <strong>Cerilas Google Marketing MCP Server</strong>, you can <strong>connect your ChatGPT</strong>, Claude Desktop, and Cursor directly to your live Google telemetry.
          Ask ChatGPT about your organic search queries, real-time visitors, conversion attribution, and Google Ads return on ad spend (ROAS) directly in plain English.
        </p>

        <div className="gmcp-compare-grid">
          <div className="gmcp-compare-card">
            <h3><Database size={18} color="#3b82f6" /> Talk Directly to GA4 & GSC</h3>
            <p className="gmcp-seo-p">
              No spreadsheets, no CSV exports, and no outdated Looker Studio dashboards. ChatGPT queries Google's live reporting APIs in under 400 milliseconds.
            </p>
          </div>

          <div className="gmcp-compare-card">
            <h3><ShieldCheck size={18} color="#10b981" /> 100% Read-Only & Zero AI Training</h3>
            <p className="gmcp-seo-p">
              Protected by official Google OAuth 2.0 with strict read-only permissions (<code>analytics.readonly</code>, <code>webmasters.readonly</code>). Your data is never used to train AI models.
            </p>
          </div>

          <div className="gmcp-compare-card">
            <h3><Layers size={18} color="#8b5cf6" /> Multi-Property & Multi-Domain</h3>
            <p className="gmcp-seo-p">
              Access all your verified Search Console domains and Google Analytics 4 properties automatically. Switch between sites or perform cross-property comparisons effortlessly.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Step-by-Step Tutorial: How to Connect ChatGPT in 3 Steps */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Zap size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Quickstart Tutorial</span>
            <h2 className="gmcp-seo-h2">How to Connect ChatGPT to Google Analytics in 3 Steps</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          Getting your AI assistant connected takes less than 60 seconds with zero manual coding or server configuration:
        </p>

        <div className="gmcp-steps-grid">
          <div className="gmcp-step-card">
            <div className="gmcp-step-number">1</div>
            <h3 className="gmcp-step-title">Sign in with Google</h3>
            <p className="gmcp-step-desc">
              Click the <strong>Sign in with Google</strong> button above. Authorize read-only access so your AI agent can query GA4 and Search Console metrics securely.
            </p>
          </div>

          <div className="gmcp-step-card">
            <div className="gmcp-step-number">2</div>
            <h3 className="gmcp-step-title">Copy Setup Prompt or SSE URL</h3>
            <p className="gmcp-step-desc">
              Choose your favorite AI client. Copy the <strong>1-Click Agentic Setup Prompt</strong> for instant setup, or copy your personal <strong>Remote SSE URL</strong>.
            </p>
          </div>

          <div className="gmcp-step-card">
            <div className="gmcp-step-number">3</div>
            <h3 className="gmcp-step-title">Connect & Start Querying</h3>
            <p className="gmcp-step-desc">
              Paste into ChatGPT (Settings &gt; Connected Apps &gt; Add MCP Server or Custom GPT Actions), Claude Desktop, or Cursor. Ask: <em>"What were my top pages yesterday?"</em>
            </p>
          </div>
        </div>
      </section>

      {/* 3. Real-World Use Cases: What You Can Ask ChatGPT */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Practical Applications</span>
            <h2 className="gmcp-seo-h2">What You Can Ask ChatGPT Once Connected to Google Analytics</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          Connecting ChatGPT to Google Analytics transforms the AI from a general text generator into an elite digital marketing analyst. Here is what you can accomplish:
        </p>

        <div className="gmcp-usecase-grid">
          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><Activity size={18} color="#3b82f6" /></div>
            <div>
              <h4>Real-Time Audience & Spike Audits</h4>
              <p>Ask ChatGPT: <em>"Are visitors currently active on my checkout or pricing page? Where did they come from?"</em></p>
            </div>
          </div>

          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><Search size={18} color="#10b981" /></div>
            <div>
              <h4>SEO Low-Hanging Fruit Identification</h4>
              <p>Ask ChatGPT: <em>"Find Search Console queries ranking between position 4 and 10 with over 500 impressions so we can optimize them to page 1."</em></p>
            </div>
          </div>

          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><TrendingUp size={18} color="#f59e0b" /></div>
            <div>
              <h4>Traffic Drop Root Cause Analysis</h4>
              <p>Ask ChatGPT: <em>"Our organic traffic dropped by 22% last week compared to last month. Which specific URLs and search queries caused this?"</em></p>
            </div>
          </div>

          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><DollarSign size={18} color="#ef4444" /></div>
            <div>
              <h4>Google Ads Wasted Spend Elimination</h4>
              <p>Ask ChatGPT: <em>"Audit our Google Ads search terms: list any query with more than $40 in spend but zero conversions for our negative keyword list."</em></p>
            </div>
          </div>

          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><BarChart3 size={18} color="#8b5cf6" /></div>
            <div>
              <h4>Multi-Channel Conversion Attribution</h4>
              <p>Ask ChatGPT: <em>"Which channel is driving the highest quality users: organic search, LinkedIn referrals, or paid search campaigns?"</em></p>
            </div>
          </div>

          <div className="gmcp-usecase-card">
            <div className="gmcp-usecase-icon"><FileCode size={18} color="#06b6d4" /></div>
            <div>
              <h4>Keyword Cannibalization Audits</h4>
              <p>Ask ChatGPT: <em>"Check Search Console for keywords where two or more different pages on our website are splitting impressions."</em></p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table: MCP Server vs Looker Studio vs CSV */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <TableProperties size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Architecture Comparison</span>
            <h2 className="gmcp-seo-h2">Why Connect ChatGPT via MCP vs. Traditional Methods?</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          See how connecting your ChatGPT via the Model Context Protocol compares against traditional CSV spreadsheet exports and rigid BI dashboards:
        </p>

        <div className="gmcp-specs-table-wrap">
          <table className="gmcp-specs-table">
            <thead>
              <tr>
                <th>Feature & Capability</th>
                <th>Cerilas ChatGPT MCP</th>
                <th>Looker Studio / Dashboards</th>
                <th>Manual CSV Export</th>
                <th>Custom Python Scripts</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.feature}</strong></td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{row.mcp}</td>
                  <td>{row.looker}</td>
                  <td>{row.csv}</td>
                  <td>{row.script}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Available MCP Tools Specification */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Terminal size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">API Tool Registry</span>
            <h2 className="gmcp-seo-h2">Available MCP Tools & Native AI Functions</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          When you connect your ChatGPT or Claude to the Cerilas MCP server, the following standardized tool functions are automatically registered into the AI's runtime:
        </p>

        <div className="gmcp-specs-table-wrap">
          <table className="gmcp-specs-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>MCP Function Name</th>
                <th>Required Inputs</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Search Console</strong></td>
                <td><span className="gmcp-tool-code">gsc_get_search_analytics</span></td>
                <td>startDate, endDate, dimensions, rowLimit</td>
                <td>Retrieves organic search clicks, impressions, CTR, and average SERP ranking positions.</td>
              </tr>
              <tr>
                <td><strong>Search Console</strong></td>
                <td><span className="gmcp-tool-code">gsc_inspect_url</span></td>
                <td>inspectionUrl, siteUrl</td>
                <td>Checks index coverage status, mobile usability, and Googlebot canonical URL assignment.</td>
              </tr>
              <tr>
                <td><strong>Analytics (GA4)</strong></td>
                <td><span className="gmcp-tool-code">ga4_get_traffic_acquisition</span></td>
                <td>dateRange, channelGroup, metrics</td>
                <td>Analyzes sessions, active users, engagement rates, and key conversions by acquisition channel.</td>
              </tr>
              <tr>
                <td><strong>Analytics (GA4)</strong></td>
                <td><span className="gmcp-tool-code">ga4_get_realtime_users</span></td>
                <td>propertyId, dimensions</td>
                <td>Inspects live active visitors and active page URLs for the last 30 minutes in real time.</td>
              </tr>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td><span className="gmcp-tool-code">gads_get_campaign_performance</span></td>
                <td>dateRange, campaignStatus, metrics</td>
                <td>Analyzes total ad spend, cost-per-click (CPC), conversion values, and ROAS across campaigns.</td>
              </tr>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td><span className="gmcp-tool-code">gads_find_wasted_search_terms</span></td>
                <td>minSpend, maxConversions</td>
                <td>Identifies search terms generating ad spend with 0 conversions for negative keyword lists.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Battle-Tested Prompt Library */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Cpu size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Ready-to-Use Prompts</span>
            <h2 className="gmcp-seo-h2">Battle-Tested Prompt Library for ChatGPT & Claude</h2>
          </div>
        </div>

        <p className="gmcp-seo-p">
          Click any prompt below to copy it. Paste it directly into ChatGPT or Claude once your connection is active:
        </p>

        <div className="gmcp-prompts-grid">
          {PROMPT_TEMPLATES.map((item, idx) => (
            <div 
              key={idx} 
              className="gmcp-prompt-card"
              onClick={() => handleCopyPrompt(item.prompt, idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="gmcp-prompt-category">{item.category}</span>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                  {copiedPromptIndex === idx ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <span style={{ color: '#10b981' }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </span>
              </div>
              <p className="gmcp-prompt-text">"{item.prompt}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comprehensive FAQ */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <HelpCircle size={22} />
          </div>
          <div>
            <span className="gmcp-seo-tag">Knowledge Base</span>
            <h2 className="gmcp-seo-h2">Frequently Asked Questions</h2>
          </div>
        </div>

        <div className="gmcp-faq-list">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`gmcp-faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  type="button" 
                  className="gmcp-faq-question" 
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.2s ease', 
                      color: isOpen ? '#3b82f6' : 'var(--text-muted)',
                      flexShrink: 0
                    }} 
                  />
                </button>
                {isOpen && (
                  <div className="gmcp-faq-answer">
                    <p style={{ margin: 0 }}>{faq.a}</p>
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
