import { NextResponse } from 'next/server';
import { getOrCreatePerson, computeBalancesForPerson } from '@/lib/queries';
import { todayStr } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/** GET /api/balances?sub=<blazerid> → this person's balances as of today. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sub = url.searchParams.get('sub') || '';
  if (!sub) return NextResponse.json({ error: 'Missing sub (BlazerID).' }, { status: 400 });

  const person = await getOrCreatePerson({ preferred_username: sub });
  const balances = await computeBalancesForPerson(person, todayStr());
  return NextResponse.json({ person, balances });
}
