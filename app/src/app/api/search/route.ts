import { NextResponse } from 'next/server';
import { getProjects, getTickets, getMilestones } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const [projects, tickets, milestones] = await Promise.all([
    getProjects(),
    getTickets(),
    getMilestones()
  ]);

  const items: any[] = [];

  // Match projects
  for (const p of projects) {
    if (
      p.project_name.toLowerCase().includes(q) ||
      p.project_key?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ) {
      items.push({
        type: 'project',
        title: p.project_name,
        subtitle: `Klíč: ${p.project_key} | Rozpočet: ${p.budget} ${p.currency}`,
        url: `/projects/${p.project_key}/issues`
      });
    }
  }

  // Match tickets
  for (const t of tickets) {
    if (
      t.name.toLowerCase().includes(q) ||
      t.ticket_code?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    ) {
      items.push({
        type: 'ticket',
        title: `[${t.ticket_code}] ${t.name}`,
        subtitle: `Stav: ${t.state} | Priorita: ${t.priority} | Přiřazeno: ${t.assignee_name}`,
        url: `/projects/${t.project_key}/issues/${t.ticket_id}`
      });
    }
  }

  // Match milestones
  for (const m of milestones) {
    if (m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)) {
      items.push({
        type: 'milestone',
        title: m.title,
        subtitle: `Projekt: ${m.project_name} | Termín: ${m.due_date}`,
        url: `/projects/${m.project_key}/milestones`
      });
    }
  }

  return NextResponse.json({ items: items.slice(0, 10) });
}

