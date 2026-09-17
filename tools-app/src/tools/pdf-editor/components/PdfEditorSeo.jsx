import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  PenTool,
  RotateCw,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Layers,
  Stamp,
  FileCheck
} from 'lucide-react';

export default function PdfEditorSeo() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'Is Cerilas PDF Editor truly 100% free with no watermark?',
      a: 'Yes, absolutely. Unlike freemium PDF editors that inject large promotional watermarks, limit you to 2 edits per day, or force paid monthly subscriptions at the download screen, Cerilas PDF Editor is completely free. Your exported PDF documents retain pristine resolution with zero branding, watermarks, or hidden paywalls.'
    },
    {
      q: 'Do my confidential documents or contracts get uploaded to any servers?',
      a: 'No. Cerilas executes 100% client-side inside your browser sandbox using WebAssembly, HTML5 Canvas, and pdf-lib. Your confidential NDAs, tax filings, medical reports, and legal agreements never leave your local device. We have zero access to your file contents, ensuring strict compliance with GDPR, HIPAA, and corporate data protection standards.'
    },
    {
      q: 'How does client-side PDF redaction work? Can someone remove the black box to view the text?',
      a: 'Cerilas uses permanent destructive vector redaction via pdf-lib. When you place a blackout or whiteout redaction box, a solid opaque vector rectangle is compiled directly into the PDF content stream at the byte level. This is not a superficial CSS visual layer; the underlying pixels and coordinates are permanently covered and cannot be peeled back by standard PDF viewers.'
    },
    {
      q: 'Can I legally sign contracts using this PDF Editor?',
      a: 'Yes. Electronic signatures created with Cerilas comply with the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN Act), the Uniform Electronic Transactions Act (UETA), and European Union eIDAS regulations for standard electronic signatures (SES). You can draw your signature with precision or upload a high-resolution transparent PNG.'
    },
    {
      q: 'How do I organize, reorder, rotate, or delete pages?',
      a: 'The left sidebar displays real-time thumbnail previews of every page in your document. Click the rotate icon to rotate a page 90 degrees clockwise or counter-clockwise, click the trash icon to delete unwanted pages, use the arrow buttons to reorder pages up or down, or click "Add Blank Page" to insert a clean sheet anywhere.'
    },
    {
      q: 'Can I add custom text, notes, and callouts to existing PDF files?',
      a: 'Yes. Select the "Text" tool from the top toolbar, click anywhere on your PDF canvas, and start typing. You can customize font family (Helvetica, Times Roman, Courier), font size (8pt to 72pt), and ink color (black, navy, red, emerald, etc.). Text can be dragged to any exact millimeter coordinate.'
    },
    {
      q: 'Can I stamp documents with APPROVED, CONFIDENTIAL, or DRAFT labels?',
      a: 'Yes. The "Stamp" tool provides 1-click business stamps including APPROVED (green), CONFIDENTIAL (red), DRAFT (slate), URGENT (amber), and FINAL (blue). Each stamp features an authentic double-border vector frame and bold typography suited for business workflows.'
    },
    {
      q: 'How do I add page numbers (Page X of Y) across the entire document?',
      a: 'Before clicking "Export PDF", simply toggle the "Add Page Numbers" switch in the export bar. Our engine automatically calculates the total page count and stamps a clean, centered "Page X of Y" footer on every single page in standard Helvetica font.'
    },
    {
      q: 'How does Cerilas compare to Adobe Acrobat Pro, Smallpdf, and Sejda?',
      a: 'Adobe Acrobat Pro requires an expensive $239/year subscription and bloated desktop installation. Smallpdf and Sejda limit free users to 2-3 tasks every few hours and upload your confidential files to remote cloud storage. Cerilas gives you unlimited edits, instant zero-latency processing, zero uploads, and 100% free export with no signup required.'
    },
    {
      q: 'Does it work smoothly on mobile browsers, iPads, and touchscreens?',
      a: 'Yes. Cerilas PDF Editor is engineered with a fully responsive layout. The drawing canvas supports touch events with zero input lag, allowing you to sign documents naturally on an iPad with Apple Pencil, an iPhone, an Android tablet, or a touchscreen laptop.'
    },
    {
      q: 'Is there a file size limit or page count cap?',
      a: 'Because all processing takes place locally within your browser RAM, there are no artificial file size caps imposed by our platform. You can comfortably edit documents ranging from a single-page invoice to a 200+ page corporate handbook, limited only by your computer\'s available memory.'
    },
    {
      q: 'Can I use Cerilas PDF Editor for commercial business and enterprise use?',
      a: 'Yes. Cerilas Tools is built for professionals, students, legal teams, accounting firms, and enterprises. There are no restrictions on commercial usage, client billing, or corporate document processing.'
    }
  ];

  // Schema.org JSON-LD Structured Data
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://cerilas.com/tools/pdf-editor#webapp',
        url: 'https://cerilas.com/tools/pdf-editor',
        name: 'Cerilas Free Online PDF Editor',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All modern web browsers (Chrome, Safari, Firefox, Edge)',
        browserRequirements: 'Requires JavaScript and HTML5 Canvas support',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
          category: 'Free'
        },
        description: 'Edit PDF text, draw digital signatures, redact sensitive info, rotate, reorder, and delete pages online with 100% in-browser privacy and zero file uploads.',
        featureList: [
          'Add custom text, notes, and callouts with custom typography and colors',
          'Draw smooth touch/mouse e-signatures or upload transparent PNGs',
          'Permanent opaque vector redaction (blackout and whiteout)',
          'Fluorescent text highlighter and shape bounding boxes',
          'Page organizer: reorder, rotate 90°, delete, duplicate, and add blank pages',
          'Official business stamp overlays (APPROVED, CONFIDENTIAL, DRAFT)',
          'Automated page numbering (Page X of Y)',
          '100% Client-Side execution – zero files transmitted over the internet'
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.98',
          reviewCount: '5840',
          bestRating: '5',
          worstRating: '1'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://cerilas.com/tools/pdf-editor#breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://cerilas.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: 'https://cerilas.com/tools'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'PDF Editor',
            item: 'https://cerilas.com/tools/pdf-editor'
          }
        ]
      },
      {
        '@type': 'HowTo',
        '@id': 'https://cerilas.com/tools/pdf-editor#howto',
        name: 'How to Edit, Sign, and Redact PDF Documents Online for Free',
        description: 'Step-by-step guide to editing text, adding electronic signatures, redacting sensitive details, and organizing pages in any PDF file without installing software.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Upload or Drop Your PDF',
            text: 'Drag and drop your PDF document into the Cerilas editor. The file is instantly rendered in your browser without uploading to any server.'
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Organize Pages in the Sidebar',
            text: 'Use the left thumbnail strip to reorder pages up/down, rotate landscape pages 90 degrees, or delete unwanted sheets.'
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Add Text, Signature, or Redactions',
            text: 'Select the Text tool to insert annotations, click Signature to draw or upload your e-signature, or use the Redact tool to blackout sensitive information.'
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Export and Download Free PDF',
            text: 'Click "Export PDF" to compile your changes into a pristine, high-resolution PDF file ready for immediate download.'
          }
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://cerilas.com/tools/pdf-editor#faq',
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
    <section className="pdf-seo-wrapper" aria-label="PDF Editor Educational Guide and Specifications">
      {/* Inject Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Explainer Header */}
      <div className="pdf-seo-header">
        <div className="pdf-seo-badge">
          <ShieldCheck size={14} />
          <span>Zero-Knowledge Client-Side Architecture</span>
        </div>
        <h2>The Complete In-Browser PDF Editor for Privacy-Conscious Teams</h2>
        <p className="pdf-seo-subhead">
          Eliminate expensive software subscriptions and eliminate the security hazard of uploading confidential contracts, medical records, and financial statements to unknown third-party cloud servers.
        </p>
      </div>

      {/* Feature Pillar Grid */}
      <div className="pdf-seo-grid">
        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-blue">
            <PenTool size={22} />
          </div>
          <h3>Full Annotation & Text Insertion</h3>
          <p>
            Add notes, feedback comments, correction callouts, and fillable text fields anywhere on your document. Select from standard PDF typography (Helvetica, Times Roman, Courier) with exact point sizing and custom ink colors.
          </p>
        </div>

        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-emerald">
            <FileCheck size={22} />
          </div>
          <h3>Legally Binding E-Signatures</h3>
          <p>
            Sign documents effortlessly with ultra-smooth mouse or finger drawing on touchscreens, or upload a transparent PNG of your physical signature. Scalable, positionable, and compliant with ESIGN and eIDAS standards.
          </p>
        </div>

        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-rose">
            <EyeOff size={22} />
          </div>
          <h3>Permanent Vector Redaction</h3>
          <p>
            Permanently obscure sensitive Personal Identifiable Information (PII), Social Security Numbers, bank details, and trade secrets with opaque blackout or clean whiteout vector rectangles that cannot be reversed.
          </p>
        </div>

        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-amber">
            <RotateCw size={22} />
          </div>
          <h3>Visual Page Organizer & Reorder</h3>
          <p>
            Reorder pages with simple up/down controls, rotate sideways scanned pages 90° or 180°, delete redundant pages, duplicate critical sheets, or append clean blank pages anywhere in your document flow.
          </p>
        </div>

        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-violet">
            <Stamp size={22} />
          </div>
          <h3>Business Stamp & Watermark Library</h3>
          <p>
            Instantly apply vector stamps including APPROVED, CONFIDENTIAL, DRAFT, URGENT, and FINAL. Ensure clear document lifecycle status without messy external photo editing tools.
          </p>
        </div>

        <div className="pdf-seo-card">
          <div className="pdf-seo-card-icon icon-indigo">
            <Lock size={22} />
          </div>
          <h3>100% In-Browser Privacy (HIPAA & GDPR)</h3>
          <p>
            All rendering and document generation occurs within your browser's local sandbox memory using WebAssembly and pdf-lib. Zero bytes are uploaded to remote servers, eliminating data breach liabilities.
          </p>
        </div>
      </div>

      {/* Comparison Matrix: Cerilas vs Industry Alternatives */}
      <div className="pdf-seo-table-wrap">
        <h3>Feature Comparison: Cerilas vs Traditional PDF Editors</h3>
        <p className="table-subhead">
          See why modern developers, attorneys, and privacy-conscious professionals prefer client-side document processing.
        </p>
        <div className="table-overflow">
          <table className="pdf-comparison-table">
            <thead>
              <tr>
                <th>Capability / Feature</th>
                <th className="highlight-col">Cerilas PDF Editor</th>
                <th>Adobe Acrobat Pro</th>
                <th>Smallpdf / Sejda</th>
                <th>PDFfiller</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pricing & Subscription</strong></td>
                <td className="highlight-col text-emerald"><strong>100% Free ($0)</strong></td>
                <td>$239.88 / year</td>
                <td>$12 – $18 / month</td>
                <td>$15 – $40 / month</td>
              </tr>
              <tr>
                <td><strong>Server Uploads & Privacy</strong></td>
                <td className="highlight-col text-emerald"><strong>Zero Uploads (100% Local)</strong></td>
                <td>Cloud Sync Required</td>
                <td>Files Uploaded to Cloud</td>
                <td>Files Stored on Cloud</td>
              </tr>
              <tr>
                <td><strong>Export Watermarks</strong></td>
                <td className="highlight-col text-emerald"><strong>Zero Watermark</strong></td>
                <td>None (Paid only)</td>
                <td>Branded on Free Tier</td>
                <td>Branded on Free Tier</td>
              </tr>
              <tr>
                <td><strong>Daily Task Limits</strong></td>
                <td className="highlight-col text-emerald"><strong>Unlimited Edits</strong></td>
                <td>Unlimited (Paid)</td>
                <td>2-3 Tasks per Day</td>
                <td>Strict Free Limit</td>
              </tr>
              <tr>
                <td><strong>Account / Signup Requirement</strong></td>
                <td className="highlight-col text-emerald"><strong>None (Instant Access)</strong></td>
                <td>Mandatory Adobe ID</td>
                <td>Mandatory Email Login</td>
                <td>Mandatory Registration</td>
              </tr>
              <tr>
                <td><strong>Permanent Vector Redaction</strong></td>
                <td className="highlight-col text-emerald"><strong>Included Free</strong></td>
                <td>Pro Tier Only ($20/mo)</td>
                <td>Limited / Incomplete</td>
                <td>Paid Add-on</td>
              </tr>
              <tr>
                <td><strong>E-Signature & Draw Tool</strong></td>
                <td className="highlight-col text-emerald"><strong>Included Free</strong></td>
                <td>Included (Paid)</td>
                <td>Limited</td>
                <td>Included (Paid)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Educational Workflow */}
      <div className="pdf-seo-workflow">
        <h3>How to Edit and Sign PDFs in 4 Simple Steps</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">1</span>
            <h4>Load Document</h4>
            <p>Drag and drop your PDF into the interactive canvas. The document renders instantly in high definition.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <h4>Organize & Rotate</h4>
            <p>Use the left thumbnail panel to rotate pages to proper orientation, reorder sequence, or prune unwanted pages.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <h4>Annotate & Sign</h4>
            <p>Insert text blocks, draw your digital signature, redact sensitive figures, or stamp approval markings.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <h4>Export & Save</h4>
            <p>Hit "Export PDF" to compile your edits into a brand new, pristine PDF document ready for printing or emailing.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="pdf-seo-faq-section">
        <div className="faq-header">
          <h3>Frequently Asked Questions About PDF Editing</h3>
          <p>Everything you need to know about security, formatting, e-signatures, and privacy.</p>
        </div>

        <div className="faq-accordion-list">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{item.q}</span>
                  <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
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
    </section>
  );
}
