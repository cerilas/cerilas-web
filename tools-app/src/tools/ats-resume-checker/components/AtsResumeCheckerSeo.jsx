import SearchableHidden, { useSupportsUntilFound } from '../../../components/ui/SearchableHidden';
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  FileCheck,
  Cpu,
  Layers,
  Search,
  Check,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  Briefcase,
  FileText,
  Lock,
  Compass,
  ArrowRight
} from 'lucide-react';
import './AtsResumeCheckerSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is an ATS (Applicant Tracking System) and why does it matter?',
    a: 'An Applicant Tracking System (ATS) is enterprise recruitment software—such as Workday, Taleo, Greenhouse, Lever, Ashby, or BambooHR—used by over 98% of Fortune 500 companies and 75% of high-growth tech firms. Before any human recruiter or hiring manager reads your resume, the ATS scans, extracts (parses), and ranks your CV based on job description alignment, hard/soft keywords, experience relevance, and structural readability.'
  },
  {
    q: 'Why do resumes get rejected by ATS bots even when the candidate is qualified?',
    a: 'The most common causes of silent ATS rejection are parsing failures and keyword misalignment. Complex multi-column templates, tables, Canva text boxes, graphics, non-standard section titles, or flattened scanned PDFs corrupt the text parser. When the bot cannot extract your job titles, dates, or core skills, your application is scored as a low-match and filtered out automatically.'
  },
  {
    q: 'Should I upload a PDF or Microsoft Word (.docx) file for ATS scanning?',
    a: 'Both PDF and .docx are widely supported by modern ATS, but PDF is preferred because it preserves your visual typography across different operating systems. However, you must ensure your PDF contains real vector selectable text rather than flattened bitmap raster images. Our tool parses your PDF directly in your browser to verify whether bots can extract pure text from your file.'
  },
  {
    q: 'Why should contact information and skills never be placed in document headers or footers?',
    a: 'Many legacy and enterprise ATS parsers (like Taleo and older Workday versions) intentionally ignore text inside Microsoft Word or PDF document headers and footers to avoid repeating headers across pages. If your email address, phone number, LinkedIn URL, or skills are located in the header area, the system may register your application with zero contact info or missing competencies.'
  },
  {
    q: 'How does AI semantic matching differ from old-school exact keyword stuffing?',
    a: 'Older ATS engines relied solely on literal string matching (e.g., counting how many times "Kubernetes" appeared). Modern ATS systems and Google Gemini AI use semantic vector embeddings. They understand conceptual equivalents—such as recognizing that "PostgreSQL administration" relates to "relational database design" or "React.js" relates to "frontend web architecture". Rather than keyword stuffing, your resume must contextualize skills with quantifiable achievements.'
  },
  {
    q: 'What is considered a good ATS match score percentage?',
    a: 'A score of 80% or higher generally puts your resume in the top tier for recruiter interview screening. A score between 65% and 79% indicates a strong baseline with opportunities to incorporate missing terminology from the job description. Scores below 60% usually suffer from missing technical competencies, vague bullet points, or parsing errors.'
  },
  {
    q: 'Is my resume kept private and secure when I use this tool?',
    a: 'Yes, 100%. PDF text extraction is processed entirely client-side in your local browser memory using pdf.js. No resume files are ever saved or stored on our servers. When you run the AI match check, your resume text and target job description are processed via an ephemeral, secure API call solely to generate your feedback, with zero persistent storage.'
  },
  {
    q: 'Is this ATS Resume Checker completely free?',
    a: 'Yes. Cerilas Tools provides this AI ATS Resume Checker 100% free with no account creation, subscription paywalls, or credit cards required. To ensure equal availability and prevent abuse, each visitor has an hourly allowance of 3 full AI scans, which automatically resets every hour.'
  }
];

