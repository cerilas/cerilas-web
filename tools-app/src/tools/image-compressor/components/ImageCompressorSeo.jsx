import React, { useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  ChevronDown, 
  ArrowUpRight, 
  HelpCircle, 
  Sparkles, 
  Gauge, 
  Lock, 
  Layers
} from 'lucide-react';
import './ImageCompressorSeo.css';

export default function ImageCompressorSeo({ onApplyPreset }) {
  // Inject comprehensive Schema.org JSON-LD structured data into document head

  // Quick preset trigger helper
  const handlePresetClick = (preset) => {
    if (typeof onApplyPreset === 'function') {
      onApplyPreset(preset);
    }
  };

  return (
    <section className="img-seo-root" aria-label="Image Compression Technical Guide & FAQ">
      {/* 1. HERO VALUE PROPOSITION */}
      <div className="img-seo-header">
        <div className="img-seo-badge">
          <Lock size={14} />
          <span>100% Client-Side Privacy • Zero Server Uploads • Infinite Speed</span>
        </div>
        <h2 className="img-seo-main-title">
          Compress JPEG, Make PNG Smaller in KB, and Convert to WebP Online
        </h2>
        <p className="img-seo-main-desc">
          High-performance in-browser image optimization. Reduce JPG file size in KB, make transparent PNGs smaller without pixelation or losing alpha channels, and convert photos to next-gen WebP to maximize Google Core Web Vitals (LCP) with zero server uploads and zero file limits.
        </p>
      </div>

      {/* 2. POPULAR 1-CLICK COMPRESSION PRESETS (INTENT-MATCHED) */}
      <div className="img-seo-section-block">
        <div className="img-section-title-wrap">
          <div className="img-seo-mini-badge">
            <Zap size={14} /> 1-Click Search Presets
          </div>
          <h3 className="img-section-h3">Popular Compression Presets for Instant Results</h3>
          <p className="img-section-p">
            Click any use case below to automatically configure the optimal format, quality, and resolution settings.
          </p>
        </div>

        <div className="img-presets-grid">
          {/* Preset 1: Web Performance */}
          <div className="img-preset-card">
            <div className="img-preset-top">
              <div className="img-preset-icon-box">
                <Gauge size={20} />
              </div>
              <span className="img-preset-tag tag-green">Core Web Vitals</span>
            </div>
            <h4 className="img-preset-title">Web Performance (WebP)</h4>
            <p className="img-preset-desc">
              Convert to next-gen WebP at 80% quality and 1920px max dimension. Cuts payload by up to 88% for sub-second Google LCP scores.
            </p>
            <div className="img-preset-meta">
              <span>Format: <strong>WebP</strong></span>
              <span>Quality: <strong>80%</strong></span>
              <span>Scale: <strong>Max 1920px</strong></span>
            </div>
            <button 
              className="img-preset-btn"
              onClick={() => handlePresetClick({
                format: 'image/webp',
                quality: 80,
                resizeScale: 'max-1920',
                name: 'Web Performance (WebP 80%)'
              })}
            >
              <span>Apply Preset</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Preset 2: Passport & Visa */}
          <div className="img-preset-card">
            <div className="img-preset-top">
              <div className="img-preset-icon-box">
                <ShieldCheck size={20} />
              </div>
              <span className="img-preset-tag tag-amber">&lt;100KB / &lt;50KB Forms</span>
            </div>
            <h4 className="img-preset-title">Visa &amp; Government Portals</h4>
            <p className="img-preset-desc">
              Downscales to standard 1080px resolution and 65% JPEG quality to strictly comply with passport, visa, and university portal limits.
            </p>
            <div className="img-preset-meta">
              <span>Format: <strong>JPEG</strong></span>
              <span>Quality: <strong>65%</strong></span>
              <span>Scale: <strong>Max 1080px</strong></span>
            </div>
            <button 
              className="img-preset-btn"
              onClick={() => handlePresetClick({
                format: 'image/jpeg',
                quality: 65,
                resizeScale: 'max-1080',
                name: 'Official Portal (<100KB)'
              })}
            >
              <span>Apply Preset</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Preset 3: Transparent PNG */}
          <div className="img-preset-card">
            <div className="img-preset-top">
              <div className="img-preset-icon-box">
                <Layers size={20} />
              </div>
              <span className="img-preset-tag tag-blue">Logos &amp; Graphics</span>
            </div>
            <h4 className="img-preset-title">Lossless Transparent PNG</h4>
            <p className="img-preset-desc">
              Retains 100% crystal-clear alpha transparency and pixel geometry at native resolution without blurring sharp text or logo borders.
            </p>
            <div className="img-preset-meta">
              <span>Format: <strong>PNG</strong></span>
              <span>Quality: <strong>85%</strong></span>
              <span>Scale: <strong>Original (100%)</strong></span>
            </div>
            <button 
              className="img-preset-btn"
              onClick={() => handlePresetClick({
                format: 'image/png',
                quality: 85,
                resizeScale: '100',
                name: 'Transparent PNG'
              })}
            >
              <span>Apply Preset</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Preset 4: Social Media & Messaging */}
          <div className="img-preset-card">
            <div className="img-preset-top">
              <div className="img-preset-icon-box">
                <Sparkles size={20} />
              </div>
              <span className="img-preset-tag tag-purple">Social &amp; Chat</span>
            </div>
            <h4 className="img-preset-title">Social &amp; Mobile Sharing</h4>
            <p className="img-preset-desc">
              Optimized for WhatsApp, Instagram, and email attachments. Shrinks heavy DSLR camera photos to lightweight, instant-loading files.
            </p>
            <div className="img-preset-meta">
              <span>Format: <strong>JPEG</strong></span>
              <span>Quality: <strong>75%</strong></span>
              <span>Scale: <strong>Max 1920px</strong></span>
            </div>
            <button 
              className="img-preset-btn"
              onClick={() => handlePresetClick({
                format: 'image/jpeg',
                quality: 75,
                resizeScale: 'max-1920',
                name: 'Social Sharing (JPEG 75%)'
              })}
            >
              <span>Apply Preset</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRIVACY & ARCHITECTURE COMPARISON */}
      <div className="img-comparison-card">
        <div className="img-comparison-col cerilas-col">
          <div className="img-col-header">
            <div className="img-col-tag">Cerilas Image Compressor</div>
            <h3>100% In-Browser Privacy</h3>
            <p>Zero cloud uploads. All bytes stay in your local browser RAM.</p>
          </div>
          <ul className="img-comparison-list">
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Zero Server Storage:</strong> Your photos never touch external servers or cloud buckets.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>No Upload Caps:</strong> Compress 50MB+ RAW/4K photos without arbitrary limits.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Instant Zero-Latency:</strong> No uploading or downloading over slow internet.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>Bulk ZIP Export:</strong> Package dozens of compressed images into a ZIP in 1 click.</span>
            </li>
            <li>
              <CheckCircle2 size={17} className="check-icon" />
              <span><strong>100% Free Forever:</strong> No accounts, no subscriptions, and no watermarks.</span>
            </li>
          </ul>
        </div>

        <div className="img-comparison-col competitor-col">
          <div className="img-col-header">
            <div className="img-col-tag competitor-tag">Traditional Online Compressors</div>
            <h3>The Cloud Server Risk</h3>
            <p>Uploads your private images to third-party data centers.</p>
          </div>
          <ul className="img-comparison-list">
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Server Uploads:</strong> Private personal photos or corporate designs stored in cloud queues.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Strict File Limits:</strong> 5MB file cap and max 20 images per session.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Slow Upload Speeds:</strong> Must wait minutes for large files to upload and re-download.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Aggressive Paywalls:</strong> Demands $12–$29/month for batch downloads and high resolution.</span>
            </li>
            <li>
              <XCircle size={17} className="x-icon" />
              <span><strong>Ad Clutter:</strong> Overwhelmed by flashing ads and tracking cookies.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. STEP-BY-STEP WORKFLOW (HOWTO) */}
      <div className="img-seo-section-block">
        <div className="img-section-title-wrap">
          <div className="img-seo-mini-badge">
            <Sliders size={14} /> Frictionless Workflow
          </div>
          <h3 className="img-section-h3">How to Compress Images in 3 Seconds Flat</h3>
          <p className="img-section-p">
            Follow this simple three-step process to optimize single images or bulk photo directories.
          </p>
        </div>

        <div className="img-steps-grid">
          <div className="img-step-card">
            <div className="img-step-badge">Step 1</div>
            <h4>Drag &amp; Drop Your Files</h4>
            <p>
              Select or drop any image format: JPG, PNG, WebP, AVIF, SVG, or GIF. 
              Files are queued instantly without uploading to any remote server.
            </p>
          </div>
          <div className="img-step-card">
            <div className="img-step-badge">Step 2</div>
            <h4>Tune Quality &amp; Dimensions</h4>
            <p>
              Use the intuitive quality slider (default 80% sweet spot) or choose a target 
              resolution (4K, 1080p, 1200px) to hit your exact file size goal.
            </p>
          </div>
          <div className="img-step-card">
            <div className="img-step-badge">Step 3</div>
            <h4>Compare &amp; Instant Download</h4>
            <p>
              Inspect pixel sharpness with the interactive Before/After split slider, 
              then download individual files or export everything in a clean ZIP bundle.
            </p>
          </div>
        </div>
      </div>

      {/* 5. FORMAT BENCHMARKS & CORE WEB VITALS (LCP) */}
      <div className="img-seo-section-block">
        <div className="img-section-title-wrap">
          <div className="img-seo-mini-badge">
            <Gauge size={14} /> Core Web Vitals
          </div>
          <h3 className="img-section-h3">Format Benchmark &amp; Google PageSpeed Optimization</h3>
          <p className="img-section-p">
            Learn how next-generation formats (WebP &amp; AVIF) cut bandwidth and catapult Google LCP scores into the green zone (90+).
          </p>
        </div>

        <div className="img-format-matrix-card">
          <div className="img-table-wrap">
            <table className="img-format-table">
              <thead>
                <tr>
                  <th>Image Format</th>
                  <th>Compression Type</th>
                  <th>Avg. Size Savings</th>
                  <th>Alpha Transparency</th>
                  <th>Best Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>WebP (Recommended)</strong></td>
                  <td>Predictive Intra-frame</td>
                  <td><span className="img-table-badge green">75% – 90%</span></td>
                  <td>Yes (Lossy &amp; Lossless)</td>
                  <td>General web, e-commerce, and hero banners</td>
                </tr>
                <tr>
                  <td><strong>AVIF (Next-Gen)</strong></td>
                  <td>AV1 Video Keyframe</td>
                  <td><span className="img-table-badge green">80% – 92%</span></td>
                  <td>Yes (High Bit-Depth)</td>
                  <td>High-end photography and HDR displays</td>
                </tr>
                <tr>
                  <td><strong>JPEG / JPG</strong></td>
                  <td>Discrete Cosine (DCT)</td>
                  <td><span className="img-table-badge blue">50% – 75%</span></td>
                  <td>No (Opaque only)</td>
                  <td>Legacy email templates and older browsers</td>
                </tr>
                <tr>
                  <td><strong>PNG</strong></td>
                  <td>Deflate / LZ77</td>
                  <td><span className="img-table-badge blue">40% – 65%</span></td>
                  <td>Yes (Full 8-bit Alpha)</td>
                  <td>Logos, UI icons, screenshots, and text overlays</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="img-formula-box">
            <strong>Why Google Loves WebP for LCP (Largest Contentful Paint):</strong> In Google's ranking algorithm, pages with an LCP under 2.5 seconds receive preferential search ranking. Uncompressed 3MB hero images frequently blow past this threshold, causing bounce rates to spike. Converting JPEG/PNG images to modern WebP shrinks payload sizes by an average of 78% without perceptible loss in visual quality.
          </div>
        </div>
      </div>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION - 100% ENGLISH) */}
      <div className="img-seo-section-block img-faq-section">
        <div className="img-section-title-wrap">
          <div className="img-seo-mini-badge">
            <HelpCircle size={14} /> Frequently Asked Questions
          </div>
          <h3 className="img-section-h3">Everything You Need to Know About In-Browser Image Compression</h3>
          <p className="img-section-p">
            Clear, authoritative answers to the most common search questions asked by developers, marketers, and photographers.
          </p>
        </div>

        <div className="img-faq-accordion-group">
          {/* FAQ 1 */}
          <details className="img-faq-item" name="img-faq" open>
            <summary className="img-faq-summary">
              <span className="img-faq-question">How can I compress images without losing quality for free?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                Cerilas uses client-side bicubic pixel interpolation and perceptual quantization algorithms to remove invisible high-frequency color variations that the human eye cannot perceive. 
              </p>
              <p>
                By preserving structural edges and contrast gradients while trimming redundant chroma metadata, you can achieve 70% to 90% reductions in file size with virtually zero perceptible loss in visual sharpness.
              </p>
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">Are my photos uploaded or stored on your servers?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                <strong>Never.</strong> This is the core architectural promise of Cerilas Tools. 
                All image decoding, color quantization, resizing, and encoding are performed entirely inside your device’s browser memory using HTML5 Canvas and WebAssembly APIs. 
              </p>
              <p>
                No image data is ever transmitted across the internet or stored on any cloud server, making Cerilas 100% compliant with strict enterprise confidentiality, HIPAA, and GDPR regulations.
              </p>
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">What is the difference between lossy and lossless image compression?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                <strong>Lossless Compression:</strong> Removes redundant technical metadata (EXIF camera data, color profiles, color index maps) without altering a single visual pixel. This is best for UI icons, vector illustrations, and medical diagrams.
              </p>
              <p>
                <strong>Lossy Compression:</strong> Intelligently approximates imperceptible color transitions to achieve 75%–90% size reductions. This is the global standard for web photography, blog headers, and social media imagery.
              </p>
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">Why is WebP better than PNG and JPEG for website performance?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                Developed by Google, WebP utilizes predictive block coding (predicting pixel values based on surrounding blocks). As a result, lossy WebP files are on average 25% to 34% smaller than equivalent JPEGs, and lossless WebP files are 26% smaller than PNGs. WebP also supports both full 8-bit alpha transparency and animation.
              </p>
            </div>
          </details>

          {/* FAQ 4.5: PNG in KB */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">How do I make a PNG smaller in KB without losing transparency?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                To make a PNG smaller in KB, select the <strong>Transparent PNG</strong> preset or adjust the quality slider to 80%–85%. The compressor strips redundant color chunks, uncompressed metadata, and EXIF headers while preserving 100% crystal-clear alpha transparency. For even greater reductions (up to 75% smaller in KB), you can convert the transparent PNG to WebP, which preserves transparent backgrounds at a fraction of the byte size.
              </p>
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">Can I compress images in bulk and download as a ZIP file?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                Yes! You can drag and drop dozens of photos at once. Cerilas will process each image sequentially in memory to prevent browser lag, and provide a single <strong>Download All (ZIP)</strong> button that bundles your optimized files into an instant `.zip` archive on your computer.
              </p>
            </div>
          </details>

          {/* FAQ 6 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">How to compress an image to under 100KB or 50KB for online forms?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                Many government portals, visa applications, and corporate job boards mandate file sizes under 100KB or 50KB. To achieve this:
              </p>
              <ul>
                <li>Set the <strong>Quality</strong> slider to approximately 60% – 65%.</li>
                <li>Set the <strong>Resize Scale</strong> preset to Max 1080px.</li>
                <li>Verify the output size counter on your card in real time, then download.</li>
              </ul>
            </div>
          </details>

          {/* FAQ 7 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">How do I compress images for email attachments without pixelation?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                Major email providers such as Gmail, Outlook, and Apple Mail cap single attachment payloads at 20MB to 25MB. 
                Using Cerilas, you can compress heavy camera photos down to under 500KB by choosing 75% JPEG or modern WebP. 
                Your recipients can view crisp, full-screen images without cluttering their inbox or getting blocked by spam gateways.
              </p>
            </div>
          </details>

          {/* FAQ 8 */}
          <details className="img-faq-item" name="img-faq">
            <summary className="img-faq-summary">
              <span className="img-faq-question">Can I compress images on mobile devices (iPhone, iPad, Android)?</span>
              <ChevronDown className="img-faq-chevron" size={18} />
            </summary>
            <div className="img-faq-answer">
              <p>
                <strong>Yes, absolutely.</strong> Cerilas is fully responsive and leverages hardware-accelerated Canvas APIs built directly into iOS Safari and Android Chrome. 
                You don't need to install third-party apps from the App Store or Google Play Store. Simply open the website on your phone, pick photos from your photo library or camera roll, and download the compressed files instantly.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* 7. LONG-TAIL KEYWORD CLOUD PILLS (100% ENGLISH) */}
      <div className="img-tag-cloud" aria-label="Related Topics and Features">
        <span className="img-keyword-pill">#FreeImageCompressor</span>
        <span className="img-keyword-pill">#ReduceImageSize</span>
        <span className="img-keyword-pill">#WebPConverter</span>
        <span className="img-keyword-pill">#NoServerUploads</span>
        <span className="img-keyword-pill">#ZeroCloudStorage</span>
        <span className="img-keyword-pill">#ClientSidePrivacy</span>
        <span className="img-keyword-pill">#CompressJPGPNG</span>
        <span className="img-keyword-pill">#BulkImageCompressor</span>
        <span className="img-keyword-pill">#ZipDownload</span>
        <span className="img-keyword-pill">#CoreWebVitalsLCP</span>
        <span className="img-keyword-pill">#CompressTo100KB</span>
        <span className="img-keyword-pill">#LosslessOptimization</span>
        <span className="img-keyword-pill">#PhotoCompressor</span>
        <span className="img-keyword-pill">#FastCompression</span>
      </div>
    </section>
  );
}
