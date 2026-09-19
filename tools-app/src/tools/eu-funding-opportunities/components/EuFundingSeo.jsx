import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Award, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  ArrowUpRight,
  Cpu,
  Layers,
  CheckCircle2,
  Tag,
  BookOpen,
  DollarSign,
  HelpCircle,
  Building,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import './EuFundingSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Cascade Funding (Financial Support to Third Parties - FSTP)?',
    a: 'Cascade Funding, officially termed Financial Support to Third Parties (FSTP) by the European Commission, is a streamlined funding mechanism where large EU-funded parent consortium projects distribute sub-grants (typically between €50,000 and €250,000) directly to startups, SMEs, and researchers. Unlike traditional Horizon Europe consortium grants that take 8–12 months of evaluation, Cascade Funding calls feature simplified 10-to-15 page applications, quick 6-to-8 week review cycles, and 100% equity-free lump-sum funding.'
  },
  {
    q: 'Who is eligible to apply for Horizon Europe and Cascade Funding calls?',
    a: 'Eligibility covers entities legally established in EU Member States and Horizon Europe Associated Countries (including Turkey, United Kingdom, Norway, Iceland, Israel, Switzerland, Ukraine, and Western Balkan states). Depending on the specific call, eligible beneficiaries include innovative startups, SMEs, universities, research technology organizations (RTOs), non-profits, and in certain open calls (such as evaluators or mentors), individual researchers.'
  },
  {
    q: 'Do I need a multi-country consortium to apply for Cascade Funding?',
    a: 'No! One of the biggest advantages of Cascade Funding (FSTP) is that the vast majority of calls allow single-applicant submissions. Innovative startups and SMEs can apply on their own without the complexity of coordinating a multi-country cross-border consortium of 3+ independent entities required in Horizon Europe Pillar II calls.'
  },
  {
    q: 'What is the difference between Horizon Europe Direct Grants and Cascade Funding?',
    a: 'Direct Horizon Europe grants (managed via the EU Funding & Tenders SEDIA portal) are large-scale collaborative research actions with multi-million-euro budgets (€2M–€15M) requiring extensive consortia across multiple EU states and rigorous audit trails. Cascade Funding sub-grants are smaller, agile lump-sum grants administered by designated European accelerator consortia specifically tailored for rapid testing, prototyping, tech validation, and cross-border piloting.'
  },
  {
    q: 'How does lump-sum funding work in EU grants?',
    a: 'Under the European Commission lump-sum grant regime, payment is based strictly on the completion of agreed work packages and predefined milestone deliverables rather than microscopic timesheets, hourly rate calculations, or receipts. Once the deliverable is validated by project evaluators, the agreed grant tranche is transferred in full without subsequent financial audits of individual receipts.'
  },
  {
    q: 'How are Horizon Europe Pillar II Clusters organized?',
    a: 'Pillar II ("Global Challenges and European Industrial Competitiveness") is structured into 6 thematic Clusters: Cluster 1: Health; Cluster 2: Culture, Creativity & Inclusive Society; Cluster 3: Civil Security for Society; Cluster 4: Digital, Industry & Space; Cluster 5: Climate, Energy & Mobility; and Cluster 6: Food, Bioeconomy, Natural Resources, Agriculture & Environment. Each cluster releases annual or biennial Work Programmes with specific topic calls.'
  },
  {
    q: 'Can Turkish companies and researchers apply on equal footing with EU member states?',
    a: 'Yes. The Republic of Turkey is a fully Associated Country to Horizon Europe under an official international agreement with the European Commission. Turkish universities, technology companies, research centers, and SMEs participate with the exact same legal rights, funding rates (up to 100% direct eligible costs plus 25% indirect overhead), and evaluation criteria as entities located in France, Germany, or the Netherlands.'
  },
  {
    q: 'What is a PIC (Participant Identification Code) and how do I obtain one?',
    a: 'A Participant Identification Code (PIC) is a unique 9-digit identifier issued by the European Commission to identify participant legal entities in EU grant portals. Obtaining a PIC is 100% free: you simply create an EU Login account on the official EU Funding & Tenders Portal and register your organization with its official legal trade name, tax registration number, and address.'
  },
  {
    q: 'What are the core evaluation criteria for European Commission proposals?',
    a: 'Proposals are evaluated by panels of independent expert evaluators across three fundamental criteria (each scored 0 to 5, total max 15): 1) Excellence (clarity of objectives, scientific novelty, beyond state-of-the-art methodology); 2) Impact (economic, societal, environmental benefits, exploitation plans, scale-up potential); and 3) Quality & Efficiency of Implementation (work plan coherence, team competence, budget allocation, risk management).'
  },
  {
    q: 'How frequently is the Cerilas EU Funding database updated?',
    a: 'The Cerilas platform runs continuous deterministic scraper bots that query both the official European Commission SEDIA REST APIs and the Cascade Funding Hub every 6 hours. Content is cryptographically hashed with SHA-256 to detect amendments, and expired calls are automatically pruned so that every listed opportunity is currently open and actionable.'
  }
];

