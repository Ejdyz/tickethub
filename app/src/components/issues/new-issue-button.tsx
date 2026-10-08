'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NewIssueButtonProps {
  projectId: number;
  projectKey: string;
}

export function NewIssueButton({ projectId, projectKey }: NewIssueButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    ticket_type: 'Issue',
    estimated_hours: '8.0'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          project_id: projectId,
          estimated_hours: parseFloat(form.estimated_hours) || 0
        })
      });
      if (res.ok) {
        setOpen(false);
        setForm({
          name: '',
          description: '',
          priority: 'Medium',
          ticket_type: 'Issue',
          estimated_hours: '8.0'
        });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        className="text-xs gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        Nový úkol
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Plus className="size-4 text-emerald-500" />
                Nový úkol pro projekt {projectKey}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Název úkolu *</label>
                <Input
                  required
                  placeholder="např. Optimalizovat SQL dotazy v přehledu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Detailní popis</label>
                <Textarea
                  rows={3}
                  placeholder="Popište cíl úkolu, požadavky a kroky k realizaci..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Typ</label>
                  <select
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs shadow-xs"
                    value={form.ticket_type}
                    onChange={(e) => setForm({ ...form, ticket_type: e.target.value })}
                  >
                    <option value="Issue">Issue</option>
                    <option value="Feature">Feature</option>
                    <option value="Bug">Bug</option>
                    <option value="Task">Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Priorita</label>
                  <select
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs shadow-xs"
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
                  <label className="font-semibold text-foreground">Odhad (h)</label>
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
                onClick={() => setOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Vytvářím...' : 'Vytvořit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

