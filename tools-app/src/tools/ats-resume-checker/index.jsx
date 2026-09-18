import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Check,
  Cpu,
  Layers,
  ShieldCheck,
  Trash2,
  Bot,
  Lock,
  X,
  Clock
} from 'lucide-react';
import { atsResumeCheckerManifest } from './manifest';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Button, Badge, Card, ToolHeader, AdSlot, QuotaModal } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import { extractTextFromPdf } from './pdfParser';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import AtsResumeCheckerSeo from './components/AtsResumeCheckerSeo';
import './ats-resume-checker.css';

const SAMPLE_JD = `Senior Full Stack Software Engineer
Requirements:
- 5+ years of experience with React, TypeScript, and Node.js.
- Strong knowledge of relational databases (PostgreSQL) and RESTful API architecture.
- Hands-on experience with cloud providers (AWS or GCP) and Docker containerization.
- Familiarity with CI/CD pipelines, Jest unit testing, and Agile workflows.
- Excellent communication skills, system architecture mindset, and mentoring abilities.`;

const SAMPLE_RESUME = `Jane Doe - Software Engineer
Email: jane.doe@example.com | Phone: +1 555-0199 | LinkedIn: linkedin.com/in/janedoe

PROFESSIONAL SUMMARY
Passionate Full Stack Developer with 4 years of experience building modern web applications using React, JavaScript, and Node.js. Experienced in database management and frontend optimization.

TECHNICAL SKILLS
- Languages & Frameworks: JavaScript, React, Node.js, Express, HTML5, CSS3, TailwindCSS
- Databases: MongoDB, PostgreSQL
- Tools: Git, GitHub, Webpack, Postman

EXPERIENCE
Software Engineer | Acme Tech Solutions (2022 - Present)
- Developed responsive client web apps using React and Node.js, improving page load speed by 25%.
- Implemented PostgreSQL database schemas and optimized SQL queries.
- Collaborated with cross-functional teams in bi-weekly sprint planning meetings.

Junior Web Developer | Innovate Soft (2020 - 2022)
- Built internal dashboard tools using JavaScript and Express.
- Wrote API endpoints and handled user authentication workflows.

EDUCATION
B.S. in Computer Science - State University (2016 - 2020)`;

