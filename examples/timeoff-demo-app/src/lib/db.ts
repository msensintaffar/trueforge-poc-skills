// Local data storage — a SQLite database file created automatically on
// first use at ./.data/local.db. Uses Node's BUILT-IN node:sqlite module,
// so there is no dependency to install and nothing to configure.
//
// If this app is later deployed somewhere permanent and needs a hosted
// database, this file is the single place a developer swaps that out —
// everything else in the app talks to the helpers below.

import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import {
  HOURS_PER_DAY,
  vacationDaysPerYear,
  rolloverVacationToSick,
  personalAllowanceHours,
} from './balances';

let _db: DatabaseSync | null = null;

export async function getDb(): Promise<DatabaseSync> {
  if (_db) return _db;

  const { DatabaseSync: Sqlite } = await import('node:sqlite');

  const dataDir = path.join(process.cwd(), '.data');
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Sqlite(path.join(dataDir, 'local.db'));
  db.exec('PRAGMA journal_mode = WAL;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      blazer_id     TEXT NOT NULL UNIQUE,
      full_name     TEXT NOT NULL,
      email         TEXT NOT NULL,
      is_manager    INTEGER NOT NULL DEFAULT 0,
      manager_id    INTEGER REFERENCES people(id),
      vacation_tier_years INTEGER NOT NULL DEFAULT 0,
      sick_carry_in_hours REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS requests (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id   INTEGER NOT NULL REFERENCES people(id),
      leave_type  TEXT NOT NULL CHECK (leave_type IN ('vacation','sick','personal')),
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      hours_per_day REAL NOT NULL,
      hours_total REAL NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
      decided_by  INTEGER REFERENCES people(id),
      decided_at  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_requests_person ON requests(person_id);
    CREATE TABLE IF NOT EXISTS schema_notes (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);

  _db = db;
  return db;
}

/**
 * First-run sample data, clearly labeled demo records (names are obviously
 * generic). Gives managers requests to review and the calendar entries to
 * show. Safe to delete rows from the requests table — the app recreates
 * nothing; this only runs when the people table is empty.
 */
export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();
  const count = db.prepare('SELECT COUNT(*) AS n FROM people').get() as { n: number };
  if (count.n > 0) return;

  const insertPerson = db.prepare(
    `INSERT INTO people (blazer_id, full_name, email, is_manager, manager_id, vacation_tier_years, sick_carry_in_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertRequest = db.prepare(
    `INSERT INTO requests (person_id, leave_type, start_date, end_date, hours_per_day, hours_total, status, decided_by, decided_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seed = () => {
    const fy = currentFiscalYearStartYear();
    const manager = insertPerson.run('steven', 'Steven', 'still@uab.edu', 1, null, 18, rolloverVacationToSick(14));
    const stevenId = Number(manager.lastInsertRowid);

    const dana = insertPerson.run('dana', 'Dana (demo)', 'dana.demo@uab.edu', 0, stevenId, 6, rolloverVacationToSick(4));
    const danaId = Number(dana.lastInsertRowid);
    const marcus = insertPerson.run('marcus', 'Marcus (demo)', 'marcus.demo@uab.edu', 0, stevenId, 2, rolloverVacationToSick(10));
    const marcusId = Number(marcus.lastInsertRowid);
    const priya = insertPerson.run('priya', 'Priya (demo)', 'priya.demo@uab.edu', 0, stevenId, 21, rolloverVacationToSick(22));
    const priyaId = Number(priya.lastInsertRowid);

    // A spread of statuses so every screen has something to show.
    // fy = the year this fiscal year started (July 1). Samples:
    //   - a few approved stretches in the recent past (so "used" is nonzero),
    //   - approved time early next January (shows on the calendar),
    //   - three pending requests for the manager to review,
    //   - one denied request for history.
    const past = (m: number, d: string) => `${fy}-${String(m).padStart(2, '0')}-${d}`;
    const nextJan = (d: string) => `${fy + 1}-01-${d}`;
    const nextFeb = (d: string) => `${fy + 1}-02-${d}`;

    insertRequest.run(stevenId, 'vacation', past(8, '03'), past(8, '07'), HOURS_PER_DAY, 5 * HOURS_PER_DAY, 'approved', null, past(8, '01') + ' 09:00:00');
    insertRequest.run(danaId, 'vacation', past(9, '14'), past(9, '14'), HOURS_PER_DAY, HOURS_PER_DAY, 'approved', stevenId, past(9, '02') + ' 10:00:00');
    insertRequest.run(marcusId, 'sick', past(9, '14'), past(9, '15'), HOURS_PER_DAY, 2 * HOURS_PER_DAY, 'approved', stevenId, past(9, '03') + ' 09:00:00');
    insertRequest.run(priyaId, 'personal', past(9, '15'), past(9, '15'), HOURS_PER_DAY, HOURS_PER_DAY, 'approved', stevenId, past(9, '03') + ' 14:30:00');
    insertRequest.run(danaId, 'vacation', nextJan('12'), nextJan('12'), HOURS_PER_DAY, HOURS_PER_DAY, 'approved', stevenId, past(12, '20') + ' 11:00:00');
    insertRequest.run(priyaId, 'personal', nextJan('19'), nextJan('19'), HOURS_PER_DAY, HOURS_PER_DAY, 'approved', stevenId, past(12, '20') + ' 14:30:00');
    insertRequest.run(danaId, 'vacation', nextFeb('03'), nextFeb('07'), HOURS_PER_DAY, 5 * HOURS_PER_DAY, 'pending', null, null);
    insertRequest.run(marcusId, 'vacation', nextFeb('04'), nextFeb('08'), HOURS_PER_DAY, 5 * HOURS_PER_DAY, 'pending', null, null);
    insertRequest.run(priyaId, 'sick', nextFeb('10'), nextFeb('11'), HOURS_PER_DAY, 2 * HOURS_PER_DAY, 'pending', null, null);
    insertRequest.run(danaId, 'personal', nextJan('17'), nextJan('17'), HOURS_PER_DAY, HOURS_PER_DAY, 'denied', stevenId, nextJan('05') + ' 08:00:00');
  };
  seed();
}

/** The fiscal year (personal-holiday year) the CURRENT date falls in. */
function currentFiscalYearStartYear(): number {
  const now = new Date();
  return now.getUTCMonth() + 1 >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}
