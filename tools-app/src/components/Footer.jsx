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
  ArrowUpRight
} from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Footer({ onOpenStats }) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const handleToolClick = (slug) => {
    window.location.hash = `#/tool/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <p className="seo-footer-brand-desc">
              High-performance, privacy-first web utilities and intelligent developer tools. Powered by local browser WebAssembly &amp; WebGPU with zero server-side file uploads.
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
            <p className="stats-box-text">
              Every document, video, image, and payload is processed in isolated local memory. No databases store your files.
            </p>
            {onOpenStats && (
              <button type="button" onClick={handleStatsClick} className="stats-box-link">
                <BarChart3 size={14} />
                <span>View Platform Live Analytics</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Categorized SEO Directory Columns */}
        <div className="seo-footer-grid">
          {/* Column 1: PDF & Document Suite */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <FileText size={15} />
              <span>PDF &amp; Document Tools</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>
                  Free Online PDF Editor
                  <span className="seo-link-tag">Text &amp; Sign</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>
                  Compress PDF Online Free
                  <span className="seo-link-tag">MB to KB</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pdf-rag-cleaner" onClick={() => handleToolClick('pdf-rag-cleaner')}>
                  PDF to RAG &amp; Markdown Chunker
                  <span className="seo-link-tag">Vector DB</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ai-content-detector" onClick={() => handleToolClick('ai-content-detector')}>
                  AI PDF Scanner &amp; Content Detector
                  <span className="seo-link-tag">0-100% Score</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ats-resume-checker" onClick={() => handleToolClick('ats-resume-checker')}>
                  AI ATS Resume &amp; CV Checker
                  <span className="seo-link-tag">Bot Audit</span>
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
                <a href="#/tool/image-compressor" onClick={() => handleToolClick('image-compressor')}>
                  Image Compressor &amp; WebP Converter
                  <span className="seo-link-tag">JPEG/PNG</span>
                </a>
              </li>
              <li>
                <a href="#/tool/video-compressor" onClick={() => handleToolClick('video-compressor')}>
                  Free Video Compressor (MP4 &amp; MOV)
                  <span className="seo-link-tag">Fast Export</span>
                </a>
              </li>
              <li>
                <a href="#/tool/youtube-thumbnail-downloader" onClick={() => handleToolClick('youtube-thumbnail-downloader')}>
                  YouTube 4K Thumbnail Downloader
                  <span className="seo-link-tag">Ultra HD</span>
                </a>
              </li>
              <li>
                <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>
                  In-Browser AI Background Remover
                  <span className="seo-link-tag">Transparent PNG</span>
                </a>
              </li>
              <li>
                <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>
                  Permanent QR Code Generator
                  <span className="seo-link-tag">Vector SVG</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer & Productivity Utilities */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <Code size={15} />
              <span>Developer &amp; Productivity</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/webhook-tester" onClick={() => handleToolClick('webhook-tester')}>
                  Free Online Webhook Tester
                  <span className="seo-link-tag">Discord &amp; Slack</span>
                </a>
              </li>
              <li>
                <a href="#/tool/json-beautifier" onClick={() => handleToolClick('json-beautifier')}>
                  JSON Beautifier, Formatter &amp; Validator
                  <span className="seo-link-tag">Tree View</span>
                </a>
              </li>
              <li>
                <a href="#/tool/email-signature-generator" onClick={() => handleToolClick('email-signature-generator')}>
                  Professional Email Signature Generator
                  <span className="seo-link-tag">HTML Ready</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pomodoro-timer" onClick={() => handleToolClick('pomodoro-timer')}>
                  Online Pomodoro Focus Timer
                  <span className="seo-link-tag">Fluid Wave</span>
                </a>
              </li>
              <li>
                <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>
                  Wi-Fi &amp; vCard QR Code Creator
                  <span className="seo-link-tag">Unlimited Scans</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Ecosystem & Corporate */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <ShieldCheck size={15} />
              <span>Cerilas Ecosystem</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">
                  Cerilas High Tech Corporate Site
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://cerilas.com/#services" target="_blank" rel="noopener noreferrer">
                  Research &amp; Engineering Labs
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://cerilas.com/#contact" target="_blank" rel="noopener noreferrer">
                  Enterprise Support &amp; Inquiries
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="https://github.com/cerilas/cerilas-web" target="_blank" rel="noopener noreferrer">
                  Open Source Architecture &amp; GitHub
                  <ArrowUpRight size={13} className="ext-icon" />
                </a>
              </li>
              <li>
                <a href="#/" onClick={() => { window.location.hash = '#/'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  All Tools Catalog
                  <span className="seo-link-tag">14 Utilities</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* High-Intent Search Keyword Tags Cloud */}
        <div className="seo-footer-keywords-section">
          <h4 className="seo-keywords-title">Popular Free Utilities &amp; Search Queries</h4>
          <div className="seo-keywords-cloud">
            <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>Free Dynamic QR Code Generator</a>
            <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>Compress PDF to 200KB Free</a>
            <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>Edit PDF Text Online Free</a>
            <a href="#/tool/ats-resume-checker" onClick={() => handleToolClick('ats-resume-checker')}>Free AI Resume Checker ATS</a>
            <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>Remove Background HD Cutout</a>
            <a href="#/tool/youtube-thumbnail-downloader" onClick={() => handleToolClick('youtube-thumbnail-downloader')}>YouTube Shorts Thumbnail Downloader 4K</a>
            <a href="#/tool/image-compressor" onClick={() => handleToolClick('image-compressor')}>JPEG to WebP Converter</a>
            <a href="#/tool/video-compressor" onClick={() => handleToolClick('video-compressor')}>Compress MP4 Video File Size</a>
            <a href="#/tool/webhook-tester" onClick={() => handleToolClick('webhook-tester')}>Discord Webhook Sender &amp; Tester</a>
            <a href="#/tool/json-beautifier" onClick={() => handleToolClick('json-beautifier')}>Minify and Beautify JSON</a>
            <a href="#/tool/email-signature-generator" onClick={() => handleToolClick('email-signature-generator')}>Gmail &amp; Outlook HTML Signature</a>
            <a href="#/tool/pdf-rag-cleaner" onClick={() => handleToolClick('pdf-rag-cleaner')}>PDF to Markdown for LangChain</a>
            <a href="#/tool/ai-content-detector" onClick={() => handleToolClick('ai-content-detector')}>AI Detection Score 0 to 100%</a>
            <a href="#/tool/pomodoro-timer" onClick={() => handleToolClick('pomodoro-timer')}>Pomodoro Timer with Chime</a>
            <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>Print Ready Vector SVG QR Code</a>
            <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>Reduce PDF Size in Browser</a>
            <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>100% In-Browser Privacy Tools</a>
            <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>Add Signature to PDF Free</a>
          </div>
        </div>

        {/* Bottom Legal, Privacy Guarantee & Copyright Bar */}
        <div className="seo-footer-bottom">
          <div className="seo-footer-bottom-legal">
            <p className="seo-privacy-notice">
              <CheckCircle2 size={14} className="privacy-check-icon" />
              <span>
                <strong>Privacy Assurance:</strong> All media, documents, and code are processed 100% locally in your device's browser memory using WebAssembly and WebGPU workers. No personal files or data are ever uploaded, transferred, or stored on external servers.
              </span>
            </p>
          </div>

          <div className="seo-footer-bottom-meta">
            <p className="seo-copyright">
              © {currentYear} Cerilas High Tech. All rights reserved. Engineered for privacy, speed, and precision.
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
