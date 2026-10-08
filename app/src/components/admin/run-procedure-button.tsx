'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RunProcedureButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(true);

  const handleRun = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/procedures/close-resolved', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage(`Procedura pr_close_resolved_tickets byla úspěšně spuštěna. Bylo uzavřeno ${data.count} vyřešených úkolů.`);
        router.refresh();
      } else {
        setIsSuccess(false);
        setMessage(data.error || 'Procedura selhala.');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.message || 'Chyba sítě.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        onClick={handleRun}
        disabled={running}
        className="text-xs gap-1.5"
      >
        <Play className="size-3.5" />
        {running ? 'Spouštím proceduru...' : 'Spustit proceduru pr_close_resolved_tickets'}
      </Button>

      {message && (
        <Alert
          variant={isSuccess ? 'default' : 'destructive'}
          className="text-xs"
        >
          {isSuccess ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

