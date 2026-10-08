'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Check } from 'lucide-react';
import { useTimer } from '@/components/providers/timer-provider';
import { useI18n } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TimeDurationInput } from '@/components/time/time-duration-input';

export function TimerWidget() {
  const { isRunning, formattedTime, seconds, activeTicketId, activeTicketName, pauseTimer, resumeTimer, resetTimer } = useTimer();
  const { t } = useI18n();
  const [showLogModal, setShowLogModal] = useState(false);
  const [hours, setHours] = useState('0.50');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeTicketId && seconds === 0) {
    return null;
  }

  const handleOpenModal = () => {
    pauseTimer();
    const calculatedHours = Math.max(0.05, +(seconds / 3600).toFixed(2));
    setHours(calculatedHours.toFixed(2));
    setShowLogModal(true);
  };

  const handleSaveLog = async () => {
    if (!activeTicketId) return;
    const hoursNum = parseFloat(hours);
    if (!hoursNum || hoursNum <= 0) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: activeTicketId,
          work_hours: hoursNum,
          work_description: description || `Práce na úkolu ${activeTicketName}`,
          billable: true
        })
      });
      resetTimer();
      setShowLogModal(false);
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 shadow-sm backdrop-blur">
        <Clock className={`size-3.5 ${isRunning ? 'animate-pulse text-amber-500' : 'text-muted-foreground'}`} />
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
          {formattedTime}
        </span>
        {activeTicketName && (
          <span className="max-w-[120px] truncate text-xs text-muted-foreground sm:max-w-[180px]">
            {activeTicketName}
          </span>
        )}

        <div className="flex items-center gap-1">
          {isRunning ? (
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 hover:bg-muted"
              onClick={pauseTimer}
              title="Pause timer"
            >
              <Pause className="size-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 text-emerald-500 hover:bg-muted"
              onClick={resumeTimer}
              title="Resume timer"
            >
              <Play className="size-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0 text-muted-foreground hover:bg-muted"
            onClick={resetTimer}
            title="Reset timer"
          >
            <RotateCcw className="size-3" />
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-6 px-2 text-[11px] font-medium"
            onClick={handleOpenModal}
          >
            <Check className="size-3 mr-1" />
            {t.timesheet.stopTimer}
          </Button>
        </div>
      </div>

      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.timesheet.logModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t.timesheet.ticket}</label>
              <p className="font-semibold text-sm text-foreground">{activeTicketName} (ID: #{activeTicketId})</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{t.timesheet.hours}</label>
              <TimeDurationInput
                value={hours}
                onChange={setHours}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{t.timesheet.description}</label>
              <Textarea
                rows={3}
                placeholder="Popis provedené práce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowLogModal(false)}>
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={handleSaveLog} disabled={isSubmitting}>
              {isSubmitting ? t.common.loading : t.timesheet.submitLog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

