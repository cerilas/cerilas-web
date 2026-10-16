export const VIEWS = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
  { id: 'timeline', label: 'Timeline' }
];

export function defaultViewFor(lengthDays) {
  if (lengthDays <= 1) return 'day';
  if (lengthDays <= 7) return 'week';
  if (lengthDays <= 35) return 'month';
  return 'timeline';
}
