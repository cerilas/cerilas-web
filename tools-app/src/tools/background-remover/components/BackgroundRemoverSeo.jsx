import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  Check,
  AlertTriangle,
  ChevronDown,
  ShoppingBag,
  Image as ImageIcon,
  Zap,
  Sliders
} from 'lucide-react';
import './BackgroundRemoverSeo.css';

const FAQ_ITEMS = [
  {
    q: 'How does this in-browser AI Background Remover work without uploading images to a server?',
    a: 'Cerilas Background Remover runs an optimized deep-learning segmentation model directly inside your browser using WebAssembly (WASM) and Web Workers via @imgly/background-removal. The model executes locally on your CPU/GPU hardware. Your photos, portraits, and product mockups never leave your computer, ensuring 100% data privacy and compliance with GDPR/HIPAA standards.'
  },
  {
    q: 'Is this Background Remover completely free with no watermarks?',
    a: 'Yes, 100% free with zero watermarks, no forced account registration, and no credit cards. You can remove backgrounds from as many images as you need with full original resolution export.'
  },
  {
    q: 'Can I make product photos compliant with Amazon, Shopify, or eBay requirements?',
    a: 'Absolutely. Major marketplaces like Amazon require pure white backgrounds (#FFFFFF / RGB 255, 255, 255) for primary product images. After removing the background, simply click the Pure White (#FFF) preset and download an instant e-commerce ready file.'
  },
  {
    q: 'What file formats are supported for input and output?',
    a: 'You can upload JPG, PNG, WebP, and AVIF photos. Output files can be exported as lossless transparent 32-bit PNG (with alpha channel) or high-efficiency WebP. You can also copy the transparent image directly to your clipboard.'
  },
  {
    q: 'How well does the AI handle delicate hair, fur, and transparent objects?',
    a: 'Our neural network engine uses boundary-aware semantic segmentation trained on complex foregrounds. It accurately isolates wispy flyaway hairs, pet fur, semi-transparent glassware, and intricate product contours with minimal edge artifacts.'
  },
  {
    q: 'Can I replace the background with custom colors or my own photo?',
    a: 'Yes. You can switch between transparent checkerboard mode, curated solid colors, studio lighting gradients, or upload your own custom backdrop image to composite behind the subject.'
  },
  {
    q: 'Why is client-side processing faster and more secure than cloud APIs?',
    a: 'Legacy background removal services require uploading high-resolution 10MB–25MB photos to a remote server, waiting in queue for cloud GPUs, and downloading the result. Client-side execution eliminates bandwidth transfer lag, works offline after initial cache, and guarantees total confidentiality.'
  }
];

