import React, { useEffect } from 'react';
import './SampleSizeCalculatorSeo.css';

const FAQ_ITEMS = [
  {
    q: 'What sample size do I need for a population of 1,000?',
    a: 'For a finite population of 1,000 people, a standard survey using a 95% confidence level and ±5% margin of error with an assumed 50% proportion requires **278 completed responses**. If you widen the margin of error to ±10%, the required sample drops to 88 respondents. If you require a tighter ±3% margin of error, you will need 516 respondents.'
  },
  {
    q: 'Does population size affect sample size?',
    a: 'Much less than most people assume. When populations exceed 20,000 to 50,000 individuals, the required sample size plateaus because the Finite Population Correction factor approaches 1.0. For example, a 95% confidence level with ±5% margin of error requires 383 respondents for a population of 100,000, and 384 respondents for an infinite population of 1 billion people.'
  },
  {
    q: 'What is a good sample size for research?',
    a: 'There is no universal "one-size-fits-all" sample size. A good sample size is one derived from a formal power calculation that balances statistical power (typically 80%–90%), acceptable Type I error risk (α = 0.05), and practical recruitment feasibility. Descriptive surveys commonly recruit 300–400 participants, while clinical trials or small-effect laboratory studies may require hundreds to thousands per group.'
  },
  {
    q: 'What is the difference between sample size and statistical power?',
    a: 'Sample size is the total count of participants or experimental units observed in a study. Statistical power (1 - β) is the probability that your study will detect a true effect or difference when one genuinely exists. Increasing sample size directly increases statistical power and decreases the risk of false negatives (Type II errors).'
  },
  {
    q: 'How do I calculate sample size for two groups?',
    a: 'Calculating sample sizes for two groups (such as treatment vs. control) requires specifying the expected standardized effect size (such as Cohen\'s d for continuous averages or percentage difference Δ for binary rates), the desired statistical power (usually 80%), and significance level (α = 0.05). Use the "Compare Two Means" or "Compare Two Proportions" calculators above to compute exact group quotas.'
  },
  {
    q: 'What sample size do I need for a survey?',
    a: 'Most published consumer, organizational, and political polls target **385 completed responses** for nationwide or large audiences (95% confidence level and ±5% margin of error). For smaller internal organizations (e.g. 500 employees), the finite-adjusted sample size is approximately 217 employees.'
  },
  {
    q: 'What happens if my sample size is too small?',
    a: 'An underpowered study is vulnerable to Type II errors (failing to detect genuine medical, scientific, or market effects). Furthermore, statistically significant findings from underpowered studies often suffer from the "winner\'s curse," where observed effect sizes are heavily exaggerated compared to truth.'
  },
  {
    q: 'Should I add 10% for dropout or non-response?',
    a: 'Yes, experienced researchers routinely increase recruitment targets above the required completed sample size to compensate for non-response, survey dropouts, or lost-to-follow-up patients. For example, if your statistical model calls for 385 completed answers and you anticipate a 10% non-response rate, you should recruit at least 428 participants (385 / 0.90).'
  }
];

