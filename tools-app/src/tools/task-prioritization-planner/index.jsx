import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Activity, ShieldCheck, CalendarDays, Download, Upload, RotateCcw, Copy, FileSpreadsheet, FileText, Eraser } from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { Badge, ToolHeader } from '../../components/ui';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import { taskPrioritizationPlannerManifest as manifest } from './manifest';
import PeriodPanel from './components/PeriodPanel';
import SchedulePanel from './components/SchedulePanel';
import CriteriaPanel from './components/CriteriaPanel';
import TaskTable from './components/TaskTable';
import CapacityKpis from './components/CapacityKpis';
import ScheduleViews from './components/ScheduleViews';
import { defaultViewFor } from './lib/views';
import LockedBlocksPanel, { SelectedBlockBar } from './components/LockedBlocksPanel';
import PlannerSeo from './components/PlannerSeo';
import { buildCalendar, summarizeCapacity, validatePeriod } from './lib/capacity';
import { scoreTasks, applyPreset } from './lib/scoring';
import { buildSchedule } from './lib/scheduler';
import { loadState, saveState, createDefaultState, createTask, normalizeState, newId } from './lib/planState';
import { scheduleToCsv, scheduleToIcs, tasksToCsv, downloadFile } from './lib/exporters';
import { clampIso, diffDays, formatTime, formatDate, formatHours, isIsoDate, todayIso } from './lib/dates';
import './task-prioritization-planner.css';

