'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderGit2, CircleDot, Milestone, Clock, DollarSign, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/providers/locale-provider';

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    router.push(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-[280px] items-center gap-2 rounded-lg border bg-muted/30 px-3 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left truncate">{t.app.searchPlaceholder}</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden shadow-2xl">
          <div className="flex items-center border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat cokoliv v projektech, úkolech..."
              className="h-12 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {query.trim() === '' ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Zadejte název projektu, číslo tiketu nebo klíčové slovo...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenalezeny žádné výsledky pro &quot;{query}&quot;.
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.url)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    {item.type === 'project' && <FolderGit2 className="size-4 text-blue-500 shrink-0" />}
                    {item.type === 'ticket' && <CircleDot className="size-4 text-emerald-500 shrink-0" />}
                    {item.type === 'milestone' && <Milestone className="size-4 text-purple-500 shrink-0" />}
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-foreground truncate">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                    </div>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-mono text-muted-foreground">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

