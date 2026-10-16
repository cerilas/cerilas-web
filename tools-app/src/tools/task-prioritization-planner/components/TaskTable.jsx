import React, { useMemo, useState } from 'react';
import { ListChecks, Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
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

export default function TaskTable({ tasks, criteria, scores, results, onAdd, onUpdate, onRemove, referenceDate }) {
  const [expanded, setExpanded] = useState(() => new Set());
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

  const totalHours = tasks.filter((t) => !t.done).reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  const colSpan = 6 + ratingCriteria.length;

  return (
    <section className="tpp-panel tpp-panel-wide" aria-labelledby="tpp-tasks-title">
      <header className="tpp-panel-head">
        <ListChecks size={18} aria-hidden="true" />
        <h2 id="tpp-tasks-title">4. Tasks &amp; priority scores</h2>
        <div className="tpp-head-actions">
          <label className="tpp-template-select">
            <span className="tpp-sr-only">Sort tasks</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Sort: priority score</option>
              <option value="deadline">Sort: deadline</option>
              <option value="manual">Sort: order added</option>
            </select>
          </label>
          <button type="button" className="tpp-btn primary" onClick={onAdd}><Plus size={14} /> Add task</button>
        </div>
      </header>
      <p className="tpp-panel-lead">{tasks.length} tasks · {Number(totalHours.toFixed(2))}h of open work. Rate each criterion from 1 (lowest) to 5 (highest). Expand a row for deadlines, dependencies and restrictions.</p>

      <div className="tpp-table-wrap">
        <table className="tpp-task-table">
          <thead>
            <tr>
              <th scope="col" aria-label="Details" />
              <th scope="col">Task</th>
              <th scope="col">Hours</th>
              <th scope="col">Deadline</th>
              {ratingCriteria.map((c) => <th scope="col" key={c.id} title={c.help}>{c.name}</th>)}
              <th scope="col">Priority</th>
              <th scope="col">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={colSpan} className="tpp-empty">No tasks yet. Add your first task to build a schedule.</td></tr>
            )}
            {sorted.map((task) => {
              const score = scores[task.id];
              const result = results[task.id];
              const isOpen = expanded.has(task.id);
              return (
                <React.Fragment key={task.id}>
                  <tr className={`${task.done ? 'is-done' : ''} ${isOpen ? 'is-open' : ''}`}>
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
                          <button type="button" className="tpp-btn danger" onClick={() => onRemove(task.id)}><Trash2 size={14} /> Delete task</button>
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
