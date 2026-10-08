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

export function CreateProjectModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    project_key: '',
    description: '',
    budget: '150000',
    github_repo_url: '',
    default_hourly_rate: '850'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget: parseFloat(form.budget) || 100000,
          default_hourly_rate: parseFloat(form.default_hourly_rate) || 750
        })
      });
      if (res.ok) {
        setOpen(false);
        setForm({
          name: '',
          project_key: '',
          description: '',
          budget: '150000',
          github_repo_url: '',
          default_hourly_rate: '850'
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
        className="text-xs gap-1.5 shadow-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        Nový projekt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Vytvořit nový projekt
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Název projektu *</label>
                <Input
                  required
                  placeholder="např. E-Commerce Mobilní Aplikace"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Klíč projektu (Prefix) *</label>
                  <Input
                    required
                    placeholder="např. MOB"
                    value={form.project_key}
                    onChange={(e) => setForm({ ...form, project_key: e.target.value.toUpperCase() })}
                    className="font-mono text-xs uppercase"
                  />
                  <p className="text-[10px] text-muted-foreground">Kód tiketů (např. MOB-1, MOB-2)</p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Výchozí sazba (CZK/h)</label>
                  <Input
                    type="number"
                    step="50"
                    value={form.default_hourly_rate}
                    onChange={(e) => setForm({ ...form, default_hourly_rate: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Popis projektu</label>
                <Textarea
                  rows={2}
                  placeholder="Stručný popis cílů a rozsahu projektu..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">GitHub Repozitář (URL)</label>
                <Input
                  placeholder="https://github.com/org/repo"
                  value={form.github_repo_url}
                  onChange={(e) => setForm({ ...form, github_repo_url: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Počáteční rozpočet (CZK)</label>
                <Input
                  type="number"
                  step="10000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="text-xs"
                />
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
                {submitting ? 'Vytvářím...' : 'Vytvořit projekt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

