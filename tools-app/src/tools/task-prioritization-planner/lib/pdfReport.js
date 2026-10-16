import { PDFDocument, PDFName, PDFString, StandardFonts, degrees, rgb } from 'pdf-lib';
import { formatDate, formatHours, formatTime, todayIso } from './dates';

const TOOL_URL = 'https://tools.cerilas.com/tool/task-prioritization-planner';
const SITE_URL = 'https://tools.cerilas.com';
const LOGO_URL = '/platform-logo.png';

const PAGE_W = 841.89;
const PAGE_H = 595.28;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 44;
const FOOTER_H = 30;
const BODY_TOP = PAGE_H - MARGIN - HEADER_H;
const BODY_BOTTOM = MARGIN + FOOTER_H;

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const C = {
  text: hex('#0f172a'),
  muted: hex('#64748b'),
  border: hex('#e2e8f0'),
  zebra: hex('#f8fafc'),
  headBg: hex('#f1f5f9'),
  accent: hex('#6366f1'),
  accentSoft: hex('#eef2ff'),
  ok: hex('#10b981'),
  warn: hex('#f59e0b'),
  bad: hex('#ef4444'),
  brand: hex('#38bdf8'),
  white: rgb(1, 1, 1)
};

const TIER_COLORS = { critical: C.bad, high: C.warn, medium: C.accent, low: C.muted };
const STATUS_LABELS = { complete: 'Scheduled', partial: 'Partially scheduled', unscheduled: 'Not scheduled', done: 'Done' };

const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const CHAR_MAP = {
  'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D',
  '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '−': '-', '×': 'x', '\u2009': ' ', '\u202f': ' ', '\u00a0': ' '
};

/** Standard PDF fonts only cover WinAnsi; transliterate or replace everything else. */
function clean(value) {
  let out = '';
  for (const ch of String(value ?? '')) {
    const code = ch.codePointAt(0);
    if (CHAR_MAP[ch] !== undefined) { out += CHAR_MAP[ch]; continue; }
    if (code === 9 || code === 10 || code === 13) { out += ' '; continue; }
    if (code < 32 || code > 0xffff) continue;
    if (code <= 0x7e || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(ch)) { out += ch; continue; }
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    out += base && base.codePointAt(0) <= 0x7e ? base : '?';
  }
  return out;
}

function fit(text, font, size, maxWidth) {
  const s = clean(text);
  if (font.widthOfTextAtSize(s, size) <= maxWidth) return s;
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.widthOfTextAtSize(`${s.slice(0, mid)}...`, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return `${s.slice(0, lo).trimEnd()}...`;
}

function wrap(text, font, size, maxWidth) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = font.widthOfTextAtSize(word, size) <= maxWidth ? word : fit(word, font, size, maxWidth);
    }
  }
  if (line) lines.push(line);
  return lines;
}

function addLink(pdf, page, rect, url) {
  const annot = pdf.context.register(pdf.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: rect,
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) }
  }));
  const annots = page.node.lookup(PDFName.of('Annots'));
  if (annots) annots.push(annot);
  else page.node.set(PDFName.of('Annots'), pdf.context.obj([annot]));
}

async function loadLogoPng() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, 256, 256);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * Builds a branded, watermarked A4 landscape PDF of the current plan.
 * Returns the PDF bytes.
 */
