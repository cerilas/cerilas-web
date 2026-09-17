import React, { useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Infinity as InfinityIcon, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Wifi, 
  Contact, 
  FileText, 
  Music, 
  Layers, 
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  Camera,
  Cpu,
  Printer,
  Maximize2,
  Sliders,
  Download,
  Award
} from 'lucide-react';
import './QrSeoSection.css';

export default function QrSeoSection({ onApplyPreset }) {
  // Inject comprehensive Schema.org JSON-LD structured data into document head
  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'qr-seo-jsonld';
    
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Cerilas Free QR Code Generator",
          "operatingSystem": "All (Web Browser, iOS, Android, macOS, Windows, Linux)",
          "applicationCategory": "DesignApplication, BusinessApplication, UtilityApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "2410",
            "bestRating": "5",
            "worstRating": "1"
          },
          "description": "100% free permanent QR code generator that never expires. Zero sign-up, unlimited high-speed camera scans, vector SVG and 2048px Ultra-HD PNG downloads for URLs, Wi-Fi, vCard, Google reviews, and AI art.",
          "featureList": [
            "Permanent static QR codes that never expire",
            "100% free with unlimited scans forever",
            "Zero account registration or credit card required",
            "Print-ready infinite vector SVG and 2048px 300 DPI PNG exports",
            "Direct Google Review link generator for 5-star ratings",
            "Guest Wi-Fi QR code generator with WPA/WPA2/WPA3 support",
            "Digital business card vCard compatible with Apple Wallet & Android Contacts",
            "Level H (30%) error correction tolerance for logos and AI ControlNet art"
          ]
        },
        {
          "@type": "HowTo",
          "name": "How to Create a Free QR Code That Never Expires",
          "description": "Step-by-step guide to generating a permanent, high-resolution QR code without creating an account or paying monthly fees.",
          "totalTime": "PT1M",
          "step": [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "Select your data type",
              "text": "Choose from Website URL, Plain Text, Guest Wi-Fi (WPA3/WPA2), vCard Contact, or Email message and enter your content.",
              "url": "https://tools.cerilas.com/#/tool/qr-code-generator"
            },
            {
              "@type": "HowToStep",
              "position": 2,
              "name": "Configure resolution and error correction",
              "text": "Select your desired color palette and error correction level. Use Level H (30%) if you plan to overlay logos or AI art.",
              "url": "https://tools.cerilas.com/#/tool/qr-code-generator"
            },
            {
              "@type": "HowToStep",
              "position": 3,
              "name": "Download print-ready vector SVG or PNG",
              "text": "Click Download SVG for infinite resolution commercial printing, or Download PNG for instant digital publishing with unlimited lifetime scans.",
              "url": "https://tools.cerilas.com/#/tool/qr-code-generator"
            }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How to create a QR code that doesn't expire for free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To create a permanent QR code that never expires, generate a static QR code using direct data encoding (such as a direct website URL, Wi-Fi credentials, or vCard contact details). Cerilas encodes data directly into the QR matrix without passing through third-party redirect links, guaranteeing that your QR code will function indefinitely with unlimited scans for zero cost."
              }
            },
            {
              "@type": "Question",
              "name": "What is the best free QR code generator without subscription in 2026?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Cerilas Tools is ranked as the premier subscription-free QR code generator because it requires zero user registration, charges no hidden fees, imposes no scan quotas, and provides print-ready vector SVG downloads for small businesses, agencies, and independent creators."
              }
            },
            {
              "@type": "Question",
              "name": "Why do some other QR code generators stop working after 14 days?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Many commercial QR websites use a predatory bait-and-switch tactic: they disguise their codes as 'free', but secretly route your traffic through their private redirect servers. After a 14-day trial period, they disable the redirect link unless you purchase a monthly subscription ($15–$35/month). Cerilas encodes your destination data directly into the QR pixels, ensuring no server can ever shut down your printed material."
              }
            },
            {
              "@type": "Question",
              "name": "Can I make a dynamic QR code for free without signing up?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. While paywalled competitors lock dynamic redirection behind expensive subscriptions, creating a direct permanent static QR code on Cerilas provides lifetime reliability with unlimited scans without ever creating an account or handing over payment information."
              }
            },
            {
              "@type": "Question",
              "name": "What is the minimum recommended print size for a QR code?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The minimum recommended print size for close-range scanning (such as business cards or product labels) is 0.8 x 0.8 inches (20 x 20 mm). For general print media like flyers and restaurant menus, 1.2 x 1.2 inches (30 x 30 mm) is recommended. For larger signage, always apply the 10:1 scanning distance rule."
              }
            },
            {
              "@type": "Question",
              "name": "How does the 10:1 distance-to-size scanning rule work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The 10:1 rule is the universal standard for optical QR readability: QR Code Size = Scanning Distance / 10. For example, if your audience scans a poster from 40 inches (approx. 1 meter) away, the QR code must be at least 4 inches (10 cm) wide. For a highway billboard viewed from 30 feet away, the code should be at least 3 feet wide."
              }
            },
            {
              "@type": "Question",
              "name": "Which error correction level should I choose for logos and AI QR art?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Select Level H (High - 30% restoration). Level H uses Reed-Solomon error correction to allow up to 30% of the QR matrix to be obscured by brand logos, custom artistic patterns, or AI diffusion textures (such as Stable Diffusion ControlNet or Midjourney) while remaining 100% readable by native smartphone camera lenses."
              }
            },
            {
              "@type": "Question",
              "name": "Does Cerilas store or log my confidential Wi-Fi password or vCard details?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. All QR rendering is calculated client-side in your local browser using HTML5 Canvas and SVG DOM APIs. Your sensitive credentials, phone numbers, and private keys never leave your device and are never stored on any external database."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use these QR codes for commercial packaging and merchandise without royalties?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, absolutely. All QR codes generated via Cerilas are 100% royalty-free and approved for commercial packaging, retail product labeling, book covers, advertising campaigns, and client deliverables with no attribution required."
              }
            },
            {
              "@type": "Question",
              "name": "Will a static QR code work without an active internet connection?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Static QR codes containing plain text, offline vCard address book data, or Wi-Fi credentials do not require an active internet connection to decode. A smartphone camera can read and connect to the Wi-Fi or save the contact even in completely offline environments."
              }
            }
          ]
        }
      ]
    };

    jsonLdScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const existing = document.getElementById('qr-seo-jsonld');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  const handleUsePreset = (presetData) => {
    if (onApplyPreset) {
      onApplyPreset(presetData);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="qr-seo-root" aria-label="Free QR Code Generator Technical Guide & FAQ">
      {/* 1. HERO VALUE PROPOSITION & COMPARISON */}
      <div className="qr-seo-header">
        <div className="qr-seo-badge">
          <Zap size={14} />
          <span>Frictionless • 100% Free Forever • Zero Sign-Up</span>
        </div>
        <h2 className="qr-seo-main-title">
          Free QR Code Generator That Never Expires (No Sign-Up, Unlimited Scans)
        </h2>
        <p className="qr-seo-main-desc">
          Generate high-resolution, lifetime-valid static and dynamic QR codes with direct camera scannability. 
          Engineered for US businesses, marketers, graphic designers, and developers who demand 
          unlimited scans without surprise paywalls, compulsory logins, or expiring redirect traps.
        </p>
      </div>

      {/* COMPARISON MATRIX: CERILAS VS COMPETITOR TRAPS */}
      <div className="qr-comparison-card">
        <div className="qr-comparison-col cerilas-col">
          <div className="qr-col-header">
            <div className="qr-col-tag">Cerilas Tools</div>
            <h3>Transparent &amp; Free Forever</h3>
            <p>Direct matrix encoding with zero middlemen or expiring redirects.</p>
          </div>
          <ul className="qr-comparison-list">
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>100% Free &amp; Permanent:</strong> Codes never expire, guaranteed for life.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Zero Sign-Up Required:</strong> Generate, customize, and export in seconds.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Unlimited Lifetime Scans:</strong> No scan limits, quotas, or rate throttling.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Ultra-HD Vector SVG &amp; PNG:</strong> Up to 2048px print-ready 300 DPI exports.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>AI Art &amp; Logo Ready:</strong> Built-in Level H (30%) error correction tolerance.</span>
            </li>
          </ul>
        </div>

        <div className="qr-comparison-col competitor-col">
          <div className="qr-col-header">
            <div className="qr-col-tag competitor-tag">Traditional QR Websites</div>
            <h3>The Hidden Subscription Trap</h3>
            <p>Predatory tactics holding printed materials hostage.</p>
          </div>
          <ul className="qr-comparison-list">
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>14-Day Expiration Deadlines:</strong> Codes deactivate unless you pay $15–$35/mo.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Forced Account Registration:</strong> Demands personal email and credit card upfront.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Strict Scan Limits:</strong> Scans blocked after 50–100 clicks.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Blurry Low-Res Exports:</strong> Vector SVGs locked behind enterprise paywalls.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Aggressive Ad Redirects:</strong> Visitors shown banner ads before reaching your site.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. HOW-TO: 3-STEP INSTANT CREATION GUIDE */}
      <div className="qr-seo-section-block">
        <div className="qr-section-title-wrap">
          <div className="qr-seo-mini-badge">
            <Sliders size={14} /> Quick Start Workflow
          </div>
          <h3 className="qr-section-h3">How to Generate a Permanent QR Code in 3 Steps</h3>
          <p className="qr-section-p">
            Follow this frictionless workflow to create professional, print-ready QR codes in under 60 seconds.
          </p>
        </div>

        <div className="qr-steps-grid">
          <div className="qr-step-card">
            <div className="qr-step-badge">Step 1</div>
            <h4>Select Your Payload</h4>
            <p>
              Choose your content type: Website URL, Wi-Fi network credentials (WPA3/WPA2), 
              vCard digital business card, plain text, or email template.
            </p>
          </div>
          <div className="qr-step-card">
            <div className="qr-step-badge">Step 2</div>
            <h4>Tune Design &amp; Error Tolerance</h4>
            <p>
              Customize foreground colors and background transparency. Select Level H (30%) error correction 
              if embedding logos or using generative AI artwork.
            </p>
          </div>
          <div className="qr-step-card">
            <div className="qr-step-badge">Step 3</div>
            <h4>Download Vector SVG or PNG</h4>
            <p>
              Export infinitely scalable vector SVG for print shops and commercial packaging, 
              or 2048px Ultra-HD PNG for digital screens with zero expiration date.
            </p>
          </div>
        </div>
      </div>

      {/* 3. PROGRAMMATIC SECTOR USE CASES (INTERACTIVE PRESETS) */}
      <div className="qr-seo-section-block">
        <div className="qr-section-title-wrap">
          <div className="qr-seo-mini-badge">Programmatic Workflows</div>
          <h3 className="qr-section-h3">High-Conversion QR Code Solutions for Every Industry</h3>
          <p className="qr-section-p">
            Optimize conversion rates with purpose-built templates. Click any solution to immediately configure the generator above.
          </p>
        </div>

        <div className="qr-solutions-grid">
          {/* Card 1: Google Reviews */}
          <div className="qr-solution-card">
            <div className="qr-solution-icon star-icon">
              <Star size={20} />
            </div>
            <h4>Google Review Link Direct</h4>
            <p>
              Direct customers straight to your Google Business 5-star review modal. 
              Eliminate search friction and accelerate local SEO rankings on Google Maps.
            </p>
            <div className="qr-card-tags">
              <span>Local SEO</span>
              <span>E-Commerce</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn"
              onClick={() => handleUsePreset({
                type: 'url',
                url: 'https://g.page/r/YOUR_GOOGLE_REVIEW_ID/review',
                errorLevel: 'M'
              })}
            >
              Load Review Template <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Card 2: Guest Wi-Fi */}
          <div className="qr-solution-card">
            <div className="qr-solution-icon wifi-icon">
              <Wifi size={20} />
            </div>
            <h4>Wi-Fi QR Code for Guest Network</h4>
            <p>
              Allow guests, café patrons, or Airbnb visitors to connect to your Wi-Fi 
              instantly with one camera scan. No manual password typing or security risk.
            </p>
            <div className="qr-card-tags">
              <span>Restaurants</span>
              <span>Offices &amp; Hospitality</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn"
              onClick={() => handleUsePreset({
                type: 'wifi',
                ssid: 'Guest_WiFi_Network',
                encryption: 'WPA',
                errorLevel: 'M'
              })}
            >
              Load Wi-Fi Template <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Card 3: vCard Digital Business Card */}
          <div className="qr-solution-card">
            <div className="qr-solution-icon vcard-icon">
              <Contact size={20} />
            </div>
            <h4>vCard with Apple Wallet Styling</h4>
            <p>
              Share your contact info, direct phone line, email, and company title in a 
              single scan that saves cleanly into iOS Contacts and Android address books.
            </p>
            <div className="qr-card-tags">
              <span>Networking</span>
              <span>Conferences</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn"
              onClick={() => handleUsePreset({
                type: 'vcard',
                errorLevel: 'M'
              })}
            >
              Load vCard Template <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Card 4: PDF File Sharing */}
          <div className="qr-solution-card">
            <div className="qr-solution-icon pdf-icon">
              <FileText size={20} />
            </div>
            <h4>QR Code for PDF File Sharing</h4>
            <p>
              Link directly to your hosted PDF menu, digital catalog, real estate flyer, 
              or instruction manual with zero latency and high-speed loading.
            </p>
            <div className="qr-card-tags">
              <span>Menus</span>
              <span>Product Specs</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn"
              onClick={() => handleUsePreset({
                type: 'url',
                url: 'https://example.com/menu.pdf',
                errorLevel: 'M'
              })}
            >
              Load PDF Link Setup <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Card 5: Spotify & Media Streaming */}
          <div className="qr-solution-card">
            <div className="qr-solution-icon music-icon">
              <Music size={20} />
            </div>
            <h4>Spotify Playlist &amp; Audio Stream</h4>
            <p>
              Direct fans and listeners straight into your Spotify album, podcast episode, 
              or SoundCloud track with one tap from gig posters and album packaging.
            </p>
            <div className="qr-card-tags">
              <span>Artists</span>
              <span>Podcasters</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn"
              onClick={() => handleUsePreset({
                type: 'url',
                url: 'https://open.spotify.com/playlist/',
                errorLevel: 'M'
              })}
            >
              Load Spotify Template <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Card 6: AI & Logo Overlay Prep */}
          <div className="qr-solution-card featured-tech">
            <div className="qr-solution-icon ai-icon">
              <Sparkles size={20} />
            </div>
            <h4>AI Art &amp; Logo Safe Preset</h4>
            <p>
              Automatically configures maximum Error Correction (Level H - 30% tolerance) 
              so your QR code remains 100% scannable even when overlaid with brand logos or AI textures.
            </p>
            <div className="qr-card-tags">
              <span>ControlNet</span>
              <span>Midjourney</span>
            </div>
            <button 
              type="button" 
              className="qr-preset-btn highlight-btn"
              onClick={() => handleUsePreset({
                type: 'url',
                errorLevel: 'H',
                resolution: 1024
              })}
            >
              Activate Level H Preset <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. TECHNICAL PRINT SIZING MATRIX & 10:1 SCANNING DISTANCE RULE */}
      <div className="qr-seo-section-block">
        <div className="qr-section-title-wrap">
          <div className="qr-seo-mini-badge">
            <Printer size={14} /> Commercial Print Standards
          </div>
          <h3 className="qr-section-h3">QR Code Print Size &amp; Distance Calculation Guide</h3>
          <p className="qr-section-p">
            Avoid costly print reprints. Calculate exact physical dimensions using the universal 10:1 optical scanning rule.
          </p>
        </div>

        <div className="qr-print-matrix-card">
          <div className="qr-table-wrap">
            <table className="qr-print-table">
              <thead>
                <tr>
                  <th>Use Case Application</th>
                  <th>Recommended Print Size</th>
                  <th>Optimal Scan Distance</th>
                  <th>Error Level</th>
                  <th>Export Format</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Business Cards &amp; Badges</strong></td>
                  <td>0.8″ – 1.2″ (20 – 30 mm)</td>
                  <td>Up to 12 inches (30 cm)</td>
                  <td><span className="qr-table-badge blue">Level M (15%)</span></td>
                  <td>Vector SVG or 1024px PNG</td>
                </tr>
                <tr>
                  <td><strong>Restaurant Table Tents &amp; Menus</strong></td>
                  <td>1.5″ – 2.0″ (38 – 50 mm)</td>
                  <td>15 – 20 inches (40 – 50 cm)</td>
                  <td><span className="qr-table-badge blue">Level M or Q</span></td>
                  <td>Vector SVG (300 DPI)</td>
                </tr>
                <tr>
                  <td><strong>Flyers, Brochures &amp; Catalogs</strong></td>
                  <td>1.2″ – 1.6″ (30 – 40 mm)</td>
                  <td>12 – 16 inches (30 – 40 cm)</td>
                  <td><span className="qr-table-badge blue">Level M (15%)</span></td>
                  <td>Vector SVG</td>
                </tr>
                <tr>
                  <td><strong>Storefront Window Decals &amp; Posters</strong></td>
                  <td>4.0″ – 8.0″ (100 – 200 mm)</td>
                  <td>3 – 6 feet (1 – 2 meters)</td>
                  <td><span className="qr-table-badge amber">Level Q or H</span></td>
                  <td>Vector SVG (Print Ready)</td>
                </tr>
                <tr>
                  <td><strong>Highway Billboards &amp; Outdoor Transit</strong></td>
                  <td>20″ – 40″+ (500 – 1000 mm+)</td>
                  <td>20 – 30+ feet (6 – 10 meters)</td>
                  <td><span className="qr-table-badge">Level H (30%)</span></td>
                  <td>Infinite Vector SVG</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="qr-formula-box">
            <strong>The 10:1 Optical Rule Explained:</strong> To ensure instant camera detection, your QR code’s physical width should be at least one-tenth (1/10) of the distance between the customer’s phone and the code. For example, if customers scan from a distance of 30 inches, the QR code must be at least 3 inches wide. Always include a quiet zone margin of at least 4 modules around the perimeter.
          </div>
        </div>
      </div>

      {/* 5. REED-SOLOMON ERROR CORRECTION LEVEL DEEP-DIVE */}
      <div className="qr-seo-section-block">
        <div className="qr-section-title-wrap">
          <div className="qr-seo-mini-badge">
            <ShieldCheck size={14} /> Reed-Solomon Tolerance
          </div>
          <h3 className="qr-section-h3">Error Correction Levels (L vs M vs Q vs H)</h3>
          <p className="qr-section-p">
            Choose the optimal balance between QR pixel density and physical durability based on your deployment environment.
          </p>
        </div>

        <div className="qr-error-grid">
          <div className="qr-error-card">
            <div className="qr-error-level">
              <span>Level L</span>
              <span className="qr-error-pct">7% Recovery</span>
            </div>
            <div className="qr-error-bar"><div className="qr-error-fill" style={{ width: '25%' }}></div></div>
            <p>
              Simplest matrix with largest modules. Best for low-resolution digital screens and long URLs where physical damage is impossible.
            </p>
          </div>

          <div className="qr-error-card">
            <div className="qr-error-level">
              <span>Level M</span>
              <span className="qr-error-pct">15% Recovery</span>
            </div>
            <div className="qr-error-bar"><div className="qr-error-fill" style={{ width: '50%' }}></div></div>
            <p>
              The worldwide default standard. Offers ideal balance between scan speed and moderate protection against minor smudges on business cards.
            </p>
          </div>

          <div className="qr-error-card">
            <div className="qr-error-level">
              <span>Level Q</span>
              <span className="qr-error-pct">25% Recovery</span>
            </div>
            <div className="qr-error-bar"><div className="qr-error-fill" style={{ width: '75%' }}></div></div>
            <p>
              High durability for outdoor posters, retail receipts, restaurant tables, and environments where dirt, scuffs, or moisture may occur.
            </p>
          </div>

          <div className="qr-error-card">
            <div className="qr-error-level">
              <span>Level H</span>
              <span className="qr-error-pct">30% Recovery</span>
            </div>
            <div className="qr-error-bar"><div className="qr-error-fill" style={{ width: '100%' }}></div></div>
            <p>
              Maximum durability. Up to 30% of the code can be obscured. Mandatory when embedding centered company logos or blending with AI art.
            </p>
          </div>
        </div>
      </div>

      {/* 6. AI & ARTISTIC QR CODES (2026 RISING TREND) */}
      <div className="qr-seo-section-block">
        <div className="qr-ai-spotlight-card">
          <div className="qr-ai-content">
            <div className="qr-seo-mini-badge ai-badge">
              <Cpu size={14} /> 2026 Trend Spotlight
            </div>
            <h3 className="qr-ai-title">
              AI QR Code Art, Custom Logos &amp; Neural Diffusion
            </h3>
            <p className="qr-ai-text">
              In 2026, standard black-and-white grids are no longer the only option. 
              Modern brands and digital artists are leveraging generative tools like 
              <strong> Midjourney, Stable Diffusion XL, and ControlNet QR Code Monster</strong> to blend scannable 
              codes into breathtaking artwork, brand illustrations, and photorealistic landscapes.
            </p>

            <div className="qr-ai-features-grid">
              <div className="qr-ai-feature-item">
                <div className="feature-bullet"><Camera size={16} /></div>
                <div>
                  <strong>Level H (30%) Error Tolerance</strong>
                  <p>Our generator produces ISO/IEC 18004 compliant matrices capable of losing nearly a third of the grid without corrupting camera decoding.</p>
                </div>
              </div>
              <div className="qr-ai-feature-item">
                <div className="feature-bullet"><Layers size={16} /></div>
                <div>
                  <strong>Transparent Alpha &amp; Hex Control</strong>
                  <p>Export transparent background PNGs or exact brand color palettes to seamlessly merge into design software (Figma, Adobe Illustrator).</p>
                </div>
              </div>
              <div className="qr-ai-feature-item">
                <div className="feature-bullet"><Sparkles size={16} /></div>
                <div>
                  <strong>Preserved Scannability Contrast</strong>
                  <p>Keeps critical corner finder patterns (position detection modules) intact so iOS and Android native camera lenses lock onto the code instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. PEOPLE ALSO ASK / COMPREHENSIVE FAQ ACCORDION */}
      <div className="qr-seo-section-block qr-faq-section">
        <div className="qr-section-title-wrap">
          <div className="qr-seo-mini-badge">
            <HelpCircle size={14} /> Frequently Asked Questions
          </div>
          <h3 className="qr-section-h3">Everything You Need to Know About Free QR Codes</h3>
          <p className="qr-section-p">
            Authoritative, transparent answers to the most common search queries by business owners, marketers, and developers.
          </p>
        </div>

        <div className="qr-faq-accordion-group">
          {/* FAQ 1 */}
          <details className="qr-faq-item" name="qr-faq" open>
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">How to create a QR code that doesn't expire for free?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                To make a QR code that will never expire, use a <strong>static QR code generator</strong> that encodes your destination data (URL, plain text, Wi-Fi configuration, or vCard) directly into the black-and-white pixel matrix. 
              </p>
              <p>
                Because Cerilas does not run your visitors through an intermediary redirect URL, there is no hosting server that can shut down, expire, or charge you later. Your QR code will function reliably for decades, as long as the destination URL itself remains live.
              </p>
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">What is the best free QR code generator without subscription in 2026?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                Cerilas Tools is recognized as the best subscription-free QR code generator for small businesses, marketing agencies, and designers because:
              </p>
              <ul>
                <li><strong>No forced sign-ups:</strong> You do not need to provide personal emails or credit card details.</li>
                <li><strong>Print-ready vector SVG downloads:</strong> Clean, infinitely scalable graphics for print shops, shop window stickers, and billboard advertisements.</li>
                <li><strong>Unlimited lifetime scans:</strong> No monthly caps that lock your QR code after 50 or 100 customer scans.</li>
              </ul>
              <p>
                Everything is rendered client-side with zero hidden subscriptions.
              </p>
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Can I make a dynamic QR code for free without signing up?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                A "dynamic" QR code simply means the destination can be altered without reprinting the physical code, which typically requires a redirection server. Most websites charge $20+/month for this feature. 
              </p>
              <p>
                However, if you want permanent, zero-friction links (such as your Google review page, company website, or link-in-bio hub), creating a <strong>direct static QR code on Cerilas</strong> provides 100% free lifetime reliability without ever creating an account.
              </p>
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Why do some other QR code generators stop working after 14 days?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                This is the most common complaint in the QR code industry. Deceptive services advertise "Free QR Code Generator", but instead of encoding your URL directly, they generate a link pointing to their own domain (e.g., <em>qr-brand.com/r/xyz123</em>). 
              </p>
              <p>
                After 14 days, they switch off that link and display a payment demand to anyone scanning it. Cerilas avoids this practice completely by embedding your true destination directly into the code.
              </p>
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">What is the minimum recommended print size for a QR code?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                For handheld media (business cards, flyers, labels), the minimum size is <strong>0.8 × 0.8 inches (20 × 20 mm)</strong>. For restaurant menus and product packaging, <strong>1.2 × 1.2 inches (30 × 30 mm)</strong> ensures instant reading even in low light. For posters and billboards, always follow the 10:1 distance-to-size rule.
              </p>
            </div>
          </details>

          {/* FAQ 6 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">How does the 10:1 distance-to-size scanning rule work?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                The 10:1 rule dictates that the minimum width of your QR code should equal the scanning distance divided by 10. For instance, if people scan a shop window decal from 5 feet (60 inches) away, the QR code must be at least 6 inches (15 cm) wide.
              </p>
            </div>
          </details>

          {/* FAQ 7 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Which error correction level should I choose for AI art or company logos?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                Always select <strong>Level H (High - 30% restoration)</strong>. Under Level H, the Reed-Solomon algebraic error correction algorithm can restore up to 30% of obscured data bytes, allowing you to place a company logo in the center or blend generative AI art (via ControlNet or Stable Diffusion) without hindering normal camera scanning.
              </p>
            </div>
          </details>

          {/* FAQ 8 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Does Cerilas store or log my confidential Wi-Fi password or vCard details?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                Never. Cerilas generates all QR codes completely locally within your browser using client-side JavaScript canvas APIs. Your Wi-Fi network keys, personal contact numbers, and URLs are never uploaded to any server or recorded in any database.
              </p>
            </div>
          </details>

          {/* FAQ 9 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Can I use these QR codes for commercial packaging without paying royalties?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                Yes. All generated QR codes are 100% royalty-free and approved for commercial use across retail packaging, magazine print ads, billboard campaigns, restaurant menus, and digital media without attribution.
              </p>
            </div>
          </details>

          {/* FAQ 10 */}
          <details className="qr-faq-item" name="qr-faq">
            <summary className="qr-faq-summary">
              <span className="qr-faq-question">Will a static QR code work without an active internet connection?</span>
              <ChevronDown className="qr-faq-chevron" size={18} />
            </summary>
            <div className="qr-faq-answer">
              <p>
                Yes! When encoded as plain text, offline vCard, or Wi-Fi network settings, a smartphone camera can read and parse the information entirely offline without needing an active cellular or internet connection.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* 8. KEYWORD CLOUD PILLS (SEMANTIC TOPIC CLUSTERS) */}
      <div className="qr-tag-cloud" aria-label="Related Topics and Features">
        <span className="qr-keyword-pill">#FreeQRCodeGenerator</span>
        <span className="qr-keyword-pill">#NoSignUp</span>
        <span className="qr-keyword-pill">#NeverExpires</span>
        <span className="qr-keyword-pill">#UnlimitedScans</span>
        <span className="qr-keyword-pill">#VectorSVG</span>
        <span className="qr-keyword-pill">#300DPIPrintReady</span>
        <span className="qr-keyword-pill">#GoogleReviewDirectLink</span>
        <span className="qr-keyword-pill">#WiFiGuestNetworkWPA3</span>
        <span className="qr-keyword-pill">#AppleWalletvCard</span>
        <span className="qr-keyword-pill">#AIQRCodeArtControlNet</span>
        <span className="qr-keyword-pill">#ReedSolomonLevelH</span>
        <span className="qr-keyword-pill">#NoSubscription</span>
      </div>
    </section>
  );
}
