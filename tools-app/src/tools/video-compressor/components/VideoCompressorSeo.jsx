import React, { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
  HardDrive,
  Check,
  X,
  Sparkles,
  Sliders,
  Film
} from 'lucide-react';

export default function VideoCompressorSeo() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How do I compress an MP4 video to under 25MB for Discord or 16MB for WhatsApp?',
      a: 'Select the "Chat & Email (< 25MB)" preset, which scales your MP4 resolution to 480p and adjusts the bitrate to 1.2 Mbps. To save even more megabytes, toggle "Mute Audio" to strip audio tracks (saving an additional 15%–20%) or use the interactive trim slider to cut unnecessary intro and outro seconds.'
    },
    {
      q: 'How do I compress iPhone .MOV videos to make them smaller for email?',
      a: 'Apple devices record video in Apple QuickTime (.MOV) format with high uncompressed bitrates. Drag your .MOV file into Cerilas Video Compressor, select the "Balanced (720p HD)" preset, and click "Compress Video". The engine transcodes the heavy MOV footage into an efficient, web-standard compressed MP4 file, typically shrinking file size by 70% to 85%.'
    },
    {
      q: 'Is my video uploaded to any cloud server during MP4 or MOV compression?',
      a: 'No. Unlike traditional cloud converters (like FreeConvert, CloudConvert, or Clideo) that require uploading private video files to remote cloud servers, Cerilas Video Compressor processes 100% locally inside your browser sandbox using HTML5 Video, Canvas, and MediaRecorder APIs. Your personal clips, confidential screen recordings, and client work never leave your device RAM.'
    },
    {
      q: 'Will compressing an MP4 or WebM video reduce visual quality noticeably?',
      a: 'Modern video codecs (H.264 / VP9) utilize psycho-visual algorithms that eliminate redundant high-frequency data invisible to the human eye. With our "Balanced (720p HD)" preset, files are typically reduced in size by 60% to 75% while maintaining crisp, high-definition visual clarity on desktop monitors, laptops, and smartphone screens.'
    },
    {
      q: 'What video formats are supported for compression?',
      a: 'You can compress MP4, MOV (QuickTime), WebM, and MKV files. The output format defaults to MP4 (AVC1/H.264) where supported by your browser hardware, or high-efficiency WebM (VP9/VP8) on supported Chromium and Firefox environments.'
    },
    {
      q: 'Are there file size limits or watermarks on exported videos?',
      a: 'No. There are zero watermarks, zero brand overlays, and zero artificial file size limits. You do not need to register, create an account, or enter credit card information.'
    },
    {
      q: 'What is the difference between bitrate and resolution in video compression?',
      a: 'Resolution refers to the dimensions of the video (e.g. 1920x1080 for 1080p, 1280x720 for 720p). Bitrate is the amount of digital data processed per second (e.g. 2.5 Mbps vs 10 Mbps). Reducing bitrate shrinks file size in MB dramatically without altering canvas dimensions, while scaling resolution down reduces total pixel count by more than 50%.'
    },
    {
      q: 'Does video compression work offline without an active internet connection?',
      a: 'Yes. Once the web application is loaded in your browser, the compression engine relies entirely on your local CPU and GPU. You can disconnect your Wi-Fi or go into airplane mode and the tool will continue to compress MP4, MOV, and WebM videos locally.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://tools.cerilas.com/#/tool/video-compressor',
        name: 'Cerilas Free Online Video Compressor – Compress MP4, MOV & WebM',
        alternateName: [
          'Compress MP4 Online',
          'Reduce MP4 Size in MB',
          'Compress MOV Video',
          'Compress Video for Discord 25MB',
          'Make Video Smaller Free',
          'Private In-Browser Video Reducer'
        ],
        url: 'https://tools.cerilas.com/#/tool/video-compressor',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Compress MP4 video files with zero quality loss and no watermark',
          'Compress iPhone MOV and QuickTime clips locally in your browser',
          '100% In-Browser Video Compression with zero server storage',
          'Preset profiles to compress video to under 25MB for Discord and 16MB for WhatsApp',
          'Side-by-side original vs compressed video comparison preview',
          'Interactive video trimming to cut intro and outro sections',
          'Audio mute toggle for maximum byte reduction'
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.96',
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
            name: 'Media & Video Tools',
            item: 'https://tools.cerilas.com/#/category/Optimizer'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Compress MP4 & Video',
            item: 'https://tools.cerilas.com/#/tool/video-compressor'
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: 'How to Compress MP4 and MOV Video Files Online for Free with Total Privacy',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Select MP4, MOV, or WebM Video',
            text: 'Drag and drop your MP4, MOV, or WebM video file into the browser workspace, or click Browse to choose from your device.'
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Choose Target Preset or Platform Limit',
            text: 'Select your preferred profile: Balanced (720p HD), Chat/Email (<25MB for Discord), or High Quality (1080p). Adjust trim sliders or mute audio if needed.'
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Compress MP4 Locally in Browser',
            text: 'Click "Compress Video". The browser hardware engine processes your file frame-by-frame with zero server uploads.'
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Inspect & Download Compressed Video',
            text: 'Preview the compressed result in the side-by-side player, inspect the megabytes saved, and download your optimized video.'
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
    <article className="vc-seo-wrapper" aria-label="Cerilas Video Compressor – Compress MP4, MOV & WebM Detailed Guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* SEO Header */}
      <div className="vc-seo-header">
        <span className="vc-seo-badge">
          <Sparkles size={14} /> 100% In-Browser Compression: MP4, MOV, WebM, MKV
        </span>
        <h2>Compress MP4, MOV &amp; WebM Videos Online Without Losing Quality</h2>
        <p className="vc-seo-subhead">
          Reduce MP4 file size in MB, compress Apple MOV recordings for email, and transcode WebM clips 100% locally. Meet strict 25MB Discord and 16MB WhatsApp limits with zero cloud uploads, zero wait queues, and zero watermarks.
        </p>
      </div>

      {/* Supported Video Formats Grid */}
      <div className="vc-seo-grid">
        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-blue">
            <Film size={22} />
          </div>
          <h3>Compress MP4 (H.264 / AVC)</h3>
          <p>
            The global standard for video sharing. Reduce MP4 file size in MB by up to 85% for web streaming, YouTube uploads, Slack, and email attachments while preserving sharp 1080p or 720p definition.
          </p>
        </div>

        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-rose">
            <Film size={22} />
          </div>
          <h3>Compress MOV (Apple QuickTime)</h3>
          <p>
            iPhone and Mac cameras record in high-bitrate .MOV format. Transcode and compress heavy QuickTime files into compact, web-compatible MP4s to send via Gmail, Outlook, or AirDrop instantly.
          </p>
        </div>

        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-emerald">
            <HardDrive size={22} />
          </div>
          <h3>Compress WebM &amp; MKV</h3>
          <p>
            High-efficiency VP8 and VP9 video transcoding. Shrink HTML5 background animations, web screencasts, and open-source MKV files for ultra-fast website loading speeds.
          </p>
        </div>

        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-indigo">
            <Lock size={22} />
          </div>
          <h3>100% In-Browser Privacy</h3>
          <p>
            Zero video bytes ever leave your device memory. Perfect for confidential client footage, NDA product demos, legal depositions, and private family memories.
          </p>
        </div>

        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-amber">
            <Zap size={22} />
          </div>
          <h3>Zero Upload Lag &amp; Instant Start</h3>
          <p>
            Skip the 10-minute wait uploading heavy 200MB+ files over sluggish home connections. Hardware-accelerated encoding starts the instant you click Compress.
          </p>
        </div>

        <div className="vc-seo-card">
          <div className="vc-seo-card-icon icon-violet">
            <Sliders size={22} />
          </div>
          <h3>Discord &amp; WhatsApp Presets</h3>
          <p>
            Target strict platform caps with 1-click: compress videos to under 25MB for Discord Nitro-free accounts, under 16MB for WhatsApp chat, or under 20MB for email attachments.
          </p>
        </div>
      </div>

      {/* Technical Comparison Table */}
      <div className="vc-seo-table-wrap">
        <h3>Cerilas In-Browser Video Compressor vs. Industry Alternatives</h3>
        <p className="table-subhead">
          See why privacy-conscious professionals, creators, and teams prefer client-side media compression.
        </p>
        <div className="table-overflow">
          <table className="vc-comparison-table">
            <thead>
              <tr>
                <th>Capability / Feature</th>
                <th className="highlight-col">Cerilas Video Compressor</th>
                <th>CloudConvert / FreeConvert</th>
                <th>Clideo / Kapwing</th>
                <th>Desktop HandBrake</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Server Upload Requirement</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> Zero (100% Local)</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Required (Cloud Storage)</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Required (Cloud Storage)</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> Local Machine</span></td>
              </tr>
              <tr>
                <td><strong>Bandwidth & Data Usage</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> 0 MB Network Data</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> 2x File Size (Up + Down)</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> 2x File Size (Up + Down)</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> 0 MB Network Data</span></td>
              </tr>
              <tr>
                <td><strong>Watermarks & Branding</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> None (100% Clean)</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> None (Limited daily)</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Forced Promotional Watermark</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> None</span></td>
              </tr>
              <tr>
                <td><strong>Discord & WhatsApp Presets</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> 1-Click 25MB / 16MB</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Manual Bitrate Math</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Paid Tier Only</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Complex Encoding Menus</span></td>
              </tr>
              <tr>
                <td><strong>Interactive Video Trimmer</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> Built-in Start/End Slider</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Separate Tool</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> Built-in</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> Built-in</span></td>
              </tr>
              <tr>
                <td><strong>Installation & Setup</strong></td>
                <td className="highlight-col"><span className="vc-badge-pos"><Check size={14} /> Instant in Any Browser</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> Instant in Browser</span></td>
                <td><span className="vc-badge-pos"><Check size={14} /> Instant in Browser</span></td>
                <td><span className="vc-badge-neg"><X size={14} /> Mandatory App Install (GBs)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Educational Workflow */}
      <div className="vc-seo-workflow">
        <h3>How to Compress Videos in 4 Simple Steps</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">1</span>
            <h4>Select Video</h4>
            <p>Drag and drop your MP4, MOV, or WebM file into the browser workspace, or click to choose from your device.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <h4>Choose Preset</h4>
            <p>Select your target profile: Balanced (720p HD), Chat/Email (&lt; 25MB), or High Quality (1080p).</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <h4>Trim & Adjust</h4>
            <p>Optionally trim unwanted intro/outro seconds or toggle audio muting for maximum file size reduction.</p>
          </div>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <h4>Inspect & Save</h4>
            <p>Compare original vs compressed side-by-side, check the bytes saved, and download your optimized video.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="vc-seo-faq-section">
        <div className="faq-header">
          <h3>Frequently Asked Questions</h3>
          <p>Everything you need to know about bitrate, resolution, privacy, and sharing limits.</p>
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
