import { NextResponse } from 'next/server';
import { getAppConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getAppConfig();
  return NextResponse.json({ status: 'ok', app: cfg.appName });
}
