import SearchableHidden, { useSupportsUntilFound } from '../../../components/ui/SearchableHidden';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Scissors, 
  Layers, 
  Lock, 
  Check, 
  X, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  Zap,
  EyeOff
} from 'lucide-react';
import './PdfSplitterSeo.css';

export default function PdfSplitterSeo() {
  const supportsUntilFound = useSupportsUntilFound();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does client-side PDF splitting protect my privacy?',
      a: 'Traditional PDF splitting sites require you to upload your files to their cloud servers, where they may be stored or analyzed. Cerilas PDF Splitter runs directly on your computer or phone using JavaScript and WebAssembly (pdf-lib and pdf.js). Your documents never leave your device.'
    },
    {
      q: 'How do I specify custom page ranges (e.g., chapters or sections)?',
      a: 'In the "Custom Ranges" tab, click "+ Add Part" to add as many sections as you want. Enter standard range syntax such as "1-5", "6, 8, 10-12", or "7-end". Each part can be given a custom file name before downloading.'
    },
    {
      q: 'Can I visually preview pages before choosing which ones to extract?',
      a: 'Yes! Click on the "Visual Page Grid" tab. You will see high-resolution rendered thumbnails of every page in your PDF. Simply click on the pages you want to extract and hit split.'
    },
    {
      q: 'How do I download multiple extracted parts at once?',
      a: 'When you split a document into multiple parts, our system creates individual download buttons for each part as well as a prominent "Download All as ZIP" button that packages all split PDFs into a single compressed file.'
    },
    {
      q: 'Does splitting affect the original formatting, fonts, or resolution?',
      a: 'Not at all. The underlying PDF vector objects, embedded fonts, high-resolution graphics, and text layers are preserved identically without any compression loss.'
    }
  ];

  return (
    <div className="pdfs-seo-container">
      {/* 3-Step Guide */}
      <section className="pdfs-seo-section">
        <h2 className="pdfs-seo-section-title">How to Split PDF Files in 3 Simple Steps</h2>
        <p className="pdfs-seo-desc">
          Easily divide a PDF into specific chapters, extract individual pages, or break down large files without installing desktop software.
        </p>

        <div className="pdfs-steps-grid">
          <div className="pdfs-step-card">
            <div className="pdfs-step-num">1</div>
            <h3 className="pdfs-step-title">Upload Your PDF</h3>
            <p className="pdfs-step-text">
              Drop your PDF file into the upload zone. The tool will instantly parse total pages and render high-resolution thumbnails for every page.
            </p>
          </div>

          <div className="pdfs-step-card">
            <div className="pdfs-step-num">2</div>
            <h3 className="pdfs-step-title">Choose Split Mode</h3>
            <p className="pdfs-step-text">
              Select between Custom Ranges (e.g. Part 1: 1-3, Part 2: 4-8), Visual Grid Selection, Extract All Pages, or Interval Splitting (every N pages).
            </p>
          </div>

          <div className="pdfs-step-card">
            <div className="pdfs-step-num">3</div>
            <h3 className="pdfs-step-title">Split &amp; Download</h3>
            <p className="pdfs-step-text">
              Click "Split PDF Now". Download individual PDF files or save all separated parts at once with a 1-click ZIP bundle.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="pdfs-seo-section">
        <h2 className="pdfs-seo-section-title">Why Use Cerilas In-Browser PDF Splitter?</h2>
        <p className="pdfs-seo-desc">
          Engineered for privacy-conscious researchers, legal counsel, accountants, students, and businesses who cannot risk uploading sensitive files to third-party clouds.
        </p>

        <div className="pdfs-steps-grid">
          <div className="pdfs-step-card">
            <div className="pdfs-step-num" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 className="pdfs-step-title">100% In-Browser Privacy</h3>
            <p className="pdfs-step-text">
              Zero cloud uploads. All parsing and page extraction happen in your browser’s local memory, ensuring compliance with strict privacy policies and NDAs.
            </p>
          </div>

          <div className="pdfs-step-card">
            <div className="pdfs-step-num" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Scissors size={20} />
            </div>
            <h3 className="pdfs-step-title">Custom Multi-Part Ranges</h3>
            <p className="pdfs-step-text">
              Cut documents exactly where you want. Define unlimited output parts with custom page boundaries and individual filenames.
            </p>
          </div>

          <div className="pdfs-step-card">
            <div className="pdfs-step-num" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <Zap size={20} />
            </div>
            <h3 className="pdfs-step-title">1-Click ZIP Packaging</h3>
            <p className="pdfs-step-text">
              Extract dozens of individual pages or multiple parts and download them all together in a single lightweight ZIP archive.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pdfs-seo-section">
        <h2 className="pdfs-seo-section-title">Cerilas PDF Splitter vs. Other Tools</h2>
        <p className="pdfs-seo-desc">
          See why privacy-first in-browser processing beats both server-upload web tools and costly desktop software.
        </p>

        <div className="pdfs-table-wrap">
          <table className="pdfs-comp-table">
            <thead>
              <tr>
                <th>Feature / Security</th>
                <th className="pdfs-highlight-col">Cerilas PDF Splitter</th>
                <th>Standard Cloud Web Splitters</th>
                <th>Desktop Software (Acrobat)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Data Security</strong></td>
                <td className="pdfs-highlight-col">100% In-Browser (Zero Upload)</td>
                <td>Uploaded to 3rd-party servers</td>
                <td>Local File System</td>
              </tr>
              <tr>
                <td><strong>Custom Multi-Part Ranges</strong></td>
                <td className="pdfs-highlight-col">Unlimited custom parts &amp; names</td>
                <td>Often limited to 2 parts on free tier</td>
                <td>Supported</td>
              </tr>
              <tr>
                <td><strong>Visual Thumbnail Grid</strong></td>
                <td className="pdfs-highlight-col">Yes, rendered on-device</td>
                <td>Server-rendered previews</td>
                <td>Supported</td>
              </tr>
              <tr>
                <td><strong>Cost &amp; Watermarks</strong></td>
                <td className="pdfs-highlight-col">100% Free, Zero Watermarks</td>
                <td>Often requires paid plan or adds watermark</td>
                <td>$239/year subscription</td>
              </tr>
              <tr>
                <td><strong>ZIP Bundle Export</strong></td>
                <td className="pdfs-highlight-col">Instant client-side ZIP</td>
                <td>Slow server download</td>
                <td>Separate exports</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="pdfs-seo-section">
        <h2 className="pdfs-seo-section-title">Frequently Asked Questions</h2>
        <div className="pdfs-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`pdfs-faq-item ${isOpen ? 'is-open' : ''}`}>
                <button 
                  type="button" 
                  className="pdfs-faq-question" 
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={(isOpen) || !supportsUntilFound}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="pdfs-faq-icon" />
                </button>
                <SearchableHidden isOpen={isOpen} onReveal={() => setOpenFaq(idx)}>
                  <div className="pdfs-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </SearchableHidden>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
