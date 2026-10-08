import { NextResponse } from 'next/server';
import { executeTransferBudget } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { sourceProjectId, targetProjectId, amount, note } = await req.json();

    if (!sourceProjectId || !targetProjectId || !amount) {
      return NextResponse.json({ error: 'Source project, target project, and amount are required' }, { status: 400 });
    }

    const result = await executeTransferBudget(
      parseInt(sourceProjectId),
      parseInt(targetProjectId),
      parseFloat(amount),
      session?.userId || 1,
      note || 'Inter-project budget transfer'
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

