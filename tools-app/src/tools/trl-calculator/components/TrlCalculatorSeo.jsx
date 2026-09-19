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
  Tag,
  BookOpen,
  DollarSign,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import './TrlCalculatorSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What is Technology Readiness Level (TRL) and how is it defined internationally?',
    a: 'Technology Readiness Level (TRL) is a globally standardized 9-level measurement system used to objectively assess the technological maturity and risk profile of an R&D concept, prototype, or industrial system. Originally formulated by NASA in the 1970s and subsequently standardized under ISO 16290 and adopted by the European Commission, US Department of Defense, and TÜBİTAK, TRL spans from TRL 1 (basic principles observed) to TRL 9 (actual system proven through successful operational commercial missions).'
  },
  {
    q: 'Why is accurate TRL assessment critical for Horizon Europe and EIC Accelerator grants?',
    a: 'Funding agencies like the European Innovation Council (EIC) strictly gate grant eligibility based on TRL thresholds. For instance, EIC Pathfinder funds high-risk breakthrough research from TRL 1 to TRL 4; EIC Transition bridges deeptech innovations from TRL 4 to TRL 5/6; and EIC Accelerator exclusively accepts projects that have already demonstrated a validated prototype in relevant environments (TRL 5/6) and finances scaling up to TRL 8. Overestimating your TRL in a proposal leads to immediate rejection during jury review.'
  },
  {
    q: 'What is the concrete difference between TRL 4, TRL 5, and TRL 6?',
    a: 'The key distinction lies in the testing environment and component integration fidelity: At TRL 4, separate components are wired together into a crude "breadboard" setup and validated strictly within a controlled laboratory environment. At TRL 5, components are integrated into a higher-fidelity configuration and tested in a simulated relevant environment that mimics real-world stress factors (extreme temperature, electrical noise, packet loss, or vibration). At TRL 6, a full-scale representative engineering prototype is tested under actual operational or near-actual environmental conditions.'
  },
  {
    q: 'How does TRL apply to Software, Artificial Intelligence, and DeepTech (SRL)?',
    a: 'In software and AI architectures, traditional hardware terminology maps to Software Readiness Level (SRL). TRL 1–3 corresponds to algorithmic theory, mathematical formulations, and synthetic benchmark proofs of concept. TRL 4 is local integration of software modules in a developer staging environment. TRL 5 is validation against real-world, noisy data streams in an isolated sandbox. TRL 6 represents a pilot deployment in an external customer beta environment with live API traffic. TRL 7–8 covers high-availability production deployments with automated failover, security hardening, and ISO/SOC2 compliance, while TRL 9 is enterprise-scale multi-region deployment.'
  },
  {
    q: 'What is "Strict TRL" versus "Overall Maturity Percentage"?',
    a: 'Strict TRL enforces the sequential prerequisite rule of formal scientific auditing: a technology cannot claim TRL 6 if prerequisites for TRL 4 (such as repeatable laboratory validation) have not been formally satisfied. Our calculator provides both your Strict TRL (the highest sequentially unbroken maturity baseline) and an Overall Maturity Percentage that shows how many subsequent milestone criteria you have completed ahead of time.'
  },
  {
    q: 'What specific documentation and evidence do grant auditors look for at each TRL gate?',
    a: 'Auditors require tangible artifacts: For TRL 1–2, peer-reviewed papers, patents, and mathematical equations. For TRL 3–4, bench test logs, bill of materials (BOM), and laboratory repeatability datasets. For TRL 5–6, environmental stress test reports (EMC, thermal, vibration), prototype telemetry, and customer beta feedback. For TRL 7–8, signed pilot agreements, third-party CE/FDA/ISO certification reports, and failure mode effects analysis (FMEA). For TRL 9, commercial sales invoices, warranty records, and manufacturing SLAs.'
  },
  {
    q: 'How does TÜBİTAK evaluate TRL in 1501, 1507, and 1001 R&D programs in Turkey?',
    a: 'TÜBİTAK TEYDEB evaluates industrial research proposals according to formal TRL progression. Academic programs like TÜBİTAK 1001 primarily finance basic and applied research (TRL 1–3). Industry calls such as TÜBİTAK 1507 (SME R&D) and 1501 (Industrial R&D) finance projects starting from proof of concept (TRL 3/4) through industrial prototype testing (TRL 6/7). Programs like TÜBİTAK 1707 (Order-Based R&D) specifically focus on late-stage co-development and field trials (TRL 6–8).'
  },
  {
    q: 'What is Manufacturing Readiness Level (MRL) and how does it intersect with TRL?',
    a: 'While TRL measures functional and operational performance, Manufacturing Readiness Level (MRL) assesses the producibility, tooling availability, quality assurance, and supply chain scalability needed to manufacture that technology economically at scale. A technology may be TRL 7 (functional prototype in the field) but only MRL 3 (hand-assembled, unscalable tooling). Investors and grant evaluators require both metrics to ensure commercial viability.'
  },
  {
    q: 'What is Commercial Readiness Level (CRL) and Investment Readiness Level (IRL)?',
    a: 'CRL evaluates customer discovery, market demand, regulatory clearance, and pricing models, while IRL evaluates unit economics, gross margins, and capitalization tables. While TRL confirms that the technology works, CRL confirms that customers will pay for it. Deeptech grants like EIC Accelerator and Eurostars evaluate TRL and CRL in parallel.'
  },
  {
    q: 'How should multidisciplinary systems (hardware + firmware + AI algorithms) be evaluated?',
    a: 'In hybrid systems, the overall system TRL is always governed by the lowest validated subsystem ("weakest link rule"). For example, if an autonomous robotics startup has achieved TRL 8 in its mechanical chassis and sensors, but its core computer vision neural network is only validated on synthetic benchmarks (TRL 4), the integrated robotic system cannot claim TRL 8. Our calculator highlights subsystem gaps to balance progress across software and hardware.'
  },
  {
    q: 'Can confidential R&D project details or proprietary IP leak when using this tool?',
    a: 'Zero data is sent to external servers. The Cerilas TRL Calculator runs 100% client-side directly within your web browser using modern JavaScript and WebAssembly. Your project responses, diagnostic criteria, gap evaluations, and exported reports remain entirely inside your local browser memory and are never logged, tracked, or stored in any database.'
  },
  {
    q: 'How can I export my TRL audit report for investor pitch decks or grant annexes?',
    a: 'Click "Copy Executive Summary" or "Export Audit (JSON)" in the summary panel. The formatted markdown summary includes your project name, target framework, verified milestones, identified development gaps, and matched grant opportunities ready to paste directly into proposal annexes, technical documentation, or investor dataroom folders.'
  }
];