export default function TaskPrioritizationPlanner({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackUse, trackDownload, trackCopy } = useToolAnalytics(manifest.slug, toolMeta);
  const [plan, setPlan] = useState(loadState);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [notice, setNotice] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const usedRef = useRef(false);
  const fileRef = useRef(null);

  const { settings, criteria, tasks, lockedBlocks } = plan;
  const { period } = settings;
  const periodLength = isIsoDate(period.start) && isIsoDate(period.end) ? Math.max(1, diffDays(period.start, period.end) + 1) : 1;

  const [view, setView] = useState(() => defaultViewFor(periodLength));
  const [cursor, setCursor] = useState(null);
  const [periodKey, setPeriodKey] = useState(`${period.start}|${period.end}`);
  const currentKey = `${period.start}|${period.end}`;
  if (currentKey !== periodKey) {
    setPeriodKey(currentKey);
    setView(defaultViewFor(periodLength));
    setCursor(null);
  }

  useEffect(() => {
    const id = setTimeout(() => saveState(plan), 400);
    return () => clearTimeout(id);
  }, [plan]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const commit = useCallback((updater, action) => {
    setPlan(updater);
    if (!usedRef.current) {
      usedRef.current = true;
      trackUse({ action });
    }
  }, [trackUse]);

  const deferredPlan = useDeferredValue(plan);
  const periodError = validatePeriod(period);
  const days = useMemo(() => buildCalendar(deferredPlan.settings), [deferredPlan.settings]);
  const scoring = useMemo(
    () => scoreTasks(deferredPlan.tasks, deferredPlan.criteria, deferredPlan.settings),
    [deferredPlan.tasks, deferredPlan.criteria, deferredPlan.settings]
  );
  const schedule = useMemo(() => buildSchedule({
    tasks: deferredPlan.tasks,
    scores: scoring.scores,
    days,
    lockedBlocks: deferredPlan.lockedBlocks,
    settings: deferredPlan.settings
  }), [deferredPlan.tasks, deferredPlan.lockedBlocks, deferredPlan.settings, scoring.scores, days]);
  const summary = useMemo(() => summarizeCapacity(days, deferredPlan.settings, schedule.scheduledMinutes), [days, deferredPlan.settings, schedule.scheduledMinutes]);
  const isStale = deferredPlan !== plan;
  const firstWorkingDate = days.find((d) => d.isWorking)?.date;
  const viewCursor = isIsoDate(cursor) && period.end >= period.start
    ? clampIso(cursor, period.start, period.end)
    : (firstWorkingDate || period.start);

  const taskCounts = useMemo(() => {
    const open = deferredPlan.tasks.filter((t) => !t.done);
    const res = schedule.taskResults;
    return {
      open: open.length,
      complete: open.filter((t) => res[t.id]?.status === 'complete').length,
      partial: open.filter((t) => res[t.id]?.status === 'partial').length,
      unscheduled: open.filter((t) => res[t.id]?.status === 'unscheduled').length,
      atRisk: open.filter((t) => res[t.id]?.deadlineAtRisk).length
    };
  }, [deferredPlan.tasks, schedule.taskResults]);
  const demandHours = deferredPlan.tasks.filter((t) => !t.done).reduce((s, t) => s + (Number(t.hours) || 0), 0);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const selectedBlock = schedule.blocks.find((b) => b.id === selectedBlockId) || null;

  const updateSettings = (patch, action = 'settings') => commit((p) => ({ ...p, settings: { ...p.settings, ...patch } }), action);
  const updateTask = (id, patch) => commit((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }), 'edit_task');

  const removeTask = (id) => {
    const owned = lockedBlocks.filter((b) => b.taskId === id).length;
    if (owned && !window.confirm(`This task has ${owned} locked block(s). Delete the task and its locked blocks?`)) return;
    commit((p) => ({
      ...p,
      tasks: p.tasks.filter((t) => t.id !== id).map((t) => ({ ...t, dependsOn: (t.dependsOn || []).filter((d) => d !== id) })),
      lockedBlocks: p.lockedBlocks.filter((b) => b.taskId !== id)
    }), 'remove_task');
  };

  const lockBlock = (block) => {
    const id = newId('lock');
    commit((p) => ({
      ...p,
      lockedBlocks: [...p.lockedBlocks, { id, taskId: block.taskId, title: block.title, date: block.date, start: formatTime(block.start), end: formatTime(block.end) }]
    }), 'lock_block');
    setSelectedBlockId(id);
  };

  const removeLocked = (id) => {
    commit((p) => ({ ...p, lockedBlocks: p.lockedBlocks.filter((b) => b.id !== id) }), 'unlock_block');
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const exportName = `task-plan-${period.start}-to-${period.end}`;
  const exportIcs = () => {
    downloadFile(`${exportName}.ics`, scheduleToIcs(schedule.blocks, tasksById, scoring.scores), 'text/calendar;charset=utf-8');
    trackDownload({ format: 'ics', blocks: schedule.blocks.length });
  };
  const exportPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const { buildPlanPdf } = await import('./lib/pdfReport');
      const bytes = await buildPlanPdf({
        period,
        summary,
        tasks: deferredPlan.tasks,
        scores: scoring.scores,
        results: schedule.taskResults,
        blocks: schedule.blocks,
        days,
        dayStats: schedule.dayStats,
        conflicts: schedule.conflicts,
        referenceDate: scoring.referenceDate
      });
      downloadFile(`${exportName}.pdf`, bytes, 'application/pdf');
      trackDownload({ format: 'pdf', tasks: deferredPlan.tasks.length, blocks: schedule.blocks.length });
      setNotice('PDF plan downloaded.');
    } catch {
      setNotice('Could not create the PDF. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  };
  const exportScheduleCsv = () => {
    downloadFile(`${exportName}-schedule.csv`, scheduleToCsv(schedule.blocks, tasksById, scoring.scores), 'text/csv;charset=utf-8');
    trackDownload({ format: 'csv_schedule' });
  };
  const exportTasksCsv = () => {
    downloadFile(`${exportName}-tasks.csv`, tasksToCsv(tasks, scoring.scores, schedule.taskResults), 'text/csv;charset=utf-8');
    trackDownload({ format: 'csv_tasks' });
  };
  const exportJson = () => {
    downloadFile(`${exportName}.json`, JSON.stringify(plan, null, 2), 'application/json');
    trackDownload({ format: 'json' });
  };

  const importJson = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const next = normalizeState(JSON.parse(text));
      setPlan(next);
      setSelectedBlockId(null);
      setNotice(`Imported ${next.tasks.length} tasks.`);
    } catch {
      setNotice('That file is not a valid planner JSON export.');
    }
  };

  const copySummary = async () => {
    const ranked = [...tasks].filter((t) => !t.done).sort((a, b) => (scoring.scores[b.id]?.score ?? 0) - (scoring.scores[a.id]?.score ?? 0));
    const lines = [
      `Plan: ${formatDate(period.start, { year: true })} – ${formatDate(period.end, { year: true })}`,
      `Available ${formatHours(summary.totalAvailableHours * 60)}, usable ${formatHours(summary.usableCapacityHours * 60)} (${summary.bufferPercent}% buffer), scheduled ${formatHours(summary.scheduledHours * 60)}, utilization ${summary.utilization.toFixed(1)}%`,
      '',
      ...ranked.map((t, i) => {
        const r = schedule.taskResults[t.id];
        const status = r?.status === 'complete' ? `done by ${formatDate(r.finishDate)}` : r?.status === 'partial' ? `${formatHours(r.remainingMinutes)} unscheduled` : 'not scheduled';
        return `${i + 1}. ${t.title} — score ${scoring.scores[t.id]?.score.toFixed(1)} (${scoring.scores[t.id]?.tier.label}), ${t.hours}h, ${status}`;
      })
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setNotice('Plan summary copied to clipboard.');
      trackCopy({ format: 'summary' });
    } catch {
      setNotice('Copy failed. Your browser blocked clipboard access.');
    }
  };

  return (
    <div className="c-tool-page-container tpp-root">
      <ToolHeader
        title={manifest.title}
        subtitle={manifest.shortDescription}
        onBack={onBack}
        backLabel="All Tools"
        slug={manifest.slug}
        badges={(
          <>
            {visitorCount > 0 && <Badge variant="blue" icon={<Users size={12} strokeWidth={2} />}>{visitorCount.toLocaleString()} visitors</Badge>}
            {conversionCount > 0 && <Badge variant="brand" icon={<Activity size={12} strokeWidth={2} />}>{conversionCount.toLocaleString()} {getConversionLabel()}</Badge>}
            <Badge variant="success" icon={<ShieldCheck size={12} strokeWidth={2} />}>Runs in your browser</Badge>
          </>
        )}
      />

      <CapacityKpis summary={summary} blockedHours={schedule.blockedMinutes / 60} taskCounts={taskCounts} demandHours={demandHours} />

      <div className="tpp-layout">
        <div className="tpp-col">
          <PeriodPanel period={period} onChange={(next) => updateSettings({ period: next }, 'period')} summary={summary} error={periodError} />
          <SchedulePanel
            settings={settings}
            periodStart={period.start}
            onChange={(patch) => updateSettings(patch, 'schedule')}
            onWeekChange={(week) => updateSettings({ week }, 'schedule')}
          />
        </div>
        <div className="tpp-col">
          <CriteriaPanel
            criteria={criteria}
            scoring={settings.scoring}
            referenceDate={scoring.referenceDate}
            onCriteriaChange={(next) => commit((p) => ({ ...p, criteria: next }), 'criteria')}
            onApplyPreset={(id) => commit((p) => ({ ...p, criteria: applyPreset(p.criteria, id) }), 'preset')}
            onScoringChange={(patch) => updateSettings({ scoring: { ...settings.scoring, ...patch } }, 'scoring')}
          />
        </div>
      </div>

      <TaskTable
        tasks={tasks}
        criteria={criteria}
        scores={scoring.scores}
        results={schedule.taskResults}
        referenceDate={scoring.referenceDate}
        onAdd={() => commit((p) => ({ ...p, tasks: [...p.tasks, createTask({ title: `Task ${p.tasks.length + 1}` }, p.tasks.length)] }), 'add_task')}
        onUpdate={updateTask}
        onRemove={removeTask}
      />

      <section className="tpp-panel tpp-panel-wide" aria-labelledby="tpp-plan-title">
        <header className="tpp-panel-head">
          <CalendarDays size={18} aria-hidden="true" />
          <h2 id="tpp-plan-title">5. Schedule</h2>
          {isStale && <span className="tpp-tag">recalculating…</span>}
          <div className="tpp-head-actions tpp-export">
            <button type="button" className="tpp-btn primary" onClick={exportPdf} disabled={!tasks.length || pdfBusy || !!periodError}><FileText size={14} /> {pdfBusy ? 'Creating PDF…' : 'Download PDF'}</button>
            <button type="button" className="tpp-btn" onClick={exportIcs} disabled={!schedule.blocks.length}><Download size={14} /> Calendar (.ics)</button>
            <button type="button" className="tpp-btn" onClick={exportScheduleCsv} disabled={!schedule.blocks.length}><FileSpreadsheet size={14} /> Schedule CSV</button>
            <button type="button" className="tpp-btn" onClick={exportTasksCsv} disabled={!tasks.length}><FileSpreadsheet size={14} /> Tasks CSV</button>
            <button type="button" className="tpp-btn" onClick={copySummary} disabled={!tasks.length}><Copy size={14} /> Copy summary</button>
          </div>
        </header>
        <p className="tpp-panel-lead">The schedule recalculates whenever dates, working hours, tasks or weights change. Click a block to lock it in place; locked blocks are never moved.</p>
        <ScheduleViews
          view={view}
          onViewChange={setView}
          cursor={viewCursor}
          onCursorChange={setCursor}
          period={period}
          days={days}
          blocks={schedule.blocks}
          dayStats={schedule.dayStats}
          tasks={deferredPlan.tasks}
          scores={scoring.scores}
          results={schedule.taskResults}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />
        <SelectedBlockBar
          block={selectedBlock}
          task={selectedBlock?.taskId ? tasksById.get(selectedBlock.taskId) : null}
          score={selectedBlock?.taskId ? scoring.scores[selectedBlock.taskId] : null}
          onLock={lockBlock}
          onUnlock={removeLocked}
          onClose={() => setSelectedBlockId(null)}
        />
      </section>

      <LockedBlocksPanel
        lockedBlocks={lockedBlocks}
        tasks={tasks}
        conflicts={schedule.conflicts}
        results={schedule.taskResults}
        periodStart={period.start}
        onAdd={(draft) => commit((p) => ({ ...p, lockedBlocks: [...p.lockedBlocks, { id: newId('lock'), ...draft }] }), 'add_locked')}
        onRemove={removeLocked}
      />

      <div className="tpp-data-bar">
        <button type="button" className="tpp-btn" onClick={exportJson}><Download size={14} /> Save plan (.json)</button>
        <button type="button" className="tpp-btn" onClick={() => fileRef.current?.click()}><Upload size={14} /> Open plan</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ''; }} />
        <button
          type="button"
          className="tpp-btn"
          onClick={() => {
            if (!window.confirm('Replace your current plan with the example plan?')) return;
            setPlan(createDefaultState());
            setSelectedBlockId(null);
          }}
        >
          <RotateCcw size={14} /> Load example
        </button>
        <button
          type="button"
          className="tpp-btn danger"
          onClick={() => {
            if (!window.confirm('Remove all tasks and locked blocks? Your working schedule is kept.')) return;
            setPlan((p) => ({ ...p, tasks: [], lockedBlocks: [] }));
            setSelectedBlockId(null);
          }}
        >
          <Eraser size={14} /> Clear tasks
        </button>
        <span className="tpp-hint">Your plan is saved automatically in this browser only. Today is {formatDate(todayIso(), { weekday: true, year: true })}.</span>
      </div>

      {notice && <div className="tpp-toast" role="status">{notice}</div>}

      <ToolSeoDivider label="Prioritization & Capacity Planning Guide" />
      <PlannerSeo />
    </div>
  );
}
