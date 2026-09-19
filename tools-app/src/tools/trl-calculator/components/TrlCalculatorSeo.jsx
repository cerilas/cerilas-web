import { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Layers, 
  Award, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  ArrowUpRight,
  Cpu,
  Globe,
  Compass,
  CheckCircle2,
  Tag
} from 'lucide-react';
import './TrlCalculatorSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Technology Readiness Level (TRL) and how does it work?',
    a: 'Technology Readiness Level (TRL) is a globally standardized 9-level measurement system used to assess the maturity of a particular technology, system, or product. Originally developed by NASA in the 1970s and subsequently adopted by the European Commission, ISO, and international defense and R&D bodies, TRL spans from TRL 1 (basic scientific principles observed) to TRL 9 (actual system proven through successful commercial or operational missions).'
  },
  {
    q: 'Why is accurate TRL assessment critical for Horizon Europe and EIC grants?',
    a: 'Funding bodies like the European Innovation Council (EIC) strictly gate grant eligibility based on TRL. For instance, EIC Pathfinder targets early breakthrough research from TRL 1 to 4; EIC Transition bridges technologies from TRL 4 to TRL 5/6; and EIC Accelerator exclusively accepts projects that have already achieved TRL 5/6 and funds development up to TRL 8. Overestimating your TRL leads to immediate proposal rejection during technical evaluation.'
  },
  {
    q: 'What is the fundamental difference between TRL 4, TRL 5, and TRL 6?',
    a: 'The key distinction lies in the testing environment. At TRL 4, components are integrated and tested strictly in a controlled laboratory setting. At TRL 5, testing takes place in a simulated relevant environment that mimics real-world stress factors (temperature, vibration, noisy datasets). At TRL 6, a full-scale representative engineering prototype is demonstrated under actual or near-actual operational parameters.'
  },
  {
    q: 'How does TRL apply to Software, DeepTech, and Artificial Intelligence (SRL)?',
    a: 'Traditional hardware TRL maps to Software Readiness Level (SRL). TRL 1–3 represents algorithmic theory and synthetic benchmark proofs. TRL 4 is integration of modules in a local development cluster. TRL 5 is validation against noisy, real-world data pipelines in a staging sandbox. TRL 6 is pilot integration in a customer beta environment. TRL 7–8 covers live production deployments with full security, SLA, and disaster recovery qualification, while TRL 9 is full enterprise commercial adoption.'
  },
  {
    q: 'What is a "Strict TRL" versus "Progress Percentage"?',
    a: 'Strict TRL enforces the sequential prerequisite rule of formal R&D auditing: a project cannot claim TRL 6 if prerequisites for TRL 4 (like laboratory repeatability) have not been 100% verified. Our calculator reports both your Strict TRL (the highest fully validated baseline) and an Overall Progress Percentage showing how close your project is to validating subsequent milestones.'
  },
  {
    q: 'How does TÜBİTAK evaluate TRL in 1501 and 1507 industrial grants?',
    a: 'TÜBİTAK TEYDEB evaluates projects across concept formulation, industrial prototype design, test and verification in simulated/relevant settings, and pilot demonstrations. Programs like 1501 and 1507 typically finance activities from TRL 3/4 up to TRL 7, while TÜBİTAK 1707 Siparişe Dayalı Ar-Ge focuses on higher TRL 6–8 commercialization pilots with corporate customers.'
  },
  {
    q: 'What deliverables are required to prove progression from TRL 6 to TRL 7?',
    a: 'Moving from TRL 6 to TRL 7 requires moving from internal relevant testing to actual customer field trials. Deliverables include: signed pilot trial agreements, field operating telemetry, third-party pre-compliance test reports (CE, EMC, ISO, FDA), and formal risk assessments (FMEA - Failure Mode and Effects Analysis).'
  },
  {
    q: 'Are our confidential R&D project details or proprietary IP saved on any server?',
    a: 'No. The Cerilas TRL Calculator executes 100% client-side in your web browser. All questionnaire inputs, milestone evaluations, and gap roadmaps are computed in local memory and are never transmitted to our servers or stored in any cloud database.'
  },
  {
    q: 'How can I export my TRL assessment for grant applications or investor decks?',
    a: 'Click "Copy Executive Report" or "Export Audit (JSON)" in the summary panel. The formatted markdown summary includes your project name, target framework, verified milestones, identified development gaps, and matched grant opportunities ready to insert directly into proposal annexes.'
  },
  {
    q: 'What is Manufacturing Readiness Level (MRL) and how does it relate to TRL?',
    a: 'While TRL measures the functional maturity and performance of a technological concept, Manufacturing Readiness Level (MRL) measures the scalability, tooling, supply chain stability, and cost-effectiveness of producing that technology at volume. High TRL (e.g. TRL 7/8) requires corresponding MRL advances to avoid unviable production economics.'
  }
];

