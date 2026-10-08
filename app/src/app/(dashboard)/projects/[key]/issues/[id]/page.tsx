import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CircleDot,
  CheckCircle2,
  Clock,
  DollarSign,
  Tag as TagIcon,
  MessageSquare,
  CornerDownRight,
  ExternalLink,
  Calendar,
  User as UserIcon,
  ChevronRight,
  Layers
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import {
  getProjectByKey,
  getTicketById,
  getTicketAncestors,
  getTicketDescendantTree,
  getComments,
  getTicketWorkReports,
  executeCalculateTicketPrice
} from '@/lib/db';
import { ProjectTabs } from '@/components/layout/project-tabs';
import { SubIssuesSection } from '@/components/issues/sub-issues-section';
import { LogTimeButton } from '@/components/issues/log-time-button';
import { CommentForm } from '@/components/issues/comment-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const instant = false;

interface PageProps {
  params: Promise<{ key: string; id: string }>;
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { key, id } = await params;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    notFound();
  }

  const project = await getProjectByKey(key);
  if (!project) {
    notFound();
  }

  const [ticket, subTickets, ancestors, comments, workReports, dynamicPrice] = await Promise.all([
    getTicketById(ticketId),
    getTicketDescendantTree(ticketId),
    getTicketAncestors(ticketId),
    getComments(ticketId),
    getTicketWorkReports(ticketId),
    executeCalculateTicketPrice(ticketId)
  ]);

  if (!ticket) {
    notFound();
  }

  const isClosed = ticket.state === 'Closed' || ticket.state === 'Resolved';
  const totalLoggedHours = workReports.reduce((acc: number, r: any) => acc + (parseFloat(r.work_hours) || 0), 0);

  return (
    <div className="space-y-6">
      {/* GitHub-style Project Header & Tabs */}
      <ProjectTabs
        projectKey={project.project_key}
        projectName={project.project_name}
        githubRepoUrl={project.github_repo_url}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
        <Link
          href={`/projects/${project.project_key}/issues`}
          className="inline-flex items-center gap-1.5 hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Zpět na přehled úkolů ({project.project_key})
        </Link>

        <span className="font-mono text-muted-foreground/80">
          Projekt: {project.project_name}
        </span>
      </div>

      {/* Multi-Level Ancestor Hierarchy Chain (Recursive Breadcrumbs) */}
      {ancestors.length > 0 && (
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="size-3 text-primary" />
              Hierarchická cesta úkolu ({ancestors.length}. úroveň zanoření)
            </span>
            <Badge variant="outline" className="text-[10px] bg-background border-primary/30 text-primary">
              Úroveň {ancestors.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {ancestors.map((anc: any, idx: number) => (
              <React.Fragment key={anc.ticket_id}>
                <Link
                  href={`/projects/${project.project_key}/issues/${anc.ticket_id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1"
                >
                  <span className="font-mono text-muted-foreground">[{anc.ticket_code}]</span>
                  <span className="truncate max-w-[160px]">{anc.name}</span>
                </Link>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
              </React.Fragment>
            ))}
            <span className="font-bold text-primary flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-primary/20">
              <span className="font-mono">[{ticket.ticket_code}]</span>
              <span className="truncate max-w-[200px]">{ticket.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Issue Header */}
      <div className="space-y-2 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xl sm:text-2xl font-bold text-muted-foreground">
              {ticket.ticket_code}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {ticket.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LogTimeButton
              ticketId={ticket.ticket_id}
              ticketCode={ticket.ticket_code}
            />
          </div>
        </div>

        {/* Metadata sub-row (GitHub style) */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
          <Badge
            variant={isClosed ? 'secondary' : 'default'}
            className={`text-xs gap-1.5 ${
              isClosed
                ? 'bg-purple-500/10 text-purple-600 border-purple-300'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isClosed ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <CircleDot className="size-3.5" />
            )}
            {ticket.state}
          </Badge>

          <span>
            Autor: <strong className="text-foreground">{ticket.author_name}</strong>
          </span>
          <span>•</span>
          <span>Vytvořeno: {new Date(ticket.created_at).toLocaleDateString()}</span>

          {ticket.github_issue_url && (
            <>
              <span>•</span>
              <a
                href={ticket.github_issue_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <GithubIcon className="size-3" />
                GitHub Issue #{ticket.github_issue_number}
                <ExternalLink className="size-2.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Two-Column GitHub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Sub-issues, Work reports, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Popis úkolu (Specification)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="prose prose-sm dark:prose-invert text-xs leading-relaxed whitespace-pre-wrap">
                {ticket.description || 'K tomuto úkolu nebyl zadán žádný popis.'}
              </div>
            </CardContent>
          </Card>

          {/* Sub-issues Section (First-class GitHub Sub-issues feature) */}
          <div id="subissues">
            <SubIssuesSection
              parentTicket={ticket}
              subTickets={subTickets}
              projectKey={project.project_key}
            />
          </div>

          {/* Work Reports / Logged Time on this ticket */}
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                Výkazy odpracovaného času ({workReports.length})
              </CardTitle>

              <span className="font-mono text-xs font-semibold text-foreground">
                Celkem: {totalLoggedHours.toFixed(2)} h
              </span>
            </CardHeader>

            <CardContent className="p-0">
              {workReports.length === 0 ? (
                <div className="p-5 text-center text-xs text-muted-foreground">
                  Zatím nebyl vykázán žádný čas.
                </div>
              ) : (
                <div className="divide-y text-xs">
                  {workReports.map((r: any) => (
                    <div key={r.report_id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/20">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{r.user_name}</span>
                          <span className="text-[10px] text-muted-foreground">{r.work_date}</span>
                          {r.billable && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-300">
                              Fakturovatelné
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px]">{r.work_description}</p>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="font-bold text-foreground">
                          {parseFloat(r.work_hours).toFixed(2)} h
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {(r.total_cost || 0).toLocaleString()} Kč
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion Thread */}
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center gap-2">
              <MessageSquare className="size-3.5 text-primary" />
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Diskuze & Komentáře ({comments.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Zatím žádné komentáře. Buďte první, kdo se vyjádří k tomuto úkolu.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div
                      key={c.comment_id}
                      className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {c.author_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <div className="border-t pt-3">
                <CommentForm ticketId={ticket.ticket_id} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Attributes, Financials, Dynamic Price */}
        <div className="space-y-6">
          {/* Attributes Card */}
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Vlastnosti úkolu
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Assignee */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Přiřazeno</span>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                    {(ticket.assignee_name || 'U')[0]}
                  </div>
                  <span>{ticket.assignee_name || 'Nepřiřazeno'}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Priorita</span>
                <div>
                  <Badge
                    variant={ticket.priority === 'Critical' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              {/* Ticket Type */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Typ</span>
                <div>
                  <Badge variant="secondary" className="text-xs">
                    {ticket.ticket_type || 'Issue'}
                  </Badge>
                </div>
              </div>

              {/* Milestone */}
              {ticket.milestone_title && (
                <div className="space-y-1 border-t pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Milník</span>
                  <p className="font-semibold text-foreground">{ticket.milestone_title}</p>
                </div>
              )}

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="space-y-1 border-t pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Štítky</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tg: any) => (
                      <span
                        key={tg.name}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                        style={{
                          borderColor: tg.color_hex ? `${tg.color_hex}40` : '#e2e8f0',
                          backgroundColor: tg.color_hex ? `${tg.color_hex}15` : '#f1f5f9',
                          color: tg.color_hex || '#475569'
                        }}
                      >
                        {tg.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time & Financial Cost Card (Dynamic Price from Database PL/pgSQL function) */}
          <Card className="border shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-primary" />
                Čas a kalkulace ceny
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Dynamic Price Display */}
              <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 space-y-1">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  Dynamická cena tiketu
                </span>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {dynamicPrice.toLocaleString()} Kč
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80">
                  Vypočteno databázovou funkcí <code>fn_calculate_ticket_price</code> z reálných sazeb a fakturovaných hodin.
                </p>
              </div>

              {/* Time Breakdown */}
              <div className="space-y-2 font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Odhadovaný čas:</span>
                  <span className="text-foreground font-semibold">{ticket.estimated_hours} h</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Odpracovaný čas:</span>
                  <span className="text-foreground font-semibold">{totalLoggedHours.toFixed(2)} h</span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-1 border-t">
                  <span>Zbývající čas:</span>
                  <span className="text-foreground font-semibold">
                    {Math.max(0, ticket.estimated_hours - totalLoggedHours).toFixed(2)} h
                  </span>
                </div>
              </div>

              {/* Log Time Action */}
              <div className="pt-2 border-t">
                <LogTimeButton
                  ticketId={ticket.ticket_id}
                  ticketCode={ticket.ticket_code}
                  className="w-full justify-center"
                  label="Vykázat další odpracovaný čas"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
