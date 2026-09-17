// Read/write helpers shared by the API routes. All database access is
// server-side only — pages never touch the database directly.

import { getDb, seedIfEmpty } from './db';
import {
  HOURS_PER_DAY,
  vacationDaysPerYear,
  rolloverVacationToSick,
  personalAllowanceHours,
  computeBalances,
  type Balances,
  type UsedHours,
} from './balances';
import { fiscalYearOf, daysInclusive, todayStr } from './dates';

export type LeaveType = 'vacation' | 'sick' | 'personal';

export type PersonRow = {
  id: number;
  blazer_id: string;
  full_name: string;
  email: string;
  is_manager: number;
  manager_id: number | null;
  vacation_tier_years: number;
  sick_carry_in_hours: number;
};

export type RequestRow = {
  id: number;
  person_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  hours_total: number;
  status: 'pending' | 'approved' | 'denied';
  decided_by: number | null;
  decided_at: string | null;
  created_at: string;
  person_name?: string;
};

/** Look up a person by BlazerID, creating their record on first sign-in. */
export async function getOrCreatePerson(profile: {
  preferred_username?: string;
  sub?: string;
  email?: string;
  name?: string;
}): Promise<PersonRow> {
  const db = await getDb();
  await seedIfEmpty();

  const blazerId = (profile.preferred_username || profile.sub || 'unknown').toLowerCase();
  const email = profile.email || `${blazerId}@uab.edu`;
  const fullName = profile.name || `${blazerId.charAt(0).toUpperCase()}${blazerId.slice(1)}`;

  const existing = db.prepare('SELECT * FROM people WHERE blazer_id = ?').get(blazerId) as PersonRow | undefined;
  if (existing) {
    // Keep name/email fresh on each sign-in.
    db.prepare('UPDATE people SET full_name = ?, email = ? WHERE id = ?').run(fullName, email, existing.id);
    return { ...existing, full_name: fullName, email };
  }

  // A brand-new person starts at 0 years of service, no carry-in.
  const res = db
    .prepare(
      'INSERT INTO people (blazer_id, full_name, email, is_manager, manager_id, vacation_tier_years, sick_carry_in_hours) VALUES (?, ?, ?, 0, NULL, 0, 0)'
    )
    .run(blazerId, fullName, email);
  const created = db.prepare('SELECT * FROM people WHERE id = ?').get(Number(res.lastInsertRowid)) as PersonRow;
  return created;
}

export async function listApprovedBetween(start: string, end: string): Promise<(RequestRow & { person_name: string })[]> {
  const db = await getDb();
  await seedIfEmpty();
  const rows = db
    .prepare(
      `SELECT r.*, p.full_name AS person_name
       FROM requests r JOIN people p ON p.id = r.person_id
       WHERE r.status = 'approved' AND r.start_date <= ? AND r.end_date >= ?
       ORDER BY r.start_date`
    )
    .all(end, start) as (RequestRow & { person_name: string })[];
  return rows;
}

export async function listRequestsForPerson(personId: number): Promise<RequestRow[]> {
  const db = await getDb();
  await seedIfEmpty();
  return db
    .prepare('SELECT * FROM requests WHERE person_id = ? ORDER BY start_date DESC')
    .all(personId) as RequestRow[];
}

export async function listTeamRequests(managerId: number): Promise<(RequestRow & { person_name: string })[]> {
  const db = await getDb();
  await seedIfEmpty();
  return db
    .prepare(
      `SELECT r.*, p.full_name AS person_name
       FROM requests r JOIN people p ON p.id = r.person_id
       WHERE p.manager_id = ? ORDER BY
         CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         r.start_date`
    )
    .all(managerId) as (RequestRow & { person_name: string })[];
}

