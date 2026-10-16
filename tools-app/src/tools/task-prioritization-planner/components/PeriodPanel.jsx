import React from 'react';
import { CalendarRange } from 'lucide-react';
import { PERIOD_PRESETS } from '../lib/planState';
import { addDays, diffDays, isIsoDate, todayIso, formatDate } from '../lib/dates';

export default function PeriodPanel({ period, onChange, summary, error }) {
  const length = isIsoDate(period.start) && isIsoDate(period.end) ? diffDays(period.start, period.end) + 1 : 0;

  const applyPreset = (preset) => {
    const start = isIsoDate(period.start) ? period.start : todayIso();
    onChange({ start, end: addDays(start, preset.days - 1), preset: preset.id });
  };

  return (
    <section className="tpp-panel" aria-labelledby="tpp-period-title">
      <header className="tpp-panel-head">
        <CalendarRange size={18} aria-hidden="true" />
        <h2 id="tpp-period-title">1. Planning period</h2>
      </header>
      <p className="tpp-panel-lead">Shortcuts are optional. Pick any start and end date; capacity is recalculated instantly.</p>

      <div className="tpp-chip-row" role="group" aria-label="Planning period shortcuts">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`tpp-chip ${period.preset === p.id ? 'active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`tpp-chip ${period.preset === 'custom' ? 'active' : ''}`}
          onClick={() => onChange({ ...period, preset: 'custom' })}
        >
          Custom range
        </button>
      </div>

      <div className="tpp-field-row">
        <label className="tpp-field">
          <span>Start date</span>
          <input
            type="date"
            value={period.start}
            onChange={(e) => {
              const start = e.target.value;
              if (!isIsoDate(start)) return;
              const preset = PERIOD_PRESETS.find((p) => p.id === period.preset);
              const end = preset ? addDays(start, preset.days - 1) : (period.end < start ? start : period.end);
              onChange({ start, end, preset: preset ? preset.id : 'custom' });
            }}
          />
        </label>
        <label className="tpp-field">
          <span>End date</span>
          <input
            type="date"
            value={period.end}
            min={period.start}
            onChange={(e) => {
              if (!isIsoDate(e.target.value)) return;
              onChange({ ...period, end: e.target.value, preset: 'custom' });
            }}
          />
        </label>
        <button type="button" className="tpp-btn ghost" onClick={() => onChange({ ...period, start: todayIso(), end: addDays(todayIso(), Math.max(0, length - 1)) })}>
          Start today
        </button>
      </div>

      {error && <p className="tpp-inline-warning" role="alert">{error}</p>}

      <dl className="tpp-mini-stats">
        <div><dt>Calendar days</dt><dd>{summary.calendarDays}</dd></div>
        <div><dt>Working days</dt><dd>{summary.workingDays}</dd></div>
        <div><dt>Range</dt><dd>{formatDate(period.start, { year: true })} – {formatDate(period.end, { year: true })}</dd></div>
      </dl>
    </section>
  );
}
