export interface MockUser {
  user_id: number;
  name: string;
  email: string;
  role: string;
  hourly_rate: number;
  is_admin: boolean;
  avatar_url?: string;
  github_username?: string;
  password_hash: string;
}

export interface MockProject {
  project_id: number;
  name: string;
  description: string;
  supervisor_id: number;
  budget: number;
  active: boolean;
  project_key: string;
  slug: string;
  github_repo_url: string;
  github_repo_owner: string;
  github_repo_name: string;
  github_default_branch: string;
  status: string;
  currency: string;
  default_hourly_rate: number;
  budget_alert_threshold: number;
  created_at: string;
}

export interface MockTicket {
  ticket_id: number;
  project_id: number;
  author_id: number;
  assignee_id?: number | null;
  parent_ticket_id?: number | null;
  name: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  state: 'New' | 'In Progress' | 'Resolved' | 'Closed';
  ticket_number: number;
  ticket_type: 'Issue' | 'Bug' | 'Feature' | 'Task';
  estimated_hours: number;
  due_date?: string;
  milestone_id?: number | null;
  github_issue_number?: number | null;
  github_issue_url?: string;
  created_at: string;
  tags: { tag_id: number; name: string; color_hex: string }[];
}

export interface MockMilestone {
  milestone_id: number;
  project_id: number;
  title: string;
  description: string;
  due_date: string;
  state: 'Open' | 'Closed';
  budget_allocated: number;
}

export interface MockWorkReport {
  report_id: number;
  ticket_id: number;
  user_id: number;
  work_date: string;
  work_hours: number;
  work_description: string;
  hourly_rate: number;
  billable: boolean;
  created_at: string;
}

export interface MockBudgetLog {
  log_id: number;
  project_id: number;
  change_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  related_project_id?: number | null;
  changed_by_user_id?: number | null;
  note: string;
  created_at: string;
}

export interface MockComment {
  comment_id: number;
  ticket_id: number;
  author_id: number;
  content: string;
  created_at: string;
}

// Bcrypt hash for 'Heslo1234!' (10 rounds): $2a$10$w6yZ9m4N2D9sDqKz1l0iXu4B4wF9B5.b6nZ6r6f6q6h6k6m6p6s6u
const DEFAULT_HASH = '$2a$10$kP7p2rLkWZzS1j6h5w4Q.eKx5uJ5Z3a.e4d3c2b1a0z9y8x7w6v5u';

export const INITIAL_USERS: MockUser[] = [
  {
    user_id: 1,
    name: 'Admin Správce',
    email: 'admin@tickethub.local',
    role: 'Manažer',
    hourly_rate: 1200.00,
    is_admin: true,
    github_username: 'tickethub-admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces',
    password_hash: DEFAULT_HASH
  },
  {
    user_id: 2,
    name: 'Jan Novák',
    email: 'dev_novak@tickethub.local',
    role: 'Vývojář',
    hourly_rate: 850.00,
    is_admin: false,
    github_username: 'jannovak-dev',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=faces',
    password_hash: DEFAULT_HASH
  },
  {
    user_id: 3,
    name: 'Tereza Dvořáková',
    email: 'tereza.dvorakova@tickethub.local',
    role: 'Frontend Developer',
    hourly_rate: 800.00,
    is_admin: false,
    github_username: 'terezadvor',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces',
    password_hash: DEFAULT_HASH
  },
  {
    user_id: 4,
    name: 'Petr Svoboda',
    email: 'petr.svoboda@tickethub.local',
    role: 'QA Tester',
    hourly_rate: 650.00,
    is_admin: false,
    github_username: 'psvoboda-qa',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=128&h=128&fit=crop&crop=faces',
    password_hash: DEFAULT_HASH
  },
  {
    user_id: 5,
    name: 'Martin Černý',
    email: 'martin.cerny@tickethub.local',
    role: 'DevOps',
    hourly_rate: 950.00,
    is_admin: false,
    github_username: 'mcerny-ops',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces',
    password_hash: DEFAULT_HASH
  }
];

