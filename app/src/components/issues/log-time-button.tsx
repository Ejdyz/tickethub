'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogTimeModal } from '@/components/issues/log-time-modal';

interface LogTimeButtonProps {
  ticketId: number;
  ticketCode: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function LogTimeButton({
  ticketId,
  ticketCode,
  variant = 'default',
  size = 'sm',
  className = '',
  label = 'Vykázat čas'
}: LogTimeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`text-xs gap-1.5 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Clock className="size-3.5" />
        {label}
      </Button>

      <LogTimeModal
        open={open}
        onOpenChange={setOpen}
        ticketId={ticketId}
        ticketCode={ticketCode}
      />
    </>
  );
}

