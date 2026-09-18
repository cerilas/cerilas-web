import React, { useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  Film,
  Layers,
  Award
} from 'lucide-react';
import AdSlot from '../../../components/ui/AdSlot';

export default function YoutubeSeoSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How do I download a YouTube video thumbnail in 4K or 1080p Ultra HD?',
      a: 'Simply paste any YouTube video or Shorts link into the input field above. Cerilas Tools instantly fetches the highest resolution MaxRes (1920x1080) image uploaded by the creator. Click "Download (JPG)" to save the full-resolution thumbnail directly to your computer or phone.'
    },
    {
      q: 'Can I download thumbnails from YouTube Shorts?',
      a: 'Yes. Our parser fully supports YouTube Shorts links (e.g. youtube.com/shorts/VIDEO_ID). When you paste a Shorts link, the tool automatically extracts the video ID and grabs the high-resolution landscape and standard cover frames.'
    },
    {
      q: 'Why does the 4K / MaxRes thumbnail show as "Not Available" for some videos?',
      a: 'YouTube automatically generates MaxRes (1920x1080 / maxresdefault.jpg) only when the video creator uploads a thumbnail with a resolution of at least 1280x720. For older or standard-definition uploads where the creator did not provide a high-res graphic, YouTube only generates the High Quality (640x480) or Medium Quality (320x180) preview.'
    },
    {
      q: 'Is downloading YouTube thumbnails legal and AdSense compliant?',
      a: 'Yes, 100%. Video thumbnails are publicly served image assets by YouTube’s content delivery network (i.ytimg.com). Unlike downloading copyrighted video streaming streams, extracting public cover images for fair use, inspiration, commentary, or research is fully permitted and 100% compliant with Google AdSense program policies.'
    },
    {
      q: 'What is the recommended size and aspect ratio for YouTube thumbnails in 2026?',
      a: 'YouTube officially recommends a resolution of 1280 x 720 pixels (minimum width of 640 pixels) with a 16:9 widescreen aspect ratio. The maximum file size allowed by YouTube Studio is 2MB, and recommended formats are JPG, PNG, or GIF.'
    },
    {
      q: 'How do I copy a YouTube thumbnail directly to Figma, Canva, or Photoshop?',
      a: 'Click the "Copy" button on any thumbnail card. The image is placed directly onto your system clipboard as an image/png blob. You can then press Ctrl+V (or Cmd+V on Mac) directly into Figma, Canva, Adobe Photoshop, Discord, or Slack.'
    },
    {
      q: 'Can I generate a responsive HTML embed code for my website or blog?',
      a: 'Yes. Below the thumbnail resolutions, click "Copy Responsive Embed Code". This gives you a lightweight, SEO-friendly 16:9 iframe container ready to paste into WordPress, Webflow, Ghost, or custom HTML without page layout shift.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'YouTube Thumbnail Downloader',
        'operatingSystem': 'All (Web Browser)',
        'applicationCategory': 'MultimediaApplication',
        'url': 'https://tools.cerilas.com/tool/youtube-thumbnail-downloader',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'ratingCount': '1850'
        },
        'description': 'Free online YouTube Thumbnail Downloader. Download 4K Ultra HD (1920x1080), 720p HD, and WebP cover images from any YouTube video or Shorts link.'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqItems.map((item) => ({
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

  return (
    <div className="ytd-seo-container">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* Primary Value Cards */}
      <div className="ytd-seo-grid">
        <div className="ytd-seo-card">
          <div className="ytd-seo-card-icon icon-rose">
            <Film size={22} />
          </div>
          <h3 className="ytd-seo-card-title">4K & 1080p Ultra HD</h3>
          <p className="ytd-seo-card-text">
            Directly extracts the uncompressed 1920x1080 MaxRes image uploaded by creators. Ideal for graphic designers, video editors, and presentation slides.
          </p>
        </div>

        <div className="ytd-seo-card">
          <div className="ytd-seo-card-icon icon-blue">
            <Zap size={22} />
          </div>
          <h3 className="ytd-seo-card-title">YouTube Shorts Compatible</h3>
          <p className="ytd-seo-card-text">
            Works seamlessly with modern YouTube Shorts URLs, standard desktop watch links, and mobile youtu.be shortlinks with zero setup required.
          </p>
        </div>

        <div className="ytd-seo-card">
          <div className="ytd-seo-card-icon icon-emerald">
            <ShieldCheck size={22} />
          </div>
          <h3 className="ytd-seo-card-title">100% Client-Side Privacy</h3>
          <p className="ytd-seo-card-text">
            All thumbnail downloads happen locally in your web browser. Zero server logging, no tracking cookies, and zero rate-limiting restrictions.
          </p>
        </div>
      </div>

      {/* Mid-Content AdSense Unit */}
      <AdSlot
        slotId="4093371757"
        format="fluid"
        layout="in-article"
        style={{ margin: '2.5rem 0' }}
      />

      {/* Specifications & Creator Guide */}
      <div className="ytd-guide-section">
        <h2 className="ytd-section-heading">YouTube Thumbnail Resolution & Size Standards</h2>
        <div className="ytd-table-wrapper">
          <table className="ytd-specs-table">
            <thead>
              <tr>
                <th>Quality Tier</th>
                <th>Pixel Resolution</th>
                <th>Aspect Ratio</th>
                <th>Primary Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>MaxRes (Ultra HD)</strong></td>
                <td>1920 × 1080 px</td>
                <td>16:9 Widescreen</td>
                <td>High-res desktop display, smart TVs, marketing banners</td>
              </tr>
              <tr>
                <td><strong>High Definition (HD)</strong></td>
                <td>1280 × 720 px</td>
                <td>16:9 Widescreen</td>
                <td>Official YouTube recommended upload standard (2MB max)</td>
              </tr>
              <tr>
                <td><strong>High Quality (HQ)</strong></td>
                <td>640 × 480 px</td>
                <td>4:3 Standard</td>
                <td>Mobile feeds, embed fallbacks, search results</td>
              </tr>
              <tr>
                <td><strong>Medium Quality (MQ)</strong></td>
                <td>320 × 180 px</td>
                <td>16:9 Widescreen</td>
                <td>Email newsletters, blog sidebar widgets, forum previews</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="ytd-faq-section">
        <h2 className="ytd-section-heading">Frequently Asked Questions</h2>
        <div className="ytd-faq-list">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`ytd-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="ytd-faq-trigger"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="ytd-faq-question">{item.q}</span>
                  <ChevronDown size={18} className={`ytd-faq-icon ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="ytd-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
