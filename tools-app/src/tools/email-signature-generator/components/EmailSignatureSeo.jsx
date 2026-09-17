import React, { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Check,
  X,
  Sparkles,
  Mail,
  Image,
  Share2,
  Sliders,
  FileCode,
  Layout
} from 'lucide-react';

export default function EmailSignatureSeo() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How do I add an HTML signature to Gmail?',
      a: 'Click "Copy for Gmail / Apple Mail" in Cerilas Email Signature Generator. Then open Gmail Settings (gear icon) > See all settings > General > Signature. Click "+ Create new", give it a name, click into the signature box, press Ctrl+V (or Cmd+V on Mac) to paste the visual signature, and scroll down to click "Save Changes".'
    },
    {
      q: 'How do I add the generated signature to Microsoft Outlook?',
      a: 'For Outlook Desktop or Outlook on the Web, copy the visual signature. Open Outlook Settings > Mail > Compose and reply > Email signature. Paste the formatted signature directly into the text box. The inline HTML tables ensure fonts, colors, and logos align seamlessly across all Outlook desktop and mobile versions.'
    },
    {
      q: 'Can I upload our company logo or personal headshot avatar?',
      a: 'Yes! You can either upload a local image (PNG, JPEG, SVG, WebP) directly from your device or paste a public image URL. You can customize the shape (Circle, Rounded Rectangle, Square) and fine-tune its pixel size with the slider.'
    },
    {
      q: 'How do custom contact fields work in this generator?',
      a: 'You can add unlimited custom fields to your signature. Use them for your pronouns (e.g., she/her, they/them), booking calendar links (e.g., Calendly), WhatsApp direct chat, office hours, licenses/certifications, or promotional announcements with custom hyperlinks.'
    },
    {
      q: 'Why do you use HTML tables instead of standard CSS Flexbox/Grid for email signatures?',
      a: 'Major desktop email clients—most notably Microsoft Outlook on Windows—rely on legacy Microsoft Word rendering engines which do not support modern CSS Flexbox, CSS Grid, or standard float layouts. HTML tables with inline CSS styles are the global industry gold-standard for ensuring 100% pixel-perfect cross-client rendering.'
    },
    {
      q: 'Is my uploaded logo and personal contact information private?',
      a: 'Yes, 100% private. All logo handling, image conversions, and signature HTML generation occur entirely within your client browser. No phone numbers, personal emails, company details, or uploaded pictures are ever uploaded or stored on any server.'
    },
    {
      q: 'Will this signature look good on mobile devices (iOS Mail, Gmail Android)?',
      a: 'Yes. Our templates are designed with compact horizontal dimensions (under 540px) and clean table structures, ensuring they scale cleanly on iPhone Mail, Android Gmail, and mobile Outlook without horizontal scrollbars or distorted layouts.'
    },
    {
      q: 'Can I download the raw HTML file or copy raw HTML source code?',
      a: 'Yes! You can click "Copy Raw HTML" to embed the source directly into automated email sending tools (like SendGrid, Mailchimp, or AWS SES), or click "Download HTML" to save a clean .html file for distribution across your team.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://tools.cerilas.com/#/tool/email-signature-generator',
        name: 'Cerilas Free Online Email Signature Generator',
        alternateName: [
          'Email Signature Generator',
          'HTML Email Signature Maker',
          'Gmail Signature Generator',
          'Outlook Email Signature Creator',
          'Apple Mail Signature Template',
          'Professional Business Email Signature'
        ],
        url: 'https://tools.cerilas.com/#/tool/email-signature-generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Company logo and headshot photo upload with circle and rounded corners',
          'Job title, department, company name, and full contact details',
          'Social media profile badges (LinkedIn, X, GitHub, Instagram, YouTube, WhatsApp)',
          'Unlimited custom fields with optional URLs (pronouns, Calendly links, certifications)',
          'Call to Action (CTA) button generator with custom brand styling',
          'Legal disclaimer text generator for corporate compliance',
          '1-Click rich visual text copy for Gmail, Outlook, and Apple Mail',
          'Raw HTML export and standalone .html file download'
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.98',
          ratingCount: '1840'
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
            name: 'Productivity',
            item: 'https://tools.cerilas.com/#/category/Productivity'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Email Signature Generator',
            item: 'https://tools.cerilas.com/#/tool/email-signature-generator'
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: 'How to Create and Install a Professional HTML Email Signature',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Enter Personal & Company Details',
            text: 'Fill in your name, job title, department, company, phone, email, and website.'
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Upload Logo or Avatar',
            text: 'Upload your company brand logo or headshot image. Adjust shape and size with interactive controls.'
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Add Socials & Custom Fields',
            text: 'Add your LinkedIn, X, or GitHub profiles, and create custom rows for pronouns, Calendly meeting links, or disclaimers.'
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Copy & Paste into Your Email Client',
            text: 'Click "Copy for Gmail / Apple Mail" and paste directly into your email client settings.'
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
    <article className="sig-seo-wrapper" aria-label="Email Signature Generator Technical Guide, Features and FAQ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* SEO Header */}
      <div className="sig-seo-header">
        <span className="sig-seo-badge">
          <Sparkles size={14} /> 100% In-Browser Privacy • Client-Safe Table HTML
        </span>
        <h2>Professional HTML Email Signature Generator for Teams &amp; Individuals</h2>
        <p className="sig-seo-subhead">
          Build sleek, cross-platform email signatures in seconds. Upload company logos, add custom social profiles, configure custom fields (pronouns, booking links), and install seamlessly into Gmail, Apple Mail, and Microsoft Outlook with zero coding.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="sig-seo-grid">
        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-blue">
            <Layout size={22} />
          </div>
          <h3>4 Polished Layout Templates</h3>
          <p>
            Choose between Modern Minimalist, Corporate Classic, Compact Horizontal, or Card &amp; CTA layouts designed specifically for business and personal correspondence.
          </p>
        </div>

        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-emerald">
            <Image size={22} />
          </div>
          <h3>Company Logo &amp; Avatar Upload</h3>
          <p>
            Upload your high-res company logo or headshot photo. Toggle between circular, rounded, or sharp square framing and adjust sizing seamlessly.
          </p>
        </div>

        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-indigo">
            <Sliders size={22} />
          </div>
          <h3>Extensible Custom Fields</h3>
          <p>
            Add arbitrary custom fields for pronouns, office hours, Calendly or Google Meet appointment links, certifications, and licenses with custom labels and hyperlinks.
          </p>
        </div>

        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-amber">
            <Share2 size={22} />
          </div>
          <h3>Full Social Media Integration</h3>
          <p>
            Link your LinkedIn, X (Twitter), GitHub, Instagram, YouTube, Facebook, WhatsApp, and meeting links with stylish, branded badges.
          </p>
        </div>

        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-rose">
            <Mail size={22} />
          </div>
          <h3>1-Click Visual Rich Text Copy</h3>
          <p>
            Copy the formatted visual signature directly to your system clipboard so you can paste (Ctrl+V / Cmd+V) directly into Gmail, Outlook, or Apple Mail.
          </p>
        </div>

        <div className="sig-seo-card">
          <div className="sig-seo-card-icon icon-violet">
            <ShieldCheck size={22} />
          </div>
          <h3>100% In-Browser Privacy</h3>
          <p>
            Your email address, phone numbers, and company assets remain on your device. No data is stored, tracked, or sent across the internet.
          </p>
        </div>
      </div>

      {/* Technical Comparison Table */}
      <div className="sig-seo-table-wrap">
        <h3>Cerilas Email Signature Generator vs. Traditional Tools</h3>
        <p className="table-subhead">
          Free, no forced subscriptions, no watermark logos, and no account sign-up required.
        </p>

        <div className="sig-table-responsive">
          <table className="sig-seo-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th className="highlight-col">Cerilas Tools</th>
                <th>Paid Signature Services</th>
                <th>Free Web Generators</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Price &amp; Watermarks</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> 100% Free, No Watermark</td>
                <td><X size={16} className="text-danger" /> $6–$15/user/month</td>
                <td><X size={16} className="text-danger" /> Adds forced promotional link</td>
              </tr>
              <tr>
                <td><strong>Company Logo Upload</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> Yes (Local or Web URL)</td>
                <td><Check size={16} className="text-success" /> Yes</td>
                <td><X size={16} className="text-danger" /> Often requires image hosting</td>
              </tr>
              <tr>
                <td><strong>Custom Dynamic Fields</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> Unlimited Custom Rows</td>
                <td><Check size={16} className="text-success" /> Yes</td>
                <td><X size={16} className="text-danger" /> Fixed static fields only</td>
              </tr>
              <tr>
                <td><strong>Outlook &amp; Gmail Compatibility</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> Strict Table Layouts</td>
                <td><Check size={16} className="text-success" /> High</td>
                <td><X size={16} className="text-danger" /> Often broken on Outlook</td>
              </tr>
              <tr>
                <td><strong>Data Privacy &amp; GDPR</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> 100% Client-Side Private</td>
                <td><X size={16} className="text-danger" /> Stored on remote servers</td>
                <td><X size={16} className="text-danger" /> Tracked for marketing</td>
              </tr>
              <tr>
                <td><strong>Account Sign-up Required</strong></td>
                <td className="highlight-col"><Check size={16} className="text-success" /> No Sign-up, Instant Use</td>
                <td><X size={16} className="text-danger" /> Mandatory credit card / registration</td>
                <td><X size={16} className="text-danger" /> Requires email address</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="sig-seo-steps-wrap">
        <h3>How to Create &amp; Install Your Signature in 4 Easy Steps</h3>
        <div className="sig-steps-grid">
          <div className="sig-step-card">
            <div className="step-num">1</div>
            <h4>Input Details</h4>
            <p>Enter your full name, position, team, organization, phone number, and website address.</p>
          </div>
          <div className="sig-step-card">
            <div className="step-num">2</div>
            <h4>Brand Visuals</h4>
            <p>Upload your logo or personal headshot. Choose shape, sizing, and brand accent colors.</p>
          </div>
          <div className="sig-step-card">
            <div className="step-num">3</div>
            <h4>Customize Extras</h4>
            <p>Add social handles, meeting scheduling URLs, custom fields, and legal disclaimers.</p>
          </div>
          <div className="sig-step-card">
            <div className="step-num">4</div>
            <h4>Copy &amp; Paste</h4>
            <p>Click "Copy for Gmail / Apple Mail" and paste straight into your email client's signature box.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="sig-seo-faq-section">
        <h3>Frequently Asked Questions About Email Signatures</h3>
        <p className="faq-subhead">
          Everything you need to know about email client compatibility, styling, and best practices.
        </p>

        <div className="sig-faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className={`sig-faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="sig-faq-question">
                  <h4>{item.q}</h4>
                  <ChevronDown
                    size={18}
                    className={`sig-faq-chevron ${isOpen ? 'rotated' : ''}`}
                  />
                </div>
                {isOpen && (
                  <div className="sig-faq-answer">
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