export default function EuFundingSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    // Inject Schema.org FAQPage Structured JSON-LD
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'eu-funding-faq-schema';
    script.innerHTML = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('eu-funding-faq-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="eu-seo-container">
      {/* 1. Executive Guide & Overview */}
      <section className="eu-seo-section">
        <div className="eu-seo-badge-row">
          <span className="eu-seo-pill">
            <Globe size={13} />
            <span>European Innovation Directory</span>
          </span>
          <span className="eu-seo-pill highlight">
            <Zap size={13} />
            <span>Horizon Europe & Cascade FSTP</span>
          </span>
        </div>

        <h2 className="eu-seo-h2">
          Mastering European Commission Research Grants & Cascade Sub-Grants
        </h2>
        
        <p className="eu-seo-lead">
          The European Union allocates over <strong>€95.5 Billion</strong> under the <em>Horizon Europe</em> framework programme (2021–2027) alongside complementary programmes including <strong>Digital Europe</strong>, the <strong>European Innovation Council (EIC)</strong>, and <strong>Innovation Fund</strong>. For technology companies, startups, and academic laboratories, securing non-dilutive European grants accelerates research cycles, secures international market validation, and eliminates reliance on venture capital dilution.
        </p>

        <div className="eu-seo-grid-3">
          <div className="eu-seo-card">
            <div className="eu-seo-card-icon blue">
              <Layers size={22} />
            </div>
            <h3>Horizon Europe Pillar II</h3>
            <p>
              Large collaborative collaborative actions across 6 thematic clusters (Health, Climate & Energy, Digital & Space, Food & Bioeconomy). Consortia of 3+ EU entities receive up to <strong>100% grant coverage</strong> plus 25% indirect overhead.
            </p>
          </div>

          <div className="eu-seo-card">
            <div className="eu-seo-card-icon purple">
              <Sparkles size={22} />
            </div>
            <h3>Cascade Funding (FSTP)</h3>
            <p>
              Sub-grants of <strong>€50,000 to €250,000</strong> distributed directly to single startups and SMEs. 100% lump-sum funding, ultra-fast 6-8 week evaluation, and concise 10–15 page proposal templates.
            </p>
          </div>

          <div className="eu-seo-card">
            <div className="eu-seo-card-icon green">
              <TrendingUp size={22} />
            </div>
            <h3>EIC & DeepTech Scaling</h3>
            <p>
              European Innovation Council calls including <em>EIC Pathfinder</em> (TRL 1–4 early breakthrough), <em>EIC Transition</em> (TRL 4–6 validation), and <em>EIC Accelerator</em> (up to €2.5M grant + €15M equity).
            </p>
          </div>
        </div>
      </section>

      {/* 2. Step-by-Step Strategic Roadmap */}
      <section className="eu-seo-section">
        <h2 className="eu-seo-h2">
          Five-Stage Roadmap for Winning EU Grants & Sub-Grants
        </h2>
        <div className="eu-seo-roadmap">
          <div className="eu-roadmap-item">
            <div className="eu-roadmap-num">1</div>
            <div className="eu-roadmap-content">
              <h4>Establish Your Legal & Digital Credentials</h4>
              <p>
                Create your <strong>EU Login</strong> account on the European Commission portal and register your organization to obtain a 9-digit <strong>Participant Identification Code (PIC)</strong>. Verify your SME status through the automated SME Self-Assessment tool if targeting SME-exclusive calls.
              </p>
            </div>
          </div>

          <div className="eu-roadmap-item">
            <div className="eu-roadmap-num">2</div>
            <div className="eu-roadmap-content">
              <h4>Filter High-Alignment Calls Early</h4>
              <p>
                Match your core IP, Technology Readiness Level (TRL), and development roadmap with active Work Programmes 60–90 days ahead of submission deadlines. Prioritize calls that explicitly request your technological capability (e.g. AI-driven materials, zero-emission powertrains, or federated data architectures).
              </p>
            </div>
          </div>

          <div className="eu-roadmap-item">
            <div className="eu-roadmap-num">3</div>
            <div className="eu-roadmap-content">
              <h4>Architect Consortium or Single-Applicant Track</h4>
              <p>
                For <em>Cascade Funding</em>, prepare single-company bids focusing on fast deployment and piloting. For <em>Horizon Europe</em> direct calls, join or lead a balanced consortium featuring academic depth (universities), industrial validation (industrial pilots/end-users), and commercial scaling power (SMEs).
              </p>
            </div>
          </div>

          <div className="eu-roadmap-item">
            <div className="eu-roadmap-num">4</div>
            <div className="eu-roadmap-content">
              <h4>Structure Proposal Around Excellence, Impact & Implementation</h4>
              <p>
                Frame your project strictly around EU policy objectives: demonstrate clear progress beyond the state-of-the-art, quantifiable socio-economic KPIs, thorough open science/data management protocols, and clear risk mitigation matrices.
              </p>
            </div>
          </div>

          <div className="eu-roadmap-item">
            <div className="eu-roadmap-num">5</div>
            <div className="eu-roadmap-content">
              <h4>Execute Milestone Lump-Sum Deliverables</h4>
              <p>
                Upon grant agreement signature, execute milestones according to your Gantt chart. Under European Commission lump-sum guidelines, timely deliverable submission triggers immediate tranches without laborious line-by-line financial receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive FAQ Accordion */}
      <section className="eu-seo-section">
        <div className="eu-seo-badge-row">
          <span className="eu-seo-pill">
            <HelpCircle size={13} />
            <span>Frequently Asked Questions</span>
          </span>
        </div>
        <h2 className="eu-seo-h2">Frequently Asked Questions About EU Grants & Cascade Funding</h2>

        <div className="eu-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className={`eu-faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <button 
                  className="eu-faq-question" 
                  aria-expanded={isOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFaq(isOpen ? null : idx);
                  }}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`eu-faq-icon ${isOpen ? 'rotate' : ''}`} size={18} />
                </button>
                {isOpen && (
                  <div className="eu-faq-answer">
                    <p>{item.a}</p>
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
