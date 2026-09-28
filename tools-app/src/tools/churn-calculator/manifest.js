export const churnCalculatorManifest = {
  slug: 'churn-calculator',
  title: 'Churn Calculator',
  shortDescription: 'Calculate Customer (Logo) Churn, Gross Revenue Churn, Net Revenue Retention (NRR), and Gross Revenue Retention (GRR) with SaaS industry benchmarks.',
  category: 'Startup & Finance',
  iconName: 'RotateCcw',
  badge: 'Retention & NRR',
  targetUrl: '#/tool/churn-calculator',
  seoTitle: 'Churn Calculator - Customer & Revenue Churn Rate, NRR | Cerilas Tools',
  seoDescription: 'Free SaaS Churn Calculator. Calculate Logo Churn Rate, Gross vs Net Revenue Churn, Net Revenue Retention (NRR), and average customer lifetime in months.',
  features: [
    'Dual Churn Tracking: Computes both Logo (Customer) Churn and Gross Revenue (Dollar) Churn',
    'Net Revenue Retention (NRR): Evaluates expansion vs churn to identify Negative Net Churn',
    'Gross Revenue Retention (GRR): Measures baseline cohort revenue stability excluding expansion',
    'Average Customer Lifetime: Converts monthly churn rates into expected retention lifespan',
    'Industry Benchmark Grading: Instant verdict comparing your retention to SMB, Mid-Market, and Enterprise tiers',
    '100% In-Browser Privacy: All customer and financial numbers remain strictly in your local device memory'
  ],
  conversionLabel: 'Calculations',
  seo: {
    title: "Free Churn Rate Calculator – Customer & MRR Churn | Cerilas Tools",
    description: "Calculate customer churn rate and gross or net revenue churn percentage for SaaS. Benchmark against industry standards to improve subscriber retention rate.",
    keywords: "churn calculator, churn rate calculator, customer churn rate, revenue churn calculator, saas retention, logo churn, net revenue retention calculator",
    ogImage: 'https://tools.cerilas.com/tool-icons/churn-calculator.webp',
    ogImageAlt: "Free Churn Rate Calculator – Customer & MRR Churn | Cerilas Tools",
    breadcrumbsName: "Churn Rate Calculator",
    faq: [
        {
            "q": "What is the difference between Customer (Logo) Churn and Revenue Churn?",
            "a": "Customer Churn measures the percentage of accounts lost. Revenue Churn measures the dollar amount of recurring revenue lost, which accounts for tier differences."
        },
        {
            "q": "What is Net Negative Churn and why is it crucial for SaaS scale?",
            "a": "Net Negative Churn occurs when expansion revenue from existing customers exceeds revenue lost from cancellations, meaning revenue grows even with zero new sales."
        },
        {
            "q": "What is considered a healthy annual churn rate for B2B vs B2C SaaS?",
            "a": "Enterprise B2B SaaS typically targets 5% to 7% annual churn (<1% monthly). B2C and SMB subscriptions typically experience 3% to 5% monthly churn."
        },
        {
            "q": "How do you accurately convert monthly churn into an annual churn rate?",
            "a": "Annual Churn = 1 - (1 - Monthly Churn)^12. For example, a 3% monthly churn rate compounds to 30.6% annual churn."
        }
    ]
  }
};