export const INITIAL_PROJECTS: MockProject[] = [
  {
    project_id: 1,
    name: 'TicketHub Platform',
    description: 'Centrální systém pro správu úkolů, rozpočtů a vykazování času s integrací na GitHub.',
    supervisor_id: 1,
    budget: 350000.00,
    active: true,
    project_key: 'TH',
    slug: 'tickethub-platform',
    github_repo_url: 'https://github.com/my-org/tickethub-platform',
    github_repo_owner: 'my-org',
    github_repo_name: 'tickethub-platform',
    github_default_branch: 'main',
    status: 'Active',
    currency: 'CZK',
    default_hourly_rate: 850.00,
    budget_alert_threshold: 80.00,
    created_at: '2026-09-01T09:00:00Z'
  },
  {
    project_id: 2,
    name: 'Mobile Gateway API',
    description: 'REST a GraphQL rozhraní pro mobilní klienty a externí platební brány.',
    supervisor_id: 1,
    budget: 180000.00,
    active: true,
    project_key: 'API',
    slug: 'mobile-gateway-api',
    github_repo_url: 'https://github.com/my-org/mobile-gateway-api',
    github_repo_owner: 'my-org',
    github_repo_name: 'mobile-gateway-api',
    github_default_branch: 'master',
    status: 'Active',
    currency: 'CZK',
    default_hourly_rate: 900.00,
    budget_alert_threshold: 85.00,
    created_at: '2026-09-10T10:30:00Z'
  },
  {
    project_id: 3,
    name: 'Cloud Infrastructure & CI/CD',
    description: 'Automatizace nasazování, Docker kontejnery a monitoring v Kubernetes.',
    supervisor_id: 5,
    budget: 120000.00,
    active: true,
    project_key: 'INFRA',
    slug: 'cloud-infrastructure',
    github_repo_url: 'https://github.com/my-org/infra-gitops',
    github_repo_owner: 'my-org',
    github_repo_name: 'infra-gitops',
    github_default_branch: 'main',
    status: 'Active',
    currency: 'CZK',
    default_hourly_rate: 950.00,
    budget_alert_threshold: 75.00,
    created_at: '2026-09-15T14:00:00Z'
  }
];

export const INITIAL_MILESTONES: MockMilestone[] = [
  {
    milestone_id: 1,
    project_id: 1,
    title: 'Milestone v1.0 - Core Launch',
    description: 'Spuštění základního rozhraní pro správu tiketů a projektů',
    due_date: '2026-11-15',
    state: 'Open',
    budget_allocated: 150000.00
  },
  {
    milestone_id: 2,
    project_id: 1,
    title: 'Milestone v1.1 - Timesheet & Finance',
    description: 'Vykazování práce, stopky a převody rozpočtů',
    due_date: '2026-12-01',
    state: 'Open',
    budget_allocated: 100000.00
  },
  {
    milestone_id: 3,
    project_id: 2,
    title: 'API v2.0 Release',
    description: 'Podpora webhooků a OAuth tokenů',
    due_date: '2026-11-30',
    state: 'Open',
    budget_allocated: 90000.00
  }
];

