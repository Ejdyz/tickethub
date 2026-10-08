'use client';

import React from 'react';
import { CommandSearch } from './command-search';
import { TimerWidget } from './timer-widget';
import { LocaleToggle } from './locale-toggle';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h1>}
        <CommandSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TimerWidget />
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

