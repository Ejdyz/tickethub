import React from 'react';
import { notFound } from 'next/navigation';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { getProjectByKey, getProjectBudgetLogs, getProjects } from '@/lib/db';
import { ProjectTabs } from '@/components/layout/project-tabs';
import { BudgetTransferModal } from '@/components/budget/budget-transfer-modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const instant = false;

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function ProjectBudgetPage({ params }: PageProps) {
  const { key } = await params;
  const project = await getProjectByKey(key);

  if (!project) {
    notFound();
  }

  const [logs, allProjects] = await Promise.all([
    getProjectBudgetLogs(project.project_id),
    getProjects()
  ]);

  const budget = parseFloat(project.budget) || 0;
  const expenses = parseFloat(project.current_expenses) || 0;
  const remaining = Math.max(0, budget - expenses);
  const consumedPct = budget > 0 ? Math.min(100, Math.round((expenses / budget) * 100)) : 0;
  const isOverBudget = expenses > budget;
  const isNearLimit = !isOverBudget && consumedPct >= 80;

  return (
    <div className="space-y-6">
      {/* Project Tabs */}
      <ProjectTabs
        projectKey={project.project_key}
        projectName={project.project_name}
        githubRepoUrl={project.github_repo_url}
      />

      {/* Header and Transfer Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Rozpočet a finanční přehled
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sledování čerpání rozpočtu, nákladů na odvedenou práci a auditované převody financí.
          </p>
        </div>

        <BudgetTransferModal
          currentProject={project}
          allProjects={allProjects}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Celkový rozpočet
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {budget.toLocaleString()} {project.currency}
          </div>
          <p className="text-[10px] text-muted-foreground">Schválený finanční rámec</p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Vyčerpané náklady
          </span>
          <div className={`text-2xl font-bold font-mono ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
            {expenses.toLocaleString()} {project.currency}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Z {project.total_hours_logged || 0} vykázaných hodin
          </p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Zbývající rozpočet
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {remaining.toLocaleString()} {project.currency}
          </div>
          <p className="text-[10px] text-muted-foreground">K dispozici pro další práci</p>
        </Card>

        <Card className="p-4 border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Stav rozpočtu
          </span>
          <div className="pt-1">
            {isOverBudget ? (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="size-3.5" />
                Překročen rozpočet
              </Badge>
            ) : isNearLimit ? (
              <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-300">
                <AlertTriangle className="size-3.5" />
                Blízko limitu ({consumedPct}%)
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-200">
                <CheckCircle2 className="size-3.5" />
                V normě ({consumedPct}%)
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            {consumedPct}% vyčerpáno
          </p>
        </Card>
      </div>

      {/* Visual Budget Progress Bar */}
      <Card className="p-4 border shadow-xs space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Čerpání rozpočtu projektu</span>
          <span className="font-semibold text-foreground font-mono">{consumedPct}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
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
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>0 {project.currency}</span>
          <span>Limit: {budget.toLocaleString()} {project.currency}</span>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Auditní deník rozpočtu (project_budget_log)
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left font-medium text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3">Čas záznamu</th>
                  <th className="py-2.5 px-3">Typ operace</th>
                  <th className="py-2.5 px-3 text-right">Změna částky</th>
                  <th className="py-2.5 px-3 text-right">Před změnou</th>
                  <th className="py-2.5 px-3 text-right">Po změně</th>
                  <th className="py-2.5 px-3">Poznámka / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Pro tento projekt nejsou evidovány žádné změny rozpočtu.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.log_id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">
                          {log.change_type}
                        </Badge>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                        log.amount < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {log.amount > 0 ? `+${log.amount.toLocaleString()}` : log.amount.toLocaleString()} Kč
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {log.balance_before.toLocaleString()} Kč
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                        {log.balance_after.toLocaleString()} Kč
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {log.note || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
