import React, { useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { WEEKDAY_ORDER, WEEKDAY_NAMES, parseTime, formatTime, isIsoDate, formatDate } from '../lib/dates';
import { scheduleHoursFor } from '../lib/capacity';
import { SCHEDULE_TEMPLATES, newId } from '../lib/planState';

function setHoursForRule(rule, hours) {
  const start = parseTime(rule.start) ?? 540;
  const end = Math.min(24 * 60, start + Math.round(Math.max(0, hours) * 60) + (Number(rule.breakMinutes) || 0));
  return { ...rule, enabled: hours > 0, end: formatTime(end) };
}

export default function SchedulePanel({ settings, onChange, onWeekChange, periodStart }) {
  const [holidayDraft, setHolidayDraft] = useState({ start: '', end: '', label: '' });
  const [overrideDraft, setOverrideDraft] = useState({ date: '', type: 'custom', start: '09:00', end: '13:00', breakMinutes: 0, label: '' });

  const weeklyHours = settings.week.reduce((sum, r) => sum + scheduleHoursFor(r), 0);
  const overrides = Object.entries(settings.overrides || {}).sort(([a], [b]) => (a < b ? -1 : 1));

  const updateRule = (weekday, patch) => {
    onWeekChange(settings.week.map((r, i) => (i === weekday ? { ...r, ...patch } : r)));
  };

  const addHoliday = () => {
    if (!isIsoDate(holidayDraft.start)) return;
    const end = isIsoDate(holidayDraft.end) && holidayDraft.end >= holidayDraft.start ? holidayDraft.end : holidayDraft.start;
    onChange({ holidays: [...settings.holidays, { id: newId('hol'), start: holidayDraft.start, end, label: holidayDraft.label.trim() || 'Unavailable' }] });
    setHolidayDraft({ start: '', end: '', label: '' });
  };

  const addOverride = () => {
    if (!isIsoDate(overrideDraft.date)) return;
    const { date, ...rest } = overrideDraft;
    const value = rest.type === 'off'
      ? { type: 'off', label: rest.label.trim() }
      : { type: 'custom', start: rest.start, end: rest.end, breakMinutes: Number(rest.breakMinutes) || 0, label: rest.label.trim() };
    onChange({ overrides: { ...settings.overrides, [date]: value } });
    setOverrideDraft((d) => ({ ...d, date: '', label: '' }));
  };

  const removeOverride = (date) => {
    const next = { ...settings.overrides };
    delete next[date];
    onChange({ overrides: next });
  };

  return (
    <section className="tpp-panel" aria-labelledby="tpp-schedule-title">
      <header className="tpp-panel-head">
        <Clock size={18} aria-hidden="true" />
        <h2 id="tpp-schedule-title">2. Working schedule</h2>
        <label className="tpp-template-select">
          <span className="tpp-sr-only">Schedule template</span>
          <select
            value=""
            onChange={(e) => {
              const tpl = SCHEDULE_TEMPLATES[e.target.value];
              if (tpl) onWeekChange(tpl.week.map((r) => ({ ...r })));
            }}
          >
            <option value="">Apply template…</option>
            {Object.entries(SCHEDULE_TEMPLATES).map(([id, tpl]) => (
              <option key={id} value={id}>{tpl.label}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="tpp-table-wrap">
        <table className="tpp-week-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Start</th>
              <th scope="col">End</th>
              <th scope="col">Break (min)</th>
              <th scope="col">Hours</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAY_ORDER.map((wd) => {
              const r = settings.week[wd];
              const hours = scheduleHoursFor(r);
              const invalid = r.enabled && hours === 0;
              return (
                <tr key={wd} className={r.enabled ? '' : 'is-off'}>
                  <th scope="row">
                    <label className="tpp-check">
                      <input type="checkbox" checked={r.enabled} onChange={(e) => updateRule(wd, { enabled: e.target.checked })} />
                      <span>{WEEKDAY_NAMES[wd]}</span>
                    </label>
                  </th>
                  <td><input type="time" aria-label={`${WEEKDAY_NAMES[wd]} start`} value={r.start} disabled={!r.enabled} onChange={(e) => e.target.value && updateRule(wd, { start: e.target.value })} /></td>
                  <td><input type="time" aria-label={`${WEEKDAY_NAMES[wd]} end`} value={r.end} disabled={!r.enabled} onChange={(e) => e.target.value && updateRule(wd, { end: e.target.value })} /></td>
                  <td><input type="number" min="0" max="600" step="5" aria-label={`${WEEKDAY_NAMES[wd]} break minutes`} value={r.breakMinutes} disabled={!r.enabled} onChange={(e) => updateRule(wd, { breakMinutes: Math.max(0, Number(e.target.value) || 0) })} /></td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      aria-label={`${WEEKDAY_NAMES[wd]} working hours`}
                      className={invalid ? 'is-invalid' : ''}
                      value={Number(hours.toFixed(2))}
                      onChange={(e) => updateRule(wd, setHoursForRule(r, Number(e.target.value) || 0))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>Weekly working hours</th>
              <td><strong>{Number(weeklyHours.toFixed(2))}h</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="tpp-field-grid">
        <label className="tpp-field">
          <span>Max daily workload (h)</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            placeholder="No limit"
            value={settings.maxDailyHours ?? ''}
            onChange={(e) => onChange({ maxDailyHours: e.target.value === '' || Number(e.target.value) <= 0 ? null : Math.min(24, Number(e.target.value)) })}
          />
        </label>
        <label className="tpp-field">
          <span>Buffer (%)</span>
          <input type="number" min="0" max="95" step="1" value={settings.bufferPercent} onChange={(e) => onChange({ bufferPercent: Math.max(0, Math.min(95, Number(e.target.value) || 0)) })} />
        </label>
        <label className="tpp-field">
          <span>Min. session (min)</span>
          <input type="number" min="5" max="480" step="5" value={settings.minSessionMinutes} onChange={(e) => onChange({ minSessionMinutes: Math.max(5, Math.min(480, Number(e.target.value) || 5)) })} />
        </label>
      </div>

      <details className="tpp-subsection">
        <summary>Holidays &amp; unavailable dates <span className="tpp-count">{settings.holidays.length}</span></summary>
        <div className="tpp-inline-form">
          <input type="date" aria-label="Unavailable from" value={holidayDraft.start} min={periodStart} onChange={(e) => setHolidayDraft((d) => ({ ...d, start: e.target.value }))} />
          <input type="date" aria-label="Unavailable until" value={holidayDraft.end} min={holidayDraft.start || undefined} onChange={(e) => setHolidayDraft((d) => ({ ...d, end: e.target.value }))} />
          <input type="text" aria-label="Label" placeholder="Label (e.g. Vacation)" maxLength={80} value={holidayDraft.label} onChange={(e) => setHolidayDraft((d) => ({ ...d, label: e.target.value }))} />
          <button type="button" className="tpp-btn" onClick={addHoliday} disabled={!isIsoDate(holidayDraft.start)}><Plus size={14} /> Add</button>
        </div>
        {settings.holidays.length > 0 && (
          <ul className="tpp-pill-list">
            {settings.holidays.map((h) => (
              <li key={h.id}>
                <span>{h.label}: {formatDate(h.start, { year: true })}{h.end !== h.start ? ` – ${formatDate(h.end, { year: true })}` : ''}</span>
                <button type="button" aria-label={`Remove ${h.label}`} onClick={() => onChange({ holidays: settings.holidays.filter((x) => x.id !== h.id) })}><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="tpp-subsection">
        <summary>Date-specific availability <span className="tpp-count">{overrides.length}</span></summary>
        <p className="tpp-hint">Override a single date, e.g. a half day or an extra working Saturday. Overrides win over holidays and the weekly schedule.</p>
        <div className="tpp-inline-form">
          <input type="date" aria-label="Override date" value={overrideDraft.date} onChange={(e) => setOverrideDraft((d) => ({ ...d, date: e.target.value }))} />
          <select aria-label="Availability" value={overrideDraft.type} onChange={(e) => setOverrideDraft((d) => ({ ...d, type: e.target.value }))}>
            <option value="custom">Custom hours</option>
            <option value="off">Not available</option>
          </select>
          {overrideDraft.type === 'custom' && (
            <>
              <input type="time" aria-label="Override start" value={overrideDraft.start} onChange={(e) => setOverrideDraft((d) => ({ ...d, start: e.target.value }))} />
              <input type="time" aria-label="Override end" value={overrideDraft.end} onChange={(e) => setOverrideDraft((d) => ({ ...d, end: e.target.value }))} />
              <input type="number" aria-label="Override break minutes" min="0" step="5" value={overrideDraft.breakMinutes} onChange={(e) => setOverrideDraft((d) => ({ ...d, breakMinutes: e.target.value }))} />
            </>
          )}
          <input type="text" aria-label="Override label" placeholder="Label (optional)" maxLength={80} value={overrideDraft.label} onChange={(e) => setOverrideDraft((d) => ({ ...d, label: e.target.value }))} />
          <button type="button" className="tpp-btn" onClick={addOverride} disabled={!isIsoDate(overrideDraft.date)}><Plus size={14} /> Add</button>
        </div>
        {overrides.length > 0 && (
          <ul className="tpp-pill-list">
            {overrides.map(([date, o]) => (
              <li key={date}>
                <span>
                  {formatDate(date, { weekday: true, year: true })}: {o.type === 'off' ? 'not available' : `${o.start}–${o.end}${o.breakMinutes ? `, ${o.breakMinutes}m break` : ''}`}
                  {o.label ? ` (${o.label})` : ''}
                </span>
                <button type="button" aria-label={`Remove override for ${date}`} onClick={() => removeOverride(date)}><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
