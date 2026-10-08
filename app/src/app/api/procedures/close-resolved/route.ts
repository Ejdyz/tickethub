import { NextResponse } from 'next/server';
import { executeCloseResolvedTickets } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    const result = await executeCloseResolvedTickets(session?.userId || 1);
    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

