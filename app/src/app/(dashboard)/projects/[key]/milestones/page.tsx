import React from 'react';
import Link from 'next/link';
import { Milestone, Calendar, CircleDot, CheckCircle2, DollarSign, ArrowLeft } from 'lucide-react';
import { getMilestones, getProjectByKey } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ProjectTabs } from '@/components/layout/project-tabs';

export const instant = false;

export default async function MilestonesPage({
  params
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params;
  const project = await getProjectByKey(key);
  const milestones = await getMilestones(project?.project_id);

  return (
    <div className="space-y-6">
      {project && (
        <ProjectTabs
          projectKey={project.project_key}
          projectName={project.project_name}
          githubRepoUrl={project.github_repo_url}
        />
      )}
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <Link href={`/projects/${key}/issues`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="size-3.5" />
            <span>Zpět na úkoly ({key})</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Milníky projektu (Milestones & Sprints)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plánování releasů, sledování dokončení a alokace rozpočtů ve stylu GitHubu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {milestones.map((m: any) => {
          const compPct = Math.round(m.completion_pct || 0);

          return (
            <Card key={m.milestone_id} className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={m.state === 'Open' ? 'default' : 'secondary'} className="text-[10px]">
                    {m.state}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>Termín: {new Date(m.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <CardTitle className="text-base font-semibold">{m.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {m.description || 'Bez bližšího popisu.'}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Dokončeno {compPct}%</span>
                    <span>{m.closed_tickets} vyřešeno / {m.open_tickets} otevřeno</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${compPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="size-3.5 text-emerald-600" />
                    <span>Alokovaný rozpočet: <strong>{parseFloat(m.budget_allocated).toLocaleString()} Kč</strong></span>
                  </div>

                  <Link href={`/projects/${key}/issues`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Zobrazit úkoly →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

