'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleDot,
  Kanban,
  Milestone,
  DollarSign,
  Info,
  ExternalLink
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { Badge } from '@/components/ui/badge';

interface ProjectTabsProps {
  projectKey: string;
  projectName: string;
  githubRepoUrl?: string;
  openIssuesCount?: number;
}

export function ProjectTabs({
  projectKey,
  projectName,
  githubRepoUrl,
  openIssuesCount
}: ProjectTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Úkoly',
      href: `/projects/${projectKey}/issues`,
      icon: CircleDot,
      count: openIssuesCount,
      active: pathname === `/projects/${projectKey}/issues` || (pathname.startsWith(`/projects/${projectKey}/issues`) && !pathname.includes('view=kanban'))
    },
    {
      name: 'Kanban',
      href: `/projects/${projectKey}/issues?view=kanban`,
      icon: Kanban,
      active: pathname.includes('view=kanban')
    },
    {
      name: 'Milníky',
      href: `/projects/${projectKey}/milestones`,
      icon: Milestone,
      active: pathname === `/projects/${projectKey}/milestones`
    },
    {
      name: 'Rozpočet & Finance',
      href: `/projects/${projectKey}/budget`,
      icon: DollarSign,
      active: pathname === `/projects/${projectKey}/budget`
    },
    {
      name: 'Přehled',
      href: `/projects/${projectKey}`,
      icon: Info,
      active: pathname === `/projects/${projectKey}`
    }
  ];

  return (
    <div className="border-b bg-card/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 mb-6">
      {/* GitHub-style Project Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-muted/60">
            {projectKey}
          </Badge>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            {projectName}
          </h2>
        </div>

        {githubRepoUrl && (
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1 rounded-md border bg-background hover:bg-muted/50 transition-colors w-fit"
          >
            <GithubIcon className="size-3.5" />
            GitHub repozitář
            <ExternalLink className="size-3 opacity-60" />
          </a>
        )}
      </div>

      {/* GitHub-style Navigation Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                tab.active
                  ? 'border-primary text-foreground font-semibold bg-muted/30 rounded-t-md'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.name}</span>
              {typeof tab.count === 'number' && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