export default function AtsResumeCheckerTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    atsResumeCheckerManifest.slug,
    toolMeta
  );
  const fileInputRef = useRef(null);

  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [pdfMeta, setPdfMeta] = useState(null); // { fileName, fileSize, numPages, wordCount, isScanned }
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showBotPreview, setShowBotPreview] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [quota, setQuota] = useState({ limit: 3, remaining: 3, resetInMinutes: 0 });
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  // Fetch initial hourly quota
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const vid = getOrCreateVisitorId();
        const res = await fetch(`/api/ats/quota?visitorId=${encodeURIComponent(vid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quota) {
            setQuota(data.quota);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch AI quota:', e);
      }
    };
    fetchQuota();
  }, []);

  // Handle PDF / Text file drop & selection
  const processUploadedFile = async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (!isPdf && !isTxt) {
      setError('Please upload a PDF (.pdf) or Plain Text (.txt) resume.');
      return;
    }

    if (isPdf) {
      setIsParsingPdf(true);
      try {
        const parsed = await extractTextFromPdf(file);
        if (!parsed.success) {
          setError(parsed.error || 'Failed to read PDF file.');
          return;
        }

        setPdfMeta({
          fileName: parsed.fileName,
          fileSize: parsed.fileSize,
          numPages: parsed.numPages,
          wordCount: parsed.wordCount,
          isScanned: parsed.isScanned
        });
        setResumeText(parsed.text);

        if (parsed.isScanned) {
          setError('Warning: This PDF appears to be a scanned image or has non-extractable text. ATS bots cannot read images! Use a text-based PDF for best results.');
        }
      } catch (err) {
        setError('Error reading PDF: ' + err.message);
      } finally {
        setIsParsingPdf(false);
      }
    } else if (isTxt) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || '';
        setResumeText(text);
        setPdfMeta({
          fileName: file.name,
          fileSize: file.size,
          numPages: 1,
          wordCount: text.split(/\s+/).length,
          isScanned: false
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleFillSample = () => {
    setJobDescription(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
    setPdfMeta({
      fileName: 'Sample_Jane_Doe_Resume.pdf',
      fileSize: 42500,
      numPages: 1,
      wordCount: SAMPLE_RESUME.split(/\s+/).length,
      isScanned: false
    });
    setError(null);
    setResult(null);
  };

  const handleClear = () => {
    setJobDescription('');
    setResumeText('');
    setPdfMeta(null);
    setResult(null);
    setError(null);
    setShowBotPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please upload your Resume PDF or provide resume text.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please provide the Target Job Description to evaluate against.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const vid = getOrCreateVisitorId();
      const response = await fetch('/api/ats/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resumeText, visitorId: vid })
      });

      const data = await response.json();

      if (data.quota) {
        setQuota(data.quota);
      }

      if (!response.ok) {
        if (response.status === 429) {
          setQuotaModalOpen(true);
          setError(data.error || 'Hourly AI limit reached (3 scans per hour). Please try again later.');
          return;
        }
        throw new Error(data.error || data.message || 'Analysis failed. Please try again.');
      }

      setResult(data);
      trackAction('use', { score: data.score });
    } catch (err) {
      console.error('ATS Analyze error:', err);
      setError(err.message || 'Failed to connect to the analysis engine. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `ATS Match Score: ${result.score}%
Verdict: ${result.score >= 80 ? 'Strong Match' : result.score >= 60 ? 'Moderate Match' : 'Low Match'}

Missing Keywords:
${result.missingKeywords?.map((k) => `- ${k}`).join('\n') || 'None'}

Matching Keywords:
${result.matchingKeywords?.map((k) => `- ${k}`).join('\n') || 'None'}

Formatting & Structure:
${result.formattingIssues?.map((f) => `- ${f}`).join('\n') || 'None'}

Actionable Suggestions:
${result.suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}
`;
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="c-tool-page-container ats-checker-page">
      {/* Standardized Tool Header */}
      <ToolHeader
        title={atsResumeCheckerManifest.title}
        subtitle="Upload your Resume (PDF) to test bot readability and match score against any target job description."
        onBack={onBack}
        backLabel="All Tools"
        badges={
          <>
            <Badge variant="purple" icon={<Sparkles size={13} />}>
              AI Assisted
            </Badge>
            <div
              onClick={() => setQuotaModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Click to view hourly quota details"
            >
              <Badge
                variant={quota.remaining > 0 ? 'neutral' : 'warning'}
                icon={<Clock size={12} />}
              >
                {quota.remaining} / {quota.limit} Hourly Scans Left
              </Badge>
            </div>
            <Badge variant="success" icon={<ShieldCheck size={13} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Quota Modal Component */}
      <QuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        limit={quota.limit}
        resetInMinutes={quota.resetInMinutes}
        toolName="ATS Resume Checker"
      />

      {/* Inputs Grid */}
      <div className="ats-input-grid">
        {/* Step 1: Resume Upload (PDF) */}
        <Card
          size="sm"
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
              <FileCheck size={16} /> 1. Upload Resume (PDF / TXT)
            </span>
          }
          headerAction={
            pdfMeta && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                icon={<Trash2 size={13} />}
              >
                Remove
              </Button>
            )
          }
        >
          {!pdfMeta ? (
            <div
              className={`ats-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="ats-dropzone-icon">
                {isParsingPdf ? (
                  <Sparkles size={24} className="c-btn-spinner" />
                ) : (
                  <UploadCloud size={24} />
                )}
              </div>
              <div className="ats-dropzone-title">
                {isParsingPdf ? 'Parsing PDF in Browser...' : 'Drag & drop your Resume PDF here'}
              </div>
              <div className="ats-dropzone-sub">
                or click to browse from device (.pdf, .txt • Max 10MB)
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <Lock size={12} />
                <span>100% Private: Documents are parsed locally in your browser</span>
              </div>
            </div>
          ) : (
            <div className="ats-file-card">
              {/* File Info Header */}
              <div className="ats-file-info-bar">
                <div className="ats-file-meta">
                  <FileText size={20} color="var(--text-main)" />
                  <div>
                    <div className="ats-file-name">{pdfMeta.fileName}</div>
                    <div className="ats-file-details">
                      {(pdfMeta.fileSize / 1024).toFixed(1)} KB • {pdfMeta.numPages} Page(s) • {pdfMeta.wordCount} Words
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* ATS Bot Machine Readability Status Banner */}
              {pdfMeta.isScanned ? (
                <div className="ats-parse-status ats-parse-warning">
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>ATS Bot Readability: FAILED</strong>
                    <div>This PDF appears to be a scanned image or flattened graphics. ATS bots cannot read any text from it and will reject your application!</div>
                  </div>
                </div>
              ) : (
                <div className="ats-parse-status ats-parse-success">
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>ATS Bot Readability: PASSED</strong>
                    <div>Text was successfully extracted by the parser. ATS bots can read your sections cleanly.</div>
                  </div>
                </div>
              )}

              {/* Bot View Toggle & Preview */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={showBotPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  onClick={() => setShowBotPreview(!showBotPreview)}
                >
                  {showBotPreview ? 'Hide Bot View' : 'Preview What ATS Bots See'}
                </Button>

                {showBotPreview && (
                  <div className="ats-extracted-preview">
                    {resumeText || 'No text extracted.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: Target Job Description */}
        <Card
          size="sm"
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
              <Layers size={16} /> 2. Target Job Description
            </span>
          }
          headerAction={
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {jobDescription.length} chars
            </span>
          }
        >
          <textarea
            className="ats-textarea"
            placeholder="Paste the target job description or requirements here to calculate keyword match..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="ats-actions-bar">
        <div className="ats-actions-group">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={quota.remaining === 0}
            icon={<Sparkles size={17} />}
          >
            {isAnalyzing
              ? 'Evaluating against ATS algorithms...'
              : quota.remaining === 0
              ? `Hourly Limit Reached (${quota.resetInMinutes}m reset)`
              : 'Run ATS Scan & Match'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleFillSample}
            disabled={isAnalyzing}
            icon={<Cpu size={15} />}
          >
            Load Sample Data
          </Button>

          {(jobDescription || resumeText || result) && (
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClear}
              disabled={isAnalyzing}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="ats-error-box">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Results */}
      {result && (
        <div className="ats-results-container">
          {/* Overall Score Card */}
          <Card className="ats-score-hero">
            <span className="ats-score-label">Overall ATS Match Score</span>
            <div
              className={`ats-score-number ${
                result.score >= 80 ? 'ats-score-high' : result.score >= 60 ? 'ats-score-mid' : 'ats-score-low'
              }`}
            >
              {result.score}%
            </div>
            <div className="ats-score-verdict">
              {result.score >= 80
                ? 'Excellent match! Your resume aligns closely with this job specification and parses cleanly.'
                : result.score >= 60
                ? 'Good match. Adding the missing keywords and addressing formatting risks below will boost callbacks.'
                : 'Low match. Several critical skills and keywords are missing from your resume.'}
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyReport}
                icon={copiedReport ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              >
                {copiedReport ? 'Report Copied!' : 'Copy Summary Report'}
              </Button>
            </div>
          </Card>

          {/* Keywords Grid */}
          <div className="ats-grid-two">
            {/* Missing Keywords */}
            <Card
              size="sm"
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <XCircle size={18} color="#ef4444" />
                  Missing Keywords & Skills ({result.missingKeywords?.length || 0})
                </span>
              }
            >
              {result.missingKeywords && result.missingKeywords.length > 0 ? (
                <div className="ats-pill-list">
                  {result.missingKeywords.map((kw, idx) => (
                    <span key={idx} className="ats-pill-tag ats-pill-missing">
                      <X size={12} style={{ flexShrink: 0 }} />
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  All primary keywords from the job description are present in your resume.
                </p>
              )}
            </Card>

            {/* Matching Keywords */}
            <Card
              size="sm"
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  Matched Keywords & Skills ({result.matchingKeywords?.length || 0})
                </span>
              }
            >
              {result.matchingKeywords && result.matchingKeywords.length > 0 ? (
                <div className="ats-pill-list">
                  {result.matchingKeywords.map((kw, idx) => (
                    <span key={idx} className="ats-pill-tag ats-pill-matching">
                      <Check size={12} style={{ flexShrink: 0 }} />
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  No clear keyword matches detected yet.
                </p>
              )}
            </Card>
          </div>

          {/* Formatting & Suggestions Grid */}
          <div className="ats-grid-two">
            {/* Formatting Red Flags */}
            <Card
              size="sm"
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  ATS Readability & Formatting Trap Audit
                </span>
              }
            >
              {result.formattingIssues && result.formattingIssues.length > 0 ? (
                <ul className="ats-issues-list">
                  {result.formattingIssues.map((issue, idx) => (
                    <li key={idx}>
                      <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <CheckCircle2 size={16} /> No major structural red flags detected. Clean layout!
                </p>
              )}
            </Card>

            {/* Suggestions */}
            <Card
              size="sm"
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Lightbulb size={18} color="var(--text-main)" />
                  Targeted Optimization Tips
                </span>
              }
            >
              {result.suggestions && result.suggestions.length > 0 ? (
                <ul className="ats-suggestions-list">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="ats-suggestion-item">
                      <span className="ats-suggestion-num">{idx + 1}</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Your resume is highly optimized for this role.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="ats-features-grid">
        <Card size="sm" className="ats-feature-card">
          <h4>Bot Readability Test</h4>
          <p>Instantly verifies whether your PDF has selectable text or is blocked as a scanned image by ATS parsers.</p>
        </Card>
        <Card size="sm" className="ats-feature-card">
          <h4>"What Bots See" Preview</h4>
          <p>Inspect the raw parsed text to confirm your contact details, chronology, and headings extract correctly.</p>
        </Card>
        <Card size="sm" className="ats-feature-card">
          <h4>Semantic AI Matching</h4>
          <p>Compares candidate qualifications against job descriptions using Google Gemini 3 Flash reasoning.</p>
        </Card>
        <Card size="sm" className="ats-feature-card">
          <h4>Zero Server Uploads</h4>
          <p>Your PDF is parsed 100% locally in your web browser, ensuring complete confidentiality of your CV.</p>
        </Card>
      </div>

      {/* In-Depth Educational Guide, Comparison Matrix & Schema.org FAQ SEO (Partitioned below the fold) */}
      <ToolSeoDivider label="ATS Guide, Formatting Standards & FAQs" />
      <AtsResumeCheckerSeo />

      {/* Bottom Billboard Ad */}
      <AdSlot format="billboard" slotId="ad-ats-bottom-billboard" />
    </div>
  );
}
