import { NextResponse } from 'next/server';
import { getOrCreatePerson, listRequestsForPerson, createRequest, type LeaveType } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/requests?sub=<blazerid>  → this person's requests
 * POST /api/requests  → submit a new request
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sub = url.searchParams.get('sub') || '';
  if (!sub) return NextResponse.json({ error: 'Missing sub (BlazerID).' }, { status: 400 });

  const person = await getOrCreatePerson({ preferred_username: sub });
  const requests = await listRequestsForPerson(person.id);
  return NextResponse.json({ person, requests });
}

export async function POST(request: Request) {
  let body: { sub?: string; leave_type?: LeaveType; start_date?: string; end_date?: string; hours_per_day?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.sub) return NextResponse.json({ error: 'Missing sub (BlazerID).' }, { status: 400 });
  if (!body.leave_type || !['vacation', 'sick', 'personal'].includes(body.leave_type)) {
    return NextResponse.json({ error: 'Choose a valid time-off type.' }, { status: 400 });
  }

  const person = await getOrCreatePerson({ preferred_username: body.sub });
  const result = await createRequest(person, {
    leave_type: body.leave_type,
    start_date: String(body.start_date || ''),
    end_date: String(body.end_date || ''),
    hours_per_day: Number(body.hours_per_day),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const requests = await listRequestsForPerson(person.id);
  return NextResponse.json({ ok: true, id: result.id, requests }, { status: 201 });
}
