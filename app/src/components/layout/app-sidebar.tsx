'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  CircleDot,
  Milestone,
  Clock,
  DollarSign,
  Shield,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github-icon';
import { useI18n } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AppSidebarProps {
  currentProjectKey?: string;
  user?: any;
}

export function AppSidebar({ currentProjectKey = 'TH', user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  const projects = [
    { key: 'TH', name: 'TicketHub Platform', repo: 'my-org/tickethub-platform' },
    { key: 'API', name: 'Mobile Gateway API', repo: 'my-org/mobile-gateway-api' },
    { key: 'INFRA', name: 'Cloud Infrastructure', repo: 'my-org/infra-gitops' },
  ];

  const pathKeyMatch = pathname.match(/^\/projects\/([^/]+)/);
  const pathKey = pathKeyMatch ? pathKeyMatch[1].toUpperCase() : null;
  const activeKey = pathKey && projects.some(p => p.key === pathKey) ? pathKey : currentProjectKey;
  const [selectedKey, setSelectedKey] = useState(activeKey);

  const effectiveKey = pathKey && projects.some(p => p.key === pathKey) ? pathKey : selectedKey;
  const currentProject = projects.find(p => p.key === effectiveKey) || projects[0];

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }

  const navItems: NavItem[] = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/projects', label: t.nav.projects, icon: FolderGit2 },
    { href: `/projects/${effectiveKey}/issues`, label: t.nav.issues, icon: CircleDot },
    { href: `/projects/${effectiveKey}/milestones`, label: t.nav.milestones, icon: Milestone },
    { href: '/timesheet', label: t.nav.timesheet, icon: Clock },
    { href: `/projects/${effectiveKey}/budget`, label: t.nav.budget, icon: DollarSign },
    { href: '/admin', label: t.nav.admin, icon: Shield, adminOnly: true },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <aside
      className={`relative flex flex-col border-r bg-card/90 backdrop-blur transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand & Collapse Toggle */}
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              TH
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t.app.title}
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Project Switcher */}
      <div className="p-3 border-b">
        {!collapsed ? (
          <div className="rounded-lg border bg-muted/40 p-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>PROJEKT</span>
              <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                {currentProject.key}
              </Badge>
            </div>
            <select
              value={effectiveKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setSelectedKey(newKey);
                router.push(`/projects/${newKey}/issues`);
              }}
              className="w-full bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.key} value={p.key} className="bg-popover text-popover-foreground">
                  {p.name}
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
              <GithubIcon className="size-3" />
              <a
                href={`https://github.com/${currentProject.repo}`}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
              >
                {currentProject.repo}
              </a>
              <ExternalLink className="size-2.5 ml-auto opacity-70" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground">
              {selectedKey}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <Badge
                  variant={isActive ? 'secondary' : 'outline'}
                  className="size-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Area */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{user?.name || 'Admin Správce'}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@tickethub.local'}</div>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="size-8 p-0 text-muted-foreground hover:text-destructive"
              title={t.app.logout}
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

