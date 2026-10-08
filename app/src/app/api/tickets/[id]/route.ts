import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getTicketById, updateTicketState, executeCalculateTicketPrice, createComment } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await getTicketById(parseInt(id));
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  const dynamicPrice = await executeCalculateTicketPrice(parseInt(id));
  return NextResponse.json({ ticket: { ...ticket, ticket_total_price: dynamicPrice } });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Obsah komentáře je povinný' }, { status: 400 });
    }
    const comment = await createComment(
      parseInt(id),
      session?.userId || 1,
      content.trim()
    );
    revalidatePath('/', 'layout');
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { state } = await req.json();
  if (state) {
    await updateTicketState(parseInt(id), state);
  }
  revalidatePath('/', 'layout');
  const updated = await getTicketById(parseInt(id));
  return NextResponse.json({ ticket: updated });
}

