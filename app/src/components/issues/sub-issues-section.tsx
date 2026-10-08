'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CornerDownRight,
  Plus,
  CheckCircle2,
  CircleDot,
  Clock,
  DollarSign,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SubIssuesSectionProps {
  parentTicket: any;
  subTickets: any[]; // Recursive tree of descendants with `depth: number` (1, 2, 3, 4, 5...)
  projectKey: string;
}

export function SubIssuesSection({
  parentTicket,
  subTickets,
  projectKey
}: SubIssuesSectionProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(subTickets);
  const [showModal, setShowModal] = useState(false);
  const [targetParent, setTargetParent] = useState<any>(parentTicket);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    ticket_type: 'Task',
    estimated_hours: '4.0'
  });

  // Sync items when subTickets prop changes
  useEffect(() => {
    setItems(subTickets);
  }, [subTickets]);

  const total = items.length;
  const completed = items.filter(
    (t) => t.state === 'Closed' || t.state === 'Resolved'
  ).length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const maxDepth = items.reduce((max, t) => Math.max(max, t.depth || 1), 0);

  const handleOpenModal = (ticket: any = parentTicket) => {
    setTargetParent(ticket || parentTicket);
    setError(null);
    setShowModal(true);
  };

  const handleCreateSubIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const parentIdToUse = targetParent?.ticket_id || parentTicket.ticket_id;
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          priority: form.priority,
          ticket_type: form.ticket_type,
          project_id: parentTicket.project_id,
          parent_ticket_id: parentIdToUse,
          estimated_hours: parseFloat(form.estimated_hours) || 0
        })
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        // Calculate new depth relative to parent
        const parentDepth = (targetParent?.ticket_id === parentTicket.ticket_id) ? 0 : (targetParent?.depth || 1);
        const newTicketWithDepth = {
          ...data.ticket,
          depth: parentDepth + 1
        };

        // Instantly update items in the UI so the user sees it immediately
        setItems(prev => [...prev, newTicketWithDepth]);
        setShowModal(false);
        setForm({
          name: '',
          description: '',
          priority: 'Medium',
          ticket_type: 'Task',
          estimated_hours: '4.0'
        });
        router.refresh();
      } else {
        setError(data.error || 'Chyba při vytváření podúkolu.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba sítě.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDepthBadge = (depth: number) => {
    switch (depth) {
      case 1:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/40 text-blue-600 dark:text-blue-400">1. úroveň</Badge>;
      case 2:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/40 text-indigo-600 dark:text-indigo-400">2. úroveň</Badge>;
      case 3:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-500/40 text-purple-600 dark:text-purple-400">3. úroveň</Badge>;
      case 4:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-pink-500/40 text-pink-600 dark:text-pink-400">4. úroveň</Badge>;
      case 5:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400">5. úroveň</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-zinc-500/40">{depth}. úroveň</Badge>;
    }
  };

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Layers className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Hierarchický strom podúkolů (Sub-issues Tree)
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-mono">
            {completed}/{total} hotovo
          </Badge>
          {maxDepth > 1 && (
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              Zanoření: {maxDepth} úrovní
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={() => handleOpenModal(parentTicket)}
        >
          <Plus className="size-3" />
          Přidat podúkol
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* Progress bar */}
        {total > 0 && (
          <div className="w-full bg-muted h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {total === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <p>Tento úkol zatím nemá žádné vnořené podúkoly.</p>
            <Button
              variant="link"
              size="sm"
              className="text-xs text-primary mt-1"
              onClick={() => handleOpenModal(parentTicket)}
            >
              + Vytvořit první podúkol (1. úroveň)
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((sub) => {
              const depth = sub.depth || 1;
              const isDone = sub.state === 'Closed' || sub.state === 'Resolved';
              // Indentation calculation based on depth
              const indentPadding = Math.min(64, (depth - 1) * 18);

              return (
                <div
                  key={sub.ticket_id}
                  style={{ paddingLeft: `${12 + indentPadding}px` }}
                  className="p-3 text-xs hover:bg-muted/30 transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    {/* Visual tree connector */}
                    {depth > 1 ? (
                      <span className="text-muted-foreground/60 font-mono text-xs select-none shrink-0">
                        ↳
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 font-mono text-xs select-none shrink-0">
                        •
                      </span>
                    )}

                    {/* Status icon */}
                    {isDone ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <CircleDot className="size-3.5 text-blue-500 shrink-0" />
                    )}

                    {/* Depth Badge */}
                    {getDepthBadge(depth)}

                    {/* Ticket Code */}
                    <span className="font-mono text-muted-foreground shrink-0 text-[11px]">
                      {sub.ticket_code || `#${sub.ticket_id}`}
                    </span>

                    {/* Clickable link to open the sub-issue */}
                    <Link
                      href={`/projects/${projectKey}/issues/${sub.ticket_id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline truncate"
                      title={sub.name}
                    >
                      {sub.name}
                    </Link>

                    {sub.priority === 'Critical' && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
                        Kritická
                      </Badge>
                    )}
                  </div>

                  {/* Actions & Metadata */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
                      {sub.logged_hours || 0}h / {sub.estimated_hours || 0}h
                    </span>

                    <Badge
                      variant={isDone ? 'secondary' : 'outline'}
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {sub.state}
                    </Badge>

                    {/* Button to add a sub-sub-task under THIS specific sub-task */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                      onClick={() => handleOpenModal(sub)}
                      title={`Přidat podúkol pod ${sub.ticket_code}`}
                    >
                      <Plus className="size-2.5" />
                      + Podúkol
                    </Button>

                    <Link
                      href={`/projects/${projectKey}/issues/${sub.ticket_id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium hover:underline text-[11px]"
                    >
                      Otevřít →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal for creating sub-issue (at any level) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubIssue}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <CornerDownRight className="size-4 text-primary" />
                Nový podúkol pod {targetParent.ticket_code}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              {error && (
                <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-2.5 rounded-lg border bg-muted/30 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Nadřazený úkol
                </span>
                <p className="font-semibold text-foreground truncate">
                  [{targetParent.ticket_code}] {targetParent.name}
                </p>
                <p className="text-[10px] text-primary">
                  Nový úkol bude zařazen jako dílčí podúkol další úrovně ({((targetParent.depth || 0) + 1)}. úroveň).
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Název podúkolu *</label>
                <Input
                  required
                  placeholder="např. Implementovat ověřování tokenů"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Popis</label>
                <Textarea
                  rows={2}
                  placeholder="Specifikace dílčího úkolu..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Priorita</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Low">Nízká</option>
                    <option value="Medium">Střední</option>
                    <option value="High">Vysoká</option>
                    <option value="Critical">Kritická</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Odhad (hodiny)</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.estimated_hours}
                    onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Vytvářím...' : 'Vytvořit podúkol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
