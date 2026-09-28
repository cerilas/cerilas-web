export const trlCalculatorManifest = {
  slug: 'trl-calculator',
  title: 'TRL Calculator',
  shortDescription: 'Assess Technology Readiness Levels (TRL 1–9) for R&D projects, grant proposals (Horizon Europe, EIC, TÜBİTAK), and deeptech startups. Includes gap roadmap and grant matcher.',
  category: 'R&D & Engineering',
  iconName: 'GitCommit',
  badge: 'Scientific R&D',
  isAi: false,
  targetUrl: '#/tool/trl-calculator',
  features: [
    'Standardized Multi-Framework Assessment: Support for Horizon Europe (EC), NASA / Aerospace (ISO 16290), Software SRL, and TÜBİTAK Ar-Ge frameworks',
    'Deterministic TRL 1–9 Evaluation: Strict milestone gating algorithms and overall percentage readiness scoring',
    'Interactive Guided & Matrix Modes: Choose between step-by-step diagnostic questionnaire or quick 9-level criteria matrix',
    'Actionable Gap Analysis & Roadmap: Pinpoints exact missing test protocols, environmental validations, and deliverables needed to reach the next TRL',
    'Grant & Funding Program Matcher: Matches calculated TRL with EIC Pathfinder, EIC Transition, EIC Accelerator, TÜBİTAK 1501/1507/1707, Eurostars, and VC funding calls',
    'Audit-Ready Export: Generate executive evaluation summaries in Markdown and JSON ready to paste into proposal annexes',
    '100% Client-Side Privacy: Proprietary IP, formulas, and confidential research data are never transmitted to any server'
  ],
  seo: {
    title: "Free TRL Calculator (1-9) – Readiness Assessment | Cerilas Tools",
    description: "Calculate Technology Readiness Level (TRL 1-9) for Horizon Europe, NASA, and DeepTech R&D grants. Includes gap analysis, milestone roadmap, and grant matching.",
    keywords: "trl calculator, technology readiness level, horizon europe trl, nasa trl assessment, deeptech trl, r&d readiness scale, software readiness level",
    ogImage: 'https://tools.cerilas.com/tool-icons/trl-calculator.webp',
    ogImageAlt: "Free TRL Calculator (1-9) – Readiness Assessment | Cerilas Tools",
    breadcrumbsName: "TRL Calculator",
    faq: [
        {
            "q": "What is the operational difference between TRL 4, TRL 6, and TRL 8?",
            "a": "TRL 4 represents laboratory component validation. TRL 6 represents a prototype demonstrated in an operational or relevant simulated environment. TRL 8 indicates a completed, qualified system ready for commercial deployment."
        },
        {
            "q": "Which Horizon Europe funding schemes match my assessed TRL?",
            "a": "EIC Pathfinder targets early breakthrough concepts (TRL 1-4). EIC Transition supports technology maturation (TRL 4-6). EIC Accelerator finances commercial scaleup and deployment (TRL 5-9)."
        },
        {
            "q": "Does this calculator support software and digital innovations (SRL)?",
            "a": "Yes. It includes specialized software readiness metrics covering algorithm formulation, alpha/beta test benches, continuous integration in staging, and live production deployment."
        },
        {
            "q": "Can I export the TRL diagnostic report for grant evaluators?",
            "a": "Yes. The calculator generates an executive summary report with audit checklists, milestone gap analyses, and grant recommendations ready for submission."
        }
    ]
  }
};
