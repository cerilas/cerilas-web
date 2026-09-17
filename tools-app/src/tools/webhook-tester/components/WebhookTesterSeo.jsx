import React, { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
  Check,
  X,
  Sparkles,
  Sliders,
  Send,
  Webhook,
  Activity,
  Repeat
} from 'lucide-react';

export default function WebhookTesterSeo() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How do I test sending requests to an external webhook URL?',
      a: 'Paste your external webhook URL (such as a Discord channel webhook, Slack incoming webhook, Zapier/Make hook, or custom API endpoint) into the destination URL bar, choose your HTTP method (POST, PUT, PATCH, DELETE), select a template or write custom JSON, and click "Send Webhook". Cerilas dispatches the request and displays the HTTP status code (e.g. 200 OK), roundtrip latency, response headers, and response body.'
    },
    {
      q: 'How do I send a test webhook to Discord or Slack?',
      a: 'Click the "Discord Webhook" or "Slack Webhook" template button above the URL bar. This pre-fills an authentic JSON payload with rich embeds, markdown blocks, and author avatars. Paste your Discord or Slack webhook URL and click Send. The message will appear instantly in your channel with real-time delivery confirmation.'
    },
    {
      q: 'How does HMAC-SHA256 signature generation work for secure webhooks?',
      a: 'Many webhook consumers (e.g. Stripe, GitHub, Shopify, custom microservices) require incoming requests to include an HMAC signature header to verify authenticity and prevent tampering. In the "HMAC Signature" tab, enter your secret key. Cerilas calculates the SHA-256 hash of your exact JSON payload and attaches the signature header (e.g. X-Hub-Signature-256 or Stripe-Signature) automatically.'
    },
    {
      q: 'Can I test webhook concurrency, queuing, and rate limits with repeated requests?',
      a: 'Yes! Open the "Repeat" tab to configure multi-call stress testing. You can dispatch up to 20 sequential webhook calls with customizable delays (e.g. 200ms interval) to test your backend queue workers, idempotency keys, and rate limiters.'
    },
    {
      q: 'What dynamic variables can I use in my webhook payloads?',
      a: 'You can insert dynamic placeholders like {{timestamp}} (current epoch ms), {{iso_date}} (ISO-8601 timestamp), {{uuid}} (random v4 UUID), and {{random_id}} (random 6-digit number). These placeholders are automatically evaluated and replaced with fresh values each time a webhook is dispatched.'
    },
    {
      q: 'Why use Cerilas Webhook Tester instead of Postman or cURL?',
      a: 'Cerilas Webhook Tester runs directly in your browser with zero download, zero sign-in, and zero bloat. It features dedicated 1-click webhook templates for Discord, Slack, Telegram, Stripe, and Zapier, dynamic placeholder generation, automatic HMAC signature computation, and a dual-purpose temporary test receiver for full end-to-end debugging.'
    },
    {
      q: 'Can I send webhooks to localhost (e.g. http://localhost:8000)?',
      a: 'Yes. You can test local microservices, Docker containers, or staging servers. Our backend proxy securely dispatches the request directly to your target local or remote port without browser CORS restrictions.'
    },
    {
      q: 'Is Cerilas Webhook Tester 100% free with no request limits?',
      a: 'Yes. Cerilas Webhook Tester is completely free with zero ads, no account registration, and no artificial paywalls.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://tools.cerilas.com/#/tool/webhook-tester',
        name: 'Cerilas Free Online Webhook Tester & Sender',
        alternateName: [
          'Online Webhook Sender',
          'Test External Webhooks',
          'Discord Webhook Tester',
          'Slack Webhook Sender',
          'Webhook Dispatcher with HMAC',
          'Postman Alternative for Webhooks'
        ],
        url: 'https://tools.cerilas.com/#/tool/webhook-tester',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Send HTTP POST, PUT, PATCH requests to any external webhook URL',
          '1-click templates for Discord, Slack, Telegram, Zapier, and Stripe',
          'HMAC-SHA256 signature generator for secure webhook authentication',
          'Dynamic variable placeholders ({{timestamp}}, {{uuid}}, {{iso_date}})',
          'Multi-call repeat testing with configurable delay intervals',
          'Deep response inspector with HTTP status, roundtrip latency (ms), and body',
          '1-click cURL export command for terminal automation',
          '100% free with zero signup or API keys required'
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.98',
          ratingCount: '1580'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://tools.cerilas.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Developer Tools',
            item: 'https://tools.cerilas.com/#/category/Developer%20Tool'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Webhook Tester & Sender',
            item: 'https://tools.cerilas.com/#/tool/webhook-tester'
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: 'How to Send and Test External Webhooks Online for Free',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Enter Target Webhook URL',
            text: 'Paste your external webhook URL (Discord, Slack, Zapier, or custom API) into the destination bar.'
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Choose Template or Custom JSON',
            text: 'Select Discord, Slack, or Stripe template, or customize the JSON payload with dynamic variables.'
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Add Headers or HMAC Signature (Optional)',
            text: 'Attach custom authorization tokens or calculate HMAC SHA-256 signatures with your secret key.'
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Send Webhook & Inspect Response',
            text: 'Click Send Webhook to dispatch the request and inspect the return status code, response time, and payload.'
          }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a
          }
        }))
      }
    ]
  };

  return (
    <article className="wt-seo-wrapper" aria-label="Cerilas Webhook Tester & Sender Technical Guide and FAQ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* SEO Header */}
      <div className="wt-seo-header">
        <span className="wt-seo-badge">
          <Sparkles size={14} /> Send &amp; Test External Webhooks Online Free
        </span>
        <h2>Test External Webhooks, Dispatch Mock Payloads &amp; Verify Responses</h2>
        <p className="wt-seo-subhead">
          Send HTTP requests to Discord channels, Slack bots, Zapier hooks, and custom API endpoints. Test JSON payloads, calculate HMAC-SHA256 signatures, simulate concurrency, and inspect server responses in real time.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="wt-seo-grid">
        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-blue">
            <Send size={22} />
          </div>
          <h3>Send to Any Webhook URL</h3>
          <p>
            Dispatch HTTP POST, PUT, PATCH, and DELETE requests to Discord, Slack, Zapier, Telegram, Stripe, or local dev endpoints with zero CORS blocking.
          </p>
        </div>

        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-emerald">
            <Sparkles size={22} />
          </div>
          <h3>1-Click Platform Templates</h3>
          <p>
            Pre-configured payload templates for Discord embeds, Slack markdown blocks, Telegram messages, Stripe events, and Shopify orders save you setup time.
          </p>
        </div>

        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-indigo">
            <ShieldCheck size={22} />
          </div>
          <h3>HMAC Signature Generator</h3>
          <p>
            Automatically sign your payload with SHA-256 or SHA-1 using your secret key to test webhook signature authentication (like Stripe and GitHub).
          </p>
        </div>

        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-amber">
            <Repeat size={22} />
          </div>
          <h3>Multi-Call Repeat Testing</h3>
          <p>
            Send up to 20 repeated webhook requests with custom delay intervals to verify background job queue workers, idempotency keys, and rate limit thresholds.
          </p>
        </div>

        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-rose">
            <Activity size={22} />
          </div>
          <h3>Response Telemetry &amp; Latency</h3>
          <p>
            Inspect the exact HTTP status code (200, 204, 400, 500), roundtrip latency in milliseconds, response headers, and response payload returned by the server.
          </p>
        </div>

        <div className="wt-seo-card">
          <div className="wt-seo-card-icon icon-violet">
            <Terminal size={22} />
          </div>
          <h3>1-Click cURL Generator</h3>
          <p>
            Instantly generate exact cURL terminal commands for any webhook configuration so you can replay or script requests in CI/CD pipelines.
          </p>
        </div>
      </div>

      {/* Technical Comparison Table */}
      <div className="wt-seo-table-wrap">
        <h3>Cerilas Webhook Tester vs. Traditional Webhook Tools</h3>
        <p className="table-subhead">
          See why modern developers prefer Cerilas for clean, ad-free, real-time HTTP debugging.
        </p>
        <div className="table-overflow">
          <table className="wt-comparison-table">
            <thead>
              <tr>
                <th>Capability / Feature</th>
                <th className="highlight-col">Cerilas Webhook Tester</th>
                <th>Webhook.site</th>
                <th>RequestBin</th>
                <th>Beeceptor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pricing &amp; Account Quotas</strong></td>
                <td className="highlight-col"><span className="wt-badge-pos"><Check size={14} /> 100% Free ($0)</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Freemium / Paid Plans</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Mandatory Signup</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> 50 req/day Limit</span></td>
              </tr>
              <tr>
                <td><strong>Built-in Mock Dispatcher</strong></td>
                <td className="highlight-col"><span className="wt-badge-pos"><Check size={14} /> Included (Stripe, GitHub)</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Paid Add-on</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Receiver Only</span></td>
                <td><span className="wt-badge-pos"><Check size={14} /> Basic Sender</span></td>
              </tr>
              <tr>
                <td><strong>Custom Response Codes &amp; Delays</strong></td>
                <td className="highlight-col"><span className="wt-badge-pos"><Check size={14} /> Full Control (0-5s delay)</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Restricted</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Fixed 200 OK</span></td>
                <td><span className="wt-badge-pos"><Check size={14} /> Configurable</span></td>
              </tr>
              <tr>
                <td><strong>Ad-Free Developer Experience</strong></td>
                <td className="highlight-col"><span className="wt-badge-pos"><Check size={14} /> 100% Clean Apple UI</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Heavy Display Ads</span></td>
                <td><span className="wt-badge-pos"><Check size={14} /> Clean</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Promotional Banners</span></td>
              </tr>
              <tr>
                <td><strong>1-Click cURL Replay Generator</strong></td>
                <td className="highlight-col"><span className="wt-badge-pos"><Check size={14} /> Instant Terminal Command</span></td>
                <td><span className="wt-badge-pos"><Check size={14} /> Supported</span></td>
                <td><span className="wt-badge-neg"><X size={14} /> Limited</span></td>
                <td><span className="wt-badge-pos"><Check size={14} /> Supported</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Educational Workflow */}
      <div className="wt-seo-workflow">
        <h3>How to Test Webhooks in 4 Simple Steps</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">1</span>
            <h4>Copy Unique URL</h4>
            <p>Generate and copy your dedicated webhook endpoint URL with a single click.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <h4>Connect Your Provider</h4>
            <p>Paste the URL into Stripe, GitHub, Shopify, or your custom API webhook configuration.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <h4>Inspect Live Payload</h4>
            <p>View requests in real time, analyze HTTP headers, and format nested JSON trees.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <h4>Replay to Localhost</h4>
            <p>Use the cURL command or the Mock Dispatcher to replay webhooks to your local dev environment.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="wt-seo-faq-section">
        <div className="faq-header">
          <h3>Frequently Asked Questions About Webhook Testing</h3>
          <p>Everything you need to know about debugging payloads, headers, security signatures, and local proxies.</p>
        </div>
        <div className="faq-accordion-list">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`faq-item ${isOpen ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{item.q}</span>
                  <ChevronDown size={16} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                </button>
                {isOpen && (
                  <div className="faq-answer-pane">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
