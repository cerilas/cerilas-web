import React from 'react';
import {
  PLANNER_HOW_TO,
  PLANNER_DEFINITIONS,
  PLANNER_METHODS,
  PLANNER_FAQ,
  PLANNER_EXAMPLE,
  PLANNER_HOW_IT_WORKS
} from '../../../seo/taskPlannerContent';

export default function PlannerSeo() {
  return (
    <section className="tpp-seo" aria-label="Task prioritization and capacity planning guide">
      <article>
        <header className="tpp-seo-header">
          <span className="tpp-seo-tag">Planning guide</span>
          <h2>How to prioritize tasks when time is limited</h2>
          <p className="tpp-seo-lead">
            A good plan answers two separate questions: <strong>what matters most</strong> and <strong>what actually fits</strong>.
            {' '}{PLANNER_HOW_IT_WORKS}
          </p>
        </header>

        <section className="tpp-seo-section" aria-labelledby={PLANNER_HOW_TO.anchor}>
          <h2 id={PLANNER_HOW_TO.anchor}>{PLANNER_HOW_TO.title}</h2>
          <p>{PLANNER_HOW_TO.lead}</p>
          <ol className="tpp-seo-steps">
            {PLANNER_HOW_TO.steps.map((step) => (
              <li key={step.name}><strong>{step.name}.</strong> {step.text}</li>
            ))}
          </ol>
        </section>

        <section className="tpp-seo-section">
          <h2>Capacity planning formulas</h2>
          <p>Capacity is always derived from your own schedule for the dates you select. Nothing assumes a fixed number of working days or hours.</p>
          <div className="tpp-seo-formulas">
            <div><span>Total available hours</span><code>SUM(available working hours on each date in the range)</code></div>
            <div><span>Usable capacity</span><code>Total available hours × (1 − Buffer % / 100)</code></div>
            <div><span>Capacity utilization</span><code>Scheduled task hours / Usable capacity × 100</code></div>
            <div><span>Priority score (0–100)</span><code>100 × Σ(weightᵢ × valueᵢ) / Σ weightᵢ</code></div>
          </div>
          <h3>Worked example</h3>
          <p className="tpp-seo-example">{PLANNER_EXAMPLE}</p>
        </section>

        <section className="tpp-seo-section">
          <h2>{PLANNER_DEFINITIONS.title}</h2>
          <dl className="tpp-seo-defs">
            {PLANNER_DEFINITIONS.items.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="tpp-seo-section">
          <h2>{PLANNER_METHODS.title}</h2>
          <p>{PLANNER_METHODS.lead}</p>
          <div className="tpp-table-wrap">
            <table className="tpp-seo-table">
              <thead>
                <tr>{PLANNER_METHODS.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
              </thead>
              <tbody>
                {PLANNER_METHODS.rows.map(([label, ...cells]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {cells.map((c) => <td key={c}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tpp-seo-section">
          <h2>Frequently asked questions</h2>
          <div className="tpp-faq">
            {PLANNER_FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>
    </section>
  );
}