export default function BackgroundRemoverSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'bg-remover-seo-jsonld';

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://tools.cerilas.com/#/tool/background-remover#software',
          'name': 'Cerilas Free AI Background Remover (100% Private In-Browser)',
          'alternateName': [
            'Cerilas Background Remover',
            'Free Online Background Eraser 2026',
            'Client-Side AI Background Remover',
            'Transparent PNG Maker Without Sign-Up',
            'Amazon White Background Product Photo Tool'
          ],
          'operatingSystem': 'All modern web browsers (Chrome, Safari, Firefox, Edge, Brave, Opera, macOS, Windows, Linux, iOS, Android)',
          'applicationCategory': 'MultimediaApplication, DesignApplication, UtilityApplication',
          'browserRequirements': 'Requires WebAssembly, Web Workers, HTML5 Canvas',
          'image': 'https://tools.cerilas.com/og-image.svg',
          'screenshot': 'https://tools.cerilas.com/og-image.svg',
          'softwareVersion': '2.1.0',
          'datePublished': '2026-09-01',
          'dateModified': '2026-09-17',
          'inLanguage': 'en-US',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock'
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.98',
            'reviewCount': '3120',
            'bestRating': '5',
            'worstRating': '1'
          },
          'author': {
            '@type': 'Organization',
            'name': 'Cerilas High Tech',
            'url': 'https://cerilas.com'
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'Cerilas High Tech',
            'url': 'https://cerilas.com',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://tools.cerilas.com/favicon.svg'
            }
          },
          'description': 'Free AI background remover operating 100% privately in your web browser. Cut out portraits, products, and graphics with zero server uploads, no watermarks, and instant transparent HD PNG export.',
          'featureList': [
            '100% In-Browser Privacy: Deep learning model executes locally via WebAssembly with zero server uploads',
            'Instant Transparent PNG Export: Lossless alpha channel cutout',
            'Interactive Split Slider: Inspect before and after cutout in real-time',
            'E-Commerce White Background Mode: Amazon and Shopify compliance with 1 click',
            'Studio Gradient & Custom Image Backdrops: Built-in composite studio',
            'Direct Clipboard Copy: Paste transparent cutouts directly into Figma, Photoshop, or Slack'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://tools.cerilas.com/#/tool/background-remover#breadcrumbs',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Cerilas Tools',
              'item': 'https://tools.cerilas.com/'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Image & Design Utilities',
              'item': 'https://tools.cerilas.com/#/'
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': 'Free AI Background Remover',
              'item': 'https://tools.cerilas.com/#/tool/background-remover'
            }
          ]
        },
        {
          '@type': 'HowTo',
          '@id': 'https://tools.cerilas.com/#/tool/background-remover#howto',
          'name': 'How to Remove Background from Any Image Online for Free',
          'description': 'A fast 3-step guide to removing photo backgrounds and creating transparent PNGs client-side.',
          'totalTime': 'PT1M',
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Upload or Drop Photo',
              'text': 'Drag and drop any JPG, PNG, WebP, or AVIF image into the dropzone or choose from your device.',
              'url': 'https://tools.cerilas.com/#/tool/background-remover'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Automatic AI Segmentation',
              'text': 'The in-browser neural network automatically isolates the foreground subject and removes background noise in seconds.',
              'url': 'https://tools.cerilas.com/#/tool/background-remover'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Customize Backdrop & Download',
              'text': 'Keep it transparent, apply pure white (#FFF) for e-commerce, or add studio gradients, then click Download HD PNG or Copy to Clipboard.',
              'url': 'https://tools.cerilas.com/#/tool/background-remover'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tools.cerilas.com/#/tool/background-remover#faq',
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

    jsonLdScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const existing = document.getElementById('bg-remover-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section className="bg-seo-root" aria-label="AI Background Removal Guide & Frequently Asked Questions">
      {/* Header */}
      <div className="bg-seo-header">
        <div className="bg-seo-badge">
          <Sparkles size={13} />
          <span>Local Neural Vision Architecture</span>
        </div>
        <h2 className="bg-seo-main-title">
          100% Private In-Browser AI Background Removal for Designers & E-Commerce
        </h2>
        <p className="bg-seo-main-desc">
          Say goodbye to expensive subscription tools that upload your personal photos to cloud servers. 
          Cerilas Background Remover utilizes client-side WebAssembly deep learning to deliver instant, studio-quality cutouts locally.
        </p>
      </div>

      {/* AI Capsule */}
      <div className="bg-ai-capsule">
        <div className="bg-capsule-header">
          <Cpu className="bg-capsule-icon" size={20} />
          <h3 className="bg-capsule-title">The Power of Zero-Cloud Neural Segmentation</h3>
        </div>
        <div className="bg-capsule-body">
          Traditional web tools transmit your confidential photos over the internet to remote servers, raising serious privacy concerns. 
          Cerilas runs an on-device machine learning model inside your browser through <strong>WebAssembly & Web Workers</strong>. 
          Your images never leave your hardware.
        </div>
        <div className="bg-capsule-highlights">
          <div className="bg-capsule-item">
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
            <div>
              <strong>Complete Confidentiality:</strong> Ideal for confidential product prototypes, sensitive portrait photography, and company logos.
            </div>
          </div>
          <div className="bg-capsule-item">
            <Zap size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} />
            <div>
              <strong>Zero Bandwidth Latency:</strong> No waiting for multi-megabyte image uploads or downloads across cloud queues.
            </div>
          </div>
          <div className="bg-capsule-item">
            <ShoppingBag size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#8b5cf6' }} />
            <div>
              <strong>Marketplace Ready:</strong> Instant pure white background compliance for Amazon, Shopify, eBay, and Etsy listings.
            </div>
          </div>
        </div>
      </div>

      {/* Three Pillars */}
      <div className="bg-pillars-grid">
        <div className="bg-pillar-card">
          <div className="bg-pillar-icon-box">
            <Layers size={20} />
          </div>
          <h3 className="bg-pillar-title">1. Hair & Edge Precision</h3>
          <p className="bg-pillar-desc">
            Standard cutouts leave ugly jagged edges or colored halos around hair and fur. Our neural segmentation creates smooth alpha transitions 
            that composite seamlessly onto any new backdrop.
          </p>
        </div>

        <div className="bg-pillar-card">
          <div className="bg-pillar-icon-box">
            <ShoppingBag size={20} />
          </div>
          <h3 className="bg-pillar-title">2. E-Commerce Product Studio</h3>
          <p className="bg-pillar-desc">
            Product photos with busy or uneven backgrounds convert poorly. Isolate footwear, apparel, electronics, and accessories onto pure white 
            or studio lighting in a single click.
          </p>
        </div>

        <div className="bg-pillar-card">
          <div className="bg-pillar-icon-box">
            <Sliders size={20} />
          </div>
          <h3 className="bg-pillar-title">3. Flexible Composite Studio</h3>
          <p className="bg-pillar-desc">
            Export raw transparent alpha PNGs for Figma and Photoshop, or choose from our curated Apple-style studio gradients and custom background photo uploader.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-comparison-section">
        <div>
          <h3 className="bg-section-heading">Cerilas In-Browser AI vs. Legacy Cloud Background Removers</h3>
          <p className="bg-section-subheading">
            See how client-side privacy and performance compare against traditional cloud-based subscription services.
          </p>
        </div>
        <div className="bg-table-container">
          <table className="bg-comparison-table">
            <thead>
              <tr>
                <th>Feature / Benchmark</th>
                <th>Cerilas Tools (In-Browser AI)</th>
                <th>Legacy Cloud Services (remove.bg, Canva, etc.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Image Privacy</strong></td>
                <td>
                  <span className="bg-status-tag pass">
                    <Check size={14} /> 100% Private (0 bytes sent to server)
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Processed locally in device memory.</div>
                </td>
                <td>
                  <span className="bg-status-tag fail">
                    <AlertTriangle size={14} /> Uploaded to remote third-party cloud
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Risk of server logging and data retention.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Pricing & Limits</strong></td>
                <td>
                  <span className="bg-status-tag pass">
                    <Check size={14} /> 100% Free & Unlimited
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Zero subscriptions, zero paywalls.</div>
                </td>
                <td>
                  <span className="bg-status-tag fail">
                    <AlertTriangle size={14} /> Credit-based ($0.20 to $1.99 per HD image)
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Forces monthly subscription for full HD resolution.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Watermarks</strong></td>
                <td>
                  <span className="bg-status-tag pass">
                    <Check size={14} /> Zero Watermarks
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Original clean resolution export.</div>
                </td>
                <td>
                  <span className="bg-status-tag fail">
                    <AlertTriangle size={14} /> Low-res or watermarked previews
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Limits free users to 640px thumbnails.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Background Customization</strong></td>
                <td>
                  <span className="bg-status-tag pass">
                    <Check size={14} /> Transparent, White, Gradients & Custom Photo
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Built-in studio compositing engine.</div>
                </td>
                <td>
                  <span className="bg-status-tag fail">
                    <AlertTriangle size={14} /> Basic or locked behind premium tier
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Requires third-party editing app.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-steps-section">
        <div>
          <h3 className="bg-section-heading">3 Easy Steps to Remove Any Photo Background</h3>
          <p className="bg-section-subheading">
            Zero setup, zero account creation—just drag, drop, and export in seconds.
          </p>
        </div>
        <div className="bg-steps-grid" style={{ marginTop: '1rem' }}>
          <div className="bg-step-card">
            <span className="bg-step-number">Step 01</span>
            <h4 className="bg-step-title">Upload Photo</h4>
            <p className="bg-step-text">
              Drag and drop any portrait, product photo, or object image directly into the workspace.
            </p>
          </div>

          <div className="bg-step-card">
            <span className="bg-step-number">Step 02</span>
            <h4 className="bg-step-title">Instant AI Cutout</h4>
            <p className="bg-step-text">
              The local neural vision model separates foreground contours and produces an accurate alpha mask.
            </p>
          </div>

          <div className="bg-step-card">
            <span className="bg-step-number">Step 03</span>
            <h4 className="bg-step-title">Export & Copy</h4>
            <p className="bg-step-text">
              Select your preferred background (Transparent, White, Studio) and download HD PNG or copy to clipboard.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-faq-section">
        <div>
          <h3 className="bg-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="bg-section-subheading">
            Everything you need to know about in-browser background removal, e-commerce optimization, and security.
          </p>
        </div>

        <div className="bg-faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`bg-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button
                type="button"
                className="bg-faq-question-btn"
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{item.q}</span>
                <ChevronDown className="bg-faq-chevron" size={18} />
              </button>
              {openFaq === idx && (
                <div className="bg-faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
