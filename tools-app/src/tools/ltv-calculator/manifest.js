export const ltvCalculatorManifest = {
  slug: 'ltv-calculator',
  title: 'LTV Calculator',
  shortDescription: 'Calculate Customer Lifetime Value (LTV), expected customer lifespan in months, gross profit generated per customer, and discounted cash flow LTV.',
  category: 'Startup & Finance',
  iconName: 'DollarSign',
  badge: 'Unit Economics',
  targetUrl: '#/tool/ltv-calculator',
  seoTitle: 'Customer Lifetime Value (LTV) Calculator | Cerilas Tools',
  seoDescription: 'Free SaaS LTV Calculator. Calculate Customer Lifetime Value from ARPU, Gross Margin %, and Monthly Churn with discounted cohort modeling.',
  features: [
    'Margin-Adjusted LTV: Calculates real gross profit lifetime value rather than top-line revenue only',
    'Customer Lifespan Projections: Determines expected duration of relationship in months and years',
    'Discounted Cash Flow (DCF) Option: Factors in annual cost of capital for high-accuracy enterprise valuations',
    'Interactive Churn Sensitivity: Move churn rate sliders to see immediate impact on enterprise valuation',
    'One-Click Metrics Export: Clean report formatting for investor pitches and unit economic reviews',
    '100% In-Browser Privacy: All financial data is calculated locally with zero external tracking'
  ],
  conversionLabel: 'Calculations',
  seo: {
    title: "Free LTV Calculator – Customer Lifetime Value | Cerilas Tools",
    description: "Calculate Customer Lifetime Value (LTV / CLTV) with ARPU, churn rates, and gross margins. Benchmark unit economics and plan sustainable customer acquisition.",
    keywords: "ltv calculator, customer lifetime value, cltv calculator, saas ltv calculation, arpu ltv, customer lifespan calculator, unit economics calculator",
    ogImage: 'https://tools.cerilas.com/tool-icons/ltv-calculator.webp',
    ogImageAlt: "Free LTV Calculator – Customer Lifetime Value | Cerilas Tools",
    breadcrumbsName: "Customer Lifetime Value (LTV) Calculator",
    faq: [
        {
            "q": "What is the standard formula for calculating SaaS Customer Lifetime Value?",
            "a": "LTV = (ARPU × Gross Margin %) / Customer Churn Rate. It calculates the cumulative gross profit expected from a single customer over their lifespan."
        },
        {
            "q": "Why must Gross Margin Percentage be included in LTV calculations?",
            "a": "Using pure revenue instead of gross profit artificially inflates LTV, leading founders to overspend on acquisition and burn cash on unprofitable users."
        },
        {
            "q": "What is the difference between customer lifespan and churn rate?",
            "a": "Customer Lifespan is the mathematical inverse of Churn Rate (1 / Churn). If monthly churn is 5%, average customer lifespan is 20 months."
        },
        {
            "q": "How can SaaS companies effectively increase their Customer Lifetime Value?",
            "a": "By reducing churn through better onboarding, expanding account revenue with tier upgrades and add-ons, and increasing gross profit margins."
        }
    ]
  }
};