const TRL_STANDARDS_TABLE = [
  {
    level: 'TRL 1',
    name: 'Basic Principles Observed',
    eu: 'Scientific research begins; basic principles observed and reported.',
    nasa: 'Basic principles observed and documented (peer-reviewed research).',
    soft: 'Mathematical algorithm formulated; basic theoretical properties proven.',
    evidence: 'Academic literature, mathematical proof, peer-reviewed preprints.'
  },
  {
    level: 'TRL 2',
    name: 'Technology Concept Formulated',
    eu: 'Technology concept and/or application formulated; practical uses scoped.',
    nasa: 'Practical applications invented; basic analytical formulations developed.',
    soft: 'Application logic outlined; architecture diagram and pseudocode drafted.',
    evidence: 'Preliminary feasibility memo, application whitepaper, initial patents.'
  },
  {
    level: 'TRL 3',
    name: 'Experimental Proof of Concept (PoC)',
    eu: 'Analytical and experimental critical function and/or characteristic proof of concept.',
    nasa: 'Analytical and experimental proof of concept validated in bench setup.',
    soft: 'Synthetic benchmark code executed; core algorithmic throughput verified.',
    evidence: 'Bench lab test data, empirical performance curves, simulation logs.'
  },
  {
    level: 'TRL 4',
    name: 'Laboratory Component Validation',
    eu: 'Technology validated in lab; individual components integrated into breadboard.',
    nasa: 'Component and/or breadboard validation in controlled laboratory environment.',
    soft: 'Individual modules integrated into a working dev sandbox; unit tests passing.',
    evidence: 'Integrated breadboard photos, component test reports, repeatability logs.'
  },
  {
    level: 'TRL 5',
    name: 'Validation in Relevant Environment',
    eu: 'Technology validated in relevant environment (industrially relevant environment).',
    nasa: 'Component and/or breadboard validation in simulated relevant environment.',
    soft: 'System deployed to staging environment with real-world noisy data streams.',
    evidence: 'Thermal/vibration/noise stress test reports, staging telemetry data.'
  },
  {
    level: 'TRL 6',
    name: 'Demonstration in Relevant Environment',
    eu: 'Technology demonstrated in relevant environment (representative engineering prototype).',
    nasa: 'System/subsystem model or prototype demonstrated in relevant environment.',
    soft: 'Customer beta release; pilot integration with live external APIs and traffic.',
    evidence: 'Engineering prototype telemetry, beta test agreements, pilot performance logs.'
  },
  {
    level: 'TRL 7',
    name: 'System Prototype in Operational Environment',
    eu: 'System prototype demonstration in operational environment (field trials).',
    nasa: 'System prototype demonstration in actual operational flight/field environment.',
    soft: 'Live customer production deployment handling real transaction workloads.',
    evidence: 'Customer sign-off letters, field operating telemetry, pre-compliance audit.'
  },
  {
    level: 'TRL 8',
    name: 'System Complete and Qualified',
    eu: 'Actual system completed and qualified through test and demonstration.',
    nasa: 'Actual system completed and flight-qualified through test and certification.',
    soft: 'Full SLA compliance, automated disaster recovery, SOC2/ISO 27001 audited.',
    evidence: 'Official CE/UL/FDA certification reports, safety qualification dossier.'
  },
  {
    level: 'TRL 9',
    name: 'Actual System Proven in Operational Mission',
    eu: 'Actual system proven in operational environment (competitive commercial manufacturing).',
    nasa: 'Actual system flight proven through successful mission operations.',
    soft: 'Full commercial enterprise scale; sustained high uptime across global regions.',
    evidence: 'Commercial invoices, warranty logs, mass production quality metrics.'
  }
];

