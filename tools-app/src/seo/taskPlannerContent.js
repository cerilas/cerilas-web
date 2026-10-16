/**
 * Task Prioritization & Capacity Planner (/tool/task-prioritization-planner):
 * shared copy for the visible page, server-rendered HTML and JSON-LD.
 *
 * Keyword ownership: "task prioritization tool", "capacity planner" and
 * "available working hours calculator". Focus-timer intent stays with the
 * Pomodoro Timer.
 */

export const PLANNER_SEO = {
  slug: 'task-prioritization-planner',
  name: 'Task Prioritization & Capacity Planner',
  h1: 'Free Task Prioritization & Capacity Planner',
  title: 'Task Prioritization & Capacity Planner (Free) | Cerilas Tools',
  description: 'Prioritize tasks with weighted scoring, calculate available working hours for any date range, and auto-schedule work around deadlines. Free, no sign-up.',
  shortDescription: 'Score tasks with weighted criteria, calculate real working capacity for any date range, and auto-schedule work around deadlines, dependencies and locked calendar blocks.',
  keywords: 'task prioritization tool, task prioritization matrix, capacity planner, capacity planning calculator, available working hours calculator, weighted scoring model, prioritize tasks, work schedule planner, time blocking planner, workload planner, resource capacity planning'
};

export const PLANNER_HOW_IT_WORKS = 'The planner separates two questions: which task matters most, and what actually fits in your calendar. Priority scores come from a weighted multi-criteria model (impact, strategic alignment, urgency, deadline risk, effort and any custom criteria). Capacity comes from your own working schedule for the dates you choose: hours per weekday, breaks, holidays, date overrides, a maximum daily workload and a safety buffer. The scheduler then places tasks into free working time by priority, pulls deadline-critical tasks forward, waits for dependencies to finish, respects minimum session length and no-split rules, and never moves blocks you have locked.';

export const PLANNER_FORMULA = [
  'Total Available Hours = SUM(available working hours on each date in the planning period)',
  'Usable Capacity = Total Available Hours × (1 − Buffer % / 100)',
  'Capacity Utilization = Scheduled Task Hours / Usable Capacity × 100',
  'Priority Score = 100 × Σ (weight_i × normalized_value_i) / Σ weight_i',
  'Rating criteria: (rating − 1) / 4 · Cost criteria (e.g. effort): 1 − normalized value',
  'Urgency = 1 − days until deadline / urgency window · Deadline risk = remaining hours / usable hours before the deadline'
].join('\n');

export const PLANNER_WHEN_TO_USE = 'Use it for weekly or sprint planning, when a deadline-heavy month needs a realistic plan, when you work different hours on different days, before committing to a client delivery date, or whenever a to-do list is longer than the time available and you need to decide what moves, what waits and what will not fit.';

export const PLANNER_EXAMPLE = 'A consultant works Monday 6h, Tuesday 4h, Wednesday 8h, Thursday 5h and Friday 6h (29 hours a week). For a 14-day period the total available time is 58 hours. With a 15% buffer the usable capacity is 58 × 0.85 = 49.3 hours. If 42 hours of tasks are scheduled, capacity utilization is 42 / 49.3 × 100 = 85.2%, leaving 7.3 hours of slack for unplanned work.';

export const PLANNER_HOW_TO = {
  title: 'How to prioritize tasks and plan your capacity in 4 steps',
  lead: 'To build a realistic plan, choose any planning period, describe when you can work, score your tasks, and let the scheduler fit the highest-priority work into the hours you actually have.',
  anchor: 'tpp-howto-heading',
  totalTime: 'PT5M',
  steps: [
    {
      name: 'Choose a planning period',
      text: 'Pick a shortcut (1, 3, 7, 14, 30 or 90 days) or any custom start and end date. Nothing assumes a fixed number of days.'
    },
    {
      name: 'Set your working schedule',
      text: 'Enter working days, start and end times and breaks for each weekday, add holidays or date-specific hours, and set a maximum daily workload, buffer percentage and minimum session length.'
    },
    {
      name: 'Add and score your tasks',
      text: 'Give each task an hour estimate, optional deadline and dependencies, and rate impact and strategic alignment from 1 to 5. Adjust criterion weights or pick a preset; scores from 0 to 100 update instantly.'
    },
    {
      name: 'Review, lock and export the schedule',
      text: 'Check utilization and the feasibility list, switch between daily, weekly, monthly and timeline views, lock blocks you want to keep, and export to your calendar as an .ics file or to a spreadsheet as CSV.'
    }
  ]
};