/** Approved hours per type in the current fiscal year, plus pending vacation. */
export async function getUsedHours(personId: number, asOf: string): Promise<UsedHours> {
  const db = await getDb();
  await seedIfEmpty();
  const fy = fiscalYearOf(asOf);
  const fyStart = `${fy}-07-01`;

  // Approved vacation counts against the yearly cap from the moment it
  // is approved — including future-dated time — so "used" here matches
  // what the yearly calendar shows and the cap always holds.
  const approved = db
    .prepare(
      `SELECT leave_type, SUM(hours_total) AS h
       FROM requests
       WHERE person_id = ? AND status = 'approved' AND start_date >= ? AND start_date <= ?
       GROUP BY leave_type`
    )
    .all(personId, fyStart, `${fy + 1}-06-30`) as { leave_type: string; h: number | null }[];

  // Pending vacation reserves against the annual cap from the moment it
  // is submitted — including future-dated requests — so a manager can
  // never approve more vacation than the year allows.
  const pendingVacation = db
    .prepare(
      `SELECT COALESCE(SUM(hours_total), 0) AS h
       FROM requests
       WHERE person_id = ? AND status = 'pending' AND leave_type = 'vacation' AND start_date >= ? AND start_date <= ?
      `
    )
    .get(personId, fyStart, `${fy + 1}-06-30`) as { h: number };

  const byType: UsedHours = { vacation: 0, sick: 0, personal: 0, pendingVacation: 0 };
  for (const row of approved) {
    if (row.leave_type === 'vacation') byType.vacation = row.h || 0;
    else if (row.leave_type === 'sick') byType.sick = row.h || 0;
    else if (row.leave_type === 'personal') byType.personal = row.h || 0;
  }
  byType.pendingVacation = pendingVacation.h || 0;
  return byType;
}

export async function computeBalancesForPerson(person: PersonRow, asOf: string): Promise<Balances> {
  const used = await getUsedHours(person.id, asOf);
  return computeBalances(person, used, asOf);
}

/** Create a request after validating it against the plain-English rules. */
export async function createRequest(
  person: PersonRow,
  input: { leave_type: LeaveType; start_date: string; end_date: string; hours_per_day: number }
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const db = await getDb();
  const { leave_type, start_date, end_date, hours_per_day } = input;

  const fmt = /^\d{4}-\d{2}-\d{2}$/;
  if (!fmt.test(start_date) || !fmt.test(end_date)) {
    return { ok: false, error: 'Please provide valid dates.' };
  }
  if (end_date < start_date) {
    return { ok: false, error: 'The end date must be the same day as or after the start date.' };
  }
  if (!Number.isFinite(hours_per_day) || hours_per_day <= 0 || hours_per_day > HOURS_PER_DAY) {
    return { ok: false, error: `Hours per day must be between 0 and ${HOURS_PER_DAY}.` };
  }

  const days = daysInclusive(start_date, end_date);
  const hoursTotal = hours_total(hours_per_day, days);

  // Vacation: cannot exceed what's left of this year's earned vacation
  // (not counting other pending vacation already reserved).
  if (leave_type === 'vacation') {
    const balances = await computeBalancesForPerson(person, todayStr());
    const remaining = balances.vacation.remaining;
    const requested = hours_total(hours_per_day, days);
    if (requested > remaining) {
      return {
        ok: false,
        error: `That's ${requested} vacation hours, but only ${remaining} are available. Your request would exceed your remaining vacation.`,
      };
    }
  }
  // Sick and personal have no cap check — sick has no maximum, and personal
  // holidays are granted up front with the same reset date shown on the
  // Balances page.

  const res = db
    .prepare(
      `INSERT INTO requests (person_id, leave_type, start_date, end_date, hours_per_day, hours_total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(person.id, leave_type, start_date, end_date, hours_per_day, hoursTotal);
  return { ok: true, id: Number(res.lastInsertRowid) };
}

function hours_total(hours_per_day: number, days: number): number {
  return Math.round(hours_per_day * days * 100) / 100;
}

export async function decideRequest(
  requestId: number,
  decision: 'approved' | 'denied',
  decider: PersonRow
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId) as
    | (RequestRow & { person_name?: string })
    | undefined;
  if (!row) return { ok: false, error: 'Request not found.' };
  if (row.status !== 'pending') return { ok: false, error: 'That request was already decided.' };

  if (decision === 'approved') {
    // Re-check the vacation cap at approval time, in case balances moved.
    if (row.leave_type === 'vacation') {
      const person = db.prepare('SELECT * FROM people WHERE id = ?').get(row.person_id) as PersonRow;
      const balances = await computeBalancesForPerson(person, row.start_date);
      if (balances.vacation.remaining < row.hours_total) {
        return { ok: false, error: `Approving this would exceed ${person.full_name}'s vacation hours. Deny it or leave it pending.` };
      }
    }
  }

  db.prepare(
    "UPDATE requests SET status = ?, decided_by = ?, decided_at = datetime('now') WHERE id = ?"
  ).run(decision, decider.id, requestId);
  return { ok: true };
}

/** Simulated fiscal-year rollover: run the year-end vacation→sick rollover. */
export async function runYearEndRollover(
  personId: number,
  unusedVacationHours: number
): Promise<number> {
  const db = await getDb();
  const carry = rolloverVacationToSick(unusedVacationHours);
  db.prepare('UPDATE people SET sick_carry_in_hours = ? WHERE id = ?').run(carry, personId);
  return carry;
}
