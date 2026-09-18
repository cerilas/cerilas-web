import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  Sparkles, 
  ExternalLink, 
  BarChart3, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  Cpu, 
  CheckCircle2,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Footer({ onOpenStats }) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const handleToolClick = (slug) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
    window.location.hash = `#/tool/${slug}`;
    requestAnimationFrame(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });
  };

  const handleStatsClick = (e) => {
    e.preventDefault();
    if (onOpenStats) onOpenStats();
  };

  return (
    <footer className="seo-footer" role="contentinfo">
      <div className="seo-footer-inner">
        {/* Top Brand & Security Commitment Section */}
        <div className="seo-footer-top">
          <div className="seo-footer-brand-col">
            <div className="seo-footer-logo-row">
              <img 
                src="/platform-logo.webp" 
                alt="Cerilas' Tools" 
                className="seo-footer-logo"
                width={36}
                height={36}
                onError={(e) => {
                  if (!e.target.dataset.triedPng) {
                    e.target.dataset.triedPng = 'true';
                    e.target.src = '/platform-logo.png';
                  }
                }}
              />
              <span className="seo-footer-brand-name">Cerilas' Tools</span>
            </div>
            <p className="seo-footer-brand-desc" title="Privacy-first developer utilities powered 100% locally by browser WebAssembly.">
              Privacy-first developer utilities powered 100% locally by browser WebAssembly.
            </p>
            <div className="seo-footer-badges">
              <span className="seo-footer-pill">
                <Lock size={12} className="pill-icon" /> 100% In-Browser Privacy
              </span>
              <span className="seo-footer-pill">
                <Zap size={12} className="pill-icon" /> Zero Server Uploads
              </span>
              <span className="seo-footer-pill">
                <Sparkles size={12} className="pill-icon" /> Free with No Sign-Up
              </span>
            </div>
          </div>

          <div className="seo-footer-stats-box">
            <div className="stats-box-header">
              <Cpu size={16} />
              <span>Edge Client Architecture</span>
            </div>
            <p className="stats-box-text" title="Local isolated memory processing with zero server storage.">
              Local isolated memory processing with zero server storage.
            </p>
            {onOpenStats && (
              <button type="button" onClick={handleStatsClick} className="stats-box-link">
                <BarChart3 size={14} />
                <span>View Live Analytics</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Categorized SEO Directory Columns */}
        <div className="seo-footer-grid">
          {/* Column 1: PDF & Document Suite */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <FileText size={15} />
              <span>PDF &amp; Document Tools</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')} title="Online PDF Editor">
                  <span className="seo-tool-title">Online PDF Editor</span>
                  <span className="seo-link-tag">Edit &amp; Sign</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')} title="Compress PDF Online">
                  <span className="seo-tool-title">Compress PDF Online</span>
                  <span className="seo-link-tag">MB to KB</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pdf-rag-cleaner" onClick={() => handleToolClick('pdf-rag-cleaner')} title="PDF to RAG Chunker">
                  <span className="seo-tool-title">PDF to RAG Chunker</span>
                  <span className="seo-link-tag">Vector DB</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ai-content-detector" onClick={() => handleToolClick('ai-content-detector')} title="AI Content Detector">
                  <span className="seo-tool-title">AI Content Detector</span>
                  <span className="seo-link-tag">0-100% Score</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ats-resume-checker" onClick={() => handleToolClick('ats-resume-checker')} title="ATS Resume Checker">
                  <span className="seo-tool-title">ATS Resume Checker</span>
                  <span className="seo-link-tag">CV Audit</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Media, Video & Graphic Tools */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <ImageIcon size={15} />
              <span>Media, Image &amp; Video</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/image-compressor" onClick={() => handleToolClick('image-compressor')} title="Image Compressor & WebP">
                  <span className="seo-tool-title">Image Compressor</span>
                  <span className="seo-link-tag">WebP/JPEG</span>
                </a>
              </li>
              <li>
                <a href="#/tool/video-compressor" onClick={() => handleToolClick('video-compressor')} title="Video Compressor">
                  <span className="seo-tool-title">Video Compressor</span>
                  <span className="seo-link-tag">MP4 &amp; MOV</span>
                </a>
              </li>
              <li>
                <a href="#/tool/youtube-thumbnail-downloader" onClick={() => handleToolClick('youtube-thumbnail-downloader')} title="YouTube Thumbnail Grab">
                  <span className="seo-tool-title">YouTube Thumbnail Grab</span>
                  <span className="seo-link-tag">4K Ultra HD</span>
                </a>
              </li>
              <li>
                <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')} title="AI Background Remover">
                  <span className="seo-tool-title">AI Background Remover</span>
                  <span className="seo-link-tag">PNG Cutout</span>
                </a>
              </li>
              <li>
                <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')} title="Permanent QR Generator">
                  <span className="seo-tool-title">Permanent QR Generator</span>
                  <span className="seo-link-tag">Vector SVG</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Startup & SaaS Finance */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <TrendingUp size={15} />
              <span>Startup &amp; SaaS Finance</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/startup-runway-calculator" onClick={() => handleToolClick('startup-runway-calculator')} title="Startup Runway Calculator">
                  <span className="seo-tool-title">Startup Runway Calculator</span>
                  <span className="seo-link-tag">Burn &amp; Zero-Cash</span>
                </a>
              </li>
              <li>
                <a href="#/tool/mrr-calculator" onClick={() => handleToolClick('mrr-calculator')} title="MRR Calculator">
                  <span className="seo-tool-title">MRR Calculator</span>
                  <span className="seo-link-tag">Net Growth</span>
                </a>
              </li>
              <li>
                <a href="#/tool/arr-calculator" onClick={() => handleToolClick('arr-calculator')} title="ARR Calculator">
                  <span className="seo-tool-title">ARR Calculator</span>
                  <span className="seo-link-tag">Run-Rate &amp; Scale</span>
                </a>
              </li>
              <li>
                <a href="#/tool/churn-calculator" onClick={() => handleToolClick('churn-calculator')} title="Churn Calculator">
                  <span className="seo-tool-title">Churn Calculator</span>
                  <span className="seo-link-tag">Logo &amp; Revenue</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ltv-calculator" onClick={() => handleToolClick('ltv-calculator')} title="LTV Calculator">
                  <span className="seo-tool-title">LTV Calculator</span>
                  <span className="seo-link-tag">Lifetime Value</span>
                </a>
              </li>
              <li>
                <a href="#/tool/cac-calculator" onClick={() => handleToolClick('cac-calculator')} title="CAC Calculator">
                  <span className="seo-tool-title">CAC Calculator</span>
                  <span className="seo-link-tag">Payback Period</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ltv-cac-calculator" onClick={() => handleToolClick('ltv-cac-calculator')} title="LTV:CAC Calculator">
                  <span className="seo-tool-title">LTV:CAC Ratio Calculator</span>
                  <span className="seo-link-tag">Unit Economics</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Developer & Productivity Utilities */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <Code size={15} />
              <span>Developer &amp; Productivity</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/webhook-tester" onClick={() => handleToolClick('webhook-tester')} title="Online Webhook Tester">
                  <span className="seo-tool-title">Online Webhook Tester</span>
                  <span className="seo-link-tag">HTTP/JSON</span>
                </a>
              </li>
              <li>
                <a href="#/tool/json-beautifier" onClick={() => handleToolClick('json-beautifier')} title="JSON Formatter & Validator">
                  <span className="seo-tool-title">JSON Formatter</span>
                  <span className="seo-link-tag">Tree &amp; Lint</span>
                </a>
              </li>
              <li>
                <a href="#/tool/email-signature-generator" onClick={() => handleToolClick('email-signature-generator')} title="Email Signature Creator">
                  <span className="seo-tool-title">Email Signature Creator</span>
                  <span className="seo-link-tag">HTML Ready</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pomodoro-timer" onClick={() => handleToolClick('pomodoro-timer')} title="Pomodoro Focus Timer">
                  <span className="seo-tool-title">Pomodoro Focus Timer</span>
                  <span className="seo-link-tag">Wave Audio</span>
                </a>
              </li>
              <li>
                <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')} title="Wi-Fi & vCard QR Creator">
                  <span className="seo-tool-title">Wi-Fi &amp; vCard QR</span>
                  <span className="seo-link-tag">Scan Code</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Ecosystem & Corporate */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <ShieldCheck size={15} />
              <span>Cerilas Ecosystem</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer" title="Cerilas Corporate Site">
                  <span className="seo-tool-title">Cerilas Corporate Site</span>
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://cerilas.com/#services" target="_blank" rel="noopener noreferrer" title="Engineering Labs">
                  <span className="seo-tool-title">Engineering Labs</span>
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://cerilas.com/#contact" target="_blank" rel="noopener noreferrer" title="Enterprise Support">
                  <span className="seo-tool-title">Enterprise Support</span>
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://github.com/cerilas/cerilas-web" target="_blank" rel="noopener noreferrer" title="Open Source GitHub">
                  <span className="seo-tool-title">Open Source GitHub</span>
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="#/" onClick={() => { 
                  try {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  } catch (e) {
                    window.scrollTo(0, 0);
                  }
                  if (typeof document !== 'undefined') {
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                  }
                  window.location.hash = '#/'; 
                }} title="All Tools Catalog">
                  <span className="seo-tool-title">All Tools Catalog</span>
                  <span className="seo-link-tag">21 Utilities</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* High-Intent Search Keyword Tags Cloud */}
        <div className="seo-footer-keywords-section">
          <h4 className="seo-keywords-title">Popular Free Utilities &amp; Search Queries</h4>
          <div className="seo-keywords-cloud">
            <a href="#/tool/startup-runway-calculator" onClick={() => handleToolClick('startup-runway-calculator')}>Startup Runway Calculator</a>
            <a href="#/tool/mrr-calculator" onClick={() => handleToolClick('mrr-calculator')}>SaaS MRR Calculator</a>
            <a href="#/tool/arr-calculator" onClick={() => handleToolClick('arr-calculator')}>ARR to MRR Calculator</a>
            <a href="#/tool/churn-calculator" onClick={() => handleToolClick('churn-calculator')}>SaaS Churn Rate Formula</a>
            <a href="#/tool/ltv-calculator" onClick={() => handleToolClick('ltv-calculator')}>Customer Lifetime Value LTV</a>
            <a href="#/tool/cac-calculator" onClick={() => handleToolClick('cac-calculator')}>Customer Acquisition Cost CAC</a>
            <a href="#/tool/ltv-cac-calculator" onClick={() => handleToolClick('ltv-cac-calculator')}>LTV to CAC Ratio Benchmark</a>
            <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>Free Dynamic QR Code</a>
            <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>Compress PDF to 200KB</a>
            <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>Edit PDF Text Online</a>
            <a href="#/tool/ats-resume-checker" onClick={() => handleToolClick('ats-resume-checker')}>Free AI Resume Checker</a>
            <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>Remove Background HD</a>
            <a href="#/tool/youtube-thumbnail-downloader" onClick={() => handleToolClick('youtube-thumbnail-downloader')}>YouTube 4K Thumbnail Grab</a>
            <a href="#/tool/image-compressor" onClick={() => handleToolClick('image-compressor')}>JPEG to WebP Converter</a>
            <a href="#/tool/video-compressor" onClick={() => handleToolClick('video-compressor')}>Compress MP4 Video</a>
            <a href="#/tool/webhook-tester" onClick={() => handleToolClick('webhook-tester')}>Discord Webhook Tester</a>
            <a href="#/tool/json-beautifier" onClick={() => handleToolClick('json-beautifier')}>JSON Beautifier Online</a>
            <a href="#/tool/email-signature-generator" onClick={() => handleToolClick('email-signature-generator')}>HTML Email Signature</a>
            <a href="#/tool/pdf-rag-cleaner" onClick={() => handleToolClick('pdf-rag-cleaner')}>PDF to Markdown RAG</a>
            <a href="#/tool/ai-content-detector" onClick={() => handleToolClick('ai-content-detector')}>AI Content Detector 100%</a>
            <a href="#/tool/pomodoro-timer" onClick={() => handleToolClick('pomodoro-timer')}>Pomodoro Timer Online</a>
            <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>Vector SVG QR Code</a>
            <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>Reduce PDF Size Free</a>
            <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>100% In-Browser Privacy</a>
            <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>Add PDF Signature Free</a>
          </div>
        </div>

        {/* Bottom Legal, Privacy Guarantee & Copyright Bar */}
        <div className="seo-footer-bottom">
          <div className="seo-footer-bottom-legal">
            <p className="seo-privacy-notice" title="Privacy Assurance: 100% local in-browser processing via WebAssembly & WebGPU. Zero server file uploads.">
              <CheckCircle2 size={14} className="privacy-check-icon" />
              <span>
                <strong>Privacy Assurance:</strong> 100% local in-browser processing via WebAssembly &amp; WebGPU. Zero server file uploads.
              </span>
            </p>
          </div>

          <div className="seo-footer-bottom-meta">
            <p className="seo-copyright">
              © {currentYear} Cerilas High Tech. All rights reserved. Built for speed &amp; privacy.
            </p>
            <div className="seo-footer-bottom-links">
              <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">Cerilas.com</a>
              <span className="dot">•</span>
              <a href="#/">Cerilas' Tools</a>
              <span className="dot">•</span>
              <a href="https://github.com/cerilas/cerilas-web" target="_blank" rel="noopener noreferrer">GitHub</a>
              <span className="dot">•</span>
              <span className="status-indicator">
                <span className="status-dot"></span> All Systems Normal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
