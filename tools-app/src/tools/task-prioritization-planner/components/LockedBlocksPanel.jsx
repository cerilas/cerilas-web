import React, { useState } from 'react';
import { Lock, Unlock, Trash2, Plus, AlertTriangle, X } from 'lucide-react';
import { formatDate, formatTime, isIsoDate, parseTime } from '../lib/dates';

export function SelectedBlockBar({ block, task, score, onLock, onUnlock, onClose }) {
  if (!block) return null;
  return (
    <div className="tpp-selected-bar" role="status">
      <span className="tpp-color-dot" style={{ background: block.kind === 'blocked' ? '#94a3b8' : task?.color }} />
      <div>
        <strong>{task?.title || block.title}</strong>
        <span>
          {formatDate(block.date, { weekday: true, year: true })} · {formatTime(block.start)}–{formatTime(block.end)}
          {score ? ` · priority ${score.score.toFixed(1)} (${score.tier.label})` : ''}
          {block.locked ? ' · locked' : ' · auto-scheduled'}
        </span>
      </div>
      {block.locked ? (
        <button type="button" className="tpp-btn" onClick={() => onUnlock(block.id)}><Unlock size={14} /> {block.kind === 'blocked' ? 'Remove' : 'Unlock'}</button>
      ) : (
        <button type="button" className="tpp-btn primary" onClick={() => onLock(block)}><Lock size={14} /> Lock this block</button>
      )}
      <button type="button" className="tpp-icon-btn" aria-label="Close" onClick={onClose}><X size={15} /></button>
    </div>
  );
}

export default function LockedBlocksPanel({ lockedBlocks, tasks, conflicts, results, periodStart, onAdd, onRemove }) {
  const [draft, setDraft] = useState({ date: periodStart, start: '10:00', end: '11:00', taskId: '', title: '' });
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const valid = isIsoDate(draft.date) && parseTime(draft.start) !== null && parseTime(draft.end) !== null && parseTime(draft.end) > parseTime(draft.start);
  const problems = tasks.filter((t) => !t.done && results[t.id] && (results[t.id].status !== 'complete' || results[t.id].late));

  const submit = () => {
    if (!valid) return;
    onAdd({ date: draft.date, start: draft.start, end: draft.end, taskId: draft.taskId || null, title: draft.taskId ? '' : (draft.title.trim() || 'Blocked time') });
    setDraft((d) => ({ ...d, title: '' }));
  };

  return (
    <div className="tpp-side-grid">
      <section className="tpp-panel" aria-labelledby="tpp-issues-title">
        <header className="tpp-panel-head">
          <AlertTriangle size={18} aria-hidden="true" />
          <h2 id="tpp-issues-title">Feasibility check</h2>
        </header>
        {problems.length === 0 && conflicts.length === 0 && <p className="tpp-ok-note">Every open task fits in the planning period and no locked block conflicts with the schedule.</p>}
        {problems.length > 0 && (
          <ul className="tpp-issue-list">
            {problems.map((t) => (
              <li key={t.id}>
                <span className="tpp-color-dot" style={{ background: t.color }} />
                <div>
                  <strong>{t.title}</strong>
                  {results[t.id].late && <p>Finishes on {formatDate(results[t.id].finishDate)}, after its deadline ({formatDate(t.deadline)}).</p>}
                  {results[t.id].reasons.map((r) => <p key={r}>{r}</p>)}
                </div>
              </li>
            ))}
          </ul>
        )}
        {conflicts.length > 0 && (
          <>
            <h3 className="tpp-subhead">Locked block warnings</h3>
            <ul className="tpp-issue-list">
              {conflicts.map((c, i) => <li key={`${c.type}-${c.blockId || c.date}-${i}`}><div><p>{c.message}</p></div></li>)}
            </ul>
          </>
        )}
      </section>

      <section className="tpp-panel" aria-labelledby="tpp-locked-title">
        <header className="tpp-panel-head">
          <Lock size={18} aria-hidden="true" />
          <h2 id="tpp-locked-title">Locked calendar blocks</h2>
        </header>
        <p className="tpp-panel-lead">Locked blocks are never moved by recalculation. Lock an auto-scheduled block by clicking it in the calendar, or reserve time here.</p>
        <div className="tpp-inline-form">
          <input type="date" aria-label="Block date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
          <input type="time" aria-label="Block start" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
          <input type="time" aria-label="Block end" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
          <select aria-label="Block task" value={draft.taskId} onChange={(e) => setDraft((d) => ({ ...d, taskId: e.target.value }))}>
            <option value="">Blocked time (meeting, focus…)</option>
            {tasks.filter((t) => !t.done).map((t) => <option key={t.id} value={t.id}>Task: {t.title}</option>)}
          </select>
          {!draft.taskId && <input type="text" aria-label="Block title" placeholder="Title" maxLength={140} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />}
          <button type="button" className="tpp-btn" disabled={!valid} onClick={submit}><Plus size={14} /> Lock time</button>
        </div>
        {lockedBlocks.length > 0 ? (
          <ul className="tpp-pill-list">
            {[...lockedBlocks].sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)).map((b) => {
              const task = b.taskId ? taskById.get(b.taskId) : null;
              return (
                <li key={b.id}>
                  <span className="tpp-color-dot" style={{ background: task?.color || '#94a3b8' }} />
                  <span>{formatDate(b.date, { weekday: true })} {b.start}–{b.end} · {task?.title || b.title || 'Blocked time'}</span>
                  <button type="button" aria-label="Remove locked block" onClick={() => onRemove(b.id)}>{task ? <Unlock size={13} /> : <Trash2 size={13} />}</button>
                </li>
              );
            })}
          </ul>
        ) : <p className="tpp-hint">No locked blocks yet.</p>}
      </section>
    </div>
  );
}
