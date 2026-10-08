import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getTickets, createTicket } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const tickets = await getTickets(projectId ? parseInt(projectId) : undefined);
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const created = await createTicket(data);
    revalidatePath('/', 'layout');
    return NextResponse.json({ ticket: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

