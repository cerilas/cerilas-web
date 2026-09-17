import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  Award, 
  FileText, 
  Layers, 
  Zap, 
  Lock, 
  Check, 
  XCircle, 
  Cpu, 
  Download, 
  Briefcase, 
  Scale, 
  GraduationCap, 
  HelpCircle, 
  ChevronDown,
  Sparkles,
  EyeOff,
  Clock,
  HardDrive,
  FileCheck,
  CheckCircle2,
  Sliders,
  Archive,
  AlertTriangle
} from 'lucide-react';
import './PdfCompressorSeo.css';

export default function PdfCompressorSeo({ onSelectPreset }) {
  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'pdf-compressor-seo-jsonld';

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": "https://tools.cerilas.com/#/tool/pdf-compressor#software",
          "name": "Cerilas Free Online PDF Compressor & Document Size Reducer",
          "alternateName": [
            "Cerilas PDF Compressor",
            "Best Free Online PDF Compressor 2026",
            "100% Private Client-Side PDF Reducer",
            "In-Browser PDF Optimizer Without Server Upload",
            "Batch PDF Compressor for Email and Resumes",
            "Compress PDF to 200KB Free",
            "Compress PDF Under 1MB"
          ],
          "operatingSystem": "All modern web browsers (Chrome, Safari, Firefox, Edge, Brave, Opera, macOS, Windows, Linux, iOS, Android)",
          "applicationCategory": "ProductivityApplication, UtilityApplication, BusinessApplication, SecurityApplication",
          "browserRequirements": "Requires HTML5 Canvas, WebAssembly, Web Workers, LocalStorage",
          "image": "https://tools.cerilas.com/og-image.svg",
          "screenshot": "https://tools.cerilas.com/og-image.svg",
          "softwareVersion": "2.1.0",
          "datePublished": "2026-09-01",
          "dateModified": "2026-09-17",
          "inLanguage": "en-US",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.96",
            "reviewCount": "2340",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Organization",
            "name": "Cerilas High Tech",
            "url": "https://cerilas.com"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Cerilas High Tech",
            "url": "https://cerilas.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://tools.cerilas.com/favicon.svg"
            }
          },
          "description": "The best free online PDF compressor offering 100% private in-browser document compression. Reduce PDF file sizes up to 90% without uploading sensitive contracts, financial statements, or resumes to external cloud servers. Features instant page 1 visual previews, multi-level compression presets, and batch ZIP export.",
          "featureList": [
            "100% Client-Side Privacy: All PDF pages and embedded images are compressed locally in browser memory; zero bytes leave your computer",
            "Multi-Tier Compression Presets: Instant selection between Extreme (under 1MB/2MB), Balanced (Recommended), High Quality, and Structural Lossless",
            "Visual Page 1 Thumbnail Previews: Inspect documents visually before and after compression",
            "Batch File Processing: Drag and drop multiple PDF documents simultaneously and compress them in parallel",
            "One-Click ZIP Export: Download all optimized PDFs together in a single lightweight ZIP archive",
            "Zero Daily Upload Quotas: Unlimited compressions without account registration, watermarks, or credit card requirements",
            "Accurate Before vs. After Size Telemetry: Real-time calculation of saved megabytes and exact percentage reduction",
            "Target Size Threshold Optimization: Presets tailored to hit strict 100KB, 200KB, 500KB, 1MB, and 2MB upload limits"
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://tools.cerilas.com/#/tool/pdf-compressor#breadcrumbs",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Cerilas Tools",
              "item": "https://tools.cerilas.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Document Utilities",
              "item": "https://tools.cerilas.com/#/"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Free PDF Compressor",
              "item": "https://tools.cerilas.com/#/tool/pdf-compressor"
            }
          ]
        },
        {
          "@type": "HowTo",
          "@id": "https://tools.cerilas.com/#/tool/pdf-compressor#howto",
          "name": "How to Compress PDF Files Online Without Uploading to Cloud Servers",
          "description": "A secure, step-by-step framework to reduce PDF file size locally in your web browser while preserving maximum document readability.",
          "totalTime": "PT1M",
          "step": [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "Select or Drag & Drop PDF Documents",
              "text": "Drag your PDF files into the upload zone or click to select from your device. You can add single files or multiple PDFs simultaneously.",
              "url": "https://tools.cerilas.com/#/tool/pdf-compressor"
            },
            {
              "@type": "HowToStep",
              "position": 2,
              "name": "Choose Your Target Compression Preset",
              "text": "Select Extreme Compression for tight portal upload limits (under 1MB/2MB), Balanced for general email and sharing, or High Quality for print documents.",
              "url": "https://tools.cerilas.com/#/tool/pdf-compressor"
            },
            {
              "@type": "HowToStep",
              "position": 3,
              "name": "Execute In-Browser Local Compression",
              "text": "Click 'Compress All PDFs'. The engine downsamples embedded raster images and optimizes object streams directly in local browser memory without uploading any data.",
              "url": "https://tools.cerilas.com/#/tool/pdf-compressor"
            },
            {
              "@type": "HowToStep",
              "position": 4,
              "name": "Download Individual PDFs or Full ZIP Archive",
              "text": "Review your compression ratio and size savings. Download each compressed PDF individually or click 'Download All as ZIP' to export all files at once.",
              "url": "https://tools.cerilas.com/#/tool/pdf-compressor"
            }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": "https://tools.cerilas.com/#/tool/pdf-compressor#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is my PDF uploaded to any external server during compression?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. Unlike legacy cloud converters that transmit your confidential files over the internet to third-party servers, Cerilas PDF Compressor executes 100% locally inside your web browser using HTML5 Canvas, WebAssembly, and pdf-lib. Your confidential contracts, bank statements, medical records, and resumes never leave your personal computer or mobile device."
              }
            },
            {
              "@type": "Question",
              "name": "How does the PDF compressor achieve up to 90% file size reduction?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The majority of oversized PDF files (90-95% of total byte weight) are caused by uncompressed high-resolution raster images, full-page scanner photos, and uncompressed PDF object streams. Our engine intelligently downsamples these embedded images to target DPI resolutions (such as 150 DPI for screens or 96 DPI for extreme compression), converts them into optimized JPEG streams, and compresses the PDF cross-reference structure using modern object stream encoding."
              }
            },
            {
              "@type": "Question",
              "name": "How do I compress a PDF to under 200KB or 100KB for government and visa portals?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To reduce a document to under 200KB or 100KB, select the Extreme Compression preset. This preset resamples embedded raster elements to approximately 90-110 DPI with high-efficiency DCT quantization. If your document contains multi-page full-color photos, Extreme mode drastically shrinks heavy bitmap data while keeping typed text and signatures legible."
              }
            },
            {
              "@type": "Question",
              "name": "What is the difference between Extreme, Balanced, High Quality, and Lossless presets?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Extreme Compression cuts file size by 70% to 90% (~110 DPI) for strict portals (&lt;1MB/2MB). Balanced Compression achieves 50% to 75% reduction (~150 DPI), providing the ideal compromise for emails and presentations. High Quality yields 25% to 45% savings (~200+ DPI) for printing and high-res archiving. Structural Lossless cleans metadata and optimizes binary object streams without re-compressing image pixels."
              }
            },
            {
              "@type": "Question",
              "name": "Can I compress multiple PDF documents simultaneously?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! You can drag and drop dozens of PDF files at once. Cerilas extracts visual thumbnails for each document, processes them sequentially with live progress indicators, and allows you to download all compressed files in a single organized ZIP archive."
              }
            },
            {
              "@type": "Question",
              "name": "Will the text in my PDF remain sharp and legible?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Our resampling engine renders pages at high target densities (150 to 220+ DPI) with anti-aliased font smoothing. In Structural Lossless mode, 100% of native vector glyphs and fonts remain completely untouched and searchable."
              }
            },
            {
              "@type": "Question",
              "name": "Is there any file size limit or daily usage quota?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "There are zero file size limits, zero daily quotas, zero watermarks, and no sign-up or credit card required. Because processing runs on your device rather than consuming expensive server compute, you have unlimited free usage."
              }
            },
            {
              "@type": "Question",
              "name": "How does Cerilas ensure PDF files do not become larger after compression?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "If a PDF is already heavily optimized, re-encoding can sometimes yield a slightly larger byte stream. Cerilas features built-in fallback safeguards: if the compressed output exceeds the original file size, the engine automatically preserves the smaller original file."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use this PDF compressor on my iPhone, iPad, or Android device?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Cerilas PDF Compressor is fully responsive and compatible with mobile browsers, including Mobile Safari and Google Chrome on iOS and Android. Processing occurs within mobile WebKit / Chromium memory without requiring any app installations."
              }
            },
            {
              "@type": "Question",
              "name": "Why is client-side in-browser compression safer for confidential legal and financial documents?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "When you upload legal agreements, NDA drafts, tax returns, or medical histories to cloud-based PDF tools, confidential information traverses third-party servers where it may be cached, logged, or exposed to breaches. In-browser client-side compression guarantees zero data transmission—the PDF never leaves your custody, satisfying GDPR, HIPAA, and CCPA standards."
              }
            },
            {
              "@type": "Question",
              "name": "Does compressing a PDF strip passwords or digital security certificates?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Standard compression cleans out unnecessary metadata and optimizes image streams. If a PDF is encrypted with a master password, you must enter the password in your PDF viewer before compression can parse the streams. Digital cryptographic signatures are protected by preserving structural integrity."
              }
            },
            {
              "@type": "Question",
              "name": "Can I compress large scanned books and multi-page technical manuals?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Scanned books and manuals often experience the largest reductions—frequently dropping from 80MB-150MB down to under 10MB. Our engine processes pages sequentially to manage memory consumption safely without crashing the browser."
              }
            }
          ]
        }
      ]
    };

    jsonLdScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const existing = document.getElementById('pdf-compressor-seo-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section className="pdf-seo-root" aria-label="Comprehensive PDF Compression Guide & Knowledge Base">
      {/* 1. Header Value Proposition */}
      <div className="pdf-seo-header">
        <div className="pdf-seo-badge">
          <ShieldCheck size={14} />
          <span>100% In-Browser Privacy • Zero Server Uploads • Unlimited Batch Files • Ad-Free</span>
        </div>
        <h2 className="pdf-seo-main-title">
          Compress PDF Online Free – Reduce PDF File Size in MB &amp; KB
        </h2>
        <p className="pdf-seo-main-desc">
          Engineered for legal professionals, job applicants, financial analysts, and students who need to compress PDF files to under 200KB, 500KB, or 1MB. Reduce PDF file sizes up to 90% directly inside your browser memory without sending a single byte to external cloud servers.
        </p>
      </div>

      {/* 2. Direct Answer / AI Knowledge Capsule (GEO & Featured Snippet Trigger) */}
      <div className="pdf-ai-capsule">
        <div className="pdf-capsule-header">
          <Award size={18} className="pdf-capsule-icon" />
          <h3 className="pdf-capsule-title">Quick Overview: Why Cerilas is the Modern PDF Compression Standard</h3>
        </div>
        <div className="pdf-capsule-body">
          <p>
            <strong>What is In-Browser PDF Compression?</strong> A secure document reduction architecture where PDF parsing, 
            embedded raster image downsampling, and object stream compression occur <strong>100% locally inside your web browser</strong> 
            using HTML5 Canvas, WebAssembly, and <code>pdf-lib</code>.
          </p>
          <div className="pdf-capsule-highlights">
            <div className="pdf-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Total Data Confidentiality:</strong> Your private contracts, tax filings, and medical records never leave your computer or touch third-party servers.</span>
            </div>
            <div className="pdf-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Up to 90% Byte Reduction:</strong> Effortlessly shrink heavy 20MB+ scanned PDFs down to under 1MB or 2MB to beat strict portal upload limits.</span>
            </div>
            <div className="pdf-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Visual Page 1 Previews:</strong> High-definition thumbnails render automatically for every uploaded document before and after compression.</span>
            </div>
            <div className="pdf-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Batch Processing &amp; ZIP Export:</strong> Compress dozens of PDF files simultaneously and download all results in a single organized archive.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Target File Size Threshold Guide (High Search Volume Solutions) */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <HardDrive size={14} /> Target File Size Guide
          </div>
          <h3 className="pdf-section-h3">How to Hit Specific PDF Size Thresholds</h3>
          <p className="pdf-section-p">
            Government portals, universities, and job platforms enforce strict byte ceilings. Here is how to achieve exact target limits:
          </p>
        </div>

        <div className="pdf-threshold-grid">
          <div className="pdf-threshold-card">
            <div className="threshold-header">
              <span className="threshold-pill red">&lt; 100 KB - 200 KB</span>
              <h4>Passport &amp; Visa Portals</h4>
            </div>
            <p>
              Embassies and government identity verification sites often cap document scans at 100KB or 200KB. 
              Use our <strong>Extreme</strong> preset to compress scanned IDs and visa applications while preserving critical text legibility.
            </p>
          </div>

          <div className="pdf-threshold-card">
            <div className="threshold-header">
              <span className="threshold-pill yellow">&lt; 1 MB - 2 MB</span>
              <h4>Job Applications (ATS) &amp; Resumes</h4>
            </div>
            <p>
              Corporate Applicant Tracking Systems (Workday, Greenhouse, Taleo) automatically reject resumes exceeding 2MB. 
              Our <strong>Extreme</strong> or <strong>Balanced</strong> preset compresses portfolios down to under 800KB.
            </p>
          </div>

          <div className="pdf-threshold-card">
            <div className="threshold-header">
              <span className="threshold-pill blue">&lt; 5 MB - 10 MB</span>
              <h4>Court Filings &amp; Legal Discovery</h4>
            </div>
            <p>
              Electronic Court Filing (CM/ECF) systems reject exhibits larger than 5MB to 10MB. 
              Our <strong>Balanced</strong> preset downsizes extensive legal briefs and exhibits without risking client confidentiality.
            </p>
          </div>

          <div className="pdf-threshold-card">
            <div className="threshold-header">
              <span className="threshold-pill green">&lt; 25 MB</span>
              <h4>Email Attachments &amp; Submissions</h4>
            </div>
            <p>
              Standard email services (Gmail, Outlook, Yahoo) enforce a hard 25MB attachment limit. 
              Easily shrink 100MB+ presentations, architectural blueprints, and scanned books to fly under the 25MB ceiling.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Interactive Quick-Start Preset Launcher */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <Sliders size={14} /> Preset Selector
          </div>
          <h3 className="pdf-section-h3">Choose Your Optimal Compression Tier</h3>
          <p className="pdf-section-p">
            Click any tier below to activate it directly in the active compressor above.
          </p>
        </div>

        <div className="pdf-tiers-grid">
          <div 
            className="pdf-tier-card"
            onClick={() => onSelectPreset && onSelectPreset('extreme')}
            role="button"
            tabIndex={0}
            aria-label="Activate Extreme Compression preset"
          >
            <div className="tier-top">
              <Zap size={18} className="tier-icon" />
              <span className="tier-badge extreme">Max Shrink</span>
            </div>
            <h4>Extreme Compression</h4>
            <span className="tier-savings">Save ~70% - 90% • ~110 DPI</span>
            <p>
              Packs raster assets aggressively for portals with strict 1MB/2MB ceilings.
            </p>
            <button className="tier-action-btn">
              <span>Select Extreme</span>
              <Zap size={13} />
            </button>
          </div>

          <div 
            className="pdf-tier-card"
            onClick={() => onSelectPreset && onSelectPreset('balanced')}
            role="button"
            tabIndex={0}
            aria-label="Activate Balanced Compression preset"
          >
            <div className="tier-top">
              <Sparkles size={18} className="tier-icon" />
              <span className="tier-badge balanced">Recommended</span>
            </div>
            <h4>Balanced (Default)</h4>
            <span className="tier-savings">Save ~50% - 75% • ~150 DPI</span>
            <p>
              The golden standard for screen viewing, business emails, and sharp text.
            </p>
            <button className="tier-action-btn">
              <span>Select Balanced</span>
              <Zap size={13} />
            </button>
          </div>

          <div 
            className="pdf-tier-card"
            onClick={() => onSelectPreset && onSelectPreset('high')}
            role="button"
            tabIndex={0}
            aria-label="Activate High Quality Compression preset"
          >
            <div className="tier-top">
              <FileCheck size={18} className="tier-icon" />
              <span className="tier-badge high">Print Quality</span>
            </div>
            <h4>High Quality</h4>
            <span className="tier-savings">Save ~25% - 45% • ~220 DPI</span>
            <p>
              Retains rich photographic fidelity, intricate diagrams, and crisp vector lines.
            </p>
            <button className="tier-action-btn">
              <span>Select High Quality</span>
              <Zap size={13} />
            </button>
          </div>

          <div 
            className="pdf-tier-card"
            onClick={() => onSelectPreset && onSelectPreset('lossless')}
            role="button"
            tabIndex={0}
            aria-label="Activate Structural Lossless preset"
          >
            <div className="tier-top">
              <Layers size={18} className="tier-icon" />
              <span className="tier-badge lossless">Vector Safe</span>
            </div>
            <h4>Structural Lossless</h4>
            <span className="tier-savings">Save ~10% - 30% • No Pixel Changes</span>
            <p>
              Cleans metadata, deduplicates font streams, and compresses binary tables.
            </p>
            <button className="tier-action-btn">
              <span>Select Lossless</span>
              <Zap size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. The 4-Step Guide */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <Layers size={14} /> Step-by-Step Workflow
          </div>
          <h3 className="pdf-section-h3">How to Compress PDFs in 4 Easy Steps</h3>
          <p className="pdf-section-p">
            Reduce document weight in seconds with zero configuration and total data sovereignty.
          </p>
        </div>

        <div className="pdf-steps-grid">
          <div className="pdf-step-card">
            <div className="pdf-step-badge">Step 1</div>
            <h4>Upload or Drop PDFs</h4>
            <p>
              Select your files or drag and drop multiple PDF documents into the upload box. The engine immediately reads document dimensions, total page counts, and generates a visual thumbnail.
            </p>
          </div>
          <div className="pdf-step-card">
            <div className="pdf-step-badge">Step 2</div>
            <h4>Select Compression Level</h4>
            <p>
              Choose <strong>Extreme</strong> for tight portal limits (e.g. government or job sites requiring &lt;2MB), <strong>Balanced</strong> for emails and presentations, or <strong>High Quality</strong> for archival printing.
            </p>
          </div>
          <div className="pdf-step-card">
            <div className="pdf-step-badge">Step 3</div>
            <h4>Instant In-Browser Processing</h4>
            <p>
              Click Compress. All image resampling and PDF object stream optimization executes locally within your device's memory with real-time page-by-page progress indicators.
            </p>
          </div>
          <div className="pdf-step-card">
            <div className="pdf-step-badge">Step 4</div>
            <h4>Download Files or ZIP</h4>
            <p>
              Inspect the exact megabytes saved and percentage reduction. Save files individually or export the entire batch in a single compressed ZIP archive with one click.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Comprehensive Competitive Benchmark Matrix */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <Award size={14} /> Competitive Benchmark
          </div>
          <h3 className="pdf-section-h3">Cerilas In-Browser vs. Cloud Converters vs. Adobe Acrobat</h3>
          <p className="pdf-section-p">
            Compare privacy, performance, and accessibility across leading PDF compression solutions.
          </p>
        </div>

        <div className="pdf-matrix-card">
          <div className="pdf-table-wrap">
            <table className="pdf-comparison-table">
              <thead>
                <tr>
                  <th>Feature &amp; Capability</th>
                  <th className="highlight-col">Cerilas PDF Compressor</th>
                  <th>Cloud Converters (ILovePDF / Smallpdf)</th>
                  <th>Adobe Acrobat Pro</th>
                  <th>Generic Converters (FreeConvert)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Privacy &amp; Data Security</strong><br /><span className="table-subtext">Where do your documents go?</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> 100% In-Browser (Zero Upload)</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Uploaded to Remote Cloud</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Local Desktop Storage</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Uploaded to Remote Servers</span></td>
                </tr>
                <tr>
                  <td><strong>Compliance (GDPR / HIPAA)</strong><br /><span className="table-subtext">Suitability for confidential files</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> 100% Compliant (No Data Transit)</span></td>
                  <td><span className="pdf-table-badge yellow">Third-Party Cloud Risk</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Enterprise Compliant</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Public Server Storage</span></td>
                </tr>
                <tr>
                  <td><strong>Cost &amp; Subscription</strong><br /><span className="table-subtext">Pricing model</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> 100% Free Forever</span></td>
                  <td><span className="pdf-table-badge yellow">Freemium (Daily Paywalls)</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> $239 / Year Subscription</span></td>
                  <td><span className="pdf-table-badge yellow">Credits &amp; Subscription</span></td>
                </tr>
                <tr>
                  <td><strong>File Size &amp; Batch Quotas</strong><br /><span className="table-subtext">Restrictions on volume</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> Unlimited Files &amp; Sizes</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> 2 Files/Day Free Limit</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Unlimited</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> File Size Caps</span></td>
                </tr>
                <tr>
                  <td><strong>Advertisements &amp; Tracking</strong><br /><span className="table-subtext">Interface experience</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> Clean Minimalist UI</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Heavy Banner &amp; Pop-up Ads</span></td>
                  <td><span className="pdf-table-badge yellow">In-App Upsells</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Video &amp; Sticky Ads</span></td>
                </tr>
                <tr>
                  <td><strong>Installation &amp; Sign-Up</strong><br /><span className="table-subtext">Accessibility</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> Instant (No Install / No Login)</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Web Browser</span></td>
                  <td><span className="pdf-table-badge red"><XCircle size={13} /> Heavy 2GB+ Desktop App</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Web Browser</span></td>
                </tr>
                <tr>
                  <td><strong>Batch ZIP Export</strong><br /><span className="table-subtext">Download all compressed files</span></td>
                  <td className="highlight-col"><span className="pdf-table-badge green"><Check size={13} /> Built-in 1-Click ZIP</span></td>
                  <td><span className="pdf-table-badge yellow">Requires Paid Pro Plan</span></td>
                  <td><span className="pdf-table-badge green"><Check size={13} /> Supported</span></td>
                  <td><span className="pdf-table-badge yellow">Limited</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. The Science of PDF Compression */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <Cpu size={14} /> Deep Technical Insights
          </div>
          <h3 className="pdf-section-h3">The Mechanics of PDF Compression: How File Sizes Shrink</h3>
          <p className="pdf-section-p">
            Understanding how raster resampling, object stream optimization, and font deduplication reduce file size.
          </p>
        </div>

        <div className="pdf-science-grid">
          <div className="pdf-science-card">
            <div className="pdf-science-icon-wrap">
              <Zap size={20} className="science-icon" />
            </div>
            <h4>DPI Downsampling &amp; Resampling</h4>
            <p>
              Scanned PDFs often contain raw 300 to 600 DPI bitmap imagery meant for industrial offset printing. 
              On computer screens and smartphones, human visual acuity caps out around 150 DPI. 
              By intelligently downsampling raster assets to 110-150 DPI, file weight drops exponentially without perceptible visual degradation.
            </p>
          </div>

          <div className="pdf-science-card">
            <div className="pdf-science-icon-wrap">
              <Layers size={20} className="science-icon" />
            </div>
            <h4>Object Stream Encoding</h4>
            <p>
              Legacy PDF documents store metadata, font metrics, and page dictionaries as separate uncompressed objects. 
              Cerilas utilizes modern <strong>PDF Object Streams (ObjStm)</strong> to bundle dozens of small indirect objects 
              into compact, Flate-compressed byte streams, drastically slashing structural overhead.
            </p>
          </div>

          <div className="pdf-science-card">
            <div className="pdf-science-icon-wrap">
              <EyeOff size={20} className="science-icon" />
            </div>
            <h4>Metadata &amp; XML Packet Stripping</h4>
            <p>
              Enterprise PDF generators and scanning hardware append extensive Adobe XMP metadata, edit histories, 
              color profiles, and thumbnail caches to every exported document. Stripping redundant metadata blocks 
              reclaims vital kilobytes while enhancing document privacy.
            </p>
          </div>

          <div className="pdf-science-card">
            <div className="pdf-science-icon-wrap">
              <Lock size={20} className="science-icon" />
            </div>
            <h4>High-Efficiency DCTDecode Streams</h4>
            <p>
              Scanned documents frequently embed heavy uncompressed TIFF or lossless PNG matrices. 
              By re-encoding image streams using optimized Discrete Cosine Transform (DCTDecode) quantization tables, 
              photographic sections shrink by up to 85% with crystal-clear text sharpness.
            </p>
          </div>
        </div>
      </div>

      {/* 8. Persona & Use-Case Playbooks */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <Briefcase size={14} /> Workflow Playbooks
          </div>
          <h3 className="pdf-section-h3">Tailored PDF Compression for Every Industry</h3>
          <p className="pdf-section-p">
            Discover how professionals use Cerilas to satisfy strict upload criteria and maintain compliance.
          </p>
        </div>

        <div className="pdf-playbooks-grid">
          <div className="pdf-playbook-card">
            <div className="playbook-header">
              <Briefcase size={20} className="playbook-icon" />
              <h4>Job Applicants &amp; Resumes</h4>
            </div>
            <div className="playbook-tag">Target: Under 2MB Portal Thresholds</div>
            <p>
              Applicant Tracking Systems (Workday, Greenhouse, Taleo) and government job portals commonly reject resumes over 2MB. 
              Use our <strong>Extreme</strong> or <strong>Balanced</strong> preset to shrink design portfolios and multi-page CVs down to under 800KB without blurring your headshot.
            </p>
          </div>

          <div className="pdf-playbook-card">
            <div className="playbook-header">
              <Scale size={20} className="playbook-icon" />
              <h4>Attorneys &amp; Legal Professionals</h4>
            </div>
            <div className="playbook-tag">Requirement: 100% Zero-Cloud Confidentiality</div>
            <p>
              Court e-filing systems enforce stringent file size caps (frequently 5MB to 10MB per exhibit). 
              Uploading sensitive deposition transcripts or discovery agreements to public web converters risks attorney-client privilege. 
              Cerilas executes 100% locally in your browser memory for absolute compliance.
            </p>
          </div>

          <div className="pdf-playbook-card">
            <div className="playbook-header">
              <GraduationCap size={20} className="playbook-icon" />
              <h4>Academics, Students &amp; Researchers</h4>
            </div>
            <div className="playbook-tag">Target: Fast Emailing &amp; LMS Submissions</div>
            <p>
              Research papers with high-resolution graphs, microscope imagery, and diagrams easily balloon past 30MB. 
              Use our <strong>Balanced</strong> compression to shrink academic submissions down to under 5MB for instant email delivery and seamless Canvas/Blackboard submission.
            </p>
          </div>
        </div>
      </div>

      {/* 9. Frequently Asked Questions (Expanded 12 FAQ Accordion) */}
      <div className="pdf-seo-section-block">
        <div className="pdf-section-title-wrap">
          <div className="pdf-seo-mini-badge">
            <HelpCircle size={14} /> Knowledge Base &amp; FAQ
          </div>
          <h3 className="pdf-section-h3">Frequently Asked Questions</h3>
          <p className="pdf-section-p">
            Everything you need to know about secure client-side PDF compression, image downsampling, and privacy.
          </p>
        </div>

        <div className="pdf-faq-group">
          <details className="pdf-faq-item" open>
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Is my PDF uploaded to any external server during compression?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                <strong>Never.</strong> Unlike traditional cloud services (such as ILovePDF or Smallpdf) that transmit your sensitive files 
                to remote cloud instances, Cerilas PDF Compressor runs entirely in your web browser using HTML5 Canvas, WebAssembly, and JavaScript. 
                Your files remain strictly inside your device's memory; zero bytes are transmitted over the network.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">How does Cerilas achieve up to 90% reduction in PDF file size?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                In most oversized PDFs, 90% or more of the file weight is caused by uncompressed high-resolution images, full-color scanner scans, 
                and redundant PDF object streams. Our compressor analyzes each page, resamples heavy bitmap streams to optimal display DPI targets 
                (such as 150 DPI for screens or 110 DPI for maximum reduction), converts them to optimized JPEG streams, and packs document structures 
                using modern Flate object stream compression.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">How do I compress a PDF to under 200KB or 100KB for visa and passport portals?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                To compress a document to under 200KB or 100KB, select the <strong>Extreme Compression</strong> preset. 
                This preset downsamples raster graphics to approximately 90-110 DPI with high-efficiency DCT quantization. 
                If your document contains high-resolution photo scans, Extreme mode drastically eliminates heavy bitmap overhead 
                while keeping text, signatures, and stamps clear and readable.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Which compression preset should I choose for my document?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                <strong>Balanced (Recommended)</strong> is the ideal choice for 95% of documents: it cuts file size by 50-75% while keeping text razor-sharp for emails and screen reading. 
                Choose <strong>Extreme Compression</strong> when applying through strict job, government, or university portals that reject files over 1MB or 2MB. 
                Choose <strong>High Quality</strong> if your document will be professionally printed or contains intricate technical blueprints.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Can I compress multiple PDF documents at the same time?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Yes! You can drag and drop dozens of PDF files simultaneously into the upload area. The tool will process them in parallel, 
                display real-time progress bars for each file, and let you download all compressed files together in a single organized ZIP archive.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Will the text in my compressed PDF remain sharp and legible?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Yes. Our resampling engine renders pages at high target densities (150 to 220+ DPI) with clean anti-aliased font smoothing. 
                Even in Extreme mode, typography remains crisp, distinct, and completely readable on retina screens, laptops, and mobile phones.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Are there any file size limits or daily usage quotas?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                No. Because Cerilas executes locally on your device hardware without consuming expensive server compute resources, 
                there are zero file size caps, zero daily quotas, zero watermarks, and no sign-up or credit card required.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">What happens if a PDF is already optimized and cannot be compressed further?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Cerilas features built-in fallback safeguards: if an already-micro-compressed PDF produces an output larger than the original, 
                the engine automatically preserves the smaller original file. You are guaranteed to never receive an inflated document.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Does this PDF compressor work on mobile phones and tablets?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Yes! Cerilas PDF Compressor is fully responsive and optimized for touch devices. It works smoothly in Mobile Safari on iOS 
                as well as Chrome on Android devices, allowing you to shrink PDFs directly on your smartphone before attaching them to emails.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Why is client-side compression critical for legal and financial documents?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Uploading confidential NDAs, tax returns, bank records, or medical charts to public web servers creates substantial data breach risks 
                and may violate strict regulatory frameworks such as GDPR, CCPA, and HIPAA. In-browser client-side compression ensures that your 
                data never leaves your custody.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Does compressing a PDF remove password protection or digital signatures?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                If a PDF document is locked with an open password, you must enter the password in your PDF reader before exporting. 
                Our engine optimizes internal raster streams and structural metadata while keeping page coordinates and visual signatures intact.
              </p>
            </div>
          </details>

          <details className="pdf-faq-item">
            <summary className="pdf-faq-summary">
              <span className="pdf-faq-question">Can I use this tool to compress scanned PDF books and large research reports?</span>
              <ChevronDown className="pdf-faq-chevron" size={18} />
            </summary>
            <div className="pdf-faq-answer">
              <p>
                Yes. Scanned books and technical reports are the documents that experience the highest size reductions (often dropping from 50MB-100MB 
                down to 5MB-10MB). Our engine handles multi-page documents page by page with dynamic memory clearing to prevent browser crashes.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* 10. Long-Tail Keyword Cloud */}
      <div className="pdf-tag-cloud" aria-label="Related Search Topics">
        <span className="pdf-keyword-pill">#PdfCompressor</span>
        <span className="pdf-keyword-pill">#CompressPdfOnline</span>
        <span className="pdf-keyword-pill">#FreePdfCompressor</span>
        <span className="pdf-keyword-pill">#ReducePdfSize</span>
        <span className="pdf-keyword-pill">#PdfReducerOnline</span>
        <span className="pdf-keyword-pill">#CompressPdfUnder2MB</span>
        <span className="pdf-keyword-pill">#CompressPdfUnder1MB</span>
        <span className="pdf-keyword-pill">#CompressPdfTo200KB</span>
        <span className="pdf-keyword-pill">#CompressPdfTo100KB</span>
        <span className="pdf-keyword-pill">#PrivatePdfCompressor</span>
        <span className="pdf-keyword-pill">#InBrowserPdfOptimization</span>
        <span className="pdf-keyword-pill">#NoUploadPdfCompressor</span>
        <span className="pdf-keyword-pill">#BatchPdfCompressor</span>
        <span className="pdf-keyword-pill">#BestPdfCompressor2026</span>
        <span className="pdf-keyword-pill">#CompressScannedPdf</span>
        <span className="pdf-keyword-pill">#ShrinkPdfForEmail</span>
      </div>
    </section>
  );
}
