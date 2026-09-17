// The automatic time-off balance engine.
//
// Plain-English rules (from the project plan):
//   Vacation — earned every month; a bit faster for people with 15+ years
//   of service, a bit slower for everyone else — up to a yearly maximum.
//   Leftover vacation at year's end rolls into sick time instead of being
//   lost (converted at half value).
//   Sick — earned every month at the same rate for everyone, no maximum.
//   Personal holidays — a fixed handful each year, resetting every July 1.
//
// All figures are in HOURS (a full day = 8 hours), matching how requests
// are entered. Pure functions only — no database access here, so the
// accrual rules are easy to read and unit-test later.

export const HOURS_PER_DAY = 8;

// Vacation: 12 days/year normally, 14 days/year at 15+ years of service,
// capped at 20 unused days per year.
export const VACATION_DAYS_PER_YEAR = 12;
export const VACATION_DAYS_PER_YEAR_15_PLUS = 14;
export const VACATION_SERVICE_THRESHOLD_YEARS = 15;
export const VACATION_CAP_DAYS = 20;

// Sick: 8 days/year at the same rate for everyone, no cap.
export const SICK_DAYS_PER_YEAR = 8;

// Personal holidays: 3 days per fiscal year, reset every July 1.
export const PERSONAL_HOLIDAY_DAYS_PER_YEAR = 3;

// Year-end rollover: unused vacation converts to sick time at half value.
export const ROLLOVER_CONVERSION_RATE = 0.5;

export function vacationDaysPerYear(tierYears: number): number {
  return tierYears >= VACATION_SERVICE_THRESHOLD_YEARS
    ? VACATION_DAYS_PER_YEAR_15_PLUS
    : VACATION_DAYS_PER_YEAR;
}

export function vacationHoursCap(): number {
  return VACATION_CAP_DAYS * HOURS_PER_DAY;
}

export function personalAllowanceHours(): number {
  return PERSONAL_HOLIDAY_DAYS_PER_YEAR * HOURS_PER_DAY;
}

/**
 * Unused vacation hours at fiscal-year end → sick hours carried in.
 * Half value, rounded to the nearest half hour. Returns 0 for
 * negative or absent inputs.
 */
export function rolloverVacationToSick(leftoverVacationHours: number | null | undefined): number {
  if (leftoverVacationHours == null || leftoverVacationHours <= 0) return 0;
  return Math.round(leftoverVacationHours * ROLLOVER_CONVERSION_RATE * 2) / 2;
}

export type BalanceLine = {
  earned: number;
  used: number; // approved time off in this fiscal year
  pending: number; // reserved by requests awaiting review
  remaining: number; // earned − used − pending
};

export type Balances = {
  fiscalYear: number;
  fiscalYearLabel: string;
  vacation: BalanceLine;
  sick: BalanceLine;
  personal: BalanceLine;
  personalResetsOn: string;
  vacationTierYears: number;
  vacationYearCapHours: number;
  carriedIntoSickHours: number; // from last year's unused vacation
};

export type UsedHours = {
  vacation: number;
  sick: number;
  personal: number;
  pendingVacation: number;
};

/**
 * Compute one person's balances as of a date (defaults to today).
 * `sick_carry_in_hours` is sick time already rolled in from the previous
 * fiscal year's unused vacation (computed at seed/renewal time).
 */
export function computeBalances(
  person: { vacation_tier_years: number; sick_carry_in_hours?: number | null },
  used: UsedHours,
  asOf: string
): Balances {
  const [y, m] = asOf.split('-').map(Number);
  const fy = m >= 7 ? y : y - 1;
  const months = Math.max(1, (y - fy) * 12 + (m - 7) + 1);

  const vacationMonthlyHours = (vacationDaysPerYear(person.vacation_tier_years) * HOURS_PER_DAY) / 12;
  const sickMonthlyHours = (SICK_DAYS_PER_YEAR * HOURS_PER_DAY) / 12;

  // Round to 2 decimals to avoid floating-point noise.
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const vacationEarned = Math.min(r2(vacationMonthlyHours * months), vacationHoursCap());
  const sickEarned = r2(sickMonthlyHours * months + (person.sick_carry_in_hours || 0));
  const personalEarned = personalAllowanceHours();

  const line = (earned: number, usedH: number, pendingH: number): BalanceLine => ({
    earned: r2(earned),
    used: r2(usedH),
    pending: r2(pendingH),
    remaining: r2(earned - usedH - pendingH),
  });

  return {
    fiscalYear: fy,
    fiscalYearLabel: `${fy}–${String((fy + 1) % 100).padStart(2, '0')}`,
    vacation: line(vacationEarned, used.vacation, used.pendingVacation),
    sick: line(sickEarned, used.sick, 0),
    personal: line(personalEarned, used.personal, 0),
    personalResetsOn: `${fy + 1}-07-01`,
    vacationTierYears: person.vacation_tier_years,
    vacationYearCapHours: vacationHoursCap(),
    carriedIntoSickHours: person.sick_carry_in_hours || 0,
  };
}
