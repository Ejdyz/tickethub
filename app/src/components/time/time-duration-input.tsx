'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimeDurationInputProps {
  value: string; // decimal hours, e.g. "2.00" or "1.99"
  onChange: (decimalHours: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
}

export function TimeDurationInput({
  value,
  onChange,
  id,
  className = '',
  required = true
}: TimeDurationInputProps) {
  // Mode: 'decimal' (e.g. 1.75 h) or 'hm' (e.g. 1h 45m)
  const [mode, setMode] = useState<'decimal' | 'hm'>('decimal');

  // Internal state for hours & minutes mode
  const currentNum = parseFloat(value) || 0;
  const initialH = Math.floor(currentNum);
  const initialM = Math.round((currentNum - initialH) * 60);

  const [hoursPart, setHoursPart] = useState<string>(initialH.toString());
  const [minutesPart, setMinutesPart] = useState<string>(initialM.toString());

  // Synchronize H:M inputs when decimal value changes externally
  useEffect(() => {
    const valNum = parseFloat(value);
    if (!isNaN(valNum)) {
      const h = Math.floor(valNum);
      const m = Math.round((valNum - h) * 60);
      setHoursPart(h.toString());
      setMinutesPart(m.toString());
    }
  }, [value]);

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw);
  };

  const handleHoursPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Math.max(0, parseInt(e.target.value) || 0);
    setHoursPart(e.target.value);
    const m = Math.max(0, Math.min(59, parseInt(minutesPart) || 0));
    const totalDecimal = (h + m / 60).toFixed(2);
    onChange(totalDecimal);
  };

  const handleMinutesPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
    setMinutesPart(e.target.value);
    const h = Math.max(0, parseInt(hoursPart) || 0);
    const totalDecimal = (h + m / 60).toFixed(2);
    onChange(totalDecimal);
  };

  const handleQuickAdd = (addHours: number) => {
    const current = parseFloat(value) || 0;
    const next = Math.max(0, +(current + addHours).toFixed(2));
    onChange(next.toFixed(2));
  };

  const handleSetExact = (exactHours: number) => {
    onChange(exactHours.toFixed(2));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('decimal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === 'decimal'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="size-3" />
            Desetinně (1.99h)
          </button>
          <button
            type="button"
            onClick={() => setMode('hm')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === 'hm'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3" />
            Hodiny a minuty (1h 59m)
          </button>
        </div>

        <span className="text-[11px] font-mono text-muted-foreground">
          = {parseFloat(value) ? `${parseFloat(value).toFixed(2)} hod.` : '0.00 hod.'}
        </span>
      </div>

      {/* Input controls based on mode */}
      {mode === 'decimal' ? (
        <div className="relative">
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0.01"
            max="999.99"
            required={required}
            value={value}
            onChange={handleDecimalChange}
            placeholder="např. 2.0 nebo 1.99"
            className="pr-12 font-mono text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
            hod.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="999"
              value={hoursPart}
              onChange={handleHoursPartChange}
              placeholder="0"
              className="pr-10 font-mono text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
              hod.
            </div>
          </div>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="59"
              value={minutesPart}
              onChange={handleMinutesPartChange}
              placeholder="0"
              className="pr-10 font-mono text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
              min.
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">Rychle:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleSetExact(0.5)}
        >
          30m
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleSetExact(1.0)}
        >
          1.0h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleSetExact(2.0)}
        >
          2.0h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleSetExact(4.0)}
        >
          4.0h
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleQuickAdd(0.25)}
        >
          +15m
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => handleQuickAdd(0.5)}
        >
          +30m
        </Button>
      </div>
    </div>
  );
}