export default function SampleSizeCalculatorSeo() {
  useEffect(() => {
    // Inject JSON-LD structured data
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a.replace(/\*\*/g, '')
        }
      }))
    };

    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Cerilas Sample Size Calculator',
      'url': 'https://tools.cerilas.com/#/tool/sample-size-calculator',
      'applicationCategory': 'EducationalApplication',
      'operatingSystem': 'All modern web browsers',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Free online statistical sample size calculator for surveys, experiments, clinical research, A/B testing, and two-group comparisons.'
    };

    let scriptFaq = document.getElementById('ssc-faq-jsonld');
    if (!scriptFaq) {
      scriptFaq = document.createElement('script');
      scriptFaq.id = 'ssc-faq-jsonld';
      scriptFaq.type = 'application/ld+json';
      document.head.appendChild(scriptFaq);
    }
    scriptFaq.textContent = JSON.stringify(faqSchema);

    let scriptApp = document.getElementById('ssc-app-jsonld');
    if (!scriptApp) {
      scriptApp = document.createElement('script');
      scriptApp.id = 'ssc-app-jsonld';
      scriptApp.type = 'application/ld+json';
      document.head.appendChild(scriptApp);
    }
    scriptApp.textContent = JSON.stringify(webAppSchema);

    return () => {
      const elFaq = document.getElementById('ssc-faq-jsonld');
      if (elFaq) elFaq.remove();
      const elApp = document.getElementById('ssc-app-jsonld');
      if (elApp) elApp.remove();
    };
  }, []);

  return (
    <section className="ssc-seo-container">
      {/* Educational Article */}
      <article className="ssc-seo-article">
        <header className="ssc-seo-header">
          <span className="ssc-seo-tag">Methodology & Research Guide</span>
          <h2 className="ssc-seo-main-title">Statistical Guide to Sample Size Determination</h2>
          <p className="ssc-seo-lead">
            Understanding how to calculate the minimum required sample size ensures your clinical trials, empirical theses, surveys, and A/B experiments generate statistically credible, reproducible conclusions without wasting budget or human resources.
          </p>
        </header>

        <section className="ssc-seo-section">
          <h3>What is a sample size?</h3>
          <p>
            In statistics and empirical research, <strong>sample size</strong> ($n$) refers to the number of individual observations, participants, or experimental units collected from a broader target population. Because researching every member of an entire population is usually logistically and financially impossible, researchers evaluate a representative subset. The mathematical goal of sample size planning is to ensure that inferences drawn from this subset accurately reflect the population within pre-defined boundaries of certainty.
          </p>
        </section>

        <section className="ssc-seo-section">
          <h3>How is sample size calculated?</h3>
          <p>
            Sample size calculations link six foundational statistical concepts:
          </p>
          <div className="ssc-seo-cards-grid">
            <div className="ssc-seo-card">
              <h4>1. Confidence Level (1 - α)</h4>
              <p>
                The degree of certainty that the sample estimate falls within your chosen margin of error. Standard academic convention utilizes 95% ($Z = 1.960$), representing a 5% risk of Type I error.
              </p>
            </div>
            <div className="ssc-seo-card">
              <h4>2. Margin of Error (e or E)</h4>
              <p>
                The maximum acceptable boundary of precision between your sample estimate and the true population parameter (commonly ±3% to ±5%).
              </p>
            </div>
            <div className="ssc-seo-card">
              <h4>3. Population Size (N)</h4>
              <p>
                The total universe of eligible subjects. When populations are finite and small ($N &lt; 50,000$), a Finite Population Correction (FPC) is applied to adjust sample requirements downward.
              </p>
            </div>
            <div className="ssc-seo-card">
              <h4>4. Expected Proportion (p)</h4>
              <p>
                The anticipated response distribution across binary outcomes. Selecting $p = 0.50$ produces maximum mathematical variance and the safest sample quota.
              </p>
            </div>
            <div className="ssc-seo-card">
              <h4>5. Statistical Power (1 - β)</h4>
              <p>
                The probability that a hypothesis test will detect a genuine effect or difference when one truly exists. The accepted scientific standard is 80% to 90% power.
              </p>
            </div>
            <div className="ssc-seo-card">
              <h4>6. Effect Size (Cohen's d or r)</h4>
              <p>
                The magnitude of the difference or association you expect to detect between experimental conditions. Smaller expected effects mandate substantially larger participant pools.
              </p>
            </div>
          </div>
        </section>

        <section className="ssc-seo-section">
          <h3>What confidence level should I use?</h3>
          <p>
            The choice of confidence level depends on the severity of a false positive finding in your specific domain:
          </p>
          <ul>
            <li><strong>90% Confidence Level ($Z = 1.645$):</strong> Frequently selected for exploratory customer feedback, preliminary pilot investigations, or rapid market research where velocity and lower recruitment budgets outweigh strict certainty.</li>
            <li><strong>95% Confidence Level ($Z = 1.960$):</strong> The gold standard in scientific peer review, university theses, social science journals, and standard public opinion polling.</li>
            <li><strong>99% Confidence Level ($Z = 2.576$):</strong> Required in clinical pharmaceutical trials, safety-critical aerospace testing, and forensic investigations where Type I errors carry substantial legal, human, or financial liability.</li>
          </ul>
        </section>

        <section className="ssc-seo-section">
          <h3>Why is 50% used for population proportion?</h3>
          <p>
            In the Cochran sample size equation n₀ = (Z² · p(1 - p)) / e², the product p(1 - p) measures binomial variance. This product reaches its absolute mathematical maximum when p = 0.50 (0.50 × 0.50 = 0.25). For any other value of p (e.g., p = 0.20 → 0.20 × 0.80 = 0.16), the variance is smaller.
          </p>
          <p>
            Therefore, assuming p = 50% when the true population distribution is unknown yields the most conservative (largest) required sample size, guaranteeing your study will remain statistically valid regardless of the actual observed proportion.
          </p>
        </section>

        <section className="ssc-seo-section">
          <h3>Should I increase sample size for dropout?</h3>
          <p>
            In virtually all human-subject studies, a fraction of initially recruited individuals will withdraw, fail to complete questionnaires, or be lost to follow-up. If your power analysis specifies a minimum completed sample of n, your recruitment target N (target) must be adjusted:
          </p>
          <div className="ssc-seo-formula-box">
            <code>N_target = ⌈ n / (1 - Dropout_Rate) ⌉</code>
          </div>
          <p>
            Failing to factor in attrition will leave your final dataset statistically underpowered, invalidating pre-registered primary endpoints and wasting investigator effort.
          </p>
        </section>

        {/* Worked Example */}
        <section className="ssc-seo-section">
          <h3>Sample Size Example: Step-by-Step Calculation</h3>
          <p>
            Suppose a university researcher wants to survey a campus population of <strong>10,000 students</strong> to assess student mental health service awareness with a <strong>95% confidence level</strong>, a <strong>±5% margin of error</strong>, and an expected <strong>10% non-response rate</strong>:
          </p>
          <div className="ssc-seo-example-box">
            <ol>
              <li>
                <strong>Step 1: Identify Parameters</strong>
                <br />Confidence level = 95% ($Z = 1.960$), Margin of error $e = 0.05$, Expected proportion $p = 0.50$, Population $N = 10,000$.
              </li>
              <li>
                <strong>Step 2: Calculate Infinite Baseline Sample ($n_0$)</strong>
                <br /><code>n₀ = (1.960² × 0.50 × 0.50) / 0.05² = (3.8416 × 0.25) / 0.0025 = 384.16</code>
              </li>
              <li>
                <strong>Step 3: Apply Finite Population Correction</strong>
                <br /><code>n = 384.16 / [ 1 + (384.16 - 1) / 10,000 ] = 384.16 / 1.0383 = 370.01</code>
                <br />Rounding up gives <strong>371 completed respondents</strong>.
              </li>
              <li>
                <strong>Step 4: Factor in 10% Non-Response</strong>
                <br /><code>Target = ⌈ 371 / (1 - 0.10) ⌉ = ⌈ 412.2 ⌉ = 413 students to invite.</code>
              </li>
            </ol>
          </div>
        </section>

        {/* FAQs */}
        <section className="ssc-seo-section ssc-seo-faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="ssc-faq-list">
            {FAQ_ITEMS.map((item, index) => (
              <details key={index} className="ssc-faq-item">
                <summary className="ssc-faq-question">
                  <span>{item.q}</span>
                </summary>
                <div 
                  className="ssc-faq-answer"
                  dangerouslySetInnerHTML={{ __html: item.a.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </details>
            ))}
          </div>
        </section>

        {/* Regulatory Disclaimer */}
        <footer className="ssc-seo-disclaimer">
          <h4>Academic & Regulatory Notice</h4>
          <p>
            This calculator is intended for research planning, study design, and educational purposes. Appropriate sample size depends on specific study design, distributional assumptions, planned analysis methods, and regulatory requirements. For complex, clinical, or regulated studies, confirm the methodology with a qualified statistician or study methodologist.
          </p>
        </footer>
      </article>
    </section>
  );
}
