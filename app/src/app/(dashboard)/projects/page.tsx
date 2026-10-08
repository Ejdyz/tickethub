import React from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  DollarSign,
  Clock,
  CircleDot,
  ExternalLink,
  Users,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { getProjects } from '@/lib/db';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const instant = false;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Adresář projektů
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Přehled všech aktivních i archivovaných projektů s napojením na GitHub a rozpočty.
          </p>
        </div>

        <CreateProjectModal />
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-muted-foreground border rounded-xl bg-card">
            <FolderGit2 className="size-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground text-sm">Zatím nebyly vytvořeny žádné projekty.</p>
            <p className="mt-1">Klepněte na &quot;Nový projekt&quot; výše pro vytvoření prvního projektu.</p>
          </div>
        ) : (
          projects.map((p: any) => {
            const consumedPct = Math.min(100, Math.round(p.budget_consumed_pct || 0));
            const isOverBudget = p.budget_health_status === 'OVER_BUDGET';
            const isNearLimit = p.budget_health_status === 'WARNING_NEAR_LIMIT';

            return (
              <Card
                key={p.project_id}
                className="flex flex-col border shadow-xs hover:border-primary/50 transition-all group overflow-hidden"
              >
                {/* Card Header */}
                <CardHeader className="p-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-muted/60">
                      {p.project_key}
                    </Badge>

                    {isOverBudget ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="size-3" />
                        Překročen rozpočet
                      </Badge>
                    ) : isNearLimit ? (
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-300">
                        <AlertTriangle className="size-3" />
                        Blízko limitu ({consumedPct}%)
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-200">
                        <CheckCircle2 className="size-3" />
                        V pořádku
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/projects/${p.project_key}/issues`}
                      className="font-bold text-base text-foreground hover:text-primary transition-colors group-hover:text-primary leading-snug block"
                    >
                      {p.project_name}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.description || 'Projekt bez popisu.'}
                    </p>
                  </div>
                </CardHeader>

                {/* Card Content */}
                <CardContent className="p-4 pt-0 space-y-3 flex-1 text-xs">
                  {/* Budget Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Čerpání: {p.current_expenses?.toLocaleString()} {p.currency}</span>
                      <span className="font-semibold text-foreground">{consumedPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget
                            ? 'bg-destructive'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${consumedPct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      z limitu {p.budget?.toLocaleString()} {p.currency}
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CircleDot className="size-3.5 text-primary" />
                      <span>Tikety: <strong className="text-foreground">{p.open_tickets || 0}</strong> / {p.total_tickets || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5 text-primary" />
                      <span>Hodin: <strong className="text-foreground">{p.total_hours_logged || 0}</strong> h</span>
                    </div>
                  </div>

                  {/* GitHub Repo */}
                  {p.github_repo_url && (
                    <div className="pt-2 border-t">
                      <a
                        href={p.github_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground font-medium truncate max-w-full"
                      >
                        <GithubIcon className="size-3 shrink-0" />
                        <span className="truncate">{p.github_repo_url.replace('https://github.com/', '')}</span>
                        <ExternalLink className="size-2.5 opacity-60 shrink-0" />
                      </a>
                    </div>
                  )}
                </CardContent>

                {/* Card Footer: Quick Navigation */}
                <CardFooter className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2 text-xs">
                  <Link
                    href={`/projects/${p.project_key}/issues`}
                    className="font-medium text-primary hover:underline"
                  >
                    Úkoly ({p.open_tickets || 0}) →
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${p.project_key}/budget`}
                      className="text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      Rozpočet
                    </Link>
                    <Link
                      href={`/projects/${p.project_key}/milestones`}
                      className="text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      Milníky
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