const TRL_STANDARDS_TABLE = [
  { level: 'TRL 1', name: 'Basic Principles', eu: 'Scientific literature, pure research', nasa: 'Basic principles published', soft: 'Paper concept, algorithmic idea' },
  { level: 'TRL 2', name: 'Concept Formulated', eu: 'Practical use cases identified', nasa: 'Application identified', soft: 'Architecture specification' },
  { level: 'TRL 3', name: 'Proof of Concept', eu: 'Experimental lab validation', nasa: 'Analytical & lab POC', soft: 'Algorithm tested on synthetic data' },
  { level: 'TRL 4', name: 'Lab Component', eu: 'Components integrated in lab', nasa: 'Breadboard in laboratory', soft: 'Modules integrated in local testbed' },
  { level: 'TRL 5', name: 'Relevant Environment', eu: 'Integrated in relevant setting', nasa: 'High-fidelity test in simulated env', soft: 'Staging cluster with real messy data' },
  { level: 'TRL 6', name: 'Prototype in Relevant', eu: 'Engineering prototype demonstrated', nasa: 'Model tested in relevant space/air', soft: 'Beta pilot in client staging sandbox' },
  { level: 'TRL 7', name: 'Operational Pilot', eu: 'System prototype in field operational', nasa: 'System prototype in flight/field', soft: 'Live pilot with real users & telemetry' },
  { level: 'TRL 8', name: 'System Qualified', eu: 'System complete & certified', nasa: 'System flight qualified (FAT)', soft: 'Production ready, certified SLAs, ISO' },
  { level: 'TRL 9', name: 'Commercial Mission', eu: 'Full market competitive operation', nasa: 'Flight proven through mission', soft: 'Mass commercial SaaS / enterprise live' }
];

const SEMANTIC_KEYWORDS = [
  'Technology Readiness Level Calculator',
  'Horizon Europe TRL Assessment',
  'EIC Accelerator TRL 5 to 8',
  'NASA TRL Guidelines ISO 16290',
  'TÜBİTAK 1501 Ar-Ge TRL Seviyesi',
  'Software Readiness Level (SRL)',
  'DeepTech Grant Eligibility Calculator',
  'R&D Milestone Gap Analysis',
  'TRL 1 to 9 Matrix Checklist',
  'Client-Side Private TRL Audit',
  'Eurostars-3 R&D Assessment',
  'Free Research Grant Matcher'
];

const RELATED_TOOLS = [
  { name: 'Universal Token Counter', desc: 'Audit token limits and API costs for GPT-6 Astra, Claude 3.7, and Gemini 3.8.', href: '#/tool/token-counter-universal' },
  { name: 'PDF → RAG Cleaner', desc: 'Extract and clean messy academic PDFs into structured vector chunks.', href: '#/tool/pdf-rag-cleaner' },
  { name: 'LLMs.txt Tools', desc: 'Generate and validate /llms.txt guides for AI crawlers.', href: '#/tool/llms-txt' },
  { name: 'HTML to LLM Markdown', desc: 'Convert technical documentation into clean Markdown for LLMs.', href: '#/tool/html-to-llm-markdown' },
  { name: 'Webhook Tester', desc: 'Debug webhooks, payloads, and automated IoT/R&D event pipelines.', href: '#/tool/webhook-tester' },
  { name: 'Startup Runway Calculator', desc: 'Plan R&D burn rate, grant matching cashflow, and capital runways.', href: '#/tool/startup-runway-calculator' }
];

