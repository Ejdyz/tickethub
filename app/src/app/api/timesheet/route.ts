import { NextResponse } from 'next/server';
import { getTimesheet, createWorkReport } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const timesheet = await getTimesheet(userId ? parseInt(userId) : undefined);
  return NextResponse.json({ timesheet });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const data = await req.json();
    const created = await createWorkReport({
      ticket_id: data.ticket_id,
      user_id: data.user_id || session?.userId || 1,
      work_hours: parseFloat(data.work_hours),
      work_description: data.work_description || '',
      work_date: data.work_date,
      hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
      billable: data.billable ?? true
    });
    return NextResponse.json({ report: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

