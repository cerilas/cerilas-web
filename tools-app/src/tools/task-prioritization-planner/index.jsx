import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Activity, ShieldCheck, Download, Upload, RotateCcw, Copy, FileSpreadsheet, FileText, Eraser, ChevronDown, CalendarPlus } from 'lucide-react';
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
import SetupBar from './components/SetupBar';
import { usePlannerDialog } from './components/usePlannerDialog';
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
  const [setupOpen, setSetupOpen] = useState(null);
  const [undo, setUndo] = useState(null);
  const exportMenuRef = useRef(null);
  const { ask, notify, dialogElement } = usePlannerDialog();
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

  useEffect(() => {
    if (!undo) return undefined;
    const id = setTimeout(() => setUndo(null), 7000);
    return () => clearTimeout(id);
  }, [undo]);

  useEffect(() => {
    const close = (e) => {
      const menu = exportMenuRef.current;
      if (menu?.open && !menu.contains(e.target)) menu.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

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

  const addTask = (draft) => {
    const task = createTask(draft, tasks.length);
    commit((p) => ({ ...p, tasks: [...p.tasks, task] }), 'add_task');
    return task.id;
  };

  const removeTask = (id) => {
    const snapshot = { tasks: plan.tasks, lockedBlocks: plan.lockedBlocks };
    const title = tasksById.get(id)?.title || 'Task';
    setUndo({ label: `Deleted “${title}”`, snapshot });
    if (selectedBlock?.taskId === id) setSelectedBlockId(null);
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

  const restoreUndo = () => {
    if (!undo) return;
    setPlan((p) => ({ ...p, ...undo.snapshot }));
    setSelectedBlockId(null);
    setUndo(null);
  };

  const closeExportMenu = () => { if (exportMenuRef.current) exportMenuRef.current.open = false; };

  const loadExample = async () => {
    if (tasks.length || lockedBlocks.length) {
      const ok = await ask({
        title: 'Replace your plan with the example?',
        message: 'The example plan replaces everything you have entered so far.',
        details: [
          `${tasks.length} task${tasks.length === 1 ? '' : 's'} and ${lockedBlocks.length} locked block${lockedBlocks.length === 1 ? '' : 's'}`,
          'Your planning period, working hours and priority weights'
        ],
        confirmLabel: 'Load example',
        tone: 'danger'
      });
      if (!ok) return;
    }
    const snapshot = plan;
    setPlan(createDefaultState());
    setSelectedBlockId(null);
    if (tasks.length) setUndo({ label: 'Example plan loaded', snapshot });
  };

  const exportName = `task-plan-${period.start}-to-${period.end}`;
  const exportIcs = () => {
    downloadFile(`${exportName}.ics`, scheduleToIcs(schedule.blocks, tasksById, scoring.scores), 'text/calendar;charset=utf-8');
    trackDownload({ format: 'ics', blocks: schedule.blocks.length });
  };
  const exportPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    let buildPlanPdf;
    try {
      ({ buildPlanPdf } = await import('./lib/pdfReport'));
    } catch (error) {
      console.error('[planner] PDF module failed to load', error);
      setPdfBusy(false);
      const reload = await ask({
        title: 'A new version of the planner is available',
        message: 'This tab is running an older version of the tool, so the PDF builder could not be loaded. Reload the page and download the PDF again. Your plan is saved in this browser and stays as it is.',
        confirmLabel: 'Reload page',
        cancelLabel: 'Not now',
        tone: 'info'
      });
      if (reload) {
        saveState(plan);
        window.location.reload();
      }
      return;
    }
    try {
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
    } catch (error) {
      console.error('[planner] PDF export failed', error);
      notify({ title: 'Could not create the PDF', message: 'Something went wrong while building the PDF. Please try again. Your plan has not changed.' });
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
    let next;
    try {
      next = normalizeState(JSON.parse(await file.text()));
    } catch {
      notify({
        title: 'This file cannot be opened',
        message: `“${file.name}” is not a plan saved with this tool. Choose a .json file created with “Save plan”.`
      });
      return;
    }
    if (tasks.length || lockedBlocks.length) {
      const ok = await ask({
        title: `Open “${file.name}”?`,
        message: `The file contains ${next.tasks.length} task${next.tasks.length === 1 ? '' : 's'}. Opening it replaces your current plan.`,
        details: [`Current plan: ${tasks.length} task${tasks.length === 1 ? '' : 's'}, ${lockedBlocks.length} locked block${lockedBlocks.length === 1 ? '' : 's'}`],
        confirmLabel: 'Open plan',
        tone: 'warning'
      });
      if (!ok) return;
    }
    const snapshot = plan;
    setPlan(next);
    setSelectedBlockId(null);
    if (tasks.length) setUndo({ label: `Opened ${next.tasks.length} tasks from file`, snapshot });
    else setNotice(`Opened ${next.tasks.length} tasks.`);
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
      notify({ title: 'Could not copy the summary', message: 'Your browser blocked clipboard access. Allow clipboard permissions for this site, or use “Tasks as CSV” instead.', tone: 'warning' });
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

      <section className="tpp-panel tpp-setup" aria-labelledby="tpp-setup-title">
        <header className="tpp-panel-head">
          <span className="tpp-step" aria-hidden="true">1</span>
          <h2 id="tpp-setup-title">Plan setup</h2>
          <span className="tpp-head-note">Defaults work out of the box. Change them any time; everything recalculates instantly.</span>
        </header>
        <SetupBar
          settings={settings}
          criteria={criteria}
          summary={summary}
          open={setupOpen}
          onToggle={setSetupOpen}
          periodError={periodError}
        />
        {setupOpen && (
          <div id="tpp-setup-body" className={`tpp-setup-body is-${setupOpen}`}>
            {setupOpen === 'period' && (
              <PeriodPanel period={period} onChange={(next) => updateSettings({ period: next }, 'period')} summary={summary} error={periodError} />
            )}
            {setupOpen === 'schedule' && (
              <SchedulePanel
                settings={settings}
                periodStart={period.start}
                onChange={(patch) => updateSettings(patch, 'schedule')}
                onWeekChange={(week) => updateSettings({ week }, 'schedule')}
                confirm={ask}
              />
            )}
            {setupOpen === 'criteria' && (
              <CriteriaPanel
                criteria={criteria}
                scoring={settings.scoring}
                referenceDate={scoring.referenceDate}
                onCriteriaChange={(next) => commit((p) => ({ ...p, criteria: next }), 'criteria')}
                onApplyPreset={(id) => commit((p) => ({ ...p, criteria: applyPreset(p.criteria, id) }), 'preset')}
                onScoringChange={(patch) => updateSettings({ scoring: { ...settings.scoring, ...patch } }, 'scoring')}
              />
            )}
          </div>
        )}
      </section>

      <TaskTable
        tasks={tasks}
        criteria={criteria}
        scores={scoring.scores}
        results={schedule.taskResults}
        referenceDate={scoring.referenceDate}
        capacity={{ usableHours: summary.usableCapacityHours }}
        onAdd={addTask}
        onUpdate={updateTask}
        onRemove={removeTask}
        onLoadExample={loadExample}
      />

      <section className="tpp-panel tpp-panel-wide" aria-labelledby="tpp-plan-title">
        <header className="tpp-panel-head">
          <span className="tpp-step" aria-hidden="true">3</span>
          <h2 id="tpp-plan-title">Schedule</h2>
          {isStale && <span className="tpp-tag">recalculating…</span>}
          <div className="tpp-head-actions tpp-export">
            <button type="button" className="tpp-btn primary" onClick={exportPdf} disabled={!tasks.length || pdfBusy || !!periodError}><FileText size={14} /> {pdfBusy ? 'Creating PDF…' : 'Download PDF'}</button>
            <details className="tpp-menu" ref={exportMenuRef}>
              <summary className="tpp-btn">Export <ChevronDown size={14} aria-hidden="true" /></summary>
              <div className="tpp-menu-list" role="menu">
                <button type="button" role="menuitem" onClick={() => { closeExportMenu(); exportIcs(); }} disabled={!schedule.blocks.length}>
                  <CalendarPlus size={15} /> <span>Add to calendar<small>Google, Outlook, Apple (.ics)</small></span>
                </button>
                <button type="button" role="menuitem" onClick={() => { closeExportMenu(); exportScheduleCsv(); }} disabled={!schedule.blocks.length}>
                  <FileSpreadsheet size={15} /> <span>Schedule as CSV<small>One row per time block</small></span>
                </button>
                <button type="button" role="menuitem" onClick={() => { closeExportMenu(); exportTasksCsv(); }} disabled={!tasks.length}>
                  <FileSpreadsheet size={15} /> <span>Tasks as CSV<small>Ranked list with scores</small></span>
                </button>
                <button type="button" role="menuitem" onClick={() => { closeExportMenu(); copySummary(); }} disabled={!tasks.length}>
                  <Copy size={15} /> <span>Copy text summary<small>For Slack, email or notes</small></span>
                </button>
              </div>
            </details>
          </div>
        </header>
        <p className="tpp-panel-lead">Tasks are placed into your free working time by priority, deadlines and dependencies. Click any block to lock it in place; locked blocks never move when the plan recalculates.</p>
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
        <button type="button" className="tpp-btn" onClick={loadExample}>
          <RotateCcw size={14} /> Load example
        </button>
        <button
          type="button"
          className="tpp-btn danger"
          disabled={!tasks.length && !lockedBlocks.length}
          onClick={() => {
            setUndo({ label: `Cleared ${tasks.length} task${tasks.length === 1 ? '' : 's'}`, snapshot: { tasks: plan.tasks, lockedBlocks: plan.lockedBlocks } });
            setPlan((p) => ({ ...p, tasks: [], lockedBlocks: [] }));
            setSelectedBlockId(null);
          }}
        >
          <Eraser size={14} /> Clear tasks
        </button>
        <span className="tpp-hint">Your plan is saved automatically in this browser only. Today is {formatDate(todayIso(), { weekday: true, year: true })}.</span>
      </div>

      {dialogElement}

      {(undo || notice) && (
        <div className="tpp-toast" role="status">
          <span>{undo ? undo.label : notice}</span>
          {undo && <button type="button" onClick={restoreUndo}>Undo</button>}
        </div>
      )}

      <ToolSeoDivider label="Prioritization & Capacity Planning Guide" />
      <PlannerSeo />
    </div>
  );
}
