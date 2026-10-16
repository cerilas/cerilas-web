import { formatTime } from './dates';

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function scheduleToCsv(blocks, tasksById, scores) {
  const header = ['Date', 'Start', 'End', 'Hours', 'Task', 'Priority score', 'Priority tier', 'Locked', 'Type'];
  const rows = blocks.map((b) => {
    const score = b.taskId ? scores[b.taskId] : null;
    return [
      b.date,
      formatTime(b.start),
      formatTime(b.end),
      (b.minutes / 60).toFixed(2),
      b.taskId ? tasksById.get(b.taskId)?.title || b.title : b.title,
      score ? score.score.toFixed(1) : '',
      score ? score.tier.label : '',
      b.locked ? 'yes' : 'no',
      b.kind === 'blocked' ? 'Blocked time' : 'Task'
    ];
  });
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function tasksToCsv(tasks, scores, results) {
  const header = ['Task', 'Estimated hours', 'Deadline', 'Deadline type', 'Priority score', 'Priority tier', 'Status', 'Finish date', 'Unscheduled hours', 'Notes'];
  const rows = [...tasks]
    .sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0))
    .map((t) => {
      const r = results[t.id] || {};
      return [
        t.title,
        t.hours,
        t.deadline,
        t.deadline ? t.deadlineType : '',
        scores[t.id]?.score.toFixed(1) ?? '',
        scores[t.id]?.tier.label ?? '',
        r.status || '',
        r.finishDate || '',
        r.remainingMinutes ? (r.remainingMinutes / 60).toFixed(2) : '0',
        t.notes
      ];
    });
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

function icsEscape(text) {
  return String(text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsStamp(date, minutes) {
  return `${date.replace(/-/g, '')}T${formatTime(minutes).replace(':', '')}00`;
}

function foldLine(line) {
  if (line.length <= 74) return line;
  const parts = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
  return parts.join('\r\n');
}

/** Exports blocks as an iCalendar file using floating local times. */
export function scheduleToIcs(blocks, tasksById, scores) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cerilas//Task Prioritization & Capacity Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Task plan'
  ];
  for (const b of blocks) {
    const task = b.taskId ? tasksById.get(b.taskId) : null;
    const score = b.taskId ? scores[b.taskId] : null;
    const description = score ? `Priority ${score.score.toFixed(1)} (${score.tier.label})${task?.notes ? `\n${task.notes}` : ''}` : 'Blocked time';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}-${b.date}-${b.start}@tools.cerilas.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(b.date, b.start)}`,
      `DTEND:${icsStamp(b.date, b.end)}`,
      foldLine(`SUMMARY:${icsEscape(task?.title || b.title)}`),
      foldLine(`DESCRIPTION:${icsEscape(description)}`),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
