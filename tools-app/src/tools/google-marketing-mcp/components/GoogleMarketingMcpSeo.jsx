import { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ArrowUpRight,
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
  Check
} from 'lucide-react';
import './GoogleMarketingMcpSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is the Model Context Protocol (MCP) and how does it connect to Google?',
    a: 'Model Context Protocol (MCP) is an open standard introduced by Anthropic that allows large language models (such as Claude, ChatGPT, and Cursor agents) to securely connect to external tools, live databases, and APIs. The Cerilas Google Marketing MCP Server bridges this protocol to Google Analytics 4, Search Console, and Google Ads, translating natural language requests directly into live API calls.'
  },
  {
    q: 'Can ChatGPT access my Google Analytics data without storing my password?',
    a: 'Yes, 100%. Authentication is handled via Google OAuth 2.0 with strict read-only permissions (analytics.readonly, webmasters.readonly). Neither ChatGPT nor Cerilas ever sees or stores your Google password. You can revoke access at any time with a single click from this dashboard or directly inside your Google Account Security settings.'
  },
  {
    q: 'How do I add this MCP Server to Claude Desktop?',
    a: 'Open your Claude Desktop configuration file (located at ~/Library/Application Support/Claude/claude_desktop_config.json on macOS or %APPDATA%\\Claude\\claude_desktop_config.json on Windows). Add the "cerilas-google-marketing" entry under "mcpServers" using either the remote SSE URL or our official npx package. Restart Claude Desktop and the tools icon will appear in the prompt bar.'
  },
  {
    q: 'How does it work with ChatGPT (OpenAI MCP & Custom Actions)?',
    a: 'ChatGPT supports Cerilas Google Marketing through two methods: 1) Native MCP Server: In ChatGPT Settings > Connected Apps / Developer Mode > Add MCP Server, select Server-Sent Events (SSE) and paste your personal remote endpoint. ChatGPT will automatically discover your Search Console and GA4 tools. 2) Custom GPTs: You can also import our OpenAPI 3.1 specification under GPT Builder > Actions to publish a dedicated marketing GPT in the GPT Store.'
  },
  {
    q: 'Is my proprietary marketing data used to train AI models?',
    a: 'No. The MCP server operates as a stateless data proxy. Query parameters and returned metric tables are transmitted strictly within your private chat session and are never logged, persisted, or used to fine-tune AI foundation models.'
  },
  {
    q: 'Which Google Search Console metrics can I query?',
    a: 'You can query organic clicks, search impressions, click-through rates (CTR), and average search ranking position broken down by query, target page URL, country, device, and date ranges. You can also inspect URL indexing status.'
  },
  {
    q: 'Which Google Analytics 4 (GA4) metrics are available?',
    a: 'Available GA4 dimensions and metrics include active users, real-time visitors, user acquisition source/medium, landing page performance, session engagement time, event counts, and key conversion metrics.'
  }
];