const GRANT_GATES_TABLE = [
  {
    program: 'EIC Pathfinder',
    agency: 'European Commission',
    startTrl: 'TRL 1 – 2',
    targetTrl: 'TRL 4',
    budget: 'Up to €3,000,000 – €4,000,000',
    type: '100% Non-dilutive Grant',
    focus: 'Visionary early-stage breakthrough science and deeptech proof-of-concept.'
  },
  {
    program: 'EIC Transition',
    agency: 'European Commission',
    startTrl: 'TRL 4',
    targetTrl: 'TRL 5 – 6',
    budget: 'Up to €2,500,000',
    type: '100% Non-dilutive Grant',
    focus: 'Maturing lab-tested technologies into validated engineering prototypes.'
  },
  {
    program: 'EIC Accelerator',
    agency: 'European Commission',
    startTrl: 'TRL 5 – 6',
    targetTrl: 'TRL 8 – 9',
    budget: 'Up to €17,500,000 (€2.5M grant + €15M equity)',
    type: 'Blended Finance (Grant + Equity)',
    focus: 'Scaling breakthrough high-risk startups with validated field prototypes.'
  },
  {
    program: 'Eurostars / Eureka',
    agency: 'Eureka Network & EC',
    startTrl: 'TRL 4',
    targetTrl: 'TRL 6 – 7',
    budget: 'Up to €1,500,000 – €2,000,000 per consortium',
    type: 'Grant Subsidy (up to 75%)',
    focus: 'International collaborative R&D for innovative SMEs developing market-ready products.'
  },
  {
    program: 'TÜBİTAK 1507 (SME R&D)',
    agency: 'TÜBİTAK TEYDEB',
    startTrl: 'TRL 3',
    targetTrl: 'TRL 6 – 7',
    budget: 'Up to 2,400,000 TRY (75% grant)',
    type: 'Non-dilutive R&D Grant',
    focus: 'First-time SME industrial research, prototype development, and testing.'
  },
  {
    program: 'TÜBİTAK 1501 (Industry R&D)',
    agency: 'TÜBİTAK TEYDEB',
    startTrl: 'TRL 4',
    targetTrl: 'TRL 7 – 8',
    budget: 'Budget-scaled (up to 75% grant)',
    type: 'Non-dilutive Grant',
    focus: 'Large-scale corporate and SME industrial innovation, pilot trials, and commercialization.'
  }
];

