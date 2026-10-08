'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { TimeDurationInput } from '@/components/time/time-duration-input';

interface AddTimesheetModalProps {
  tickets: any[];
}

export function AddTimesheetModal({ tickets }: AddTimesheetModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState(tickets[0]?.ticket_id?.toString() || '');
  const [hours, setHours] = useState('2.00');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = parseInt(ticketId);
    const hoursNum = parseFloat(hours);
    if (!tId || !hoursNum || hoursNum <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: tId,
          work_hours: hoursNum,
          work_date: workDate,
          work_description: description,
          billable
        })
      });

      if (res.ok) {
        setOpen(false);
        setDescription('');
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
        Vykázat práci
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Nový výkaz odpracovaného času
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              {/* Select Ticket */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Vyberte úkol *</label>
                <select
                  required
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                >
                  {tickets.map((t) => (
                    <option key={t.ticket_id} value={t.ticket_id}>
                      [{t.ticket_code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time duration input with switcher */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Odpracovaný čas *</label>
                <TimeDurationInput
                  value={hours}
                  onChange={setHours}
                  required
                />
              </div>

              {/* Work Date */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Datum vykonání práce</label>
                <Input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Popis práce *</label>
                <Textarea
                  rows={2}
                  required
                  placeholder="Detailní popis odvedené práce..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Billable */}
              <div className="flex items-center gap-2 pt-1 border-t">
                <input
                  type="checkbox"
                  id="timesheet-billable"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  className="rounded border size-3.5"
                />
                <label htmlFor="timesheet-billable" className="font-medium text-foreground cursor-pointer text-xs">
                  Fakturovatelná práce (započítává se do rozpočtu a ceny úkolu)
                </label>
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
                {submitting ? 'Ukládám...' : 'Zapsat výkaz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

