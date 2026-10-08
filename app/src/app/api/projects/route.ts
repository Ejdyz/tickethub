import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const created = await createProject(data);
    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

