import { parseTime, isIsoDate, diffDays, formatHours, formatTime } from './dates';

const DAY = 1440;

function subtractIntervals(windows, busy) {
  let free = windows.map(([a, b]) => [a, b]);
  for (const [bs, be] of busy) {
    const next = [];
    for (const [a, b] of free) {
      if (be <= a || bs >= b) {
        next.push([a, b]);
        continue;
      }
      if (bs > a) next.push([a, bs]);
      if (be < b) next.push([be, b]);
    }
    free = next;
  }
  return free.filter(([a, b]) => b - a > 0);
}

function overlapMinutes(windows, s, e) {
  return windows.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, e) - Math.max(a, s)), 0);
}

function findCycles(tasks, depsOf) {
  const ids = tasks.map((t) => t.id);
  const indegree = new Map(ids.map((id) => [id, 0]));
  const dependents = new Map(ids.map((id) => [id, []]));
  for (const id of ids) {
    for (const dep of depsOf.get(id)) {
      if (!indegree.has(dep)) continue;
      indegree.set(id, indegree.get(id) + 1);
      dependents.get(dep).push(id);
    }
  }
  const queue = ids.filter((id) => indegree.get(id) === 0);
  const seen = new Set();
  while (queue.length) {
    const id = queue.shift();
    seen.add(id);
    for (const next of dependents.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  return new Set(ids.filter((id) => !seen.has(id)));
}

/**
 * Builds a schedule for the planning period.
 *
 * Locked blocks are reserved first and never moved; they only produce conflict
 * warnings when they no longer fit the working schedule. Remaining task hours are
 * then placed chronologically, choosing at every free slot the ready task with the
 * highest priority, except that tasks whose deadline is at risk are pulled forward.
 */
export function buildSchedule({ tasks, scores, days, lockedBlocks, settings }) {
  const periodStart = days[0]?.date;
  const minSession = Math.max(5, Math.round(Number(settings.minSessionMinutes) || 0));
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const openTasks = tasks.filter((t) => !t.done);
  const doneIds = new Set(tasks.filter((t) => t.done).map((t) => t.id));

  const depsOf = new Map(openTasks.map((t) => [
    t.id,
    (t.dependsOn || []).filter((d) => d !== t.id && taskById.has(d) && !doneIds.has(d))
  ]));
  const cyclic = findCycles(openTasks, depsOf);

  const conflicts = [];
  const lockedByDay = days.map(() => []);
  const lockedCredit = new Map();
  const finishAbs = new Map();
  const blocks = [];

  const toAbs = (date, minute) => {
    if (!periodStart) return minute;
    return diffDays(periodStart, date) * DAY + minute;
  };

  for (const lb of lockedBlocks || []) {
    const s = parseTime(lb.start);
    const e = parseTime(lb.end);
    const task = lb.taskId ? taskById.get(lb.taskId) : null;
    const title = task?.title || lb.title || 'Blocked time';
    if (!isIsoDate(lb.date) || s === null || e === null || e <= s) {
      conflicts.push({ type: 'invalid', blockId: lb.id, message: `"${title}" has an invalid date or time range.` });
      continue;
    }
    if (lb.taskId && !task) {
      conflicts.push({ type: 'orphan', blockId: lb.id, message: `A locked block on ${lb.date} belongs to a deleted task; it is kept as blocked time.` });
    }
    const minutes = e - s;
    if (task) {
      lockedCredit.set(task.id, (lockedCredit.get(task.id) || 0) + minutes);
      finishAbs.set(task.id, Math.max(finishAbs.get(task.id) ?? -Infinity, toAbs(lb.date, e)));
    }
    const di = dayIndex.get(lb.date);
    const block = {
      id: lb.id,
      taskId: task ? task.id : null,
      title,
      date: lb.date,
      start: s,
      end: e,
      minutes,
      locked: true,
      kind: task ? 'task' : 'blocked'
    };
    if (di === undefined) {
      conflicts.push({ type: 'outside', blockId: lb.id, message: `Locked block "${title}" on ${lb.date} is outside the planning period. It is kept and still counts toward the task.` });
      continue;
    }
    const day = days[di];
    for (const other of lockedByDay[di]) {
      if (s < other.end && e > other.start) {
        conflicts.push({ type: 'overlap', blockId: lb.id, message: `Locked blocks "${title}" and "${other.title}" overlap on ${lb.date}.` });
      }
    }
    const inside = overlapMinutes(day.windows, s, e);
    if (inside < minutes) {
      const reason = day.windows.length === 0 ? 'a non-working day' : 'outside working hours';
      conflicts.push({ type: 'outsideHours', blockId: lb.id, message: `Locked block "${title}" on ${lb.date} (${formatTime(s)}–${formatTime(e)}) falls on ${reason}. It was kept as you placed it.` });
    }
    lockedByDay[di].push(block);
    blocks.push(block);
  }

  const budgets = days.map((day, di) => {
    const lockedInside = lockedByDay[di].reduce((sum, b) => sum + overlapMinutes(day.windows, b.start, b.end), 0);
    if (lockedInside > day.usableMinutes && day.usableMinutes > 0) {
      conflicts.push({ type: 'overbooked', date: day.date, message: `Locked blocks on ${day.date} use ${formatHours(lockedInside)}, more than the ${formatHours(day.usableMinutes)} of usable capacity.` });
    }
    return Math.max(0, day.usableMinutes - lockedInside);
  });
  const freeWindows = days.map((day, di) => subtractIntervals(day.windows, lockedByDay[di].map((b) => [b.start, b.end])));

  const suffixBudget = new Array(days.length + 1).fill(0);
  for (let i = days.length - 1; i >= 0; i -= 1) suffixBudget[i] = suffixBudget[i + 1] + budgets[i];

  const remaining = new Map();
  const autoMinutes = new Map();
  for (const t of openTasks) {
    const need = Math.max(0, Math.round((Number(t.hours) || 0) * 60));
    remaining.set(t.id, Math.max(0, need - (lockedCredit.get(t.id) || 0)));
    autoMinutes.set(t.id, 0);
    if (remaining.get(t.id) === 0 && !finishAbs.has(t.id)) finishAbs.set(t.id, -Infinity);
  }

  const deadlineIdx = (t) => {
    if (!isIsoDate(t.deadline)) return null;
    if (!periodStart) return null;
    return diffDays(periodStart, t.deadline);
  };

  const isReady = (t, di, nowAbs) => {
    if (cyclic.has(t.id) || remaining.get(t.id) <= 0) return false;
    const day = days[di];
    if (isIsoDate(t.earliestStart) && day.date < t.earliestStart) return false;
    if (t.deadlineType === 'hard' && isIsoDate(t.deadline) && day.date > t.deadline) return false;
    return depsOf.get(t.id).every((dep) => {
      if (remaining.get(dep) > 0) return false;
      const f = finishAbs.get(dep);
      return f === undefined || f <= nowAbs;
    });
  };

  const capacityUntil = (di, todayLeft, dl) => todayLeft + suffixBudget[di + 1] - suffixBudget[Math.min(days.length, dl + 1)];

  /**
   * Deadline protection: returns the earliest deadline whose pending work would
   * no longer fit in the usable time before it if `chunk` minutes went to
   * unrelated work now. Until such a deadline exists, priority order wins.
   */
  const tightDeadline = (di, todayLeft, chunk) => {
    const pending = openTasks
      .filter((t) => !cyclic.has(t.id) && remaining.get(t.id) > 0)
      .map((t) => ({ t, dl: deadlineIdx(t) }))
      .filter(({ dl }) => dl !== null && dl >= di)
      .sort((a, b) => a.dl - b.dl);
    let demand = 0;
    for (const { t, dl } of pending) {
      demand += remaining.get(t.id);
      if (demand > capacityUntil(di, todayLeft, dl) - chunk) return t.deadline;
    }
    return null;
  };

  const rank = (protectUntil) => (a, b) => {
    const pa = protectUntil !== null && isIsoDate(a.deadline) && a.deadline <= protectUntil;
    const pb = protectUntil !== null && isIsoDate(b.deadline) && b.deadline <= protectUntil;
    if (pa !== pb) return pa ? -1 : 1;
    if (pa && pb) {
      if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
      if ((a.deadlineType === 'hard') !== (b.deadlineType === 'hard')) return a.deadlineType === 'hard' ? -1 : 1;
    }
    const sa = scores[a.id]?.score ?? 0;
    const sb = scores[b.id]?.score ?? 0;
    if (sa !== sb) return sb - sa;
    const da = isIsoDate(a.deadline) ? a.deadline : '9999-12-31';
    const db = isIsoDate(b.deadline) ? b.deadline : '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    return remaining.get(a.id) - remaining.get(b.id);
  };

  const place = (t, di, start, minutes) => {
    const last = blocks[blocks.length - 1];
    if (last && !last.locked && last.taskId === t.id && last.date === days[di].date && last.end === start) {
      last.end += minutes;
      last.minutes += minutes;
    } else {
      blocks.push({
        id: `auto-${t.id}-${days[di].date}-${start}`,
        taskId: t.id,
        title: t.title,
        date: days[di].date,
        start,
        end: start + minutes,
        minutes,
        locked: false,
        kind: 'task'
      });
    }
    remaining.set(t.id, remaining.get(t.id) - minutes);
    autoMinutes.set(t.id, autoMinutes.get(t.id) + minutes);
    if (remaining.get(t.id) === 0) finishAbs.set(t.id, di * DAY + start + minutes);
  };

  const lockedFinishTimes = (di) => lockedByDay[di]
    .filter((b) => b.taskId)
    .map((b) => di * DAY + b.end);

  for (let di = 0; di < days.length; di += 1) {
    let budget = budgets[di];
    if (budget <= 0) continue;
    for (const [ws, we] of freeWindows[di]) {
      let t = ws;
      while (t < we && budget > 0) {
        const nowAbs = di * DAY + t;
        const avail = Math.min(we - t, budget);
        const ready = openTasks.filter((task) => isReady(task, di, nowAbs)).sort(rank(tightDeadline(di, budget, avail)));
        let placed = false;
        for (const task of ready) {
          const need = remaining.get(task.id);
          if (task.allowSplit === false && need > we - t) continue;
          if (task.allowSplit === false && need > budget) continue;
          const chunk = Math.min(need, avail);
          if (chunk < need && chunk < minSession) continue;
          place(task, di, t, chunk);
          t += chunk;
          budget -= chunk;
          placed = true;
          break;
        }
        if (!placed) {
          const nextEvent = lockedFinishTimes(di)
            .map((abs) => abs - di * DAY)
            .filter((m) => m > t && m < we)
            .sort((a, b) => a - b)[0];
          if (nextEvent === undefined) break;
          t = nextEvent;
        }
      }
    }
  }

  blocks.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));

  const longestWindow = Math.max(0, ...freeWindows.flat().map(([a, b]) => b - a));
  const periodEnd = days[days.length - 1]?.date;

  const taskResults = {};
  for (const t of tasks) {
    if (t.done) {
      taskResults[t.id] = { status: 'done', autoMinutes: 0, lockedMinutes: lockedCredit.get(t.id) || 0, reasons: [] };
      continue;
    }
    const left = remaining.get(t.id);
    const auto = autoMinutes.get(t.id);
    const locked = lockedCredit.get(t.id) || 0;
    const reasons = [];
    let finishDate = null;
    if (left === 0) {
      const f = finishAbs.get(t.id);
      if (Number.isFinite(f) && periodStart) {
        const offset = Math.floor((f - 1) / DAY);
        finishDate = offset >= 0 && offset < days.length ? days[offset].date : null;
      }
    } else if (cyclic.has(t.id)) {
      reasons.push('Circular dependency: this task depends (directly or indirectly) on itself.');
    } else {
      const waiting = depsOf.get(t.id).filter((d) => remaining.get(d) > 0).map((d) => taskById.get(d)?.title).filter(Boolean);
      if (waiting.length) reasons.push(`Waiting on: ${waiting.join(', ')}.`);
      if (isIsoDate(t.earliestStart) && periodEnd && t.earliestStart > periodEnd) reasons.push('Earliest start date is after the planning period.');
      if (t.deadlineType === 'hard' && isIsoDate(t.deadline)) reasons.push(`Not enough free capacity before the hard deadline (${t.deadline}).`);
      if (t.allowSplit === false && left > longestWindow) reasons.push(`Needs ${formatHours(left)} uninterrupted, but the longest free window is ${formatHours(longestWindow)}.`);
      if (!reasons.length) reasons.push(`Not enough usable capacity in the planning period: ${formatHours(left)} still unscheduled.`);
    }
    const late = Boolean(finishDate && isIsoDate(t.deadline) && finishDate > t.deadline);
    const missesDeadline = isIsoDate(t.deadline) && (late || (left > 0 && periodEnd && t.deadline <= periodEnd));
    let status = 'complete';
    if (left > 0) status = auto + locked > 0 ? 'partial' : 'unscheduled';
    taskResults[t.id] = {
      status,
      autoMinutes: auto,
      lockedMinutes: locked,
      remainingMinutes: left,
      finishDate,
      late,
      deadlineAtRisk: Boolean(missesDeadline),
      reasons
    };
  }

  const dayStats = days.map((day) => {
    const own = blocks.filter((b) => b.date === day.date);
    const taskMinutes = own.filter((b) => b.kind === 'task').reduce((s, b) => s + b.minutes, 0);
    const blockedMinutes = own.filter((b) => b.kind === 'blocked').reduce((s, b) => s + b.minutes, 0);
    return {
      date: day.date,
      taskMinutes,
      blockedMinutes,
      utilization: day.usableMinutes > 0 ? (taskMinutes / day.usableMinutes) * 100 : (taskMinutes > 0 ? Infinity : 0)
    };
  });

  const inPeriod = new Set(days.map((d) => d.date));
  const scheduledMinutes = blocks
    .filter((b) => b.kind === 'task' && inPeriod.has(b.date))
    .reduce((s, b) => s + b.minutes, 0);
  const blockedMinutes = blocks
    .filter((b) => b.kind === 'blocked' && inPeriod.has(b.date))
    .reduce((s, b) => s + b.minutes, 0);

  return { blocks, taskResults, dayStats, conflicts, scheduledMinutes, blockedMinutes };
}
