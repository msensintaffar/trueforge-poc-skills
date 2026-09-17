import { NextResponse } from 'next/server';
import { getOrCreatePerson, decideRequest } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * POST /api/requests/:id  { decision: 'approved' | 'denied', sub: <manager blazerid> }
 * Manager-only action: approve or deny a pending team request.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) {
    return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 });
  }

  let body: { decision?: string; sub?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.sub) return NextResponse.json({ error: 'Missing sub (BlazerID).' }, { status: 400 });
  if (body.decision !== 'approved' && body.decision !== 'denied') {
    return NextResponse.json({ error: 'Decision must be approved or denied.' }, { status: 400 });
  }

  const manager = await getOrCreatePerson({ preferred_username: body.sub });
  if (!manager.is_manager) {
    return NextResponse.json({ error: 'Only managers can decide requests.' }, { status: 403 });
  }

  const result = await decideRequest(requestId, body.decision, manager);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
