import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  ArrowUpDown, 
  Lock, 
  Check, 
  X, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  Zap,
  EyeOff
} from 'lucide-react';
import './PdfMergerSeo.css';

export default function PdfMergerSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'pdf-merger-seo-jsonld';

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": "https://tools.cerilas.com/#/tool/pdf-merger#software",
          "name": "Cerilas Free In-Browser PDF Merger",
          "alternateName": [
            "Cerilas PDF Merger",
            "Merge PDF Online Free",
            "Combine PDF Files with Custom Page Order",
            "100% Private Client-Side PDF Joiner"
          ],
          "operatingSystem": "All modern browsers (Chrome, Safari, Firefox, Edge, Brave)",
          "applicationCategory": "ProductivityApplication, UtilityApplication",
          "image": "https://tools.cerilas.com/tool-icons/pdf-merger.png",
          "description": "Combine multiple PDF files into one clean document with drag-and-drop page reordering and 100% client-side privacy.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://tools.cerilas.com/#/tool/pdf-merger#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is my confidential data safe when merging PDFs here?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, 100%. Unlike conventional online PDF tools that upload your files to remote cloud servers, Cerilas PDF Merger runs completely inside your web browser using WebAssembly and JavaScript. Your documents never leave your computer or phone."
              }
            },
            {
              "@type": "Question",
              "name": "Can I change the order of the merged PDF files?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely. You can drag and drop any file card into your preferred position or use the Move Up (↑) and Move Down (↓) arrow buttons on each card. You can also use 1-click A-Z sort or reverse order shortcuts."
              }
            },
            {
              "@type": "Question",
              "name": "Can I merge only specific pages from a document?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Each file card includes a Page Range input where you can enter specific pages or page ranges, such as '1-3, 5, 8-10', or leave it blank to include all pages."
              }
            },
            {
              "@type": "Question",
              "name": "Is there a file count limit or watermark?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. There are zero file count limits, zero file size restrictions, and absolutely no watermarks added to your output document."
              }
            }
          ]
        }
      ]
    };

    jsonLdScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);

    return () => {
      const el = document.getElementById('pdf-merger-seo-jsonld');
      if (el) el.remove();
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Are my confidential documents uploaded to any server?',
      a: 'No! Cerilas PDF Merger processes your files 100% locally in your web browser using client-side JavaScript (pdf-lib and pdf.js). Your files never touch our servers or any third-party cloud infrastructure, making it ideal for legal, financial, and medical documents.'
    },
    {
      q: 'How do I rearrange or change the order of documents before merging?',
      a: 'You can reorder your files in two ways: either click and drag any file card to move it up or down, or click the Move Up (↑) and Move Down (↓) buttons on the card. You can also use the "Sort A-Z" or "Reverse Order" buttons in the toolbar.'
    },
    {
      q: 'Can I select specific pages from each PDF instead of the whole file?',
      a: 'Yes. In each file card, there is a "Pages" field. You can specify custom page ranges such as "1-4, 7, 9-12". Only those chosen pages will be included in the final merged PDF.'
    },
    {
      q: 'Does merging PDFs reduce image or text quality?',
      a: 'No. Our merger copies the vector paths, fonts, embedded images, and layout elements directly from the source PDFs into the new master document without re-compressing or degrading quality.'
    },
    {
      q: 'Is there a limit on file size or the number of PDFs I can merge?',
      a: 'There are no artificial limits, paywalls, or daily quotas. You can merge as many documents as your device’s memory can handle.'
    }
  ];

  return (
    <div className="pdfm-seo-container">
      {/* 3-Step Guide */}
      <section className="pdfm-seo-section">
        <h2 className="pdfm-seo-section-title">How to Merge PDF Files in 3 Simple Steps</h2>
        <p className="pdfm-seo-desc">
          Combine multiple PDF files into one clean, continuous document in seconds without installing heavy desktop software or sending confidential files to remote servers.
        </p>

        <div className="pdfm-steps-grid">
          <div className="pdfm-step-card">
            <div className="pdfm-step-num">1</div>
            <h3 className="pdfm-step-title">Upload Documents</h3>
            <p className="pdfm-step-text">
              Drag and drop your PDF files into the upload zone or click "Browse Files". Each file will instantly display its first-page thumbnail and page count.
            </p>
          </div>

          <div className="pdfm-step-card">
            <div className="pdfm-step-num">2</div>
            <h3 className="pdfm-step-title">Reorder &amp; Customize</h3>
            <p className="pdfm-step-text">
              Drag file cards or click the Up/Down arrow buttons to set the exact document order. Optionally specify custom page ranges (e.g., 1-5, 8) for selective merging.
            </p>
          </div>

          <div className="pdfm-step-card">
            <div className="pdfm-step-num">3</div>
            <h3 className="pdfm-step-title">Merge &amp; Download</h3>
            <p className="pdfm-step-text">
              Click "Merge PDFs" to instantly assemble your unified document. Preview it in your browser or download it immediately with zero watermarks.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="pdfm-seo-section">
        <h2 className="pdfm-seo-section-title">Why Use Cerilas In-Browser PDF Merger?</h2>
        <p className="pdfm-seo-desc">
          Designed for professionals, legal teams, students, and businesses that require zero data leakage, high performance, and total control over document sequencing.
        </p>

        <div className="pdfm-steps-grid">
          <div className="pdfm-step-card">
            <div className="pdfm-step-num" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 className="pdfm-step-title">100% Client-Side Privacy</h3>
            <p className="pdfm-step-text">
              Your PDFs never leave your device. All rendering and assembly happen locally inside your browser sandbox, fully compliant with GDPR, HIPAA, and corporate security guidelines.
            </p>
          </div>

          <div className="pdfm-step-card">
            <div className="pdfm-step-num" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <ArrowUpDown size={20} />
            </div>
            <h3 className="pdfm-step-title">Precise Sequence Control</h3>
            <p className="pdfm-step-text">
              Easily rearrange files using drag &amp; drop, up/down arrows, or 1-click sorting presets (A-Z or reverse). What you see is exactly what gets merged.
            </p>
          </div>

          <div className="pdfm-step-card">
            <div className="pdfm-step-num" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Zap size={20} />
            </div>
            <h3 className="pdfm-step-title">Lightning-Fast Assembly</h3>
            <p className="pdfm-step-text">
              No server upload queues or processing delays. Hundreds of pages can be assembled in fractions of a second using optimized WebAssembly and binary streams.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pdfm-seo-section">
        <h2 className="pdfm-seo-section-title">Cerilas In-Browser Merger vs. Other Tools</h2>
        <p className="pdfm-seo-desc">
          Compare our privacy-first browser architecture with traditional server-upload web tools and paid desktop software.
        </p>

        <div className="pdfm-table-wrap">
          <table className="pdfm-comp-table">
            <thead>
              <tr>
                <th>Feature / Benchmark</th>
                <th className="pdfm-highlight-col">Cerilas PDF Merger</th>
                <th>Standard Online Tools (Cloud)</th>
                <th>Desktop Software (Acrobat Pro)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Privacy &amp; Security</strong></td>
                <td className="pdfm-highlight-col">100% In-Browser (Zero Upload)</td>
                <td>Uploaded to Cloud Servers</td>
                <td>Local File System</td>
              </tr>
              <tr>
                <td><strong>Cost &amp; Watermarks</strong></td>
                <td className="pdfm-highlight-col">100% Free, Zero Watermarks</td>
                <td>Often Paid or Adds Watermark</td>
                <td>Expensive Subscription ($239/yr)</td>
              </tr>
              <tr>
                <td><strong>Interactive Reordering</strong></td>
                <td className="pdfm-highlight-col">Drag &amp; Drop + Up/Down Arrows</td>
                <td>Limited or Clunky</td>
                <td>Supported</td>
              </tr>
              <tr>
                <td><strong>Page Range Selection</strong></td>
                <td className="pdfm-highlight-col">Custom Ranges (e.g. 1-3, 5)</td>
                <td>Often Premium Only</td>
                <td>Supported</td>
              </tr>
              <tr>
                <td><strong>Installation Required</strong></td>
                <td className="pdfm-highlight-col">None (Runs in Any Browser)</td>
                <td>None</td>
                <td>Heavy GB-sized install</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="pdfm-seo-section">
        <h2 className="pdfm-seo-section-title">Frequently Asked Questions</h2>
        <div className="pdfm-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`pdfm-faq-item ${isOpen ? 'is-open' : ''}`}>
                <button 
                  type="button" 
                  className="pdfm-faq-question" 
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="pdfm-faq-icon" />
                </button>
                {isOpen && (
                  <div className="pdfm-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
