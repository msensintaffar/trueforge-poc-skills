import { NextResponse } from 'next/server';
import { getOrCreatePerson } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * POST /api/people/me  { preferred_username, name, email }
 *
 * Normally the server verifies the Hydra access token itself; this demo
 * build trusts the identity fields the signed-in browser passes along so
 * the app runs locally with no extra setup. A production deployment would
 * validate the bearer token here instead — a step for whoever deploys it.
 */
export async function POST(request: Request) {
  let body: { preferred_username?: string; name?: string; email?: string; sub?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const profile = {
    preferred_username: body.preferred_username || body.sub,
    name: body.name,
    email: body.email,
    sub: body.preferred_username || body.sub,
  };
  const person = await getOrCreatePerson(profile);
  return NextResponse.json(person);
}
