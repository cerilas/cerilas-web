import React, { useState, useRef, useEffect } from 'react';
import { 
  Rocket, 
  Briefcase, 
  Laptop, 
  Microscope, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import './PersonaMenu.css';

export const PERSONA_CONFIGS = [
  {
    id: 'entrepreneur',
    title: 'Entrepreneur',
    subtitle: 'Startups, founders & growth',
    icon: Rocket,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    showcaseTitle: 'Top Tools for Entrepreneurs & Founders',
    showcaseSubtitle: 'Scale faster, calculate unit economics & automate pitches',
    tools: [
      {
        slug: 'startup-runway-calculator',
        title: 'Runway & Burn',
        desc: 'Calculate runway, burn rate & zero cash date',
        badge: 'Finance'
      },
      {
        slug: 'mrr-calculator',
        title: 'MRR & ARR',
        desc: 'Track recurring subscription revenues',
        badge: 'Finance'
      },
      {
        slug: 'ltv-cac-calculator',
        title: 'LTV / CAC Ratio',
        desc: 'Unit economics, payback & CAC health',
        badge: 'Metrics'
      },
      {
        slug: 'churn-calculator',
        title: 'Churn Calculator',
        desc: 'Analyze customer and revenue churn',
        badge: 'Growth'
      },
      {
        slug: 'trl-calculator',
        title: 'TRL Calculator',
        desc: 'Assess Technology Readiness for grants',
        badge: 'R&D'
      },
      {
        slug: 'email-signature-generator',
        title: 'Email Signature',
        desc: 'Build branded executive email signatures',
        badge: 'Branding'
      },
      {
        slug: 'pdf-merger',
        title: 'PDF Merger',
        desc: 'Combine investor decks & due diligence',
        badge: '100% Private'
      },
      {
        slug: 'qr-generator',
        title: 'QR Generator',
        desc: 'Dynamic QR codes for events & products',
        badge: 'Marketing'
      }
    ]
  },
  {
    id: 'whiteCollar',
    title: 'White Collar',
    subtitle: 'Corporate teams & managers',
    icon: Briefcase,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    showcaseTitle: 'Top Tools for Corporate & Office Professionals',
    showcaseSubtitle: 'Document workflows, career advancement & focus tools',
    tools: [
      {
        slug: 'ats-resume-checker',
        title: 'ATS Resume AI',
        desc: 'Score your resume against job specs',
        badge: 'AI Powered'
      },
      {
        slug: 'pdf-compressor',
        title: 'PDF Compressor',
        desc: 'Reduce PDF size for email (< 1MB / 200KB)',
        badge: '100% Private'
      },
      {
        slug: 'pdf-merger',
        title: 'PDF Merger',
        desc: 'Combine reports, invoices & contracts',
        badge: '100% Private'
      },
      {
        slug: 'pdf-splitter',
        title: 'PDF Splitter',
        desc: 'Extract chapters, custom ranges & pages',
        badge: '100% Private'
      },
      {
        slug: 'pdf-editor',
        title: 'PDF Editor',
        desc: 'Privately fill, sign & annotate forms',
        badge: '100% Private'
      },
      {
        slug: 'email-signature-generator',
        title: 'Email Signature',
        desc: 'Create corporate HTML email signatures',
        badge: 'Productivity'
      },
      {
        slug: 'pomodoro-timer',
        title: 'Pomodoro Timer',
        desc: 'Boost focus with ambient productivity audio',
        badge: 'Productivity'
      },
      {
        slug: 'background-remover',
        title: 'Background Remover',
        desc: 'Polish LinkedIn & headshot photos',
        badge: 'AI Powered'
      }
    ]
  },
  {
    id: 'freelancer',
    title: 'Freelancer',
    subtitle: 'Solopreneurs & digital creators',
    icon: Laptop,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    showcaseTitle: 'Top Tools for Freelancers & Contractors',
    showcaseSubtitle: 'Asset optimization, client handoffs & contract signing',
    tools: [
      {
        slug: 'background-remover',
        title: 'Background Remover',
        desc: 'Cut out image backgrounds in 1 click',
        badge: 'AI Powered'
      },
      {
        slug: 'image-compressor',
        title: 'Image Compressor',
        desc: 'Batch optimize client photos & WebP',
        badge: 'Media'
      },
      {
        slug: 'video-compressor',
        title: 'Video Compressor',
        desc: 'Compress MP4 & WebM client videos',
        badge: 'Media'
      },
      {
        slug: 'youtube-thumbnail-downloader',
        title: 'Thumbnail Grabber',
        desc: 'Extract 4K & HD YouTube video covers',
        badge: 'Media'
      },
      {
        slug: 'qr-generator',
        title: 'vCard QR Codes',
        desc: 'Share contact info & portfolio links',
        badge: 'Branding'
      },
      {
        slug: 'pdf-editor',
        title: 'PDF Sign & Fill',
        desc: 'Sign client NDAs & service agreements',
        badge: '100% Private'
      },
      {
        slug: 'email-signature-generator',
        title: 'Freelance Signature',
        desc: 'High-converting personal brand footer',
        badge: 'Branding'
      },
      {
        slug: 'pomodoro-timer',
        title: 'Focus Sprints',
        desc: 'Track billable deep work sessions',
        badge: 'Focus'
      }
    ]
  },
  {
    id: 'researcher',
    title: 'Researcher',
    subtitle: 'Academia, R&D & analysts',
    icon: Microscope,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    showcaseTitle: 'Top Tools for Researchers & Scientists',
    showcaseSubtitle: 'Statistical power, manuscript preparation & LLM ingestion',
    tools: [
      {
        slug: 'sample-size-calculator',
        title: 'Sample Size Calc',
        desc: 'Statistical power, surveys & clinical tests',
        badge: 'Statistics'
      },
      {
        slug: 'trl-calculator',
        title: 'TRL Calculator',
        desc: 'Evaluate Technology Readiness Levels',
        badge: 'R&D'
      },
      {
        slug: 'pdf-rag-cleaner',
        title: 'PDF RAG Cleaner',
        desc: 'Clean scientific papers for AI & LLMs',
        badge: 'AI & Data'
      },
      {
        slug: 'ai-content-detector',
        title: 'AI Detector',
        desc: 'Detect synthetic text in research drafts',
        badge: 'Verification'
      },
      {
        slug: 'token-counter-universal',
        title: 'Token Counter',
        desc: 'Accurate LLM tokens for Gemini & GPT',
        badge: 'AI & Data'
      },
      {
        slug: 'pdf-merger',
        title: 'PDF Merger',
        desc: 'Assemble papers & supplementary data',
        badge: '100% Private'
      },
      {
        slug: 'pdf-splitter',
        title: 'PDF Splitter',
        desc: 'Extract specific journal sections',
        badge: '100% Private'
      },
      {
        slug: 'html-to-llm-markdown',
        title: 'HTML to Markdown',
        desc: 'Format research documentation for AI',
        badge: 'AI & Data'
      }
    ]
  },
  {
    id: 'student',
    title: 'Student',
    subtitle: 'College, high school & study',
    icon: GraduationCap,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    showcaseTitle: 'Top Tools for Students & Learners',
    showcaseSubtitle: 'Ace your assignments, study sessions & internship applications',
    tools: [
      {
        slug: 'ats-resume-checker',
        title: 'Internship Resume',
        desc: 'Score your CV for summer internships',
        badge: 'Career'
      },
      {
        slug: 'ai-content-detector',
        title: 'AI Essay Detector',
        desc: 'Verify academic integrity & AI score',
        badge: 'Academic'
      },
      {
        slug: 'pdf-compressor',
        title: 'PDF Compressor',
        desc: 'Shrink assignments to fit upload limits',
        badge: '100% Private'
      },
      {
        slug: 'pdf-merger',
        title: 'PDF Merger',
        desc: 'Merge homework, slides & class notes',
        badge: '100% Private'
      },
      {
        slug: 'pdf-splitter',
        title: 'PDF Splitter',
        desc: 'Split heavy textbooks into chapters',
        badge: '100% Private'
      },
      {
        slug: 'pomodoro-timer',
        title: 'Study Pomodoro',
        desc: 'Study intervals with lo-fi & focus audio',
        badge: 'Study'
      },
      {
        slug: 'token-counter-universal',
        title: 'Token Counter',
        desc: 'Free token calculator for AI questions',
        badge: 'AI Tools'
      },
      {
        slug: 'image-compressor',
        title: 'Image Compressor',
        desc: 'Compress whiteboard & slide photos',
        badge: 'Media'
      }
    ]
  }
];

export default function PersonaMenu({ onSelectTool, onNavigateHome }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState('entrepreneur');
  const menuRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const activePersona = PERSONA_CONFIGS.find((p) => p.id === activePersonaId) || PERSONA_CONFIGS[0];

  // Mouse hover opening with debounce
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleToolClick = (slug) => {
    setIsOpen(false);
    if (onSelectTool) {
      onSelectTool(slug);
    } else {
      window.location.hash = `#/tool/${slug}`;
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="persona-backdrop" 
          onClick={() => setIsOpen(false)} 
          aria-hidden="true" 
        />
      )}
      <div 
        className="persona-menu-wrapper"
        ref={menuRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trigger Button */}
        <button 
          type="button" 
          className={`persona-menu-trigger ${isOpen ? 'is-open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>I'm a...</span>
          <ChevronDown size={14} className="persona-trigger-chevron" />
        </button>

        {/* Mega Dropdown Menu */}
        {isOpen && (
          <div className="persona-mega-dropdown" role="menu">
            {/* Mobile Header / Close Button */}
            <div className="persona-mobile-header">
              <span className="persona-mobile-header-title">Cerilas Roles</span>
              <button
                type="button"
                className="persona-mobile-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close role menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Left Column: 5 Persona Options */}
            <div className="persona-col-left">
              <div className="persona-col-header">Choose Your Role</div>

              {PERSONA_CONFIGS.map((persona) => {
                const IconComp = persona.icon;
                const isActive = persona.id === activePersonaId;

                return (
                  <button
                    key={persona.id}
                    type="button"
                    className={`persona-nav-item ${isActive ? 'active' : ''}`}
                    onMouseEnter={() => setActivePersonaId(persona.id)}
                    onClick={() => setActivePersonaId(persona.id)}
                  >
                    <div className="persona-item-left">
                      <div 
                        className="persona-icon-sq"
                        style={{ background: persona.gradient }}
                      >
                        <IconComp size={16} strokeWidth={2.2} />
                      </div>
                      <div className="persona-text-wrap">
                        <span className="persona-name">{persona.title}</span>
                        <span className="persona-sub">{persona.subtitle}</span>
                      </div>
                    </div>

                    <ChevronRight size={14} className="persona-chevron-active" />
                  </button>
                );
              })}
            </div>

          {/* Right Column: Curated Top Tools */}
          <div className="persona-col-right">
            <div className="persona-showcase-header">
              <div>
                <h4 className="persona-showcase-title">{activePersona.showcaseTitle}</h4>
                <p className="persona-showcase-desc">{activePersona.showcaseSubtitle}</p>
              </div>
            </div>

            <div className="persona-tools-grid">
              {activePersona.tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="persona-tool-card"
                  onClick={() => handleToolClick(tool.slug)}
                  title={tool.title}
                >
                  {/* Real Tool Logo */}
                  <div className="persona-tool-logo-wrap">
                    <img 
                      src={`/tool-icons/${tool.slug}.webp`} 
                      alt="" 
                      onError={(e) => {
                        if (!e.target.dataset.triedPng) {
                          e.target.dataset.triedPng = 'true';
                          e.target.src = `/tool-icons/${tool.slug}.png`;
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  </div>

                  <div className="persona-tool-info">
                    <div className="persona-tool-title-row">
                      <span className="persona-tool-name">{tool.title}</span>
                      {tool.badge && (
                        <span className="persona-tool-pill">{tool.badge}</span>
                      )}
                    </div>
                    <p className="persona-tool-desc">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Footer */}
            <div className="persona-footer">
              <span style={{ color: 'var(--text-muted)' }}>
                Curated by Cerilas High Tech
              </span>
              <button
                type="button"
                className="persona-footer-link"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateHome) onNavigateHome();
                }}
              >
                <span>View all 30+ tools</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
}
