'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  CircleDot,
  CheckCircle2,
  List as ListIcon,
  Kanban as KanbanIcon,
  CornerDownRight,
  Filter,
  Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface IssueFilterBarProps {
  openCount: number;
  closedCount: number;
  allCount: number;
  milestones: any[];
}

export function IssueFilterBar({
  openCount,
  closedCount,
  allCount,
  milestones
}: IssueFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentState = searchParams.get('state') || 'open';
  const currentPriority = searchParams.get('priority') || 'all';
  const currentMilestone = searchParams.get('milestone') || 'all';
  const currentView = searchParams.get('view') || 'list';
  const showSubissues = searchParams.get('sub') === '1';

  const updateParam = (key: string, val: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === null || val === 'all' || val === '') {
      params.delete(key);
    } else {
      params.set(key, val);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* Search & View Switcher Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Hledat v názvu, kódu nebo popisu úkolu..."
            value={currentSearch}
            onChange={(e) => updateParam('q', e.target.value)}
            className="pl-9 h-8.5 text-xs bg-background"
          />
        </div>

        {/* View mode toggle (List vs Tree vs Kanban) */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => updateParam('view', 'list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              currentView !== 'kanban' && currentView !== 'tree'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListIcon className="size-3.5" />
            Seznam
          </button>
          <button
            type="button"
            onClick={() => updateParam('view', 'tree')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              currentView === 'tree'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="size-3.5" />
            Strom
          </button>
          <button
            type="button"
            onClick={() => updateParam('view', 'kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              currentView === 'kanban'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KanbanIcon className="size-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* GitHub-style Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border bg-card/60 text-xs">
        {/* State Tabs: Open / Closed / All */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateParam('state', 'open')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              currentState === 'open'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CircleDot className="size-3.5 text-emerald-500" />
            <span>{openCount} Otevřených</span>
          </button>

          <button
            type="button"
            onClick={() => updateParam('state', 'closed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              currentState === 'closed'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="size-3.5 text-purple-500" />
            <span>{closedCount} Uzavřených</span>
          </button>

          <button
            type="button"
            onClick={() => updateParam('state', 'all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              currentState === 'all'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Všechny ({allCount})
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            value={currentPriority}
            onChange={(e) => updateParam('priority', e.target.value)}
          >
            <option value="all">Priorita: Všechny</option>
            <option value="Critical">Kritická</option>
            <option value="High">Vysoká</option>
            <option value="Medium">Střední</option>
            <option value="Low">Nízká</option>
          </select>

          {milestones.length > 0 && (
            <select
              className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              value={currentMilestone}
              onChange={(e) => updateParam('milestone', e.target.value)}
            >
              <option value="all">Milník: Všechny</option>
              {milestones.map((m: any) => (
                <option key={m.milestone_id} value={m.milestone_id.toString()}>
                  {m.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => updateParam('sub', showSubissues ? null : '1')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showSubissues
                ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CornerDownRight className="size-3" />
            {showSubissues ? 'Zobrazit pouze hlavní' : 'Včetně podúkolů'}
          </button>
        </div>
      </div>
    </div>
  );
}

