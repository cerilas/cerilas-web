export const startupRunwayCalculatorManifest = {
  slug: 'startup-runway-calculator',
  title: 'Startup Runway Calculator',
  shortDescription: 'Calculate net monthly burn rate, cash runway in months, zero-cash date, and simulate revenue growth scenarios with venture capital benchmarks.',
  category: 'Startup & Finance',
  iconName: 'Clock',
  badge: 'VC Benchmark',
  targetUrl: '#/tool/startup-runway-calculator',
  seoTitle: 'Startup Runway Calculator - Net Burn & Cash Out Date | Cerilas Tools',
  seoDescription: 'Free startup cash runway calculator. Calculate net burn rate, months of runway left, zero cash date, and dynamic revenue growth projections with B2B SaaS benchmarks.',
  features: [
    'Dynamic Revenue Growth Modeling: Accounts for month-over-month compounding revenue rather than static burn only',
    'Interactive Scenario Planning: Test hiring plans (+expenses) or emergency cost cuts to see instant runway extensions',
    'Zero-Cash Date & Break-Even Detection: Automatically calculates profitability crossover if growth outpaces burn',
    'Venture Capital Health Verdicts: Instant feedback comparing your runway against Seed, Series A, and Series B benchmarks',
    'One-Click Pitch Deck Summary: Copy a cleanly formatted investor update with burn multiple and monthly runway',
    '100% In-Browser Privacy: All financial figures are calculated locally in your browser with zero server storage'
  ],
  conversionLabel: 'Calculations',
  seo: {
    title: "Startup Runway Calculator – Cash Burn & Runway | Cerilas Tools",
    description: "Calculate startup runway in months, net monthly burn rate, and projected zero cash date. Model fundraising buffers and hiring scenarios with instant charts.",
    keywords: "startup runway calculator, burn rate calculator, cash runway saas, zero cash date, startup financial model, venture capital runway, net burn calculator",
    ogImage: 'https://tools.cerilas.com/tool-icons/startup-runway-calculator.webp',
    ogImageAlt: "Startup Runway Calculator – Cash Burn & Runway | Cerilas Tools",
    breadcrumbsName: "Startup Runway Calculator",
    faq: [
        {
            "q": "What is the formula for calculating startup cash runway?",
            "a": "Runway (in months) equals your Total Cash Balance divided by your Net Monthly Burn Rate (Total Monthly Expenses minus Total Monthly Revenue)."
        },
        {
            "q": "What is the difference between Gross Burn and Net Burn?",
            "a": "Gross Burn is the total cash leaving your bank account each month. Net Burn subtracts incoming monthly revenue from gross burn to show true net cash loss."
        },
        {
            "q": "How many months of runway should an early-stage startup maintain?",
            "a": "Most venture capitalists recommend maintaining 18 to 24 months of runway to allow 6 months for closing the next fundraising round without operational panic."
        },
        {
            "q": "How do new hires and planned expenses impact runway forecasts?",
            "a": "Our calculator lets you add projected headcount costs and milestone spend to model exact drop-offs in runway before committing to hiring."
        }
    ]
  }
};
