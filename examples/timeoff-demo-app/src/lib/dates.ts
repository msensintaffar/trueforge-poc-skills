// Date helpers shared by the balance engine, request entry, and the
// yearly calendar.

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/**
 * The fiscal (personal-holiday) year a date falls in. Personal holidays
 * reset every July 1st, so the year "starts" on July 1: a date in
 * Jan–Jun belongs to the fiscal year that started the previous July,
 * and a date in Jul–Dec belongs to the fiscal year starting that July.
 * Returns the calendar year in which that fiscal year STARTED.
 */
export function fiscalYearOf(dateStr: string): number {
  const [y, m] = dateStr.split('-').map(Number);
  return m >= 7 ? y : y - 1;
}

/** Human label for a fiscal year that starts in the given year: "2025–26". */
export function fiscalYearLabel(startYear: number): string {
  return `${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/**
 * Whole months elapsed from the start of the fiscal year (July 1) through
 * the given date, inclusive of the current month — used for monthly
 * accrual. July 1 itself counts as month 1.
 */
export function monthsIntoFiscalYear(dateStr: string): number {
  const fy = fiscalYearOf(dateStr);
  const [y, m] = dateStr.split('-').map(Number);
  const july1Month = 7; // July
  return (y - fy) * 12 + (m - july1Month) + 1;
}

/** Inclusive day count between two YYYY-MM-DD dates (same day = 1). */
export function daysInclusive(startStr: string, endStr: string): number {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}