export const INITIAL_TICKETS: MockTicket[] = [
  {
    ticket_id: 1,
    project_id: 1,
    author_id: 1,
    assignee_id: 2,
    parent_ticket_id: null,
    name: 'Implementovat přihlašování a session tokeny',
    description: 'Vytvořit bezpečný přihlašovací formulář s HTTP-only cookies a bcrypt hashováním hesel.',
    priority: 'Critical',
    state: 'In Progress',
    ticket_number: 1,
    ticket_type: 'Feature',
    estimated_hours: 12.0,
    due_date: '2026-10-25',
    milestone_id: 1,
    github_issue_number: 101,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/101',
    created_at: '2026-10-01T08:00:00Z',
    tags: [{ tag_id: 1, name: 'Security', color_hex: '#ef4444' }, { tag_id: 2, name: 'Backend', color_hex: '#3b82f6' }]
  },
  {
    ticket_id: 2,
    project_id: 1,
    author_id: 1,
    assignee_id: 3,
    parent_ticket_id: null,
    name: 'Design komponent pro přehled projektů',
    description: 'Navrhnout karty projektů se statistikami rozpočtu a rychlými odkazy na GitHub repozitář.',
    priority: 'High',
    state: 'In Progress',
    ticket_number: 2,
    ticket_type: 'Feature',
    estimated_hours: 16.0,
    due_date: '2026-10-28',
    milestone_id: 1,
    github_issue_number: 102,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/102',
    created_at: '2026-10-02T10:00:00Z',
    tags: [{ tag_id: 3, name: 'Frontend', color_hex: '#10b981' }, { tag_id: 4, name: 'UI/UX', color_hex: '#8b5cf6' }]
  },
  {
    ticket_id: 3,
    project_id: 1,
    author_id: 2,
    assignee_id: 4,
    parent_ticket_id: null,
    name: 'Oprava validace formátu emailu při registraci',
    description: 'Zajistit správnou normalizaci a kontrolu diakritiky u emailových adres.',
    priority: 'Medium',
    state: 'Resolved',
    ticket_number: 3,
    ticket_type: 'Bug',
    estimated_hours: 4.0,
    due_date: '2026-10-15',
    milestone_id: 1,
    github_issue_number: 103,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/103',
    created_at: '2026-10-03T11:30:00Z',
    tags: [{ tag_id: 5, name: 'Bug', color_hex: '#f59e0b' }, { tag_id: 6, name: 'QA', color_hex: '#06b6d4' }]
  },
  {
    ticket_id: 4,
    project_id: 1,
    author_id: 1,
    assignee_id: 2,
    parent_ticket_id: 1,
    name: 'Nastavení middleware pro ochranu privátních rout',
    description: 'Podúkol: Zabezpečení dashboardu a admin stránek před neoprávněným přístupem.',
    priority: 'High',
    state: 'In Progress',
    ticket_number: 4,
    ticket_type: 'Task',
    estimated_hours: 6.0,
    due_date: '2026-10-20',
    milestone_id: 1,
    github_issue_number: 104,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/104',
    created_at: '2026-10-04T09:15:00Z',
    tags: [{ tag_id: 1, name: 'Security', color_hex: '#ef4444' }]
  },
  {
    ticket_id: 5,
    project_id: 2,
    author_id: 1,
    assignee_id: 2,
    parent_ticket_id: null,
    name: 'Implementovat webhook pro synchronizaci commitů z GitHubu',
    description: 'Endpoint přijímající push eventy z GitHub repozitáře a párující hash ke konkrétnímu tiketu.',
    priority: 'Critical',
    state: 'New',
    ticket_number: 1,
    ticket_type: 'Feature',
    estimated_hours: 14.0,
    due_date: '2026-11-10',
    milestone_id: 3,
    github_issue_number: 1,
    github_issue_url: 'https://github.com/my-org/mobile-gateway-api/issues/1',
    created_at: '2026-10-05T14:00:00Z',
    tags: [{ tag_id: 2, name: 'Backend', color_hex: '#3b82f6' }]
  },
  {
    ticket_id: 6,
    project_id: 1,
    author_id: 2,
    assignee_id: 3,
    parent_ticket_id: 4, // Level 2 (child of 4, grandchild of 1)
    name: 'Validace a extrakce JWT session tokenu v Edge Runtime',
    description: 'Dílčí úkol 2. úrovně: optimalizace výkonu parsování hlaviček Authorization bez blokování SSR.',
    priority: 'High',
    state: 'In Progress',
    ticket_number: 5,
    ticket_type: 'Task',
    estimated_hours: 4.0,
    due_date: '2026-10-22',
    milestone_id: 1,
    github_issue_number: 105,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/105',
    created_at: '2026-10-05T10:00:00Z',
    tags: [{ tag_id: 1, name: 'Security', color_hex: '#ef4444' }]
  },
  {
    ticket_id: 7,
    project_id: 1,
    author_id: 2,
    assignee_id: 2,
    parent_ticket_id: 6, // Level 3 (child of 6, great-grandchild of 1)
    name: 'Implementace rotace refresh tokenů a blacklist mezipaměti',
    description: 'Dílčí úkol 3. úrovně: bezpečné zneplatnění kompromitovaných session tokenů po odhlášení uživatele.',
    priority: 'High',
    state: 'In Progress',
    ticket_number: 6,
    ticket_type: 'Task',
    estimated_hours: 5.0,
    due_date: '2026-10-24',
    milestone_id: 1,
    github_issue_number: 106,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/106',
    created_at: '2026-10-06T11:00:00Z',
    tags: [{ tag_id: 1, name: 'Security', color_hex: '#ef4444' }]
  },
  {
    ticket_id: 8,
    project_id: 1,
    author_id: 1,
    assignee_id: 4,
    parent_ticket_id: 7, // Level 4 (child of 7)
    name: 'Šifrování payloadu session pomocí AES-256-GCM',
    description: 'Dílčí úkol 4. úrovně: kryptografické zajištění důvěrnosti klientských cookie proti tampering.',
    priority: 'Critical',
    state: 'New',
    ticket_number: 7,
    ticket_type: 'Task',
    estimated_hours: 3.5,
    due_date: '2026-10-26',
    milestone_id: 1,
    github_issue_number: 107,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/107',
    created_at: '2026-10-07T08:30:00Z',
    tags: [{ tag_id: 1, name: 'Security', color_hex: '#ef4444' }]
  },
  {
    ticket_id: 9,
    project_id: 1,
    author_id: 1,
    assignee_id: 4,
    parent_ticket_id: 8, // Level 5 (child of 8)
    name: 'Automatické integrační testy pro detekci replay útoků',
    description: 'Dílčí úkol 5. úrovně: Playwright e2e a security testy ověřující znovupoužití expirovaných tokenů.',
    priority: 'Medium',
    state: 'New',
    ticket_number: 8,
    ticket_type: 'Task',
    estimated_hours: 2.5,
    due_date: '2026-10-28',
    milestone_id: 1,
    github_issue_number: 108,
    github_issue_url: 'https://github.com/my-org/tickethub-platform/issues/108',
    created_at: '2026-10-07T12:00:00Z',
    tags: [{ tag_id: 6, name: 'QA', color_hex: '#06b6d4' }]
  }
];