export const PLANNER_DEFINITIONS = {
  title: 'Key planning terms',
  items: [
    { term: 'Available hours', definition: 'Working time on each date of the period after breaks, holidays, overrides and the maximum daily workload are applied.' },
    { term: 'Usable capacity', definition: 'Available hours minus a safety buffer reserved for interruptions, email, meetings that are not in the plan and estimation errors.' },
    { term: 'Capacity utilization', definition: 'The share of usable capacity filled by scheduled task hours. Around 70–85% is sustainable; above 100% means the plan cannot be delivered as written.' },
    { term: 'Priority score', definition: 'A 0–100 weighted score of how much a task matters. It is independent of the planning period unless you choose to measure urgency from the planning start date.' },
    { term: 'Deadline risk', definition: 'How much of the usable working time before a deadline the remaining work would consume. 100% means there is no slack left.' },
    { term: 'Locked block', definition: 'A calendar block that recalculation never moves, such as a meeting or a work session you have committed to.' }
  ]
};

export const PLANNER_METHODS = {
  title: 'Task prioritization methods compared',
  lead: 'Weighted scoring generalizes the most common prioritization frameworks. The presets in this planner reproduce their intent with adjustable weights.',
  columns: ['Method', 'What it ranks by', 'Best for', 'Limitation'],
  rows: [
    ['Weighted scoring (this tool)', 'Any criteria you choose, each with a weight', 'Teams and individuals who want transparent, adjustable priorities', 'Needs honest ratings to be meaningful'],
    ['Eisenhower matrix', 'Urgent vs. important (four quadrants)', 'Quick personal triage', 'No effort, capacity or dependency awareness'],
    ['RICE', 'Reach × Impact × Confidence / Effort', 'Product feature backlogs', 'Ignores deadlines and available time'],
    ['WSJF (SAFe)', 'Cost of delay / job duration', 'Agile portfolio sequencing', 'Requires relative estimates across all items'],
    ['MoSCoW', 'Must, Should, Could, Won\'t categories', 'Scope negotiation for a release', 'No ranking inside a category']
  ]
};

export const PLANNER_FAQ = [
  {
    q: 'How do I calculate my available working hours for a date range?',
    a: 'Add up the working hours of every date in the range. For each date, take the hours set for that weekday (end time minus start time minus breaks), replace them with any date-specific override, set holidays to zero, and cap each day at your maximum daily workload. The planner does this automatically for any start and end date.'
  },
  {
    q: 'What is usable capacity and why add a buffer?',
    a: 'Usable capacity is total available hours multiplied by (1 − buffer % / 100). The buffer protects the plan from interruptions, support requests and estimation errors. A 10–20% buffer is typical for individuals; teams with frequent unplanned work often use 25–30%.'
  },
  {
    q: 'How is capacity utilization calculated?',
    a: 'Capacity utilization = scheduled task hours / usable capacity × 100. For example, 42 scheduled hours against 49.3 usable hours is 85.2%. Values above 100% mean locked or committed work already exceeds what the period can hold.'
  },
  {
    q: 'How does the weighted priority score work?',
    a: 'Each criterion is converted to a value between 0 and 1: ratings use (rating − 1) / 4, effort uses hours relative to the largest task, urgency and deadline risk are calculated from the deadline. Cost criteria such as effort are inverted. The score is 100 × the weighted average of these values, so it always falls between 0 and 100.'
  },
  {
    q: 'Does changing the planning period change task priorities?',
    a: 'No. Priority and scheduling feasibility are separate. By default urgency and deadline risk are measured from today, so moving the planning dates only changes what fits in the calendar. If you explicitly choose to measure them from the planning start date, those two time-dependent criteria are recalculated for the selected dates.'
  },
  {
    q: 'How does the scheduler decide what to do first?',
    a: 'At every free slot it chooses the ready task with the highest priority score. A task is ready when its dependencies are finished and its earliest start date has passed. Before giving time to other work, it checks that the remaining hours of every deadline task still fit into the usable time before each deadline; when they would not, the work with the earliest deadline goes first. Sessions shorter than your minimum session length are avoided unless they finish a task.'
  },
  {
    q: 'What happens to locked blocks when I change my schedule?',
    a: 'Locked blocks are never moved or deleted by recalculation. If a schedule change puts a locked block on a non-working day, outside working hours or outside the planning period, it stays where you placed it and appears as a warning so you can decide what to do.'
  },
  {
    q: 'Can I export the plan to Google Calendar or Outlook?',
    a: 'Yes. Export the schedule as an .ics file and import it into Google Calendar, Outlook or Apple Calendar. You can also export the schedule or the prioritized task list as CSV for Excel or Google Sheets, or save the whole plan as JSON.'
  },
  {
    q: 'Is my task data private?',
    a: 'Yes. The planner runs entirely in your browser and stores your plan in local storage on your device. Tasks, schedules and notes are not uploaded to a server, and no sign-up is required.'
  }
];
