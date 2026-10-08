'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TimeDurationInput } from '@/components/time/time-duration-input';

interface LogTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  ticketCode: string;
}

export function LogTimeModal({
  open,
  onOpenChange,
  ticketId,
  ticketCode
}: LogTimeModalProps) {
  const router = useRouter();
  const [hours, setHours] = useState('2.00');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hours);
    if (!hoursNum || hoursNum <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          work_hours: hoursNum,
          work_description: description,
          billable
        })
      });

      if (res.ok) {
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Vykázat čas na {ticketCode}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Odpracovaný čas *
              </label>
              <TimeDurationInput
                value={hours}
                onChange={setHours}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Podporuje libovolné desetinné číslo (např. 1.99 nebo 2.0) nebo přepnutí na hodiny a minuty.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Popis odvedené práce *
              </label>
              <Textarea
                rows={3}
                required
                placeholder="Detailní popis vykonané činnosti na úkolu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 border-t">
              <input
                type="checkbox"
                id="modal-billable"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="rounded border size-3.5"
              />
              <label htmlFor="modal-billable" className="font-medium text-foreground cursor-pointer text-xs">
                Fakturovatelná práce (započítává se do rozpočtu a ceny úkolu)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Zrušit
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Ukládám...' : 'Zapsat čas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

