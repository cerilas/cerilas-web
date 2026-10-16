import React from 'react';

function fmt(n, digits = 1) {
  return Number(n.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
}

export default function CapacityKpis({ summary, blockedHours, taskCounts, demandHours }) {
  const util = summary.utilization;
  const utilState = util > 100 ? 'over' : util >= 85 ? 'tight' : 'ok';

  const items = [
    { label: 'Total available hours', value: `${fmt(summary.totalAvailableHours)}h`, hint: summary.cappedByDailyLimit ? `Capped by max daily workload (schedule: ${fmt(summary.rawScheduleHours)}h)` : `${summary.workingDays} working days in ${summary.calendarDays} calendar days` },
    { label: 'Usable capacity', value: `${fmt(summary.usableCapacityHours)}h`, hint: `After ${fmt(summary.bufferPercent, 0)}% buffer` },
    { label: 'Scheduled task hours', value: `${fmt(summary.scheduledHours)}h`, hint: `${fmt(demandHours)}h of open work requested${blockedHours > 0 ? ` · ${fmt(blockedHours)}h blocked time` : ''}` },
    { label: 'Capacity utilization', value: `${fmt(util)}%`, hint: utilState === 'over' ? 'Locked blocks exceed usable capacity' : utilState === 'tight' ? 'Little slack left' : `${fmt(summary.freeHours)}h still free`, state: utilState },
    { label: 'Tasks fully scheduled', value: `${taskCounts.complete}/${taskCounts.open}`, hint: taskCounts.unscheduled + taskCounts.partial > 0 ? `${taskCounts.partial} partial · ${taskCounts.unscheduled} not scheduled` : 'Everything fits', state: taskCounts.unscheduled + taskCounts.partial > 0 ? 'tight' : 'ok' },
    { label: 'Deadlines at risk', value: String(taskCounts.atRisk), hint: taskCounts.atRisk ? 'Late or not finished before the deadline' : 'All deadlines met', state: taskCounts.atRisk ? 'over' : 'ok' }
  ];

  return (
    <section className="tpp-kpis" aria-label="Capacity summary" aria-live="polite">
      {items.map((item) => (
        <div key={item.label} className={`tpp-kpi ${item.state ? `is-${item.state}` : ''}`}>
          <span className="tpp-kpi-label">{item.label}</span>
          <strong className="tpp-kpi-value">{item.value}</strong>
          <span className="tpp-kpi-hint">{item.hint}</span>
        </div>
      ))}
      <div className="tpp-util-bar" role="img" aria-label={`Utilization ${fmt(util)} percent`}>
        <span className={`is-${utilState}`} style={{ width: `${Math.min(100, util)}%` }} />
      </div>
    </section>
  );
}
