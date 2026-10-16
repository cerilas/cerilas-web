import React from 'react';
import { CalendarRange, Clock, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { WEIGHT_PRESETS } from '../lib/scoring';
import { scheduleHoursFor } from '../lib/capacity';
import { formatDate, WEEKDAY_ORDER, WEEKDAY_SHORT } from '../lib/dates';

function workdayLabel(week) {
  const on = WEEKDAY_ORDER.filter((d) => week[d]?.enabled);
  if (!on.length) return 'No working days';
  const runs = [];
  let run = [on[0]];
  for (let i = 1; i < on.length; i += 1) {
    const prevIdx = WEEKDAY_ORDER.indexOf(run[run.length - 1]);
    if (WEEKDAY_ORDER.indexOf(on[i]) === prevIdx + 1) run.push(on[i]);
    else { runs.push(run); run = [on[i]]; }
  }
  runs.push(run);
  return runs.map((r) => (r.length > 2 ? `${WEEKDAY_SHORT[r[0]]}–${WEEKDAY_SHORT[r[r.length - 1]]}` : r.map((d) => WEEKDAY_SHORT[d]).join(', '))).join(', ');
}

function presetLabel(criteria) {
  const weights = Object.fromEntries(criteria.map((c) => [c.id, Number(c.weight) || 0]));
  const match = Object.values(WEIGHT_PRESETS).find((p) => criteria.every((c) => (p.weights[c.id] ?? 0) === weights[c.id]));
  return match ? `${match.label} weights` : 'Custom weights';
}

function fmt(n) {
  return Number(n.toFixed(1)).toLocaleString('en-US');
}

export default function SetupBar({ settings, criteria, summary, open, onToggle, periodError }) {
  const { period, week, holidays, overrides } = settings;
  const weeklyHours = WEEKDAY_ORDER.reduce((s, d) => s + scheduleHoursFor(week[d]), 0);
  const totalWeight = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const topCriteria = [...criteria]
    .filter((c) => Number(c.weight) > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((c) => `${c.name} ${totalWeight ? Math.round((c.weight / totalWeight) * 100) : 0}%`)
    .join(' · ');
  const exceptions = (holidays?.length || 0) + Object.keys(overrides || {}).length;

  const tiles = [
    {
      id: 'period',
      icon: CalendarRange,
      label: 'Planning period',
      value: periodError ? 'Check the dates' : `${formatDate(period.start)} – ${formatDate(period.end, { year: true })}`,
      note: `${summary.calendarDays} days · ${summary.workingDays} working days`,
      invalid: Boolean(periodError)
    },
    {
      id: 'schedule',
      icon: Clock,
      label: 'Working hours',
      value: `${fmt(weeklyHours)}h per week · ${workdayLabel(week)}`,
      note: `Max ${settings.maxDailyHours ? `${fmt(settings.maxDailyHours)}h` : 'no limit'} a day · ${fmt(settings.bufferPercent)}% buffer${exceptions ? ` · ${exceptions} exception${exceptions > 1 ? 's' : ''}` : ''}`
    },
    {
      id: 'criteria',
      icon: SlidersHorizontal,
      label: 'Priority weights',
      value: presetLabel(criteria),
      note: topCriteria || 'All weights are zero'
    }
  ];

  return (
    <div className="tpp-setup-tiles" role="group" aria-label="Plan settings">
      {tiles.map(({ id, icon: Icon, label, value, note, invalid }) => {
        const isOpen = open === id;
        return (
          <button
            key={id}
            type="button"
            className={`tpp-setup-tile ${isOpen ? 'is-open' : ''} ${invalid ? 'is-invalid' : ''}`}
            aria-expanded={isOpen}
            aria-controls="tpp-setup-body"
            onClick={() => onToggle(isOpen ? null : id)}
          >
            <span className="tpp-setup-icon" aria-hidden="true"><Icon size={17} /></span>
            <span className="tpp-setup-text">
              <span className="tpp-setup-label">{label}</span>
              <strong>{value}</strong>
              <span className="tpp-setup-note">{note}</span>
            </span>
            <span className="tpp-setup-action">
              {isOpen ? 'Close' : 'Edit'}
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