export async function buildPlanPdf({ period, summary, tasks, scores, results, blocks, days, dayStats, conflicts, referenceDate }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await loadLogoPng();
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null;

  const periodLabel = `${formatDate(period.start, { year: true })} - ${formatDate(period.end, { year: true })}`;
  const generated = formatDate(todayIso(), { weekday: true, year: true });

  pdf.setTitle(`Task plan ${period.start} to ${period.end}`);
  pdf.setAuthor('Cerilas Tools');
  pdf.setSubject('Task prioritization and capacity plan');
  pdf.setKeywords(['task prioritization', 'capacity planning', 'schedule', 'Cerilas Tools']);
  pdf.setCreator(`Cerilas Tools - Task Prioritization & Capacity Planner (${TOOL_URL})`);
  pdf.setProducer('Cerilas Tools');

  const pages = [];
  let page;
  let y;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = BODY_TOP;
  };
  const ensure = (height) => {
    if (y - height < BODY_BOTTOM) {
      newPage();
      return true;
    }
    return false;
  };
  const text = (str, x, yy, { size = 9, f = font, color = C.text } = {}) => page.drawText(clean(str), { x, y: yy, size, font: f, color });

  const sectionTitle = (title, lead) => {
    ensure(lead ? 46 : 32);
    y -= 18;
    text(title, MARGIN, y, { size: 13, f: bold });
    if (lead) {
      y -= 14;
      text(lead, MARGIN, y, { size: 8.5, color: C.muted });
    }
    y -= 10;
  };

  const drawTable = (columns, rows, { rowHeight = 18, onRow } = {}) => {
    const drawHead = () => {
      page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: CONTENT_W, height: rowHeight, color: C.headBg });
      let x = MARGIN;
      for (const col of columns) {
        const label = clean(col.label.toUpperCase());
        const tx = col.align === 'right' ? x + col.width - 6 - bold.widthOfTextAtSize(label, 7) : x + 6;
        text(label, tx, y - rowHeight + 6, { size: 7, f: bold, color: C.muted });
        x += col.width;
      }
      y -= rowHeight;
    };
    const drawGroup = (label, right) => {
      page.drawRectangle({ x: MARGIN, y: y - rowHeight - 2, width: CONTENT_W, height: rowHeight + 2, color: C.accentSoft });
      text(fit(label, bold, 8.5, CONTENT_W * 0.6), MARGIN + 6, y - rowHeight + 4, { size: 8.5, f: bold, color: C.accent });
      if (right) {
        const s = clean(right);
        text(s, MARGIN + CONTENT_W - 6 - font.widthOfTextAtSize(s, 8), y - rowHeight + 4, { size: 8, color: C.muted });
      }
      y -= rowHeight + 2;
    };
    let currentGroup = null;
    drawHead();
    rows.forEach((row, i) => {
      if (row.group) {
        if (ensure(rowHeight * 2 + 4)) drawHead();
        currentGroup = row;
        drawGroup(row.group, row.groupRight);
        return;
      }
      if (ensure(rowHeight)) {
        drawHead();
        if (currentGroup) drawGroup(`${currentGroup.group} (continued)`, currentGroup.groupRight);
      }
      if (i % 2 === 1) page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: CONTENT_W, height: rowHeight, color: C.zebra });
      page.drawLine({ start: { x: MARGIN, y: y - rowHeight }, end: { x: MARGIN + CONTENT_W, y: y - rowHeight }, thickness: 0.5, color: C.border });
      let x = MARGIN;
      columns.forEach((col, ci) => {
        const cell = row.cells[ci];
        const value = typeof cell === 'object' && cell !== null ? cell : { value: cell };
        const f = value.bold ? bold : font;
        const size = value.size || 8.5;
        const indent = value.dot ? 12 : 0;
        const s = fit(value.value ?? '', f, size, col.width - 12 - indent);
        const tx = col.align === 'right' ? x + col.width - 6 - f.widthOfTextAtSize(s, size) : x + 6 + indent;
        if (value.dot) page.drawCircle({ x: x + 9, y: y - rowHeight / 2, size: 3, color: value.dot });
        text(s, tx, y - rowHeight + 6, { size, f, color: value.color || C.text });
        x += col.width;
      });
      onRow?.(row, y);
      y -= rowHeight;
    });
  };

  newPage();

  y -= 6;
  text('Task plan', MARGIN, y - 16, { size: 22, f: bold });
  y -= 34;
  text(`Planning period: ${periodLabel}  |  ${summary.calendarDays} calendar days, ${summary.workingDays} working days`, MARGIN, y, { size: 10, color: C.muted });
  y -= 13;
  text(`Priority reference date: ${formatDate(referenceDate, { year: true })}  |  Generated ${generated}`, MARGIN, y, { size: 8.5, color: C.muted });
  y -= 18;

  const openTasks = tasks.filter((t) => !t.done);
  const fullyScheduled = openTasks.filter((t) => results[t.id]?.status === 'complete').length;
  const atRisk = openTasks.filter((t) => results[t.id]?.deadlineAtRisk).length;
  const kpis = [
    { label: 'Total available hours', value: formatHours(summary.totalAvailableHours * 60), note: `${summary.workingDays} working days` },
    { label: 'Usable capacity', value: formatHours(summary.usableCapacityHours * 60), note: `After ${summary.bufferPercent}% buffer` },
    { label: 'Scheduled task hours', value: formatHours(summary.scheduledHours * 60), note: `${formatHours(summary.freeHours * 60)} free` },
    { label: 'Capacity utilization', value: `${summary.utilization.toFixed(1)}%`, note: summary.utilization > 100 ? 'Over capacity' : summary.utilization >= 85 ? 'Little slack left' : 'Healthy load', color: summary.utilization > 100 ? C.bad : summary.utilization >= 85 ? C.warn : C.ok },
    { label: 'Tasks fully scheduled', value: `${fullyScheduled}/${openTasks.length}`, note: fullyScheduled === openTasks.length ? 'Everything fits' : 'Some work does not fit', color: fullyScheduled === openTasks.length ? C.ok : C.warn },
    { label: 'Deadlines at risk', value: String(atRisk), note: atRisk ? 'Needs attention' : 'All deadlines met', color: atRisk ? C.bad : C.ok }
  ];
  const gap = 8;
  const cardW = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
  const cardH = 58;
  kpis.forEach((k, i) => {
    const x = MARGIN + i * (cardW + gap);
    page.drawRectangle({ x, y: y - cardH, width: cardW, height: cardH, color: C.white, borderColor: C.border, borderWidth: 0.8 });
    page.drawRectangle({ x, y: y - cardH, width: 3, height: cardH, color: k.color || C.accent });
    text(fit(k.label.toUpperCase(), bold, 6.5, cardW - 16), x + 10, y - 14, { size: 6.5, f: bold, color: C.muted });
    text(k.value, x + 10, y - 35, { size: 17, f: bold });
    text(fit(k.note, font, 7.5, cardW - 16), x + 10, y - 49, { size: 7.5, color: C.muted });
  });
  y -= cardH + 10;

  const barW = CONTENT_W;
  const pct = Math.max(0, Math.min(100, summary.utilization));
  page.drawRectangle({ x: MARGIN, y: y - 5, width: barW, height: 5, color: C.border });
  page.drawRectangle({ x: MARGIN, y: y - 5, width: (barW * pct) / 100, height: 5, color: summary.utilization > 100 ? C.bad : summary.utilization >= 85 ? C.warn : C.ok });
  y -= 12;

  const ranked = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0);
  });

  sectionTitle('Priority ranking', 'Weighted priority score (0-100) per task. The score does not depend on the planning period.');
  if (!ranked.length) {
    ensure(20);
    text('No tasks in this plan yet.', MARGIN, y - 12, { size: 9, color: C.muted });
    y -= 20;
  } else {
    drawTable(
      [
        { label: '#', width: 26, align: 'right' },
        { label: 'Task', width: 270 },
        { label: 'Score', width: 50, align: 'right' },
        { label: 'Tier', width: 64 },
        { label: 'Hours', width: 50, align: 'right' },
        { label: 'Deadline', width: 110 },
        { label: 'Status', width: 112 },
        { label: 'Finishes', width: CONTENT_W - 682 }
      ],
      ranked.map((t, i) => {
        const s = scores[t.id];
        const r = results[t.id] || {};
        const status = t.done ? 'done' : r.status;
        const statusColor = status === 'complete' || status === 'done' ? C.ok : status === 'partial' ? C.warn : C.bad;
        const deadline = t.deadline ? `${formatDate(t.deadline, { year: true })}${t.deadlineType === 'hard' ? ' (hard)' : ''}` : '-';
        let finish = r.finishDate ? formatDate(r.finishDate, { year: true }) : '-';
        if (r.status === 'partial') finish = `${formatHours(r.remainingMinutes)} left`;
        return {
          cells: [
            String(i + 1),
            { value: t.title || 'Untitled task', bold: true, dot: hex(t.color || '#6366f1') },
            { value: s ? s.score.toFixed(1) : '-', bold: true },
            { value: s?.tier.label || '-', color: TIER_COLORS[s?.tier.id] || C.muted, bold: true },
            `${Number(t.hours) || 0}h`,
            { value: deadline, color: r.deadlineAtRisk ? C.bad : C.text },
            { value: STATUS_LABELS[status] || '-', color: statusColor },
            finish
          ]
        };
      })
    );
  }

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const statsByDate = new Map(dayStats.map((d) => [d.date, d]));
  const blocksByDate = new Map();
  for (const b of [...blocks].sort((a, b2) => (a.date === b2.date ? a.start - b2.start : a.date < b2.date ? -1 : 1))) {
    if (!blocksByDate.has(b.date)) blocksByDate.set(b.date, []);
    blocksByDate.get(b.date).push(b);
  }
  const scheduleDates = [...new Set([...days.filter((d) => d.isWorking).map((d) => d.date), ...blocksByDate.keys()])].sort();
  const dayByDate = new Map(days.map((d) => [d.date, d]));

  newPage();
  sectionTitle('Day-by-day schedule', 'Time blocks per working day. Locked blocks were placed manually and are never moved by the planner.');
  const scheduleRows = [];
  for (const date of scheduleDates) {
    const day = dayByDate.get(date);
    const stat = statsByDate.get(date);
    const own = blocksByDate.get(date) || [];
    const usable = day ? day.usableMinutes : 0;
    const used = stat ? stat.taskMinutes : own.filter((b) => b.kind === 'task').reduce((s, b) => s + b.minutes, 0);
    const right = day?.isWorking
      ? `${formatHours(used)} planned of ${formatHours(usable)} usable${day.label ? `  |  ${day.label}` : ''}`
      : `Outside working hours${day?.label ? `  |  ${day.label}` : ''}`;
    scheduleRows.push({ group: formatDate(date, { weekday: true, year: true }), groupRight: right });
    if (!own.length) {
      scheduleRows.push({ cells: ['', { value: 'Free - nothing scheduled', color: C.muted }, '', '', ''] });
      continue;
    }
    for (const b of own) {
      const task = b.taskId ? tasksById.get(b.taskId) : null;
      const s = b.taskId ? scores[b.taskId] : null;
      scheduleRows.push({
        cells: [
          `${formatTime(b.start)} - ${formatTime(b.end)}`,
          { value: task?.title || b.title || 'Blocked time', bold: b.kind === 'task', dot: b.kind === 'task' ? hex(task?.color || '#6366f1') : C.muted, color: b.kind === 'task' ? C.text : C.muted },
          formatHours(b.minutes),
          s ? { value: `${s.score.toFixed(1)} ${s.tier.label}`, color: TIER_COLORS[s.tier.id] } : '-',
          { value: b.locked ? (b.kind === 'blocked' ? 'Blocked (locked)' : 'Locked') : 'Auto-scheduled', color: b.locked ? C.accent : C.muted }
        ]
      });
    }
  }
  if (!scheduleRows.length) {
    text('No working days in this planning period.', MARGIN, y - 12, { size: 9, color: C.muted });
    y -= 20;
  } else {
    drawTable(
      [
        { label: 'Time', width: 100 },
        { label: 'Task', width: 380 },
        { label: 'Hours', width: 60, align: 'right' },
        { label: 'Priority', width: 110 },
        { label: 'Placement', width: CONTENT_W - 650 }
      ],
      scheduleRows
    );
  }

  const issues = [
    ...conflicts.map((c) => c.message),
    ...openTasks
      .filter((t) => results[t.id] && results[t.id].status !== 'complete')
      .map((t) => `${t.title || 'Untitled task'}: ${(results[t.id].reasons || []).join(' ')}`.trim()),
    ...openTasks
      .filter((t) => results[t.id]?.status === 'complete' && results[t.id]?.late)
      .map((t) => `${t.title || 'Untitled task'}: finishes after its deadline (${formatDate(t.deadline, { year: true })}).`)
  ];
  sectionTitle('Feasibility check');
  if (!issues.length) {
    ensure(24);
    page.drawRectangle({ x: MARGIN, y: y - 22, width: CONTENT_W, height: 22, color: hex('#ecfdf5') });
    text('Every open task fits in the planning period and no locked block conflicts with the schedule.', MARGIN + 10, y - 15, { size: 9, color: hex('#047857') });
    y -= 30;
  } else {
    for (const issue of issues) {
      const lines = wrap(issue, font, 9, CONTENT_W - 24);
      ensure(lines.length * 12 + 6);
      page.drawCircle({ x: MARGIN + 6, y: y - 8, size: 2.5, color: C.warn });
      lines.forEach((line, i) => text(line, MARGIN + 16, y - 11 - i * 12, { size: 9 }));
      y -= lines.length * 12 + 6;
    }
  }

  const total = pages.length;
  pages.forEach((p, index) => {
    page = p;
    const top = PAGE_H - MARGIN;
    if (logo) p.drawImage(logo, { x: MARGIN, y: top - 22, width: 22, height: 22 });
    const brandX = MARGIN + (logo ? 28 : 0);
    text('Cerilas Tools', brandX, top - 15, { size: 11, f: bold });
    const brandW = bold.widthOfTextAtSize('Cerilas Tools', 11);
    addLink(pdf, p, [MARGIN, top - 24, brandX + brandW, top + 2], SITE_URL);
    const headRight = clean(`Task Prioritization & Capacity Planner  |  ${periodLabel}`);
    text(headRight, PAGE_W - MARGIN - font.widthOfTextAtSize(headRight, 8.5), top - 14, { size: 8.5, color: C.muted });
    p.drawLine({ start: { x: MARGIN, y: top - 32 }, end: { x: PAGE_W - MARGIN, y: top - 32 }, thickness: 0.6, color: C.border });

    p.drawLine({ start: { x: MARGIN, y: MARGIN + 16 }, end: { x: PAGE_W - MARGIN, y: MARGIN + 16 }, thickness: 0.6, color: C.border });
    const footLeft = 'Created with the free Task Prioritization & Capacity Planner by Cerilas Tools - tools.cerilas.com/tool/task-prioritization-planner';
    text(footLeft, MARGIN, MARGIN + 4, { size: 7.5, color: C.muted });
    addLink(pdf, p, [MARGIN, MARGIN, MARGIN + font.widthOfTextAtSize(clean(footLeft), 7.5), MARGIN + 13], TOOL_URL);
    const pageLabel = `Page ${index + 1} of ${total}`;
    text(pageLabel, PAGE_W - MARGIN - font.widthOfTextAtSize(pageLabel, 7.5), MARGIN + 4, { size: 7.5, color: C.muted });

    const cx = PAGE_W / 2;
    const cy = (BODY_TOP + BODY_BOTTOM) / 2;
    if (logo) p.drawImage(logo, { x: cx - 110, y: cy - 110, width: 220, height: 220, opacity: 0.05 });
    const mark = 'CERILAS TOOLS';
    const markSize = 68;
    const markW = bold.widthOfTextAtSize(mark, markSize);
    const angle = (24 * Math.PI) / 180;
    p.drawText(mark, {
      x: cx - (markW / 2) * Math.cos(angle) + (markSize / 3) * Math.sin(angle),
      y: cy - (markW / 2) * Math.sin(angle) - (markSize / 3) * Math.cos(angle),
      size: markSize,
      font: bold,
      color: C.brand,
      opacity: 0.09,
      rotate: degrees(24)
    });
    const sub = 'tools.cerilas.com';
    const subSize = 16;
    const subW = font.widthOfTextAtSize(sub, subSize);
    const subX = cx + 56 * Math.sin(angle);
    const subY = cy - 56 * Math.cos(angle);
    p.drawText(sub, {
      x: subX - (subW / 2) * Math.cos(angle) + (subSize / 3) * Math.sin(angle),
      y: subY - (subW / 2) * Math.sin(angle) - (subSize / 3) * Math.cos(angle),
      size: subSize,
      font,
      color: C.brand,
      opacity: 0.12,
      rotate: degrees(24)
    });
  });

  return pdf.save();
}
