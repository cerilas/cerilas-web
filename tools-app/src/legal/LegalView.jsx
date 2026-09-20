import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Cookie, 
  ArrowLeft, 
  Mail, 
  Building2, 
  CheckCircle2, 
  Printer, 
  Search,
  ExternalLink
} from 'lucide-react';
import { COMPANY_INFO, LEGAL_DOCS } from './legalContent';
import { useTranslation } from '../i18n';

export default function LegalView({ initialSlug = 'terms', onBack }) {
  const { language } = useTranslation();
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialSlug && LEGAL_DOCS[initialSlug]) {
      setActiveSlug(initialSlug);
    }
  }, [initialSlug]);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [activeSlug]);

  const currentDoc = LEGAL_DOCS[activeSlug] || LEGAL_DOCS.terms;

  const handleTabChange = (slug) => {
    setActiveSlug(slug);
    window.location.hash = `#/legal/${slug}`;
  };

  const filteredSections = currentDoc.sections.filter((sec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.heading.toLowerCase().includes(q) ||
      (sec.headingTr && sec.headingTr.toLowerCase().includes(q)) ||
      sec.body.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-view-container" style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '2.5rem 1.25rem 5rem 1.25rem',
      color: 'var(--text-main, #f1f5f9)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
          <button 
            type="button" 
            onClick={onBack || (() => { window.location.hash = '#/'; })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'transparent',
              border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
              color: 'var(--text-main, #f1f5f9)',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>{language === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Tools'}</span>
          </button>
          <span>/</span>
          <span>Legal &amp; Compliance</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main, #f1f5f9)', fontWeight: 500 }}>{currentDoc.title}</span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--card-bg, rgba(255,255,255,0.04))',
            border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
            color: 'var(--text-muted, #94a3b8)',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <Printer size={14} />
          <span>{language === 'tr' ? 'Yazdır / PDF Kaydet' : 'Print / Save PDF'}</span>
        </button>
      </div>

      {/* Corporate Verification Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(30, 41, 59, 0.5) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        marginBottom: '2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            flexShrink: 0
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                {COMPANY_INFO.legalName}
              </span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}>
                Verified Legal Entity
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Tax Identification No (VKN): <strong style={{ color: '#f1f5f9' }}>{COMPANY_INFO.vkn}</strong> &bull; {COMPANY_INFO.address}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={`mailto:${COMPANY_INFO.legalEmail}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <Mail size={14} />
            <span>{COMPANY_INFO.legalEmail}</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left Tabs Sidebar & Right Document Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 280px) 1fr',
        gap: '2.5rem',
        alignItems: 'start'
      }} className="legal-layout-grid">
        {/* Left Navigation Sidebar */}
        <aside style={{
          position: 'sticky',
          top: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: '0.5rem',
            paddingLeft: '0.5rem'
          }}>
            Legal Documents
          </div>

          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: activeSlug === 'terms' ? '1px solid #38bdf8' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
              background: activeSlug === 'terms' ? 'rgba(56, 189, 248, 0.12)' : 'var(--card-bg, rgba(255,255,255,0.02))',
              color: activeSlug === 'terms' ? '#38bdf8' : 'var(--text-main, #f1f5f9)',
              fontWeight: activeSlug === 'terms' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={18} />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: activeSlug === 'privacy' ? '1px solid #38bdf8' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
              background: activeSlug === 'privacy' ? 'rgba(56, 189, 248, 0.12)' : 'var(--card-bg, rgba(255,255,255,0.02))',
              color: activeSlug === 'privacy' ? '#38bdf8' : 'var(--text-main, #f1f5f9)',
              fontWeight: activeSlug === 'privacy' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={18} />
            <span>Privacy Policy (KVKK/GDPR)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('refund')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: activeSlug === 'refund' ? '1px solid #38bdf8' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
              background: activeSlug === 'refund' ? 'rgba(56, 189, 248, 0.12)' : 'var(--card-bg, rgba(255,255,255,0.02))',
              color: activeSlug === 'refund' ? '#38bdf8' : 'var(--text-main, #f1f5f9)',
              fontWeight: activeSlug === 'refund' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={18} />
            <span>Refund &amp; Cancellation</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('cookies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: activeSlug === 'cookies' ? '1px solid #38bdf8' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
              background: activeSlug === 'cookies' ? 'rgba(56, 189, 248, 0.12)' : 'var(--card-bg, rgba(255,255,255,0.02))',
              color: activeSlug === 'cookies' ? '#38bdf8' : 'var(--text-main, #f1f5f9)',
              fontWeight: activeSlug === 'cookies' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <Cookie size={18} />
            <span>Cookie Policy</span>
          </button>

          {/* Quick Search in document */}
          <div style={{ marginTop: '1.5rem', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }} />
            <input
              type="text"
              placeholder={language === 'tr' ? 'Madde ara...' : 'Filter sections...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                background: 'var(--card-bg, rgba(255,255,255,0.03))',
                color: 'var(--text-main, #f1f5f9)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            borderRadius: '10px',
            background: 'var(--card-bg, rgba(255,255,255,0.02))',
            border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #94a3b8)',
            lineHeight: 1.5
          }}>
            <p style={{ margin: 0 }}>
              Official inquiries regarding compliance, copyright (DMCA), or KVKK/GDPR data subject rights must be directed in writing to:
            </p>
            <a href={`mailto:${COMPANY_INFO.legalEmail}`} style={{ color: '#38bdf8', textDecoration: 'none', display: 'block', marginTop: '0.4rem', fontWeight: 600 }}>
              {COMPANY_INFO.legalEmail}
            </a>
          </div>
        </aside>

        {/* Right Document Content */}
        <main className="legal-doc-body" style={{ minWidth: 0 }}>
          <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.1))', paddingBottom: '1.75rem' }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.2
            }}>
              {currentDoc.title}
            </h1>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-muted, #94a3b8)',
              margin: '0 0 1rem 0'
            }}>
              {currentDoc.subtitle}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
              <span>Effective Date: <strong>{COMPANY_INFO.lastUpdated}</strong></span>
              <span>&bull;</span>
              <span>Version: <strong>2026.1 (Pro Tier Ready)</strong></span>
            </div>
          </header>

          <article style={{ display: 'grid', gap: '2rem' }}>
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  style={{
                    background: 'var(--card-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                    borderRadius: '12px',
                    padding: '1.5rem 1.75rem',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 1rem 0',
                    color: 'var(--text-main, #f8fafc)',
                    letterSpacing: '-0.01em'
                  }}>
                    {section.heading}
                  </h2>
                  <div style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-muted, #cbd5e1)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line'
                  }}>
                    {section.body}
                  </div>
                </section>
              ))
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                No sections match "{searchQuery}".
              </div>
            )}
          </article>

          {/* Legal Sign-off Footer */}
          <footer style={{
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--card-border, rgba(255,255,255,0.1))',
            fontSize: '0.85rem',
            color: 'var(--text-muted, #94a3b8)',
            lineHeight: 1.6
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Corporate Legal Representation:</strong> This document is maintained by the Legal Affairs Directorate of {COMPANY_INFO.legalName}. Any localized version provided is for informative convenience; in the event of contractual discrepancies, the official master agreement and Turkish statutory consumer law shall prevail.
            </p>
            <p style={{ margin: 0 }}>
              Registered in Gaziantep, Türkiye under VKN {COMPANY_INFO.vkn}. For dispute notifications, contact <a href={`mailto:${COMPANY_INFO.legalEmail}`} style={{ color: '#38bdf8' }}>{COMPANY_INFO.legalEmail}</a>.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
