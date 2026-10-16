import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import {
  addDays, addMonths, diffDays, eachDay, endOfMonth, formatDate, formatHours, formatMonth,
  formatTime, startOfMonth, startOfWeek, WEEKDAY_SHORT, weekdayOf, clampIso
} from '../lib/dates';
import { VIEWS } from '../lib/views';

const HOUR_PX = 44;

function blockColor(block, tasksById) {
  if (block.kind === 'blocked') return '#94a3b8';
  return tasksById.get(block.taskId)?.color || '#6366f1';
}

function TimeGrid({ dates, dayMap, blocksByDate, tasksById, scores, selectedBlockId, onSelectBlock, period }) {
  const range = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const date of dates) {
      for (const [a, b] of dayMap.get(date)?.windows || []) { min = Math.min(min, a); max = Math.max(max, b); }
      for (const blk of blocksByDate.get(date) || []) { min = Math.min(min, blk.start); max = Math.max(max, blk.end); }
    }
    if (!Number.isFinite(min)) return [8 * 60, 18 * 60];
    return [Math.floor(min / 60) * 60, Math.min(24 * 60, Math.ceil(max / 60) * 60)];
  }, [dates, dayMap, blocksByDate]);

  const [startMin, endMin] = range;
  const hours = [];
  for (let m = startMin; m <= endMin; m += 60) hours.push(m);
  const height = ((endMin - startMin) / 60) * HOUR_PX;

  return (
    <div className="tpp-timegrid" style={{ '--tpp-cols': dates.length }}>
      <div className="tpp-timegrid-head">
        <div />
        {dates.map((date) => {
          const day = dayMap.get(date);
          const outside = date < period.start || date > period.end;
          return (
            <div key={date} className={`tpp-timegrid-day ${outside ? 'is-outside' : ''}`}>
              <strong>{WEEKDAY_SHORT[weekdayOf(date)]} {formatDate(date)}</strong>
              <span>{day ? `${formatHours(day.usableMinutes)} usable` : 'outside period'}{day?.label ? ` · ${day.label}` : ''}</span>
            </div>
          );
        })}
      </div>
      <div className="tpp-timegrid-body" style={{ height }}>
        <div className="tpp-timegrid-hours">
          {hours.map((m) => (
            <span key={m} style={{ top: ((m - startMin) / 60) * HOUR_PX }}>{formatTime(m)}</span>
          ))}
        </div>
        {dates.map((date) => {
          const day = dayMap.get(date);
          return (
            <div key={date} className={`tpp-timegrid-col ${day?.isWorking ? '' : 'is-off'}`}>
              {hours.map((m) => <span key={m} className="tpp-hour-line" style={{ top: ((m - startMin) / 60) * HOUR_PX }} />)}
              {(day?.windows || []).map(([a, b]) => (
                <span key={a} className="tpp-window" style={{ top: ((a - startMin) / 60) * HOUR_PX, height: ((b - a) / 60) * HOUR_PX }} />
              ))}
              {(blocksByDate.get(date) || []).map((blk) => {
                const top = ((blk.start - startMin) / 60) * HOUR_PX;
                const h = Math.max(14, ((blk.end - blk.start) / 60) * HOUR_PX - 2);
                const score = blk.taskId ? scores[blk.taskId] : null;
                return (
                  <button
                    type="button"
                    key={blk.id}
                    className={`tpp-block ${blk.locked ? 'is-locked' : ''} ${blk.kind === 'blocked' ? 'is-blocked' : ''} ${selectedBlockId === blk.id ? 'is-selected' : ''}`}
                    style={{ top, height: h, '--tpp-block': blockColor(blk, tasksById) }}
                    onClick={() => onSelectBlock(blk.id)}
                    title={`${blk.title} · ${formatTime(blk.start)}–${formatTime(blk.end)}`}
                  >
                    <span className="tpp-block-title">{blk.locked && <Lock size={10} />} {tasksById.get(blk.taskId)?.title || blk.title}</span>
                    {h > 30 && <span className="tpp-block-meta">{formatTime(blk.start)}–{formatTime(blk.end)}{score ? ` · ${score.score.toFixed(0)}` : ''}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({ cursor, dayMap, blocksByDate, dayStatsMap, tasksById, period, onPickDay }) {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const last = endOfMonth(cursor);
  const weeks = Math.ceil((diffDays(gridStart, last) + 1) / 7);
  const cells = eachDay(gridStart, addDays(gridStart, weeks * 7 - 1));

  return (
    <div className="tpp-month">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="tpp-month-head">{d}</div>)}
      {cells.map((date) => {
        const day = dayMap.get(date);
        const inMonth = date.slice(0, 7) === cursor.slice(0, 7);
        const inPeriod = date >= period.start && date <= period.end;
        const stats = dayStatsMap.get(date);
        const list = blocksByDate.get(date) || [];
        const util = day && day.usableMinutes > 0 ? Math.min(100, ((stats?.taskMinutes || 0) / day.usableMinutes) * 100) : 0;
        return (
          <button
            type="button"
            key={date}
            className={`tpp-month-cell ${inMonth ? '' : 'is-other'} ${inPeriod ? '' : 'is-outside'} ${day && !day.isWorking ? 'is-off' : ''}`}
            onClick={() => inPeriod && onPickDay(date)}
            disabled={!inPeriod}
            aria-label={`${formatDate(date, { weekday: true })}: ${list.length} blocks`}
          >
            <span className="tpp-month-date">{Number(date.slice(8))}</span>
            {day && inPeriod && (
              <span className="tpp-month-cap" title={`${formatHours(stats?.taskMinutes || 0)} of ${formatHours(day.usableMinutes)} usable`}>
                <span style={{ width: `${util}%` }} />
              </span>
            )}
            <span className="tpp-month-items">
              {list.slice(0, 3).map((blk) => (
                <span key={blk.id} className="tpp-month-item" style={{ '--tpp-block': blockColor(blk, tasksById) }}>
                  {blk.locked && <Lock size={9} />}{tasksById.get(blk.taskId)?.title || blk.title}
                </span>
              ))}
              {list.length > 3 && <span className="tpp-month-more">+{list.length - 3} more</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function timelineUnits(start, end) {
  const length = diffDays(start, end) + 1;
  if (length <= 42) return { unit: 'day', cols: eachDay(start, end).map((d) => ({ start: d, end: d, label: `${WEEKDAY_SHORT[weekdayOf(d)][0]} ${Number(d.slice(8))}` })) };
  if (length <= 182) {
    const cols = [];
    for (let s = startOfWeek(start); s <= end; s = addDays(s, 7)) {
      cols.push({ start: clampIso(s, start, end), end: clampIso(addDays(s, 6), start, end), label: formatDate(clampIso(s, start, end)) });
    }
    return { unit: 'week', cols };
  }
  const cols = [];
  for (let m = startOfMonth(start); m <= end; m = addMonths(m, 1)) {
    cols.push({ start: clampIso(m, start, end), end: clampIso(endOfMonth(m), start, end), label: formatMonth(m) });
  }
  return { unit: 'month', cols };
}

function Timeline({ tasks, blocks, scores, results, period, dayMap }) {
  const { unit, cols } = useMemo(() => timelineUnits(period.start, period.end), [period.start, period.end]);
  const ordered = [...tasks].filter((t) => !t.done).sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));
  const minutesFor = (taskId, col) => blocks
    .filter((b) => b.taskId === taskId && b.date >= col.start && b.date <= col.end)
    .reduce((s, b) => s + b.minutes, 0);
  const capacityFor = (col) => eachDay(col.start, col.end).reduce((s, d) => s + (dayMap.get(d)?.usableMinutes || 0), 0);
  const colCaps = cols.map(capacityFor);
  const maxCell = Math.max(60, ...ordered.flatMap((t) => cols.map((c) => minutesFor(t.id, c))));

  return (
    <div className="tpp-timeline-wrap">
      <p className="tpp-hint">Each column is one {unit}. Bar intensity shows scheduled hours; ◆ marks a deadline.</p>
      <div className="tpp-timeline" style={{ gridTemplateColumns: `minmax(160px, 220px) repeat(${cols.length}, minmax(${unit === 'day' ? 30 : 56}px, 1fr))` }}>
        <div className="tpp-tl-head tpp-tl-sticky">Task (by priority)</div>
        {cols.map((c) => <div key={c.start} className="tpp-tl-head">{c.label}</div>)}
        <div className="tpp-tl-label tpp-tl-sticky">Usable capacity</div>
        {cols.map((c, i) => <div key={c.start} className="tpp-tl-cap">{formatHours(colCaps[i], { digits: 0 })}</div>)}
        {ordered.map((t) => (
          <React.Fragment key={t.id}>
            <div className="tpp-tl-label tpp-tl-sticky" title={t.title}>
              <span className="tpp-color-dot" style={{ background: t.color }} />
              <span className="tpp-tl-title">{t.title}</span>
              <span className={`tpp-score mini tier-${scores[t.id]?.tier.id}`}>{scores[t.id]?.score.toFixed(0)}</span>
            </div>
            {cols.map((c) => {
              const m = minutesFor(t.id, c);
              const hasDeadline = t.deadline && t.deadline >= c.start && t.deadline <= c.end;
              return (
                <div key={c.start} className="tpp-tl-cell" title={m ? `${formatHours(m)} scheduled` : ''}>
                  {m > 0 && <span className="tpp-tl-bar" style={{ background: t.color, opacity: 0.35 + 0.65 * (m / maxCell) }}>{unit !== 'day' ? formatHours(m, { digits: 0 }) : ''}</span>}
                  {hasDeadline && <span className={`tpp-tl-deadline ${results[t.id]?.late || results[t.id]?.deadlineAtRisk ? 'is-risk' : ''}`} title={`Deadline ${t.deadline}`}>◆</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function ScheduleViews({ view, onViewChange, cursor, onCursorChange, period, days, blocks, dayStats, tasks, scores, results, selectedBlockId, onSelectBlock }) {
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const dayStatsMap = useMemo(() => new Map(dayStats.map((d) => [d.date, d])), [dayStats]);
  const blocksByDate = useMemo(() => {
    const map = new Map();
    for (const b of blocks) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date).push(b);
    }
    return map;
  }, [blocks]);

  const step = (dir) => {
    let next = cursor;
    if (view === 'day') next = addDays(cursor, dir);
    if (view === 'week') next = addDays(cursor, dir * 7);
    if (view === 'month') next = addMonths(cursor, dir);
    onCursorChange(clampIso(next, period.start, period.end));
  };

  const weekDates = eachDay(startOfWeek(cursor), addDays(startOfWeek(cursor), 6));
  const title = view === 'day'
    ? formatDate(cursor, { weekday: true, year: true })
    : view === 'week'
      ? `${formatDate(weekDates[0])} – ${formatDate(weekDates[6], { year: true })}`
      : view === 'month'
        ? formatMonth(cursor)
        : `${formatDate(period.start, { year: true })} – ${formatDate(period.end, { year: true })}`;

  const canPrev = view !== 'timeline' && (view === 'month' ? startOfMonth(cursor) > startOfMonth(period.start) : (view === 'week' ? weekDates[0] > period.start : cursor > period.start));
  const canNext = view !== 'timeline' && (view === 'month' ? startOfMonth(cursor) < startOfMonth(period.end) : (view === 'week' ? weekDates[6] < period.end : cursor < period.end));

  return (
    <div className="tpp-views">
      <div className="tpp-views-bar">
        <div className="tpp-segmented" role="tablist" aria-label="Schedule view">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={view === v.id ? 'active' : ''} onClick={() => onViewChange(v.id)}>{v.label}</button>
          ))}
        </div>
        <div className="tpp-views-nav">
          {view !== 'timeline' && (
            <button type="button" className="tpp-icon-btn" aria-label="Previous" onClick={() => step(-1)} disabled={!canPrev}><ChevronLeft size={16} /></button>
          )}
          <strong>{title}</strong>
          {view !== 'timeline' && (
            <button type="button" className="tpp-icon-btn" aria-label="Next" onClick={() => step(1)} disabled={!canNext}><ChevronRight size={16} /></button>
          )}
        </div>
      </div>

      {view === 'day' && (
        <TimeGrid dates={[cursor]} dayMap={dayMap} blocksByDate={blocksByDate} tasksById={tasksById} scores={scores} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} period={period} />
      )}
      {view === 'week' && (
        <div className="tpp-scroll-x">
          <TimeGrid dates={weekDates} dayMap={dayMap} blocksByDate={blocksByDate} tasksById={tasksById} scores={scores} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} period={period} />
        </div>
      )}
      {view === 'month' && (
        <MonthGrid cursor={cursor} dayMap={dayMap} blocksByDate={blocksByDate} dayStatsMap={dayStatsMap} tasksById={tasksById} period={period} onPickDay={(d) => { onCursorChange(d); onViewChange('day'); }} />
      )}
      {view === 'timeline' && (
        <div className="tpp-scroll-x">
          <Timeline tasks={tasks} blocks={blocks} scores={scores} results={results} period={period} dayMap={dayMap} />
        </div>
      )}
    </div>
  );
}
