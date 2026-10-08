'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface BudgetTransferModalProps {
  currentProject: any;
  allProjects: any[];
}

export function BudgetTransferModal({
  currentProject,
  allProjects
}: BudgetTransferModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const otherProjects = allProjects.filter((p) => p.project_id !== currentProject.project_id);
  const [targetId, setTargetId] = useState(otherProjects[0]?.project_id?.toString() || '');
  const [amount, setAmount] = useState('25000');
  const [note, setNote] = useState('Převod rozpočtu');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(amount);
    const tId = parseInt(targetId);

    if (!amountNum || amountNum <= 0 || !tId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/budget/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProjectId: currentProject.project_id,
          targetProjectId: tId,
          amount: amountNum,
          note
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(data.error || 'Převod se nezdařil');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba sítě');
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
        <ArrowRightLeft className="size-3.5" />
        Převést rozpočet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-primary" />
                Auditovaný převod rozpočtu
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <p className="text-muted-foreground">
                Převod financí z projektu <strong>{currentProject.project_name}</strong> na jiný projekt pomocí uložené procedury <code>pr_transfer_project_budget_v2</code>.
              </p>

              {error && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Cílový projekt *</label>
                <select
                  required
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  {otherProjects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      [{p.project_key}] {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Částka (CZK) *</label>
                <Input
                  type="number"
                  step="1000"
                  min="1000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Poznámka / Důvod převodu</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="např. Přerozdělení kapacit pro sprint 3"
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
                {submitting ? 'Provádím proceduru...' : 'Provést převod'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

