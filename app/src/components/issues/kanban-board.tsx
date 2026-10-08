'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CircleDot,
  Clock,
  CheckCircle2,
  CornerDownRight,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface KanbanBoardProps {
  tickets: any[];
  projectKey: string;
}

const COLUMNS = [
  { id: 'New', title: 'Nové (New)', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'In Progress', title: 'V řešení (In Progress)', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'Resolved', title: 'Vyřešeno (Resolved)', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'Closed', title: 'Uzavřeno (Closed)', color: 'border-zinc-500/30 bg-zinc-500/5' }
];

export function KanbanBoard({ tickets, projectKey }: KanbanBoardProps) {
  const router = useRouter();

  const handleStateChange = async (ticketId: number, newState: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.state === col.id);

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-xl border ${col.color} p-3 min-h-[480px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b">
              <span className="text-xs font-semibold text-foreground">
                {col.title}
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-mono font-medium border text-muted-foreground shadow-2xs">
                {colTickets.length}
              </span>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-2.5 flex-1">
              {colTickets.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-[11px] text-muted-foreground/60 border border-dashed rounded-lg">
                  Žádné úkoly
                </div>
              ) : (
                colTickets.map((ticket) => (
                  <Card
                    key={ticket.ticket_id}
                    className="p-3 text-xs bg-card hover:border-primary/50 transition-all shadow-xs space-y-2 group"
                  >
                    {/* Top Row: Code & Priority */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                        {ticket.ticket_code}
                      </span>

                      {ticket.priority === 'Critical' ? (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                          Kritická
                        </Badge>
                      ) : ticket.priority === 'High' ? (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-300">
                          Vysoká
                        </Badge>
                      ) : null}
                    </div>

                    {/* Title */}
                    <Link
                      href={`/projects/${projectKey}/issues/${ticket.ticket_id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline line-clamp-2 block leading-snug"
                    >
                      {ticket.name}
                    </Link>

                    {/* Sub-issue indicator */}
                    {ticket.parent_ticket_id && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CornerDownRight className="size-3 text-primary" />
                        <span>Podúkol</span>
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
                      <span className="truncate max-w-[100px]">
                        {ticket.assignee_name || 'Nepřiřazeno'}
                      </span>

                      <div className="flex items-center gap-2 font-mono">
                        <span className="flex items-center gap-0.5">
                          <Clock className="size-2.5" />
                          {ticket.logged_hours || 0}h
                        </span>

                        {ticket.ticket_total_price > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {ticket.ticket_total_price.toLocaleString()} Kč
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Move dropdown */}
                    <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <select
                        className="text-[10px] rounded border bg-background px-1.5 py-0.5"
                        value={ticket.state}
                        onChange={(e) => handleStateChange(ticket.ticket_id, e.target.value)}
                      >
                        <option value="New">Přesunout: Nové</option>
                        <option value="In Progress">V řešení</option>
                        <option value="Resolved">Vyřešeno</option>
                        <option value="Closed">Uzavřeno</option>
                      </select>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