const PROMPT_TEMPLATES = [
  {
    category: 'SEO Opportunity',
    prompt: 'Analyze Google Search Console: find queries with > 500 impressions but CTR below 2% in the last 28 days. Provide actionable meta title ideas to boost clicks.'
  },
  {
    category: 'Traffic Drop Diagnosis',
    prompt: 'Compare our GA4 organic search sessions from this month versus the previous month. Which specific landing pages lost the most traffic?'
  },
  {
    category: 'Google Ads ROAS',
    prompt: 'Inspect Google Ads performance for the last 14 days. List any ad groups with a ROAS below 1.8x and highlight search terms that generated zero conversions.'
  },
  {
    category: 'Keyword Cannibalization',
    prompt: 'Check Search Console for keywords where multiple URLs from our domain are competing for the same organic impressions and ranking positions.'
  },
  {
    category: 'Live User Monitoring',
    prompt: 'Check GA4 realtime active users right now: what are the top active pages and referrers driving traffic at this exact moment?'
  },
  {
    category: 'Executive Summary',
    prompt: 'Generate an executive weekly digital marketing report combining GA4 conversions, top Search Console ranking changes, and Google Ads total spend.'
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
          'applicationCategory': 'BusinessApplication, DeveloperApplication, MarketingApplication',
          'operatingSystem': 'Any (Web, macOS, Windows, Linux)',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'description': 'Model Context Protocol (MCP) server connecting Google Analytics 4, Google Search Console, and Google Ads directly to ChatGPT, Claude Desktop, and Cursor.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Cerilas High Tech',
            'url': 'https://cerilas.com'
          }
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
        },
        {
          '@type': 'HowTo',
          'name': 'How to Connect Google Analytics & Search Console to ChatGPT and Claude via MCP',
          'step': [
            {
              '@type': 'HowToStep',
              'name': 'Connect Google Account',
              'text': 'Authorize read-only access to your Google Analytics and Search Console properties.'
            },
            {
              '@type': 'HowToStep',
              'name': 'Add MCP Server to ChatGPT or Claude',
              'text': 'In ChatGPT Settings > Connected Apps > Add MCP Server (SSE) or Claude Desktop config file, connect your Cerilas remote endpoint.'
            },
            {
              '@type': 'HowToStep',
              'name': 'Query in Natural Language',
              'text': 'Ask questions about traffic, search queries, or conversions directly inside your AI chat.'
            }
          ]
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
      {/* Deep-Dive Guide: Why MCP for Marketing Data? */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Zap size={22} />
          </div>
          <h2 className="gmcp-seo-h2">Why Connect Marketing Data via Model Context Protocol (MCP)?</h2>
        </div>

        <p className="gmcp-seo-p">
          Marketing teams, SEO specialists, and founders spend hundreds of hours every month exporting CSV spreadsheets from 
          Google Search Console and Google Analytics 4, copy-pasting them into spreadsheets, and manually writing formula summaries. 
          The <strong>Model Context Protocol (MCP)</strong> eliminates this friction completely by giving frontier AI models 
          (such as Claude 3.7 Sonnet, ChatGPT 4.5/o1, and Cursor agents) a secure, real-time read channel directly into your telemetry.
        </p>

        <div className="gmcp-compare-grid">
          <div className="gmcp-compare-card">
            <h3><Database size={18} color="#3b82f6" /> Real-Time Zero-Friction Telemetry</h3>
            <p className="gmcp-seo-p">
              No manual exports or stale datasets. When you ask your AI assistant about today's traffic spike or yesterday's organic clicks, 
              the MCP server queries Google's live reporting APIs in under 400ms.
            </p>
          </div>

          <div className="gmcp-compare-card">
            <h3><ShieldCheck size={18} color="#10b981" /> 100% Read-Only & Zero Model Training</h3>
            <p className="gmcp-seo-p">
              All interactions utilize strict read-only scopes (<code>analytics.readonly</code>, <code>webmasters.readonly</code>). 
              Your raw marketing telemetry is processed ephemerally within your chat context and is never stored on third-party servers.
            </p>
          </div>

          <div className="gmcp-compare-card">
            <h3><Bot size={18} color="#8b5cf6" /> Context-Aware Synthesis Across 3 Platforms</h3>
            <p className="gmcp-seo-p">
              Correlate SEO search intent from Google Search Console with post-click engagement in Google Analytics 4 and paid performance in Google Ads, 
              all within a single conversational prompt.
            </p>
          </div>
        </div>
      </section>

      {/* Available MCP Tools Specification */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Terminal size={22} />
          </div>
          <h2 className="gmcp-seo-h2">Available MCP Tools & Functions</h2>
        </div>

        <p className="gmcp-seo-p">
          The Cerilas Google Marketing MCP Server exposes the following standard tools to your AI agent:
        </p>

        <div className="gmcp-specs-table-wrap">
          <table className="gmcp-specs-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>MCP Function Name</th>
                <th>Inputs</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Search Console</strong></td>
                <td><span className="gmcp-tool-code">gsc_get_search_analytics</span></td>
                <td>startDate, endDate, dimensions (query, page, country), rowLimit</td>
                <td>Returns clicks, impressions, CTR, and average position for organic search queries.</td>
              </tr>
              <tr>
                <td><strong>Search Console</strong></td>
                <td><span className="gmcp-tool-code">gsc_inspect_url</span></td>
                <td>inspectionUrl, siteUrl</td>
                <td>Checks index coverage status, mobile usability, and canonical URL assignment.</td>
              </tr>
              <tr>
                <td><strong>Analytics (GA4)</strong></td>
                <td><span className="gmcp-tool-code">ga4_get_traffic_acquisition</span></td>
                <td>dateRange, channelGroup, metrics (sessions, activeUsers)</td>
                <td>Breaks down sessions and conversions by organic, referral, direct, and social channels.</td>
              </tr>
              <tr>
                <td><strong>Analytics (GA4)</strong></td>
                <td><span className="gmcp-tool-code">ga4_get_realtime_users</span></td>
                <td>propertyId, dimensions (unifiedScreenName, country)</td>
                <td>Returns live active visitor counts and currently viewed pages for the past 30 minutes.</td>
              </tr>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td><span className="gmcp-tool-code">gads_get_campaign_performance</span></td>
                <td>dateRange, campaignStatus, metrics (costMicros, roas, clicks)</td>
                <td>Provides spend, cost-per-click (CPC), conversion value, and ROAS across active campaigns.</td>
              </tr>
              <tr>
                <td><strong>Google Ads</strong></td>
                <td><span className="gmcp-tool-code">gads_find_wasted_search_terms</span></td>
                <td>minSpend, maxConversions</td>
                <td>Identifies search terms triggering ads with ad spend but 0 conversions for negative keyword lists.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Battle-Tested Prompt Templates */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <Sparkles size={22} />
          </div>
          <h2 className="gmcp-seo-h2">Battle-Tested Prompt Library for AI Agents</h2>
        </div>

        <p className="gmcp-seo-p">
          Click on any prompt below to copy it and paste it into ChatGPT, Claude Desktop, or Cursor after connecting your MCP server:
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

      {/* Frequently Asked Questions */}
      <section className="gmcp-seo-section">
        <div className="gmcp-seo-heading-wrap">
          <div className="gmcp-seo-icon-badge">
            <HelpCircle size={22} />
          </div>
          <h2 className="gmcp-seo-h2">Frequently Asked Questions</h2>
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
