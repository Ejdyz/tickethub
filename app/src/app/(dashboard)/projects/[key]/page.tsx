import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CircleDot,
  Milestone,
  DollarSign,
  Clock,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { getProjectByKey, getTickets, getMilestones } from '@/lib/db';
import { ProjectTabs } from '@/components/layout/project-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const instant = false;

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params;
  const project = await getProjectByKey(key);

  if (!project) {
    return <div className="p-8 text-center text-xs text-destructive">Projekt nebyl nalezen.</div>;
  }

  const [tickets, milestones] = await Promise.all([
    getTickets(project.project_id),
    getMilestones(project.project_id)
  ]);

  const openTickets = tickets.filter((t: any) => t.state !== 'Closed' && t.state !== 'Resolved');
  const budget = parseFloat(project.budget || '0');
  const expenses = parseFloat(project.current_expenses || '0');
  const consumedPct = budget > 0 ? Math.min(100, Math.round((expenses / budget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <ProjectTabs
        projectKey={project.project_key}
        projectName={project.project_name}
        githubRepoUrl={project.github_repo_url}
        openIssuesCount={openTickets.length}
      />
      <div className="flex items-center justify-between pb-2 border-b">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          <span>Zpět na všechny projekty</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/projects/${key}/budget`}>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <DollarSign className="size-3.5 mr-1" />
              Rozpočet
            </Button>
          </Link>
          <Link href={`/projects/${key}/issues`}>
            <Button size="sm" className="text-xs h-8">
              <CircleDot className="size-3.5 mr-1" />
              Zobrazit úkoly ({openTickets.length})
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{project.project_key}</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.project_name}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
        </div>

        {project.github_repo_url && (
          <a
            href={project.github_repo_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
          >
            <GithubIcon className="size-4" />
            <span>GitHub Repozitář</span>
            <ExternalLink className="size-3 opacity-70" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Úkoly a tikety</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{openTickets.length} / {tickets.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Otevřené vs celkem evidované
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Čerpání rozpočtu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{consumedPct}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {expenses.toLocaleString()} z {budget.toLocaleString()} {project.currency}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Milníky (Milestones)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{milestones.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aktivní releasy a sprinty
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Link href={`/projects/${key}/issues`} className="block">
          <Card className="p-4 border hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Úkoly a Issues →</span>
              <CircleDot className="size-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Zobrazení seznamu tiketů, Kanban tabule, filtrování podle stavu a priority, sledování času a řešení hierarchických podúkolů.
            </p>
          </Card>
        </Link>

        <Link href={`/projects/${key}/budget`} className="block">
          <Card className="p-4 border hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Finanční rozpočet a převody →</span>
              <DollarSign className="size-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ukazatel vyčerpaného rozpočtu, automatické alerty při 80%+ čerpání, auditní log transakcí a meziprojektové přesuny rozpočtů.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

