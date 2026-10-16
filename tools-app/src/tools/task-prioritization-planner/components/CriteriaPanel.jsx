import React, { useState } from 'react';
import { SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { WEIGHT_PRESETS, CRITERION_TYPES } from '../lib/scoring';
import { formatDate } from '../lib/dates';
import { newId } from '../lib/planState';

export default function CriteriaPanel({ criteria, scoring, referenceDate, onCriteriaChange, onApplyPreset, onScoringChange }) {
  const [draftName, setDraftName] = useState('');
  const [draftDirection, setDraftDirection] = useState('benefit');
  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  const update = (id, patch) => onCriteriaChange(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCriterion = () => {
    const name = draftName.trim();
    if (!name) return;
    onCriteriaChange([...criteria, { id: newId('crit'), name: name.slice(0, 60), type: 'rating', direction: draftDirection, weight: 10, builtin: false, help: '' }]);
    setDraftName('');
  };

  return (
    <section className="tpp-panel" aria-labelledby="tpp-criteria-title">
      <header className="tpp-panel-head">
        <SlidersHorizontal size={18} aria-hidden="true" />
        <h2 id="tpp-criteria-title">3. Priority criteria &amp; weights</h2>
      </header>
      <p className="tpp-panel-lead">Priority scores (0–100) update as soon as a weight or rating changes. Weights are relative; their share is shown on the right.</p>

      <div className="tpp-chip-row" role="group" aria-label="Weight presets">
        {Object.entries(WEIGHT_PRESETS).map(([id, p]) => (
          <button key={id} type="button" className="tpp-chip" onClick={() => onApplyPreset(id)}>{p.label}</button>
        ))}
      </div>

      <ul className="tpp-criteria-list">
        {criteria.map((c) => {
          const share = totalWeight > 0 ? ((Number(c.weight) || 0) / totalWeight) * 100 : 0;
          return (
            <li key={c.id} className={Number(c.weight) === 0 ? 'is-muted' : ''}>
              <div className="tpp-criterion-head">
                {c.builtin ? (
                  <span className="tpp-criterion-name" title={c.help}>{c.name}</span>
                ) : (
                  <input className="tpp-criterion-input" aria-label="Criterion name" value={c.name} maxLength={60} onChange={(e) => update(c.id, { name: e.target.value })} />
                )}
                <span className={`tpp-direction ${c.direction}`}>{c.direction === 'cost' ? 'lower is better' : 'higher is better'}</span>
                {CRITERION_TYPES[c.type]?.timeDependent && <span className="tpp-tag">time-dependent</span>}
                <span className="tpp-share">{share.toFixed(0)}%</span>
              </div>
              <div className="tpp-criterion-controls">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  aria-label={`${c.name} weight`}
                  value={c.weight}
                  onChange={(e) => update(c.id, { weight: Number(e.target.value) })}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  aria-label={`${c.name} weight value`}
                  value={c.weight}
                  onChange={(e) => update(c.id, { weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                />
                {!c.builtin && (
                  <>
                    <select aria-label={`${c.name} direction`} value={c.direction} onChange={(e) => update(c.id, { direction: e.target.value })}>
                      <option value="benefit">Higher is better</option>
                      <option value="cost">Lower is better</option>
                    </select>
                    <button type="button" className="tpp-icon-btn" aria-label={`Delete ${c.name}`} onClick={() => onCriteriaChange(criteria.filter((x) => x.id !== c.id))}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="tpp-inline-form">
        <input type="text" placeholder="Add a custom criterion (e.g. Customer requests)" maxLength={60} value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} />
        <select aria-label="New criterion direction" value={draftDirection} onChange={(e) => setDraftDirection(e.target.value)}>
          <option value="benefit">Higher is better</option>
          <option value="cost">Lower is better</option>
        </select>
        <button type="button" className="tpp-btn" onClick={addCriterion} disabled={!draftName.trim()}><Plus size={14} /> Add criterion</button>
      </div>

      <fieldset className="tpp-fieldset">
        <legend>Time-dependent criteria</legend>
        <label className="tpp-radio">
          <input type="radio" name="tpp-ref" checked={scoring.reference === 'today'} onChange={() => onScoringChange({ reference: 'today' })} />
          <span>Measure urgency and deadline risk from <strong>today</strong> (priority stays independent of the planning period)</span>
        </label>
        <label className="tpp-radio">
          <input type="radio" name="tpp-ref" checked={scoring.reference === 'planningStart'} onChange={() => onScoringChange({ reference: 'planningStart' })} />
          <span>Measure them from the <strong>planning start date</strong> (scores follow the selected dates)</span>
        </label>
        <label className="tpp-field tpp-field-inline">
          <span>Urgency window (days)</span>
          <input type="number" min="1" max="365" value={scoring.urgencyWindowDays} onChange={(e) => onScoringChange({ urgencyWindowDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })} />
        </label>
        <p className="tpp-hint">Reference date: {formatDate(referenceDate, { weekday: true, year: true })}. A deadline on or before it scores maximum urgency; one at the end of the window or later scores zero.</p>
      </fieldset>
    </section>
  );
}