export default function TrlCalculatorSeo() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    // 1. FAQ Schema
    const faqStructuredData = {
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

    // 2. WebApplication Schema
    const appStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Cerilas TRL Calculator & R&D Readiness Auditor',
      'operatingSystem': 'All',
      'applicationCategory': 'DeveloperApplication',
      'url': 'https://tools.cerilas.com/#/tool/trl-calculator',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Free client-side Technology Readiness Level (TRL 1–9) calculator for Horizon Europe, EIC Accelerator, NASA, and TÜBİTAK R&D projects. Features diagnostic questionnaires, gap roadmaps, and grant matcher.'
    };

    let scriptFaq = document.getElementById('trl-calculator-faq-jsonld');
    if (!scriptFaq) {
      scriptFaq = document.createElement('script');
      scriptFaq.id = 'trl-calculator-faq-jsonld';
      scriptFaq.type = 'application/ld+json';
      document.head.appendChild(scriptFaq);
    }
    scriptFaq.textContent = JSON.stringify(faqStructuredData);

    let scriptApp = document.getElementById('trl-calculator-app-jsonld');
    if (!scriptApp) {
      scriptApp = document.createElement('script');
      scriptApp.id = 'trl-calculator-app-jsonld';
      scriptApp.type = 'application/ld+json';
      document.head.appendChild(scriptApp);
    }
    scriptApp.textContent = JSON.stringify(appStructuredData);

    return () => {
      const elFaq = document.getElementById('trl-calculator-faq-jsonld');
      if (elFaq) elFaq.remove();
      const elApp = document.getElementById('trl-calculator-app-jsonld');
      if (elApp) elApp.remove();
    };
  }, []);

  return (
    <div className="trl-seo-container">
      {/* Header Intro */}
      <div className="trl-seo-header">
        <h2 className="trl-seo-title">Technology Readiness Level (TRL 1–9) Guide & Audit Standard</h2>
        <p className="trl-seo-intro">
          Whether you are applying for high-stakes European Commission grants (Horizon Europe, EIC Accelerator),
          national R&D subsidies (TÜBİTAK, SBIR), or pitching deeptech investors, proving your technology's exact TRL
          is non-negotiable. Cerilas TRL Calculator provides deterministic milestone evaluation, development gap
          identification, and grant eligibility matching with 100% in-browser privacy.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="trl-seo-grid">
        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <GitCommit size={20} />
          </div>
          <h3 className="trl-seo-card-title">Deterministic TRL Scoring</h3>
          <p className="trl-seo-card-desc">
            Enforces rigorous prerequisite checking. Understand both your strict validated baseline and percentage
            progress toward the next milestone.
          </p>
        </div>

        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <Compass size={20} />
          </div>
          <h3 className="trl-seo-card-title">Actionable Gap Roadmap</h3>
          <p className="trl-seo-card-desc">
            Directly highlights which specific tests, environmental validations, or safety certifications are preventing
            your technology from advancing.
          </p>
        </div>

        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <Award size={20} />
          </div>
          <h3 className="trl-seo-card-title">Grant Program Matcher</h3>
          <p className="trl-seo-card-desc">
            Instantly matches your assessed level to active funding schemes across EIC Pathfinder, Transition, Accelerator,
            TÜBİTAK 1501/1507, and Eurostars.
          </p>
        </div>
      </div>

      {/* Standard Reference Table */}
      <div className="trl-seo-table-section">
        <h3 className="trl-seo-section-heading">
          <Layers size={18} style={{ color: '#6366f1' }} />
          <span>Cross-Framework TRL 1 to 9 Standard Comparison</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Mapping requirements between European Commission, NASA, and Software/AI Readiness Level (SRL).
        </p>
        <div className="trl-seo-table-wrap">
          <table className="trl-seo-specs-table">
            <thead>
              <tr>
                <th>TRL Level</th>
                <th>Phase Name</th>
                <th>Horizon Europe (EC)</th>
                <th>NASA / Aerospace</th>
                <th>Software & AI (SRL)</th>
              </tr>
            </thead>
            <tbody>
              {TRL_STANDARDS_TABLE.map((row, i) => (
                <tr key={i}>
                  <td><strong>{row.level}</strong></td>
                  <td>{row.name}</td>
                  <td>{row.eu}</td>
                  <td>{row.nasa}</td>
                  <td><code>{row.soft}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Semantic Keyword Cloud */}
      <div className="trl-seo-keywords-block">
        <div className="trl-seo-keywords-title">
          <Tag size={15} />
          <span>Popular Search Topics & Guidelines</span>
        </div>
        <div className="trl-seo-pills-wrap">
          {SEMANTIC_KEYWORDS.map((kw, i) => (
            <span key={i} className="trl-keyword-tag">
              <CheckCircle2 size={12} className="trl-tag-check" />
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="trl-faq-section">
        <h2 className="trl-faq-title">Frequently Asked Questions</h2>
        <div className="trl-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="trl-faq-item">
                <button
                  type="button"
                  className="trl-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`trl-faq-icon ${isOpen ? 'open' : ''}`} />
                </button>
                {isOpen && (
                  <div className="trl-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Tools */}
      <div className="trl-related-section">
        <h3 className="trl-related-title">Explore Related R&D & Developer Tools</h3>
        <div className="trl-related-grid">
          {RELATED_TOOLS.map((tool, idx) => (
            <a key={idx} href={tool.href} className="trl-related-card">
              <div>
                <div className="trl-related-name">
                  <span>{tool.name}</span>
                  <ArrowUpRight size={14} />
                </div>
                <p className="trl-related-desc">{tool.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
