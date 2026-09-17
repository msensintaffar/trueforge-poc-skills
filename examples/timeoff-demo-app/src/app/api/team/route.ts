import { NextResponse } from 'next/server';
import { getOrCreatePerson, listTeamRequests } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/team?sub=<manager blazerid> → pending + decided team requests. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sub = url.searchParams.get('sub') || '';
  if (!sub) return NextResponse.json({ error: 'Missing sub (BlazerID).' }, { status: 400 });

  const manager = await getOrCreatePerson({ preferred_username: sub });
  const requests = await listTeamRequests(manager.id);
  return NextResponse.json({ isManager: Boolean(manager.is_manager), requests });
}
