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
  TrendingUp,
  Bot
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

  const handleLegalClick = (slug) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
    window.location.hash = `#/legal/${slug}`;
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
                <a href="#/tool/pdf-merger" onClick={() => handleToolClick('pdf-merger')} title="Merge PDF Files Online">
                  <span className="seo-tool-title">Merge PDF Files</span>
                  <span className="seo-link-tag">Combine</span>
                </a>
              </li>
              <li>
                <a href="#/tool/pdf-splitter" onClick={() => handleToolClick('pdf-splitter')} title="Split PDF by Pages Online">
                  <span className="seo-tool-title">Split PDF Online</span>
                  <span className="seo-link-tag">Custom Range</span>
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
                  <span className="seo-tool-title">Cerilas Corporate</span>
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
                  <span className="seo-link-tag">31 In-Browser Tools</span>
                </a>
              </li>
              <li>
                <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer" title="Cloud & Security Architecture">
                  <span className="seo-tool-title">Security Architecture</span>
                  <span className="seo-link-tag">SOC-2 Ready</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 6: AI, R&D & Funding Grants */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <Bot size={15} />
              <span>AI, R&amp;D &amp; Funding Grants</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/tool/eu-funding-opportunities" onClick={() => handleToolClick('eu-funding-opportunities')} title="EU & Cascade Funding Opportunities Directory">
                  <span className="seo-tool-title">EU &amp; Cascade Funding</span>
                  <span className="seo-link-tag">600+ Grants</span>
                </a>
              </li>
              <li>
                <a href="#/tool/trl-calculator" onClick={() => handleToolClick('trl-calculator')} title="Technology Readiness Level (TRL) Calculator">
                  <span className="seo-tool-title">TRL Assessment (1-9)</span>
                  <span className="seo-link-tag">NASA &amp; Horizon</span>
                </a>
              </li>
              <li>
                <a href="#/tool/sample-size-calculator" onClick={() => handleToolClick('sample-size-calculator')} title="A/B Test Statistical Sample Size Calculator">
                  <span className="seo-tool-title">Sample Size Calculator</span>
                  <span className="seo-link-tag">A/B Testing</span>
                </a>
              </li>
              <li>
                <a href="#/tool/token-counter-universal" onClick={() => handleToolClick('token-counter-universal')} title="Universal Token Counter for LLMs">
                  <span className="seo-tool-title">LLM Token Counter</span>
                  <span className="seo-link-tag">GPT &amp; Claude</span>
                </a>
              </li>
              <li>
                <a href="#/tool/llms-txt-tools" onClick={() => handleToolClick('llms-txt-tools')} title="llms.txt Generator and Validator">
                  <span className="seo-tool-title">llms.txt Generator</span>
                  <span className="seo-link-tag">AI Docs</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ai-crawler-checker" onClick={() => handleToolClick('ai-crawler-checker')} title="AI Bot and Crawler Checker">
                  <span className="seo-tool-title">AI Bot &amp; Crawler Audit</span>
                  <span className="seo-link-tag">Robots.txt</span>
                </a>
              </li>
              <li>
                <a href="#/tool/ai-link-hallucination-checker" onClick={() => handleToolClick('ai-link-hallucination-checker')} title="AI Link Hallucination Checker">
                  <span className="seo-tool-title">AI Link Hallucination</span>
                  <span className="seo-link-tag">Fact Check</span>
                </a>
              </li>
              <li>
                <a href="#/tool/html-to-llm-markdown" onClick={() => handleToolClick('html-to-llm-markdown')} title="HTML to Clean LLM Markdown">
                  <span className="seo-tool-title">HTML to LLM Markdown</span>
                  <span className="seo-link-tag">RAG Prep</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column: Legal & Compliance */}
          <div className="seo-footer-col">
            <h3 className="seo-col-title">
              <ShieldCheck size={15} />
              <span>Legal &amp; Compliance</span>
            </h3>
            <ul className="seo-col-list">
              <li>
                <a href="#/legal/terms" onClick={() => handleLegalClick('terms')} title="Terms of Service & Subscription Agreement">
                  <span className="seo-tool-title">Terms of Service</span>
                  <span className="seo-link-tag">Pro &amp; Billing</span>
                </a>
              </li>
              <li>
                <a href="#/legal/privacy" onClick={() => handleLegalClick('privacy')} title="Privacy Policy & KVKK / GDPR Compliance">
                  <span className="seo-tool-title">Privacy Policy</span>
                  <span className="seo-link-tag">KVKK &amp; GDPR</span>
                </a>
              </li>
              <li>
                <a href="#/legal/refund" onClick={() => handleLegalClick('refund')} title="Refund & Cancellation Policy">
                  <span className="seo-tool-title">Refund &amp; Cancellation</span>
                  <span className="seo-link-tag">14-Day Right</span>
                </a>
              </li>
              <li>
                <a href="#/legal/cookies" onClick={() => handleLegalClick('cookies')} title="Cookie Policy & Telemetry Consent">
                  <span className="seo-tool-title">Cookie Policy</span>
                  <span className="seo-link-tag">Compliance</span>
                </a>
              </li>
              <li>
                <a href="mailto:law@cerilas.com" title="Corporate Legal Department Contact">
                  <span className="seo-tool-title">law@cerilas.com</span>
                  <span className="seo-link-tag">Contact</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Right Companion: High-Impact SEO Architecture & Keywords Spotlight Card (Spans 2 columns) */}
          <div className="seo-footer-editorial-card">
            <div className="seo-editorial-header">
              <Sparkles size={16} />
              <h4 className="seo-editorial-title">Next-Gen Client-Side Computing Platform</h4>
            </div>
            
            <p className="seo-editorial-lead">
              Cerilas Tools delivers a zero-server, privacy-first utility platform engineered for <strong>entrepreneurs, researchers, startups, white-collar professionals, and developers</strong>. Powered by <strong>WebAssembly (WASM)</strong>, <strong>WebGPU</strong>, and synchronized live grant crawlers, all calculations, document modifications, AI vision tasks, and Horizon Europe grant discoveries run seamlessly.
            </p>

            <div className="seo-editorial-features">
              <div className="seo-editorial-feature-item">
                <Lock size={13} className="feature-item-icon" />
                <span><strong>Zero Server Uploads:</strong> Sensitive contracts, financial spreadsheets, and CVs never touch remote servers. Full GDPR compliance.</span>
              </div>
              <div className="seo-editorial-feature-item">
                <Zap size={13} className="feature-item-icon" />
                <span><strong>WebAssembly Speed:</strong> Blazing-fast in-memory PDF merging, splitting, compression, and background removal without server queues.</span>
              </div>
              <div className="seo-editorial-feature-item">
                <TrendingUp size={13} className="feature-item-icon" />
                <span><strong>Audited SaaS &amp; Research Benchmarks:</strong> Standardized unit economics (MRR, ARR, LTV:CAC), TRL readiness (1-9), and A/B test sample sizing.</span>
              </div>
              <div className="seo-editorial-feature-item">
                <Sparkles size={13} className="feature-item-icon" />
                <span><strong>Live EU &amp; Cascade Grants:</strong> Real-time discovery of 600+ European Commission Horizon Europe calls and FSTP sub-grants with deadline trackers.</span>
              </div>
            </div>

            <div className="seo-editorial-tags">
              <span className="seo-editorial-tag">Client-Side WASM</span>
              <span className="seo-editorial-tag">Zero Server Logging</span>
              <span className="seo-editorial-tag">Free PDF Editor &amp; Merger</span>
              <span className="seo-editorial-tag">EU Funding &amp; Cascade Grants</span>
              <span className="seo-editorial-tag">SaaS Financial Models</span>
              <span className="seo-editorial-tag">TRL Readiness Calculator</span>
              <span className="seo-editorial-tag">LLM Token Counter</span>
              <span className="seo-editorial-tag">Privacy-First AI Tools</span>
            </div>
          </div>
        </div>

        {/* High-Intent Search Keyword Tags Cloud */}
        <div className="seo-footer-keywords-section">
          <h4 className="seo-keywords-title">Popular Free Utilities &amp; High-Intent Search Queries</h4>
          <div className="seo-keywords-cloud">
            <a href="#/tool/eu-funding-opportunities" onClick={() => handleToolClick('eu-funding-opportunities')}>EU Horizon Europe Funding Calls 2026</a>
            <a href="#/tool/eu-funding-opportunities" onClick={() => handleToolClick('eu-funding-opportunities')}>Cascade Funding FSTP Grants Directory</a>
            <a href="#/tool/eu-funding-opportunities" onClick={() => handleToolClick('eu-funding-opportunities')}>European Commission Open Tenders</a>
            <a href="#/tool/trl-calculator" onClick={() => handleToolClick('trl-calculator')}>Technology Readiness Level TRL Calculator</a>
            <a href="#/tool/sample-size-calculator" onClick={() => handleToolClick('sample-size-calculator')}>A/B Test Statistical Sample Size</a>
            <a href="#/tool/pdf-merger" onClick={() => handleToolClick('pdf-merger')}>Merge PDF Files Online Free</a>
            <a href="#/tool/pdf-splitter" onClick={() => handleToolClick('pdf-splitter')}>Split PDF by Page Numbers</a>
            <a href="#/tool/token-counter-universal" onClick={() => handleToolClick('token-counter-universal')}>Universal LLM Token Counter</a>
            <a href="#/tool/startup-runway-calculator" onClick={() => handleToolClick('startup-runway-calculator')}>Startup Runway Calculator</a>
            <a href="#/tool/mrr-calculator" onClick={() => handleToolClick('mrr-calculator')}>SaaS MRR Calculator</a>
            <a href="#/tool/arr-calculator" onClick={() => handleToolClick('arr-calculator')}>ARR to MRR Calculator</a>
            <a href="#/tool/churn-calculator" onClick={() => handleToolClick('churn-calculator')}>SaaS Churn Rate Formula</a>
            <a href="#/tool/ltv-calculator" onClick={() => handleToolClick('ltv-calculator')}>Customer Lifetime Value LTV</a>
            <a href="#/tool/cac-calculator" onClick={() => handleToolClick('cac-calculator')}>Customer Acquisition Cost CAC</a>
            <a href="#/tool/ltv-cac-calculator" onClick={() => handleToolClick('ltv-cac-calculator')}>LTV to CAC Ratio Benchmark</a>
            <a href="#/tool/llms-txt-tools" onClick={() => handleToolClick('llms-txt-tools')}>Generate llms.txt Online</a>
            <a href="#/tool/ai-crawler-checker" onClick={() => handleToolClick('ai-crawler-checker')}>AI Crawler Robots.txt Tester</a>
            <a href="#/tool/ai-link-hallucination-checker" onClick={() => handleToolClick('ai-link-hallucination-checker')}>AI Hallucination Fact Checker</a>
            <a href="#/tool/pdf-compressor" onClick={() => handleToolClick('pdf-compressor')}>Compress PDF to 200KB</a>
            <a href="#/tool/pdf-editor" onClick={() => handleToolClick('pdf-editor')}>Edit PDF Text Online Free</a>
            <a href="#/tool/ats-resume-checker" onClick={() => handleToolClick('ats-resume-checker')}>Free AI Resume Checker</a>
            <a href="#/tool/background-remover" onClick={() => handleToolClick('background-remover')}>Remove Background HD</a>
            <a href="#/tool/youtube-thumbnail-downloader" onClick={() => handleToolClick('youtube-thumbnail-downloader')}>YouTube 4K Thumbnail Grab</a>
            <a href="#/tool/image-compressor" onClick={() => handleToolClick('image-compressor')}>JPEG to WebP Converter</a>
            <a href="#/tool/video-compressor" onClick={() => handleToolClick('video-compressor')}>Compress MP4 Video Client-Side</a>
            <a href="#/tool/webhook-tester" onClick={() => handleToolClick('webhook-tester')}>Discord &amp; Slack Webhook Tester</a>
            <a href="#/tool/json-beautifier" onClick={() => handleToolClick('json-beautifier')}>JSON Beautifier Online</a>
            <a href="#/tool/email-signature-generator" onClick={() => handleToolClick('email-signature-generator')}>HTML Email Signature</a>
            <a href="#/tool/pdf-rag-cleaner" onClick={() => handleToolClick('pdf-rag-cleaner')}>PDF to Markdown Vector RAG</a>
            <a href="#/tool/ai-content-detector" onClick={() => handleToolClick('ai-content-detector')}>AI Content Detector 100%</a>
            <a href="#/tool/pomodoro-timer" onClick={() => handleToolClick('pomodoro-timer')}>Pomodoro Timer Online</a>
            <a href="#/tool/qr-code-generator" onClick={() => handleToolClick('qr-code-generator')}>Vector SVG QR Code</a>
            <a href="#/tool/html-to-llm-markdown" onClick={() => handleToolClick('html-to-llm-markdown')}>HTML to LLM Markdown</a>
          </div>
        </div>

        {/* Bottom Legal, Privacy Guarantee & Corporate Entity Bar */}
        <div className="seo-footer-bottom">
          <div className="seo-footer-bottom-legal">
            <p className="seo-privacy-notice" title="Privacy Assurance: 100% local in-browser processing via WebAssembly & WebGPU. Zero server file uploads.">
              <CheckCircle2 size={14} className="privacy-check-icon" />
              <span>
                <strong>Privacy Assurance:</strong> 100% local in-browser processing via WebAssembly &amp; WebGPU. Zero server file uploads.
              </span>
            </p>
            <p className="seo-corporate-badge" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.45rem 0 0 0', lineHeight: 1.5 }}>
              <strong>CERİLAS Yüksek Teknoloji San. ve Tic. AŞ</strong> &bull; VKN: 2061561435 &bull; <a href="mailto:law@cerilas.com" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>law@cerilas.com</a> &bull; Gaziantep, Türkiye
            </p>
          </div>

          <div className="seo-footer-bottom-meta">
            <p className="seo-copyright">
              © {currentYear} CERİLAS Yüksek Teknoloji San. ve Tic. AŞ. All rights reserved.
            </p>
            <div className="seo-footer-bottom-links">
              <a href="#/legal/terms" onClick={() => handleLegalClick('terms')}>Terms</a>
              <span className="dot">•</span>
              <a href="#/legal/privacy" onClick={() => handleLegalClick('privacy')}>Privacy</a>
              <span className="dot">•</span>
              <a href="#/legal/refund" onClick={() => handleLegalClick('refund')}>Refund</a>
              <span className="dot">•</span>
              <a href="#/legal/cookies" onClick={() => handleLegalClick('cookies')}>Cookies</a>
              <span className="dot">•</span>
              <a href="https://cerilas.com" target="_blank" rel="noopener noreferrer">Cerilas.com</a>
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
