import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CircleDot,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  CornerDownRight,
  GitPullRequest,
  Tag as TagIcon
} from 'lucide-react';
import { getProjectByKey, getTickets, getMilestones } from '@/lib/db';
import { ProjectTabs } from '@/components/layout/project-tabs';
import { IssueFilterBar } from '@/components/issues/issue-filter-bar';
import { KanbanBoard } from '@/components/issues/kanban-board';
import { IssueTreeView } from '@/components/issues/issue-tree-view';
import { NewIssueButton } from '@/components/issues/new-issue-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const instant = false;

interface PageProps {
  params: Promise<{ key: string }>;
  searchParams: Promise<{
    q?: string;
    state?: string;
    priority?: string;
    milestone?: string;
    view?: string;
    sub?: string;
  }>;
}

export default async function IssuesPage({ params, searchParams }: PageProps) {
  const { key } = await params;
  const query = await searchParams;

  const project = await getProjectByKey(key);
  if (!project) {
    notFound();
  }

  const [allTickets, milestones] = await Promise.all([
    getTickets(project.project_id),
    getMilestones(project.project_id)
  ]);

  // Counts
  const openCount = allTickets.filter(
    (t) => t.state !== 'Closed' && t.state !== 'Resolved'
  ).length;
  const closedCount = allTickets.filter(
    (t) => t.state === 'Closed' || t.state === 'Resolved'
  ).length;
  const allCount = allTickets.length;

  // Filter logic
  let filteredTickets = [...allTickets];

  // State filter
  const stateFilter = query.state || 'open';
  if (stateFilter === 'open') {
    filteredTickets = filteredTickets.filter(
      (t) => t.state !== 'Closed' && t.state !== 'Resolved'
    );
  } else if (stateFilter === 'closed') {
    filteredTickets = filteredTickets.filter(
      (t) => t.state === 'Closed' || t.state === 'Resolved'
    );
  }

  // Priority filter
  if (query.priority && query.priority !== 'all') {
    filteredTickets = filteredTickets.filter((t) => t.priority === query.priority);
  }

  // Milestone filter
  if (query.milestone && query.milestone !== 'all') {
    const mId = parseInt(query.milestone);
    filteredTickets = filteredTickets.filter((t) => t.milestone_id === mId);
  }

  // Sub-issues toggle
  if (query.sub !== '1') {
    // By default, show top-level issues primarily
    // But if search is active or sub=1, show all
  }

  // Text search
  if (query.q) {
    const qLower = query.q.toLowerCase();
    filteredTickets = filteredTickets.filter(
      (t) =>
        t.name.toLowerCase().includes(qLower) ||
        t.ticket_code.toLowerCase().includes(qLower) ||
        (t.description && t.description.toLowerCase().includes(qLower))
    );
  }

  const isKanban = query.view === 'kanban';
  const isTree = query.view === 'tree';

  // Subtask lookup map (parent_ticket_id -> child tickets)
  const childTicketsMap: Record<number, any[]> = {};
  for (const t of allTickets) {
    if (t.parent_ticket_id) {
      if (!childTicketsMap[t.parent_ticket_id]) {
        childTicketsMap[t.parent_ticket_id] = [];
      }
      childTicketsMap[t.parent_ticket_id].push(t);
    }
  }

  return (
    <div className="space-y-6">
      {/* GitHub-style Project Header & Tabs */}
      <ProjectTabs
        projectKey={project.project_key}
        projectName={project.project_name}
        githubRepoUrl={project.github_repo_url}
        openIssuesCount={openCount}
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Úkoly projektu</span>
            <span className="font-mono text-sm text-muted-foreground font-normal">
              ({filteredTickets.length})
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Správa issues, dílčích podúkolů a sledování odpracovaného času.
          </p>
        </div>

        <NewIssueButton
          projectId={project.project_id}
          projectKey={project.project_key}
        />
      </div>

      {/* Filter and search bar */}
      <IssueFilterBar
        openCount={openCount}
        closedCount={closedCount}
        allCount={allCount}
        milestones={milestones}
      />

      {/* Content: Tree View, Kanban View, or List View */}
      {isTree ? (
        <IssueTreeView
          tickets={filteredTickets}
          projectKey={project.project_key}
        />
      ) : isKanban ? (
        <KanbanBoard
          tickets={filteredTickets}
          projectKey={project.project_key}
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden divide-y">
          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <CircleDot className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium text-foreground">Žádné úkoly neodpovídají zadanému filtru.</p>
              <p className="mt-1">Zkuste resetovat vyhledávací kritéria nebo vytvořit nový úkol.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isClosed = ticket.state === 'Closed' || ticket.state === 'Resolved';
              const subTasks = childTicketsMap[ticket.ticket_id] || [];

              return (
                <div
                  key={ticket.ticket_id}
                  className="p-3.5 hover:bg-muted/30 transition-colors flex items-start gap-3 text-xs group"
                >
                  {/* Status Icon */}
                  <div className="pt-0.5 shrink-0">
                    {isClosed ? (
                      <CheckCircle2 className="size-4 text-purple-500" />
                    ) : (
                      <CircleDot className="size-4 text-emerald-500" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/projects/${project.project_key}/issues/${ticket.ticket_id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline text-sm leading-snug"
                      >
                        {ticket.name}
                      </Link>

                      {/* Tags */}
                      {ticket.tags && ticket.tags.map((tag: any) => (
                        <span
                          key={tag.name}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                          style={{
                            borderColor: tag.color_hex ? `${tag.color_hex}40` : '#e2e8f0',
                            backgroundColor: tag.color_hex ? `${tag.color_hex}15` : '#f1f5f9',
                            color: tag.color_hex || '#475569'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}

                      {/* Sub-issues Badge */}
                      {subTasks.length > 0 && (
                        <Link
                          href={`/projects/${project.project_key}/issues/${ticket.ticket_id}#subissues`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          <CornerDownRight className="size-3" />
                          <span>{subTasks.length} podúkolů</span>
                        </Link>
                      )}

                      {/* Parent Ticket reference if this is a sub-issue */}
                      {ticket.parent_ticket_id && (
                        <Link
                          href={`/projects/${project.project_key}/issues/${ticket.parent_ticket_id}`}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary underline font-mono"
                        >
                          <CornerDownRight className="size-3" />
                          nadřazený #{ticket.parent_ticket_id}
                        </Link>
                      )}
                    </div>

                    {/* Metadata line (like GitHub: #123 opened by user • milestone • etc.) */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-mono font-medium text-foreground/80">
                        {ticket.ticket_code}
                      </span>
                      <span>•</span>
                      <span>Autor: {ticket.author_name}</span>
                      {ticket.milestone_title && (
                        <>
                          <span>•</span>
                          <span className="text-foreground/70">
                            Milník: {ticket.milestone_title}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>Přiřazeno: {ticket.assignee_name || 'Nepřiřazeno'}</span>
                    </div>

                    {/* Expandable subtasks preview if any */}
                    {subTasks.length > 0 && (
                      <div className="pt-1.5 pl-3 border-l-2 border-primary/20 space-y-1">
                        {subTasks.map((sub: any) => (
                          <div key={sub.ticket_id} className="flex items-center gap-2 text-[11px]">
                            <CornerDownRight className="size-3 text-muted-foreground shrink-0" />
                            <Link
                              href={`/projects/${project.project_key}/issues/${sub.ticket_id}`}
                              className="hover:underline text-foreground truncate max-w-md"
                            >
                              <span className="font-mono text-muted-foreground mr-1">
                                {sub.ticket_code}:
                              </span>
                              {sub.name}
                            </Link>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {sub.state}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side stats: Hours, Price, State */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="hidden sm:flex flex-col items-end text-[11px] font-mono">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {ticket.logged_hours || 0}h / {ticket.estimated_hours || 0}h
                      </span>

                      {ticket.ticket_total_price > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {ticket.ticket_total_price.toLocaleString()} Kč
                        </span>
                      )}
                    </div>

                    <Badge
                      variant={isClosed ? 'secondary' : 'outline'}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {ticket.state}
                    </Badge>

                    <Link
                      href={`/projects/${project.project_key}/issues/${ticket.ticket_id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium text-xs hover:underline"
                    >
                      Detail →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
