import React from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  CircleDot,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { getProjects, getTickets, getTimesheet } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const instant = false;

export default async function DashboardPage() {
  const [projects, tickets, timesheet] = await Promise.all([
    getProjects(),
    getTickets(),
    getTimesheet()
  ]);

  const totalBudget = projects.reduce((acc, p) => acc + parseFloat(p.budget || '0'), 0);
  const totalExpenses = projects.reduce((acc, p) => acc + parseFloat(p.current_expenses || '0'), 0);
  const totalHours = timesheet.reduce((acc, r) => acc + parseFloat(r.work_hours || '0'), 0);
  const openTickets = tickets.filter(t => t.state !== 'Closed' && t.state !== 'Resolved');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Přehled systému (Dashboard)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centrální správa multi-projektů, tiketů, výkazů práce a rozpočtů napojených na GitHub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="text-xs">
              <FolderGit2 className="size-3.5 mr-1.5" />
              Projekty
            </Button>
          </Link>
          <Link href="/timesheet">
            <Button variant="outline" size="sm" className="text-xs">
              <Clock className="size-3.5 mr-1.5" />
              Vykázat čas
            </Button>
          </Link>
          <Link href="/projects/TH/issues">
            <Button size="sm" className="text-xs shadow-sm">
              <Plus className="size-3.5 mr-1.5" />
              Nový úkol
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Aktivní projekty</CardTitle>
            <FolderGit2 className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Propojeno s GitHub repos</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Otevřené úkoly</CardTitle>
            <CircleDot className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Celkem evidováno {tickets.length} tiketů
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Odpracované hodiny</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)} h</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dynamicky vypočteno z výkazů
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Schválený rozpočet</CardTitle>
            <DollarSign className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBudget.toLocaleString()} Kč</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Čerpáno {totalExpenses.toLocaleString()} Kč ({(totalExpenses / totalBudget * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Projects Status & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects Overview */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Projekty a stav čerpání</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Metriky z pohledu v_project_summary</p>
            </div>
            <Link href="/projects" className="text-xs text-primary hover:underline flex items-center">
              Zobrazit vše <ArrowUpRight className="size-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((p: any) => {
              const consumedPct = Math.min(100, Math.round(p.budget_consumed_pct || 0));
              const isOver = p.budget_health_status === 'OVER_BUDGET';
              const isNear = p.budget_health_status === 'WARNING_NEAR_LIMIT';

              return (
                <div key={p.project_id} className="p-3.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {p.project_key}
                      </Badge>
                      <Link href={`/projects/${p.project_key}/issues`} className="font-semibold text-sm hover:underline">
                        {p.project_name}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOver && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="size-3" /> Překročen rozpočet
                        </Badge>
                      )}
                      {isNear && (
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-200">
                          <AlertTriangle className="size-3" /> Blízko limitu (80%+)
                        </Badge>
                      )}
                      {!isOver && !isNear && (
                        <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-200">
                          <CheckCircle2 className="size-3" /> V pořádku
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Rozpočet: {parseFloat(p.budget).toLocaleString()} {p.currency}</span>
                      <span>Čerpáno: {parseFloat(p.current_expenses).toLocaleString()} {p.currency} ({consumedPct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-destructive' : isNear ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${consumedPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                    <div className="flex items-center gap-1 hover:text-foreground">
                      <GithubIcon className="size-3" />
                      <a href={p.github_repo_url} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px]">
                        {p.github_repo_url.replace('https://github.com/', '')}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Tikety: {p.open_tickets} otevřeno / {p.total_tickets} celkem</span>
                      <Link href={`/projects/${p.project_key}/budget`} className="text-primary hover:underline font-medium">
                        Rozpočet →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Recent Issues */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Aktuální úkoly</CardTitle>
            <Link href="/projects/TH/issues" className="text-xs text-primary hover:underline">
              Všechny →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.slice(0, 5).map((t: any) => (
              <Link
                key={t.ticket_id}
                href={`/projects/${t.project_key}/issues/${t.ticket_id}`}
                className="block p-2.5 rounded-md border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-muted-foreground">{t.ticket_code}</span>
                  <Badge
                    variant={
                      t.state === 'Closed' ? 'secondary' :
                      t.state === 'Resolved' ? 'secondary' :
                      t.state === 'In Progress' ? 'default' : 'outline'
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {t.state}
                  </Badge>
                </div>
                <h4 className="text-xs font-medium text-foreground line-clamp-1">{t.name}</h4>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Přiřazeno: {t.assignee_name}</span>
                  <span>{t.logged_hours}h / {t.estimated_hours}h</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

