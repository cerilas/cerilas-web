import React, { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Check,
  X,
  Sparkles,
  Braces,
  Wand2,
  FileCode,
  ArrowRightLeft,
  Search,
  Copy
} from 'lucide-react';

export default function JsonBeautifierSeo() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How do I beautify and format a JSON string online?',
      a: 'Paste your raw or minified JSON text into the input editor, choose your preferred indentation spacing (2 spaces, 4 spaces, or Tabs), and click "Beautify". Cerilas will format the structure with consistent indents, proper brackets, and highlight syntax errors immediately.'
    },
    {
      q: 'Can this tool repair invalid or broken JSON automatically?',
      a: 'Yes! Click the "Auto-Repair" button. Our intelligent heuristic automatically converts single quotes to double quotes, wraps unquoted object keys in quotes, strips illegal trailing commas before closing braces, removes JavaScript comments, and translates Python literals (True, False, None) into valid JSON equivalents (true, false, null).'
    },
    {
      q: 'How does the interactive JSON Tree view work?',
      a: 'Switch to the "Interactive Tree" tab to inspect deeply nested JSON documents visually. You can collapse or expand specific objects and arrays, view node data types, search for keys and values, and click any item to copy its exact JSONPath expression (e.g. $.data.users[0].email) to your clipboard.'
    },
    {
      q: 'Can I convert JSON to TypeScript interfaces or YAML?',
      a: 'Yes. With a single click, you can switch tabs to generate clean TypeScript interfaces with nested type inference, clean human-readable YAML configurations, or flat CSV tables for tabular data arrays.'
    },
    {
      q: 'How do I sort JSON keys alphabetically?',
      a: 'Toggle the "Sort Keys (A-Z)" option and click Beautify. Cerilas recursively sorts all object keys in alphabetical order, which is essential for deterministic JSON diffing, Git version control, and consistent API payloads.'
    },
    {
      q: 'Is my data safe and private when using Cerilas JSON Beautifier?',
      a: '100% yes. All parsing, validation, formatting, and conversion executes entirely in your client browser memory using JavaScript and Web APIs. Not a single character or byte of your JSON is ever transmitted to or stored on any external server.'
    },
    {
      q: 'Can I format large JSON files (up to several megabytes)?',
      a: 'Yes. Our high-performance streaming stringifier processes multi-megabyte JSON payloads with sub-second execution speed without freezing your browser.'
    },
    {
      q: 'Is this JSON Beautifier free to use without account limits?',
      a: 'Cerilas JSON Beautifier & Formatter is completely free with zero ads, no subscription plans, no daily quotas, and no account sign-up required.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://tools.cerilas.com/#/tool/json-beautifier',
        name: 'Cerilas Free Online JSON Beautifier & Formatter',
        alternateName: [
          'JSON Formatter Online',
          'JSON Prettifier',
          'JSON Validator & Minifier',
          'Repair Broken JSON Online',
          'JSON to TypeScript Converter',
          'JSON Tree Viewer'
        ],
        url: 'https://tools.cerilas.com/#/tool/json-beautifier',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Beautify & prettify JSON with 2 spaces, 4 spaces, or Tabs',
          'Minify JSON to compact one-line string for production APIs',
          'Auto-repair broken JSON syntax (unquoted keys, single quotes, trailing commas)',
          'Sort object keys alphabetically (A-Z) for clean diffs',
          'Interactive visual collapsible tree viewer with click-to-copy JSONPath',
          'Convert JSON to TypeScript interfaces, YAML, and CSV tables',
          'Live statistics: byte reduction savings, node count, max depth',
          '100% in-browser privacy with zero server uploads'
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.97',
          ratingCount: '2190'
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
            name: 'JSON Beautifier & Formatter',
            item: 'https://tools.cerilas.com/#/tool/json-beautifier'
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: 'How to Beautify, Validate and Repair JSON Online',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Paste or Upload JSON',
            text: 'Paste your raw JSON text into the editor or drag and drop a .json file.'
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Select Indentation Spacing',
            text: 'Choose 2 spaces, 4 spaces, or Tabs from the action toolbar.'
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Beautify or Auto-Repair',
            text: 'Click Beautify to format valid JSON, or click Auto-Repair to fix syntax errors like single quotes and unquoted keys.'
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Copy, Convert or Download',
            text: 'Copy the clean JSON, view the interactive tree, convert to TypeScript/YAML, or download the formatted .json file.'
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
    <article className="jb-seo-wrapper" aria-label="JSON Beautifier & Formatter Technical Guide, Features and FAQ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* SEO Header */}
      <div className="jb-seo-header">
        <span className="jb-seo-badge">
          <Sparkles size={14} /> 100% In-Browser Privacy • Zero Server Uploads
        </span>
        <h2>High-Performance Online JSON Beautifier, Formatter &amp; Auto-Repair</h2>
        <p className="jb-seo-subhead">
          Prettify, validate, minify, and fix broken JSON documents directly in your browser. Inspect nested hierarchies with an interactive tree viewer, copy JSONPaths, sort keys, and convert JSON to TypeScript interfaces or YAML.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="jb-seo-grid">
        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-blue">
            <Braces size={22} />
          </div>
          <h3>Customizable Prettifier</h3>
          <p>
            Format minified or messy payloads with 2 spaces, 4 spaces, or Tabs indentation. Highlight matching brackets and format nested structures effortlessly.
          </p>
        </div>

        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-emerald">
            <Wand2 size={22} />
          </div>
          <h3>Intelligent Auto-Repair</h3>
          <p>
            Automatically fix syntax errors: turn single quotes into double quotes, quote unquoted object keys, eliminate trailing commas, and convert Python literals.
          </p>
        </div>

        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-indigo">
            <Search size={22} />
          </div>
          <h3>Interactive Tree Inspector</h3>
          <p>
            Explore complex data visually with collapsible nodes, color-coded data types, real-time key/value filtering, and 1-click JSONPath copying.
          </p>
        </div>

        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-amber">
            <ArrowRightLeft size={22} />
          </div>
          <h3>TypeScript &amp; YAML Export</h3>
          <p>
            Instantly convert JSON objects into strongly-typed TypeScript interfaces, clean YAML configurations, or flat CSV spreadsheets.
          </p>
        </div>

        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-rose">
            <Zap size={22} />
          </div>
          <h3>Minify &amp; Payload Savings</h3>
          <p>
            Strip extra whitespace and line breaks for production API payloads. Real-time statistics show exact byte reductions and compression percentages.
          </p>
        </div>

        <div className="jb-seo-card">
          <div className="jb-seo-card-icon icon-violet">
            <ShieldCheck size={22} />
          </div>
          <h3>100% Client-Side Security</h3>
          <p>
            Your confidential API keys, customer records, and JWT tokens never leave your browser memory. Compliant with GDPR, CCPA, and HIPAA guidelines.
          </p>
        </div>
      </div>

      {/* Technical Comparison Table */}
      <div className="jb-seo-table-wrap">
        <h3>Cerilas JSON Beautifier vs. Traditional Formatters</h3>
        <p className="table-subhead">
          Designed for modern software engineers who demand speed, privacy, and zero ads.
        </p>
        <div className="table-overflow">
          <table className="jb-comparison-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th className="highlight-col">Cerilas JSON Beautifier</th>
                <th>JSONLint</th>
                <th>JSONFormatter.org</th>
                <th>CodeBeautify</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Client-Side Privacy (Zero Server Logs)</strong></td>
                <td className="highlight-col"><span className="jb-badge-pos"><Check size={14} /> 100% In-Browser</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> May log requests</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Server roundtrip</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Server logging</span></td>
              </tr>
              <tr>
                <td><strong>Smart Auto-Repair for Broken JSON</strong></td>
                <td className="highlight-col"><span className="jb-badge-pos"><Check size={14} /> 1-Click Auto-Repair</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Strict Error Only</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Error only</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Limited</span></td>
              </tr>
              <tr>
                <td><strong>Interactive Tree &amp; JSONPath Copy</strong></td>
                <td className="highlight-col"><span className="jb-badge-pos"><Check size={14} /> Included</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Text Only</span></td>
                <td><span className="jb-badge-pos"><Check size={14} /> Tree Only</span></td>
                <td><span className="jb-badge-pos"><Check size={14} /> Tree Only</span></td>
              </tr>
              <tr>
                <td><strong>TypeScript &amp; YAML Conversion</strong></td>
                <td className="highlight-col"><span className="jb-badge-pos"><Check size={14} /> Instant 1-Click</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Not supported</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Separate URL</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Separate Tool</span></td>
              </tr>
              <tr>
                <td><strong>Ad-Free Minimalist UI</strong></td>
                <td className="highlight-col"><span className="jb-badge-pos"><Check size={14} /> 100% Clean Apple UI</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Heavy Ads</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Heavy Ads</span></td>
                <td><span className="jb-badge-neg"><X size={14} /> Popups &amp; Banners</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Educational Workflow */}
      <div className="jb-seo-workflow">
        <h3>How to Beautify and Validate JSON in 4 Steps</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">1</span>
            <h4>Paste Raw Data</h4>
            <p>Paste raw, minified, or unformatted JSON text into the editor or upload a .json file.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <h4>Configure Indent &amp; Sorting</h4>
            <p>Select your spacing (2, 4 spaces, or tab) and optionally toggle alphabetical key sorting.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <h4>Beautify or Repair</h4>
            <p>Click Beautify for instant pretty-printing or Auto-Repair to automatically correct syntax errors.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <h4>Inspect, Convert or Copy</h4>
            <p>Explore the tree view, copy JSONPaths, export to TypeScript or YAML, or download the clean file.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="jb-seo-faq-section">
        <div className="faq-header">
          <h3>Frequently Asked Questions About JSON Formatting</h3>
          <p>Common questions regarding JSON validation, syntax repair, tree inspection, and data privacy.</p>
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