const SEMANTIC_KEYWORDS = [
  'Technology Readiness Level Calculator',
  'TRL Calculator Online',
  'Horizon Europe TRL Guide (2026)',
  'EIC Accelerator TRL 5 to 8 Requirements',
  'NASA TRL ISO 16290 Assessment Tool',
  'Software Readiness Level (SRL) Scale',
  'DeepTech R&D Maturity Checklist',
  'TÜBİTAK 1501 TRL Değerlendirme',
  'EIC Pathfinder Entry TRL 1 to 4',
  'TRL Gap Analysis Roadmap Generator',
  'MRL vs TRL Manufacturing Readiness',
  'TRL 6 Prototype Relevant Environment',
  'Client-Side Private R&D Audit Tool',
  'Commercial Readiness Level (CRL) Matrix'
];

const RELATED_TOOLS = [
  { 
    name: 'Startup Runway Calculator', 
    desc: 'Simulate gross burn, revenue inflection, and fundraising timelines for R&D ventures.', 
    href: '#/tool/startup-runway-calculator' 
  },
  { 
    name: 'Universal Token Counter', 
    desc: 'Calculate exact token costs, context usage, and pricing for AI & DeepTech models.', 
    href: '#/tool/token-counter-universal' 
  },
  { 
    name: 'PDF → RAG Cleaner', 
    desc: 'Extract and clean patent documents and scientific papers into clean text for AI analysis.', 
    href: '#/tool/pdf-rag-cleaner' 
  },
  { 
    name: 'JSON Beautifier & Validator', 
    desc: 'Inspect and validate complex API payloads and telemetry schemas for software pilots.', 
    href: '#/tool/json-beautifier' 
  },
  { 
    name: 'Webhook Tester', 
    desc: 'Debug real-time IoT, telemetry, and external API webhooks with zero server setup.', 
    href: '#/tool/webhook-tester' 
  },
  { 
    name: 'HTML to LLM Markdown', 
    desc: 'Convert research websites and academic docs into clean Markdown for AI digestion.', 
    href: '#/tool/html-to-llm-markdown' 
  }
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
      'name': 'Cerilas TRL Calculator (Technology Readiness Level Assessment)',
      'operatingSystem': 'All',
      'applicationCategory': 'BusinessApplication',
      'url': 'https://tools.cerilas.com/#/tool/trl-calculator',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Free online Technology Readiness Level (TRL 1-9) calculator for Horizon Europe, EIC Accelerator, NASA ISO 16290, Software SRL, and TÜBİTAK Ar-Ge projects. Evaluates sequential prerequisite gating, development gaps, and grant eligibility with 100% in-browser privacy.'
    };

    // 3. HowTo Schema
    const howToStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'How to Assess Your R&D Project Technology Readiness Level (TRL 1 to 9)',
      'description': 'Step-by-step diagnostic methodology to determine your technology maturity baseline, identify missing validation milestones, and match eligible grant funding.',
      'step': [
        {
          '@type': 'HowToStep',
          'name': 'Select Standard Framework',
          'text': 'Choose the applicable evaluation standard: Horizon Europe (EC/EIC), NASA Aerospace (ISO 16290), Software/AI (SRL), or TÜBİTAK Ar-Ge.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Answer 18 Diagnostic Criteria',
          'text': 'Evaluate your project across the 5 chronological R&D phases (Basic Principles, Lab Validation, Relevant Testing, Operational Trials, and Commercial Mission).'
        },
        {
          '@type': 'HowToStep',
          'name': 'Review Strict Gated TRL & Gap Roadmap',
          'text': 'Inspect your sequentially validated TRL score and check the gap analysis list for critical tests preventing milestone progression.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Match Eligible Grant Funding Calls',
          'text': 'Review matched non-dilutive grant opportunities such as EIC Pathfinder, EIC Transition, EIC Accelerator, or national research subsidies.'
        },
        {
          '@type': 'HowToStep',
          'name': 'Export Audit Documentation',
          'text': 'Copy the formatted markdown audit report or export structured JSON data to paste directly into your grant application annex.'
        }
      ]
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

    let scriptHowTo = document.getElementById('trl-calculator-howto-jsonld');
    if (!scriptHowTo) {
      scriptHowTo = document.createElement('script');
      scriptHowTo.id = 'trl-calculator-howto-jsonld';
      scriptHowTo.type = 'application/ld+json';
      document.head.appendChild(scriptHowTo);
    }
    scriptHowTo.textContent = JSON.stringify(howToStructuredData);

    return () => {
      const elFaq = document.getElementById('trl-calculator-faq-jsonld');
      if (elFaq) elFaq.remove();
      const elApp = document.getElementById('trl-calculator-app-jsonld');
      if (elApp) elApp.remove();
      const elHowTo = document.getElementById('trl-calculator-howto-jsonld');
      if (elHowTo) elHowTo.remove();
    };
  }, []);

  return (
    <div className="trl-seo-container">
      {/* Editorial Header */}
      <div className="trl-seo-header">
        <h2 className="trl-seo-title">Technology Readiness Level (TRL 1–9) Comprehensive Audit Guide (2026)</h2>
        <p className="trl-seo-intro">
          Whether you are preparing a multi-million euro grant proposal for Horizon Europe (EIC Accelerator, Pathfinder),
          seeking national R&D subsidies (TÜBİTAK, SBIR, Innovate UK), or conducting technical due diligence for deeptech venture capital,
          providing an unshakeable, auditable Technology Readiness Level (TRL) is essential. Cerilas TRL Calculator delivers deterministic
          prerequisite gating, development gap identification, and grant funding eligibility matching with 100% in-browser client-side privacy.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="trl-seo-grid">
        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <GitCommit size={20} />
          </div>
          <h3 className="trl-seo-card-title">Deterministic Sequential Gating</h3>
          <p className="trl-seo-card-desc">
            Enforces strict formal auditing rules: higher levels cannot be claimed if foundational milestones (such as lab repeatability or PoC)
            lack verification.
          </p>
        </div>

        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <Compass size={20} />
          </div>
          <h3 className="trl-seo-card-title">Actionable Gap Mitigation Roadmap</h3>
          <p className="trl-seo-card-desc">
            Pinpoints exact testing protocols, environmental stress validations, and regulatory certifications required to advance to the next TRL.
          </p>
        </div>

        <div className="trl-seo-card">
          <div className="trl-seo-card-icon">
            <Award size={20} />
          </div>
          <h3 className="trl-seo-card-title">Grant Program Eligibility Matcher</h3>
          <p className="trl-seo-card-desc">
            Directly cross-references your validated TRL with active non-dilutive grant calls across EIC Pathfinder, Transition, Accelerator,
            TÜBİTAK, and Eurostars.
          </p>
        </div>
      </div>

      {/* Methodology Section: The 3 Macro TRL Phases */}
      <div className="trl-seo-methodology-section">
        <h3 className="trl-seo-section-heading">
          <BookOpen size={18} style={{ color: '#6366f1' }} />
          <span>The Three Macro Tiers of Technological Readiness</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Understanding the strategic difference between discovery research, engineering validation, and operational scaling.
        </p>

        <div className="trl-seo-macro-grid">
          <div className="trl-seo-macro-card low">
            <div className="trl-seo-macro-badge">TRL 1 – 3</div>
            <h4>Discovery & Proof of Concept</h4>
            <p>
              <strong>Primary Focus:</strong> Basic research, scientific observation, theoretical formulations, and early benchtop experiments.
            </p>
            <ul>
              <li>Academic literature reviews and mathematical equations.</li>
              <li>Controlled benchtop proof-of-concept (PoC) experiments.</li>
              <li>Funded primarily by universities and <strong>EIC Pathfinder / TÜBİTAK 1001</strong>.</li>
            </ul>
          </div>

          <div className="trl-seo-macro-card mid">
            <div className="trl-seo-macro-badge">TRL 4 – 6</div>
            <h4>Validation & Prototype Demonstration</h4>
            <p>
              <strong>Primary Focus:</strong> Component integration into breadboards and testing representative prototypes in relevant environments.
            </p>
            <ul>
              <li>Simulated environmental stress (thermal, vibration, network noise).</li>
              <li>Full-scale engineering prototype demonstration (TRL 6).</li>
              <li>Funded by <strong>EIC Transition / TÜBİTAK 1507 & 1501 / Eurostars</strong>.</li>
            </ul>
          </div>

          <div className="trl-seo-macro-card high">
            <div className="trl-seo-macro-badge">TRL 7 – 9</div>
            <h4>Field Qualification & Commercial Scaling</h4>
            <p>
              <strong>Primary Focus:</strong> Customer field trials, regulatory pre-compliance (CE, FDA), full system qualification, and mass manufacturing.
            </p>
            <ul>
              <li>Operational trials with paying pilot customers.</li>
              <li>Formal certifications (ISO 13485, CE, SOC2, UL).</li>
              <li>Funded by <strong>EIC Accelerator (up to €17.5M) & DeepTech VCs</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Standard Reference Comparison Table */}
      <div className="trl-seo-table-section">
        <h3 className="trl-seo-section-heading">
          <Layers size={18} style={{ color: '#6366f1' }} />
          <span>Cross-Framework TRL 1 to 9 Standard Specification Matrix</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Comprehensive comparison mapping European Commission (Horizon Europe), NASA (ISO 16290), Software/AI (SRL), and required evidentiary deliverables.
        </p>
        <div className="trl-seo-table-wrap">
          <table className="trl-seo-specs-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Phase Name</th>
                <th>Horizon Europe (EC)</th>
                <th>NASA (ISO 16290)</th>
                <th>Software & AI (SRL)</th>
                <th>Required Evidence</th>
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
                  <td>{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* European & Global Grant Entry/Exit Gates Table */}
      <div className="trl-seo-table-section">
        <h3 className="trl-seo-section-heading">
          <DollarSign size={18} style={{ color: '#10b981' }} />
          <span>Major R&D Grant Funding Schemes: Entry & Exit TRL Gates</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Official entry and exit readiness thresholds for major international deeptech innovation and SME research grant programs.
        </p>
        <div className="trl-seo-table-wrap">
          <table className="trl-seo-specs-table">
            <thead>
              <tr>
                <th>Grant Program</th>
                <th>Funding Agency</th>
                <th>Entry TRL</th>
                <th>Exit TRL</th>
                <th>Maximum Budget</th>
                <th>Funding Nature</th>
                <th>Strategic Focus</th>
              </tr>
            </thead>
            <tbody>
              {GRANT_GATES_TABLE.map((grant, i) => (
                <tr key={i}>
                  <td><strong>{grant.program}</strong></td>
                  <td>{grant.agency}</td>
                  <td><span className="trl-table-badge">{grant.startTrl}</span></td>
                  <td><span className="trl-table-badge success">{grant.targetTrl}</span></td>
                  <td>{grant.budget}</td>
                  <td>{grant.type}</td>
                  <td>{grant.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How To Step-by-Step Diagnostic Audit Guide */}
      <div className="trl-seo-howto-section">
        <h3 className="trl-seo-section-heading">
          <FileCheck2 size={18} style={{ color: '#0284c7' }} />
          <span>How to Successfully Audit Your Technology Readiness Level</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          A systematic 5-step methodology used by professional grant evaluators and technical auditors.
        </p>

        <div className="trl-seo-steps-list">
          <div className="trl-seo-step-item">
            <div className="trl-seo-step-num">1</div>
            <div className="trl-seo-step-content">
              <h4>Define System Boundaries & Standard Framework</h4>
              <p>
                Clearly delineate the core technological concept from third-party commercial components. Select your primary evaluation framework (Horizon Europe for EU grants, NASA for aerospace/hardware, or Software SRL for AI algorithms).
              </p>
            </div>
          </div>

          <div className="trl-seo-step-item">
            <div className="trl-seo-step-num">2</div>
            <div className="trl-seo-step-content">
              <h4>Audit Sequential Prerequisites (Enforce Strict Gating)</h4>
              <p>
                Never claim advanced TRLs (such as TRL 6 or 7) based on assumptions. Verify that lower-tier prerequisites (e.g., repeatable bench testing at TRL 3 and component integration at TRL 4) are completely documented with empirical data.
              </p>
            </div>
          </div>

          <div className="trl-seo-step-item">
            <div className="trl-seo-step-num">3</div>
            <div className="trl-seo-step-content">
              <h4>Gather Tangible Test Protocols & Deliverables</h4>
              <p>
                Compile concrete evidentiary artifacts: test logs, environmental telemetry (thermal, vibration, noisy datasets), customer beta feedback, and pre-compliance safety audits.
              </p>
            </div>
          </div>

          <div className="trl-seo-step-item">
            <div className="trl-seo-step-num">4</div>
            <div className="trl-seo-step-content">
              <h4>Formulate a Gap Mitigation Roadmap</h4>
              <p>
                Use our automated Gap Analysis tab to extract unfulfilled criteria. Detail the specific testing procedures, budgets, and milestones required to elevate your project to the target grant entry gate.
              </p>
            </div>
          </div>

          <div className="trl-seo-step-item">
            <div className="trl-seo-step-num">5</div>
            <div className="trl-seo-step-content">
              <h4>Export Audit Summaries for Grant Proposals & Data Rooms</h4>
              <p>
                Export structured markdown reports or JSON audit files and append them directly to proposal annexes (e.g. EIC Accelerator Work Package 1) to demonstrate scientific rigor to evaluating jurors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Keyword Cloud */}
      <div className="trl-seo-keywords-block">
        <div className="trl-seo-keywords-title">
          <Tag size={15} />
          <span>High-Intent Research & Grant Keywords</span>
        </div>
        <div className="trl-seo-pills-wrap">
          {SEMANTIC_KEYWORDS.map((kw, i) => (
            <span key={i} className="trl-keyword-tag">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="trl-seo-faq-section">
        <h3 className="trl-seo-section-heading">
          <HelpCircle size={18} style={{ color: '#6366f1' }} />
          <span>Frequently Asked Questions About Technology Readiness Levels</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Expert answers to common evaluation questions for researchers, deeptech founders, and grant consultants.
        </p>

        <div className="trl-faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className={`trl-faq-item ${openFaq === idx ? 'open' : ''}`}
            >
              <button 
                type="button" 
                className="trl-faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={18} className="trl-faq-arrow" />
              </button>
              {openFaq === idx && (
                <div className="trl-faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Related Tools Cross-Linking */}
      <div className="trl-seo-related-section">
        <h3 className="trl-seo-section-heading">
          <Sparkles size={18} style={{ color: '#6366f1' }} />
          <span>Explore Related Cerilas Research & Engineering Tools</span>
        </h3>
        <p className="trl-seo-section-subtitle">
          Free, client-side developer and founder utilities built for high performance and strict privacy.
        </p>

        <div className="trl-related-grid">
          {RELATED_TOOLS.map((tool, i) => (
            <a key={i} href={tool.href} className="trl-related-card">
              <div className="trl-related-card-header">
                <h4>{tool.name}</h4>
                <ArrowUpRight size={16} className="trl-related-card-arrow" />
              </div>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
