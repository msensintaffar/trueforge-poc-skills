import { NextResponse } from 'next/server';
import { listApprovedBetween } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/calendar?year=2026 → everyone's approved time off for that year. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const yearParam = Number(url.searchParams.get('year'));
  const year = Number.isInteger(yearParam) && yearParam > 1970 ? yearParam : new Date().getUTCFullYear();

  const entries = await listApprovedBetween(`${year}-01-01`, `${year}-12-31`);
  return NextResponse.json({ year, entries });
}
