import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { formatDate, formatHours, isIsoDate } from '../lib/dates';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function StatusCell({ result, task }) {
  if (!result) return null;
  if (result.status === 'done') return <span className="tpp-status done"><CheckCircle2 size={13} /> Done</span>;
  if (result.status === 'complete') {
    return (
      <span className={`tpp-status ${result.late ? 'late' : 'ok'}`}>
        {result.late ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
        {result.finishDate ? `${result.late ? 'Late · ' : 'Done by '}${formatDate(result.finishDate)}` : 'Covered by locked time'}
      </span>
    );
  }
  return (
    <span className={`tpp-status ${result.deadlineAtRisk || task.deadlineType === 'hard' ? 'late' : 'warn'}`}>
      <AlertTriangle size={13} />
      {result.status === 'partial' ? `Partial · ${formatHours(result.remainingMinutes)} left` : 'Not scheduled'}
    </span>
  );
}

function QuickAdd({ onAdd }) {
  const [draft, setDraft] = useState({ title: '', hours: '2', deadline: '' });
  const titleRef = useRef(null);
  const submit = (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      titleRef.current?.focus();
      return;
    }
    onAdd({ title: title.slice(0, 140), hours: Math.max(0.25, Number(draft.hours) || 2), deadline: isIsoDate(draft.deadline) ? draft.deadline : '' });
    setDraft((d) => ({ ...d, title: '', deadline: '' }));
    titleRef.current?.focus();
  };
  return (
    <form className="tpp-quick-add" onSubmit={submit}>
      <label className="tpp-quick-title">
        <span className="tpp-sr-only">New task title</span>
        <Plus size={16} aria-hidden="true" />
        <input ref={titleRef} type="text" placeholder="New task, e.g. “Write Q4 report”" maxLength={140} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
      </label>
      <label className="tpp-quick-field">
        <span>Hours</span>
        <input type="number" min="0.25" step="0.25" value={draft.hours} onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))} />
      </label>
      <label className="tpp-quick-field">
        <span>Deadline <em>(optional)</em></span>
        <input type="date" value={draft.deadline} onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))} />
      </label>
      <button type="submit" className="tpp-btn primary">Add task</button>
    </form>
  );
}

