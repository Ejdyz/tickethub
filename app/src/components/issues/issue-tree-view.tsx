'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronDown,
  CircleDot,
  CheckCircle2,
  Clock,
  Layers,
  CornerDownRight,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface IssueTreeViewProps {
  tickets: any[];
  projectKey: string;
}

interface TreeNode {
  ticket: any;
  depth: number;
  children: TreeNode[];
}

export function IssueTreeView({ tickets, projectKey }: IssueTreeViewProps) {
  const [collapsedRoots, setCollapsedRoots] = useState<Record<number, boolean>>({});

  const toggleCollapse = (id: number) => {
    setCollapsedRoots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive tree
  const ticketMap = new Map<number, any>();
  tickets.forEach(t => ticketMap.set(t.ticket_id, t));

  const rootTickets = tickets.filter(t => !t.parent_ticket_id || !ticketMap.has(t.parent_ticket_id));

  function buildTree(ticket: any, depth: number = 0): TreeNode {
    const children = tickets
      .filter(t => t.parent_ticket_id === ticket.ticket_id)
      .map(child => buildTree(child, depth + 1));

    return {
      ticket,
      depth,
      children
    };
  }

  const treeRoots = rootTickets.map(root => buildTree(root, 0));

  const getDepthBadge = (depth: number) => {
    if (depth === 0) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted font-mono">Kořenový</Badge>;
    }
    switch (depth) {
      case 1:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/40 text-blue-600 dark:text-blue-400">1. úroveň</Badge>;
      case 2:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/40 text-indigo-600 dark:text-indigo-400">2. úroveň</Badge>;
      case 3:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-500/40 text-purple-600 dark:text-purple-400">3. úroveň</Badge>;
      case 4:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-pink-500/40 text-pink-600 dark:text-pink-400">4. úroveň</Badge>;
      case 5:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400">5. úroveň</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-zinc-500/40">{depth}. úroveň</Badge>;
    }
  };

  const renderNode = (node: TreeNode) => {
    const { ticket, depth, children } = node;
    const isDone = ticket.state === 'Closed' || ticket.state === 'Resolved';
    const isRoot = depth === 0;
    const isCollapsed = collapsedRoots[ticket.ticket_id];
    const indent = Math.min(80, depth * 20);

    return (
      <div key={ticket.ticket_id} className="space-y-0">
        <div
          style={{ paddingLeft: `${12 + indent}px` }}
          className={`p-3 text-xs transition-colors flex items-center justify-between gap-2 border-b group ${
            isRoot ? 'bg-muted/15 font-medium' : 'hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            {/* Collapse/Expand button for nodes with children */}
            {children.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleCollapse(ticket.ticket_id)}
                className="size-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            ) : depth > 0 ? (
              <span className="text-muted-foreground/60 font-mono text-xs select-none shrink-0 w-5 text-center">
                ↳
              </span>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            {/* Status icon */}
            {isDone ? (
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            ) : (
              <CircleDot className="size-3.5 text-blue-500 shrink-0" />
            )}

            {/* Depth badge */}
            {getDepthBadge(depth)}

            {/* Ticket Code */}
            <span className="font-mono text-muted-foreground shrink-0 text-[11px]">
              {ticket.ticket_code}
            </span>

            {/* Title link */}
            <Link
              href={`/projects/${projectKey}/issues/${ticket.ticket_id}`}
              className={`hover:text-primary hover:underline truncate ${
                isRoot ? 'font-semibold text-foreground text-sm' : 'text-foreground'
              }`}
            >
              {ticket.name}
            </Link>

            {/* Children count badge */}
            {children.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/40 font-mono text-muted-foreground">
                {children.length} {children.length === 1 ? 'podúkol' : children.length < 5 ? 'podúkoly' : 'podúkolů'}
              </Badge>
            )}
          </div>

          {/* Right side stats */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
              {ticket.logged_hours || 0}h / {ticket.estimated_hours || 0}h
            </span>

            <Badge
              variant={isDone ? 'secondary' : 'outline'}
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {ticket.state}
            </Badge>

            <Link
              href={`/projects/${projectKey}/issues/${ticket.ticket_id}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium hover:underline text-[11px]"
            >
              Otevřít →
            </Link>
          </div>
        </div>

        {/* Render children recursively if not collapsed */}
        {!isCollapsed && children.length > 0 && (
          <div>
            {children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Hierarchický strom úkolů (Infinetely Nested Tree)
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-mono ml-1">
            {treeRoots.length} kořenových větví
          </Badge>
        </div>

        <span className="text-xs text-muted-foreground">
          Podpora nekonečného vnořování (1., 2., 3., 4., 5.+ úroveň)
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {treeRoots.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Žádné úkoly k zobrazení ve stromu.
          </div>
        ) : (
          <div>
            {treeRoots.map(root => renderNode(root))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

