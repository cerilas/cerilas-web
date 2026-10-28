import SearchableHidden, { useSupportsUntilFound } from '../../../components/ui/SearchableHidden';
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
  const supportsUntilFound = useSupportsUntilFound();
  const [openFaq, setOpenFaq] = useState(null);

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
                aria-expanded={(openFaq === idx) || !supportsUntilFound}
              >
                <span>{item.q}</span>
                <ChevronDown className="bg-faq-chevron" size={18} />
              </button>
              <SearchableHidden isOpen={openFaq === idx} onReveal={() => setOpenFaq(idx)}>
                  <div className="bg-faq-answer">
                  <p>{item.a}</p>
                </div>
                </SearchableHidden>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
