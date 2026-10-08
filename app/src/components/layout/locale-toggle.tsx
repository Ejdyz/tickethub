'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => setLocale(locale === 'en' ? 'cs' : 'en')}
      title="Switch Language / Přepnout jazyk"
    >
      <Languages className="size-4 mr-1.5" />
      <span>{locale}</span>
    </Button>
  );
}