export default function AtsResumeCheckerSeo() {
  const supportsUntilFound = useSupportsUntilFound();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="ats-seo-root" aria-label="ATS Optimization Guide & Frequently Asked Questions">
      {/* Header */}
      <div className="ats-seo-header">
        <div className="ats-seo-badge">
          <Sparkles size={13} />
          <span>ATS Career Optimization Architecture</span>
        </div>
        <h2 className="ats-seo-main-title">
          How Applicant Tracking Systems Work & Why 75% of Resumes Never Reach a Human
        </h2>
        <p className="ats-seo-main-desc">
          Modern recruitment at top technology, finance, and enterprise companies relies on algorithmic filtering. 
          Understand how recruitment parsers interpret your CV, eliminate hidden formatting traps, and optimize your job match rate.
        </p>
      </div>

      {/* AI Knowledge Capsule */}
      <div className="ats-ai-capsule">
        <div className="ats-capsule-header">
          <Cpu className="ats-capsule-icon" size={20} />
          <h3 className="ats-capsule-title">The Anatomy of Modern ATS Parsing Engines</h3>
        </div>
        <div className="ats-capsule-body">
          Recruitment platforms like <strong>Workday, Greenhouse, Taleo, Lever, and Ashby</strong> convert incoming PDF and DOCX files into 
          structured database records. If your resume contains non-standard text layers, multi-column tables, or complex CSS artifacts, 
          the parser extracts empty strings or garbled characters, resulting in automatic disqualification before recruiter review.
        </div>
        <div className="ats-capsule-highlights">
          <div className="ats-capsule-item">
            <FileText size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} />
            <div>
              <strong>Pure Vector Text Extraction:</strong> Ensures every bullet point, job title, and company name is machine-readable without OCR distortion.
            </div>
          </div>
          <div className="ats-capsule-item">
            <Search size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
            <div>
              <strong>Semantic Entity Matching:</strong> Analyzes skill proximity and context rather than crude keyword frequency counting.
            </div>
          </div>
          <div className="ats-capsule-item">
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#8b5cf6' }} />
            <div>
              <strong>Safe Structural Hierarchy:</strong> Guarantees standard headers (Experience, Education, Skills) are accurately indexed.
            </div>
          </div>
        </div>
      </div>

      {/* Three Pillars Section */}
      <div className="ats-pillars-grid">
        <div className="ats-pillar-card">
          <div className="ats-pillar-icon-box">
            <Layers size={20} />
          </div>
          <h3 className="ats-pillar-title">1. Structural Readability</h3>
          <p className="ats-pillar-desc">
            ATS software reads resumes linearly from top to bottom, left to right. Two-column layouts, sidebars, and embedded text boxes 
            cause parsers to read across columns, scrambling chronological job titles, company names, and dates into unreadable fragments.
          </p>
        </div>

        <div className="ats-pillar-card">
          <div className="ats-pillar-icon-box">
            <Search size={20} />
          </div>
          <h3 className="ats-pillar-title">2. Targeted Keyword Density</h3>
          <p className="ats-pillar-desc">
            Hiring managers define search filters with required tools, programming languages, and certifications. If a job posting specifies 
            &quot;React, TypeScript, and AWS&quot;, your resume must include these exact terms within contextual project bullet points.
          </p>
        </div>

        <div className="ats-pillar-card">
          <div className="ats-pillar-icon-box">
            <Compass size={20} />
          </div>
          <h3 className="ats-pillar-title">3. Quantifiable Impact</h3>
          <p className="ats-pillar-desc">
            AI-enhanced screening tools evaluate achievements over passive responsibility lists. Resumes emphasizing measurable business impact 
            (e.g., &quot;increased conversion by 34%&quot; or &quot;reduced latency by 120ms&quot;) receive consistently higher match scores.
          </p>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="ats-comparison-section">
        <div>
          <h3 className="ats-section-heading">ATS-Friendly vs. ATS-Hostile Resume Elements</h3>
          <p className="ats-section-subheading">
            Review the essential design choices that determine whether recruitment bots can properly index your qualifications.
          </p>
        </div>
        <div className="ats-table-container">
          <table className="ats-comparison-table">
            <thead>
              <tr>
                <th>Resume Element</th>
                <th>ATS-Friendly Standard (High Pass Rate)</th>
                <th>ATS-Hostile Pitfall (High Rejection Risk)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Document Layout</strong></td>
                <td>
                  <span className="ats-status-tag pass">
                    <Check size={14} /> Single-column clean vertical hierarchy
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Reads chronologically without parsing collisions.</div>
                </td>
                <td>
                  <span className="ats-status-tag fail">
                    <AlertTriangle size={14} /> Multi-column grids, sidebars & text boxes
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Parsers read across columns, scrambling dates and text.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Contact Details</strong></td>
                <td>
                  <span className="ats-status-tag pass">
                    <Check size={14} /> Main body text at the top of page 1
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Email, phone, and LinkedIn immediately tokenized.</div>
                </td>
                <td>
                  <span className="ats-status-tag fail">
                    <AlertTriangle size={14} /> Document header or footer areas
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Ignored by Taleo and Workday to prevent repeating headers.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Skills Section</strong></td>
                <td>
                  <span className="ats-status-tag pass">
                    <Check size={14} /> Plain text bulleted or comma-separated lists
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Parsed directly as discrete competencies.</div>
                </td>
                <td>
                  <span className="ats-status-tag fail">
                    <AlertTriangle size={14} /> Visual skill bars, star ratings, or graphics
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Images are invisible to text parsers, registering zero skills.</div>
                </td>
              </tr>
              <tr>
                <td><strong>Section Headers</strong></td>
                <td>
                  <span className="ats-status-tag pass">
                    <Check size={14} /> Standard headings (Work Experience, Education, Skills)
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Mapped accurately to ATS database categories.</div>
                </td>
                <td>
                  <span className="ats-status-tag fail">
                    <AlertTriangle size={14} /> Creative titles (&quot;Where I&apos;ve Been&quot;, &quot;My DNA&quot;)
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Unrecognized headings cause sections to be categorized as miscellaneous.</div>
                </td>
              </tr>
              <tr>
                <td><strong>File Format</strong></td>
                <td>
                  <span className="ats-status-tag pass">
                    <Check size={14} /> Text-based vector PDF or standard .docx
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Allows instant extraction of copyable text.</div>
                </td>
                <td>
                  <span className="ats-status-tag fail">
                    <AlertTriangle size={14} /> Image-only PDFs (Canva flattened JPEGs)
                  </span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Shows as 0 words extracted; immediate candidate drop.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Steps Framework */}
      <div className="ats-steps-section">
        <div>
          <h3 className="ats-section-heading">4 Steps to Optimize Your CV for High Interview Callbacks</h3>
          <p className="ats-section-subheading">
            Follow this systematic approach with each job application to maximize your recruiter visibility.
          </p>
        </div>
        <div className="ats-steps-grid" style={{ marginTop: '1rem' }}>
          <div className="ats-step-card">
            <span className="ats-step-number">Step 01</span>
            <h4 className="ats-step-title">Upload & Test Bot View</h4>
            <p className="ats-step-text">
              Upload your PDF to inspect the raw text extraction. Verify that dates, job titles, and contact information appear in proper logical order.
            </p>
          </div>

          <div className="ats-step-card">
            <span className="ats-step-number">Step 02</span>
            <h4 className="ats-step-title">Target Job Description</h4>
            <p className="ats-step-text">
              Paste the complete job posting text to give the AI engine the exact benchmarks and competencies required by the hiring company.
            </p>
          </div>

          <div className="ats-step-card">
            <span className="ats-step-number">Step 03</span>
            <h4 className="ats-step-title">Analyze Gaps & Score</h4>
            <p className="ats-step-text">
              Review your overall match score, uncover missing hard/soft skills, and examine structural formatting recommendations.
            </p>
          </div>

          <div className="ats-step-card">
            <span className="ats-step-number">Step 04</span>
            <h4 className="ats-step-title">Refine Bullet Points</h4>
            <p className="ats-step-text">
              Incorporate high-priority missing keywords organically within your bullet points, quantify results, and re-scan to hit an 80%+ match rate.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="ats-faq-section">
        <div>
          <h3 className="ats-section-heading">Frequently Asked Questions (FAQ)</h3>
          <p className="ats-section-subheading">
            Everything you need to know about applicant tracking systems, resume scanning, and career privacy.
          </p>
        </div>

        <div className="ats-faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`ats-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button
                type="button"
                className="ats-faq-question-btn"
                onClick={() => toggleFaq(idx)}
                aria-expanded={(openFaq === idx) || !supportsUntilFound}
              >
                <span>{item.q}</span>
                <ChevronDown className="ats-faq-chevron" size={18} />
              </button>
              <SearchableHidden isOpen={openFaq === idx} onReveal={() => setOpenFaq(idx)}>
                  <div className="ats-faq-answer">
                  <p>{item.a}</p>
                </div>
                </SearchableHidden>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
