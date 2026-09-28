export const sampleSizeCalculatorManifest = {
  slug: 'sample-size-calculator',
  title: 'Sample Size Calculator',
  shortDescription: 'Calculate statistically sound sample sizes for surveys, clinical research, A/B tests, proportions, means, and correlations. Features power analysis, dropout adjustments, and audit reports.',
  category: 'R&D & Engineering',
  icon_name: 'Scale',
  badge: 'Scientific R&D',
  isAi: false,
  targetUrl: '#/tool/sample-size-calculator',
  features: [
    '7 Specialized Calculation Modes: Survey/Population, Single Proportion, Continuous Mean, Two Means (Cohen\'s d), Two Proportions, Pearson Correlation (Fisher\'s z), and A/B Testing',
    'Deterministic Mathematical Rigor: High-precision Acklam inverse normal quantiles, exact power analysis, and Cochran finite population corrections',
    'Smart Research Assistant: Classifies study descriptions in plain English to recommend the correct calculator without relying on AI for statistical math',
    'Beginner & Advanced Modes: Seamlessly switch between intuitive plain-English inputs and full academic parameters (α, β, Cohen\'s d, standard deviation, allocation ratio)',
    'Dropout & Non-Response Adjustment: Computes both minimum required completed sample and recommended recruitment target based on anticipated attrition',
    'Transparent Calculation Steps: Full step-by-step formula breakdowns with variable values ready for grant proposals, theses, and IRB submissions',
    'Executive Research Report Export: Generate printable audit reports and save calculations locally into your personal research workspace'
  ],
  seo: {
    title: "Sample Size Calculator – Research Studies & Power | Cerilas Tools",
    description: "Calculate minimum sample size for research studies, clinical trials, and surveys. Includes power analysis, margin of error, and finite population correction.",
    keywords: "sample size calculator, calculate sample size, survey sample size, power analysis calculator, margin of error calculator, cohen d sample size, finite population correction",
    ogImage: 'https://tools.cerilas.com/tool-icons/sample-size-calculator.webp',
    ogImageAlt: "Sample Size Calculator – Research Studies & Power | Cerilas Tools",
    breadcrumbsName: "Sample Size Calculator",
    faq: [
        {
            "q": "Why is 95% confidence level and 5% margin of error the scientific benchmark?",
            "a": "A 95% confidence level corresponds to an alpha (type I error rate) of 0.05, which is the peer-reviewed scientific standard. A 5% margin of error balances precision with realistic participant recruitment budgets."
        },
        {
            "q": "What is the Finite Population Correction (FPC)?",
            "a": "When your sample size exceeds 5% of the total target population (n/N > 0.05), the finite population correction formula adjusts the required sample downward because sampling without replacement captures a significant fraction of total population variance."
        },
        {
            "q": "How does statistical power affect sample size requirements?",
            "a": "Statistical power (1 - beta) is the probability of correctly identifying a genuine effect if one exists. Increasing power from 80% to 90% typically increases the required participant count by 30% to 40%."
        },
        {
            "q": "Can I export calculation steps for IRB approval or grant applications?",
            "a": "Yes. The tool generates an itemized methodology breakdown including equations, z-scores, effect sizes, and attrition adjustments ready to paste directly into your ethics committee protocol or grant proposal."
        }
    ]
  }
};