export default function TaskTable({ tasks, criteria, scores, results, onAdd, onUpdate, onRemove, onLoadExample, referenceDate, capacity }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [recentId, setRecentId] = useState(null);
  const [sortBy, setSortBy] = useState('priority');
  const ratingCriteria = criteria.filter((c) => c.type === 'rating' || c.type === 'urgency');
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const sorted = useMemo(() => {
    const list = [...tasks];
    if (sortBy === 'priority') list.sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));
    if (sortBy === 'deadline') list.sort((a, b) => (a.deadline || '9999') < (b.deadline || '9999') ? -1 : (a.deadline || '9999') > (b.deadline || '9999') ? 1 : 0);
    return list;
  }, [tasks, scores, sortBy]);

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const tableRef = useRef(null);
  useEffect(() => {
    if (!recentId) return undefined;
    tableRef.current?.querySelector(`[data-task-id="${recentId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const id = setTimeout(() => setRecentId(null), 1800);
    return () => clearTimeout(id);
  }, [recentId]);

  const handleAdd = (draft) => setRecentId(onAdd(draft));

  const openTasks = tasks.filter((t) => !t.done);
  const totalHours = openTasks.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  const fits = totalHours <= capacity.usableHours + 1e-6;
  const colSpan = 7 + ratingCriteria.length;

  return (
    <section className="tpp-panel tpp-panel-wide" aria-labelledby="tpp-tasks-title">
      <header className="tpp-panel-head">
        <span className="tpp-step" aria-hidden="true">2</span>
        <h2 id="tpp-tasks-title">Tasks &amp; priorities</h2>
        <div className="tpp-head-actions">
          {tasks.length > 0 && (
            <span className={`tpp-demand ${fits ? 'is-ok' : 'is-over'}`} title="Open work compared with usable capacity">
              <strong>{Number(totalHours.toFixed(1))}h</strong> of work · {Number(capacity.usableHours.toFixed(1))}h available
            </span>
          )}
          {tasks.length > 1 && (
            <label className="tpp-template-select">
              <span className="tpp-sr-only">Sort tasks</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="priority">Sort: priority score</option>
                <option value="deadline">Sort: deadline</option>
                <option value="manual">Sort: order added</option>
              </select>
            </label>
          )}
        </div>
      </header>
      <p className="tpp-panel-lead">Rate each task from 1 (low) to 5 (high). Urgency is calculated automatically when a task has a deadline. Open a row with the arrow for dependencies, deadline type and other options.</p>

      <QuickAdd onAdd={handleAdd} />

      <div className="tpp-table-wrap">
        <table className="tpp-task-table" ref={tableRef}>
          <thead>
            <tr>
              <th scope="col"><span className="tpp-sr-only">Details</span></th>
              <th scope="col">Task</th>
              <th scope="col">Hours</th>
              <th scope="col">Deadline</th>
              {ratingCriteria.map((c) => <th scope="col" key={c.id} title={c.help || `${c.name}: 1 = low, 5 = high`}>{c.name}</th>)}
              <th scope="col">Priority</th>
              <th scope="col">Schedule</th>
              <th scope="col"><span className="tpp-sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="tpp-empty">
                  <strong>No tasks yet</strong>
                  <span>Type a task above and press Enter. The planner scores it and fits it into your working hours.</span>
                  {onLoadExample && <button type="button" className="tpp-btn" onClick={onLoadExample}><Sparkles size={14} /> Try the example plan</button>}
                </td>
              </tr>
            )}
            {sorted.map((task) => {
              const score = scores[task.id];
              const result = results[task.id];
              const isOpen = expanded.has(task.id);
              return (
                <React.Fragment key={task.id}>
                  <tr data-task-id={task.id} className={`${task.done ? 'is-done' : ''} ${isOpen ? 'is-open' : ''} ${recentId === task.id ? 'is-new' : ''}`}>
                    <td>
                      <button type="button" className="tpp-icon-btn" aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${task.title}`} onClick={() => toggle(task.id)}>
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </td>
                    <td className="tpp-title-cell">
                      <span className="tpp-color-dot" style={{ background: task.color }} aria-hidden="true" />
                      <input aria-label="Task title" value={task.title} maxLength={140} onChange={(e) => onUpdate(task.id, { title: e.target.value })} />
                      {(task.dependsOn || []).length > 0 && <span className="tpp-tag" title="Has dependencies">deps {task.dependsOn.length}</span>}
                      {task.allowSplit === false && <span className="tpp-tag" title="Must be scheduled in one session"><Lock size={10} /> 1 session</span>}
                    </td>
                    <td><input type="number" aria-label="Estimated hours" min="0" step="0.25" value={task.hours} onChange={(e) => onUpdate(task.id, { hours: Math.max(0, Number(e.target.value) || 0) })} /></td>
                    <td><input type="date" aria-label="Deadline" value={task.deadline} onChange={(e) => onUpdate(task.id, { deadline: isIsoDate(e.target.value) ? e.target.value : '' })} /></td>
                    {ratingCriteria.map((c) => {
                      const auto = c.type === 'urgency' && isIsoDate(task.deadline);
                      const detail = score?.breakdown.find((b) => b.criterionId === c.id);
                      if (auto) {
                        return <td key={c.id}><span className="tpp-auto-value" title={`Calculated from the deadline relative to ${referenceDate}`}>{detail ? `${Math.round(detail.unit * 100)}%` : '—'} <small>{detail?.note}</small></span></td>;
                      }
                      return (
                        <td key={c.id}>
                          <select aria-label={`${c.name} rating`} value={task.ratings?.[c.id] ?? (c.type === 'urgency' ? 2 : 3)} onChange={(e) => onUpdate(task.id, { ratings: { ...task.ratings, [c.id]: Number(e.target.value) } })}>
                            {RATING_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                      );
                    })}
                    <td>
                      {score && (
                        <span className={`tpp-score tier-${score.tier.id}`} title={`${score.tier.label} priority`}>
                          <strong>{score.score.toFixed(1)}</strong> {score.tier.label}
                        </span>
                      )}
                    </td>
                    <td><StatusCell result={result} task={task} /></td>
                    <td>
                      <button type="button" className="tpp-icon-btn tpp-row-delete" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => onRemove(task.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="tpp-detail-row">
                      <td colSpan={colSpan}>
                        <div className="tpp-detail-grid">
                          <label className="tpp-field">
                            <span>Deadline type</span>
                            <select value={task.deadlineType} onChange={(e) => onUpdate(task.id, { deadlineType: e.target.value })} disabled={!task.deadline}>
                              <option value="soft">Soft (may finish late, flagged)</option>
                              <option value="hard">Hard (never schedule after it)</option>
                            </select>
                          </label>
                          <label className="tpp-field">
                            <span>Earliest start</span>
                            <input type="date" value={task.earliestStart} onChange={(e) => onUpdate(task.id, { earliestStart: isIsoDate(e.target.value) ? e.target.value : '' })} />
                          </label>
                          <label className="tpp-check">
                            <input type="checkbox" checked={task.allowSplit === false} onChange={(e) => onUpdate(task.id, { allowSplit: !e.target.checked })} />
                            <span>Schedule in one uninterrupted session</span>
                          </label>
                          <label className="tpp-check">
                            <input type="checkbox" checked={task.done} onChange={(e) => onUpdate(task.id, { done: e.target.checked })} />
                            <span>Mark as done (excluded from scheduling)</span>
                          </label>
                          <label className="tpp-field">
                            <span>Color</span>
                            <input type="color" value={task.color} onChange={(e) => onUpdate(task.id, { color: e.target.value })} />
                          </label>
                          <fieldset className="tpp-fieldset tpp-deps">
                            <legend>Depends on (must finish first)</legend>
                            {tasks.filter((t) => t.id !== task.id).length === 0 && <p className="tpp-hint">Add more tasks to define dependencies.</p>}
                            {tasks.filter((t) => t.id !== task.id).map((other) => (
                              <label key={other.id} className="tpp-check">
                                <input
                                  type="checkbox"
                                  checked={(task.dependsOn || []).includes(other.id)}
                                  onChange={(e) => onUpdate(task.id, {
                                    dependsOn: e.target.checked
                                      ? [...(task.dependsOn || []), other.id]
                                      : (task.dependsOn || []).filter((d) => d !== other.id)
                                  })}
                                />
                                <span>{other.title}</span>
                              </label>
                            ))}
                          </fieldset>
                          <label className="tpp-field tpp-notes">
                            <span>Notes</span>
                            <textarea rows={2} maxLength={1000} value={task.notes} onChange={(e) => onUpdate(task.id, { notes: e.target.value })} />
                          </label>
                          {score && (
                            <div className="tpp-breakdown">
                              <h3>Score breakdown</h3>
                              <ul>
                                {score.breakdown.map((b) => {
                                  const c = criteria.find((x) => x.id === b.criterionId);
                                  return (
                                    <li key={b.criterionId}>
                                      <span>{c?.name}</span>
                                      <span className="tpp-bar"><span style={{ width: `${Math.round(b.value * 100)}%` }} /></span>
                                      <span>+{b.contribution.toFixed(1)}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          {result?.reasons?.length > 0 && (
                            <div className="tpp-reasons" role="status">
                              {result.reasons.map((r) => <p key={r}><AlertTriangle size={13} /> {r}</p>)}
                            </div>
                          )}
                          {(task.dependsOn || []).filter((d) => !byId.has(d)).length > 0 && (
                            <p className="tpp-hint">Some dependencies point to deleted tasks and are ignored.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