export const INITIAL_WORK_REPORTS: MockWorkReport[] = [
  {
    report_id: 1,
    ticket_id: 1,
    user_id: 2,
    work_date: '2026-10-06',
    work_hours: 4.5,
    work_description: 'Vytvoření JWT token helperů a cookie session enkapsulace',
    hourly_rate: 850.00,
    billable: true,
    created_at: '2026-10-06T17:00:00Z'
  },
  {
    report_id: 2,
    ticket_id: 2,
    user_id: 3,
    work_date: '2026-10-06',
    work_hours: 6.0,
    work_description: 'Návrh komponent ProjectCard a BudgetBar v shadcn',
    hourly_rate: 800.00,
    billable: true,
    created_at: '2026-10-06T18:00:00Z'
  },
  {
    report_id: 3,
    ticket_id: 3,
    user_id: 4,
    work_date: '2026-10-07',
    work_hours: 3.0,
    work_description: 'Testování registrace a ověření regex validace',
    hourly_rate: 650.00,
    billable: true,
    created_at: '2026-10-07T15:30:00Z'
  }
];

export const INITIAL_BUDGET_LOGS: MockBudgetLog[] = [
  {
    log_id: 1,
    project_id: 1,
    change_type: 'Initial Allocation',
    amount: 300000.00,
    balance_before: 0.00,
    balance_after: 300000.00,
    related_project_id: null,
    changed_by_user_id: 1,
    note: 'Schválený počáteční rozpočet projektu',
    created_at: '2026-09-01T09:00:00Z'
  },
  {
    log_id: 2,
    project_id: 1,
    change_type: 'Transfer In',
    amount: 50000.00,
    balance_before: 300000.00,
    balance_after: 350000.00,
    related_project_id: 2,
    changed_by_user_id: 1,
    note: 'Posílení rozpočtu z projektu Mobile Gateway API',
    created_at: '2026-09-20T11:00:00Z'
  }
];

export const INITIAL_COMMENTS: MockComment[] = [
  {
    comment_id: 1,
    ticket_id: 1,
    author_id: 1,
    content: 'Nezapomeň ošetřit expiraci JWT session tokenu na 7 dní.',
    created_at: '2026-10-02T09:00:00Z'
  },
  {
    comment_id: 2,
    ticket_id: 1,
    author_id: 2,
    content: 'Jasně, použijeme jose s HS256 a httpOnly cookies se SameSite=Lax.',
    created_at: '2026-10-02T10:15:00Z'
  }
];

