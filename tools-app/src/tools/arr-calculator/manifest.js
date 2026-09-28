export const arrCalculatorManifest = {
  slug: 'arr-calculator',
  title: 'ARR Calculator',
  shortDescription: 'Convert MRR to Annual Recurring Revenue (ARR), forecast 1-to-3 year revenue trajectories, calculate Rule of 40 score, and evaluate ARR per employee efficiency.',
  category: 'Startup & Finance',
  iconName: 'Database',
  badge: 'Valuation Metric',
  targetUrl: '#/tool/arr-calculator',
  seoTitle: 'ARR Calculator - Annual Recurring Revenue & Rule of 40 | Cerilas Tools',
  seoDescription: 'Free SaaS ARR Calculator. Convert MRR to ARR, project multi-year revenue compounding, measure ACV (Average Contract Value), and calculate Rule of 40 score.',
  features: [
    'Instant MRR to ARR Conversion: Seamless bi-directional calculation between monthly and annualized figures',
    '3-Year ARR Projection: Visualizes compound annual growth rate (CAGR) milestones ($1M, $5M, $10M ARR)',
    'Rule of 40 Calculator: Measures growth rate plus profit margin against top-quartile SaaS valuation benchmarks',
    'ARR Per Employee Efficiency: Calculates employee productivity to benchmark hiring velocity against revenue',
    'Average Contract Value (ACV): Automatically computes mean revenue per customer account',
    '100% In-Browser Privacy: All financial computations run locally without server tracking or uploads'
  ],
  conversionLabel: 'Calculations',
  seo: {
    title: "Free ARR Calculator – Annual Recurring Revenue | Cerilas Tools",
    description: "Calculate Annual Recurring Revenue (ARR) and SaaS valuation multiples. Track expansion revenue, contraction, and ARR run rate with instant audit breakdowns.",
    keywords: "arr calculator, annual recurring revenue, saas arr calculator, arr run rate, startup valuation calculator, enterprise acv calculator, b2b saas metrics",
    ogImage: 'https://tools.cerilas.com/tool-icons/arr-calculator.webp',
    ogImageAlt: "Free ARR Calculator – Annual Recurring Revenue | Cerilas Tools",
    breadcrumbsName: "ARR Calculator",
    faq: [
        {
            "q": "What is the formal difference between ARR and MRR x 12?",
            "a": "For pure monthly contracts, ARR equals MRR x 12 (annualized run rate). For enterprise B2B with multi-year annual contracts, ARR measures normalized annual contract value (ACV)."
        },
        {
            "q": "Should multi-year enterprise contracts be counted into a single year's ARR?",
            "a": "No. A 3-year $300,000 contract should be recognized as $100,000 in ARR each year rather than counting the full $300,000 upfront."
        },
        {
            "q": "How do venture capital investors use ARR to calculate valuation multiples?",
            "a": "SaaS valuations are commonly expressed as multiples of ARR (e.g. 5x to 15x ARR) depending on net revenue retention, growth rate, and gross margins."
        },
        {
            "q": "What is the difference between Committed ARR and Recognized ARR?",
            "a": "Committed ARR (CARR) includes signed contracts awaiting deployment, while Recognized ARR only counts revenue currently being delivered and billed."
        }
    ]
  }
};
