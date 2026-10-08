import { Pool } from 'pg';
import { db } from '@/prisma/db';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TICKETS,
  INITIAL_MILESTONES,
  INITIAL_WORK_REPORTS,
  INITIAL_BUDGET_LOGS,
  INITIAL_COMMENTS,
  MockUser,
  MockProject,
  MockTicket,
  MockMilestone,
  MockWorkReport,
  MockBudgetLog,
  MockComment
} from './mock-data';

export { db };

// Global in-memory fallback state if PostgreSQL instance is unreachable (e.g. inside devcontainer)
class MemoryDataStore {
  users: MockUser[] = [...INITIAL_USERS];
  projects: MockProject[] = [...INITIAL_PROJECTS];
  tickets: MockTicket[] = [...INITIAL_TICKETS];
  milestones: MockMilestone[] = [...INITIAL_MILESTONES];
  workReports: MockWorkReport[] = [...INITIAL_WORK_REPORTS];
  budgetLogs: MockBudgetLog[] = [...INITIAL_BUDGET_LOGS];
  comments: MockComment[] = [...INITIAL_COMMENTS];

  nextTicketId = 100;
  nextReportId = 100;
  nextLogId = 100;
  nextCommentId = 100;
  nextUserId = 100;
  nextProjectId = 100;
  nextMilestoneId = 100;
}

const memoryStore = new MemoryDataStore();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tickethub:zTAVD3ttOCGb9hustsLT@192.168.1.101:5436/tickethub',
  connectionTimeoutMillis: 500,
  idleTimeoutMillis: 5000,
});

let isPostgresAvailable: boolean | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 30000;

async function checkPostgresConnection(): Promise<boolean> {
  const now = performance.now();
  if (isPostgresAvailable !== null && (now - lastCheckTime) < CHECK_INTERVAL_MS) {
    return isPostgresAvailable;
  }
  lastCheckTime = now;
  try {
    const client = await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection check timeout')), 250))
    ]);
    client.release();
    isPostgresAvailable = true;
    return true;
  } catch {
    isPostgresAvailable = false;
    return false;
  }
}

async function queryDb<T = any>(text: string, params: any[] = []): Promise<T[] | null> {
  const canConnect = await checkPostgresConnection();
  if (!canConnect) {
    return null;
  }
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err: any) {
    return null;
  }
}

// ============================================================================
// STORED PROCEDURES & PL/pgSQL FUNCTIONS
// ============================================================================

export async function executeCalculateTicketPrice(ticketId: number): Promise<number> {
  const rows = await queryDb<{ price: string }>(
    'SELECT fn_calculate_ticket_price($1) AS price',
    [ticketId]
  );
  if (rows && rows[0]?.price) {
    return parseFloat(rows[0].price);
  }

  // Fallback calculation in memory
  const ticket = memoryStore.tickets.find(t => t.ticket_id === ticketId);
  if (!ticket) return 0;
  const project = memoryStore.projects.find(p => p.project_id === ticket.project_id);
  const reports = memoryStore.workReports.filter(r => r.ticket_id === ticketId && r.billable);
  return reports.reduce((acc, r) => acc + (r.work_hours * (r.hourly_rate || project?.default_hourly_rate || 750)), 0);
}

export async function executeCalculateProjectExpenses(projectId: number, rate?: number): Promise<number> {
  const rows = await queryDb<{ expenses: string }>(
    'SELECT fn_calculate_project_expenses_v2($1, $2) AS expenses',
    [projectId, rate ?? null]
  );
  if (rows && rows[0]?.expenses) {
    return parseFloat(rows[0].expenses);
  }

  // Fallback calculation in memory
  const project = memoryStore.projects.find(p => p.project_id === projectId);
  if (!project) return 0;
  const tickets = memoryStore.tickets.filter(t => t.project_id === projectId);
  const ticketIds = new Set(tickets.map(t => t.ticket_id));
  const reports = memoryStore.workReports.filter(r => ticketIds.has(r.ticket_id) && r.billable);
  return reports.reduce((acc, r) => acc + (r.work_hours * (rate ?? r.hourly_rate ?? project.default_hourly_rate ?? 750)), 0);
}

export async function executeTransferBudget(
  sourceProjectId: number,
  targetProjectId: number,
  amount: number,
  userId?: number,
  note: string = 'Budget Transfer'
): Promise<{ success: boolean; message: string }> {
  try {
    const rows = await queryDb(
      'CALL pr_transfer_project_budget_v2($1, $2, $3, $4, $5)',
      [sourceProjectId, targetProjectId, amount, userId ?? null, note]
    );
    if (rows !== null) {
      return { success: true, message: `Successfully transferred ${amount} between projects via procedure.` };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Database error executing procedure' };
  }

  // Memory fallback transfer
  const source = memoryStore.projects.find(p => p.project_id === sourceProjectId);
  const target = memoryStore.projects.find(p => p.project_id === targetProjectId);
  if (!source || !target) {
    return { success: false, message: 'Source or target project not found' };
  }
  if (source.budget < amount) {
    return { success: false, message: `Insufficient budget on project ${source.name}` };
  }

  const sBefore = source.budget;
  const tBefore = target.budget;
  source.budget -= amount;
  target.budget += amount;

  memoryStore.budgetLogs.push({
    log_id: memoryStore.nextLogId++,
    project_id: sourceProjectId,
    change_type: 'Transfer Out',
    amount: -amount,
    balance_before: sBefore,
    balance_after: source.budget,
    related_project_id: targetProjectId,
    changed_by_user_id: userId ?? 1,
    note,
    created_at: new Date().toISOString()
  });

  memoryStore.budgetLogs.push({
    log_id: memoryStore.nextLogId++,
    project_id: targetProjectId,
    change_type: 'Transfer In',
    amount: amount,
    balance_before: tBefore,
    balance_after: target.budget,
    related_project_id: sourceProjectId,
    changed_by_user_id: userId ?? 1,
    note,
    created_at: new Date().toISOString()
  });

  return { success: true, message: `Successfully transferred ${amount} ${source.currency} from ${source.name} to ${target.name}.` };
}

export async function executeCloseResolvedTickets(adminUserId: number): Promise<{ count: number }> {
  const rows = await queryDb<{ count: number }>(
    'CALL pr_close_resolved_tickets($1)',
    [adminUserId]
  );
  if (rows !== null) {
    return { count: rows[0]?.count ?? 1 };
  }

  // Memory fallback
  let count = 0;
  for (const t of memoryStore.tickets) {
    if (t.state === 'Resolved') {
      t.state = 'Closed';
      count++;
    }
  }
  return { count };
}

// ============================================================================
// PROJECT REPOSITORY
// ============================================================================

export async function getProjects() {
  const rows = await queryDb(`SELECT * FROM v_project_summary ORDER BY project_id ASC`);
  if (rows && rows.length > 0) return rows;

  return memoryStore.projects.map(p => {
    const pTickets = memoryStore.tickets.filter(t => t.project_id === p.project_id);
    const completed = pTickets.filter(t => t.state === 'Closed' || t.state === 'Resolved').length;
    const pTicketIds = new Set(pTickets.map(t => t.ticket_id));
    const pReports = memoryStore.workReports.filter(r => pTicketIds.has(r.ticket_id));
    const totalHours = pReports.reduce((acc, r) => acc + r.work_hours, 0);
    const expenses = pReports.filter(r => r.billable).reduce((acc, r) => acc + r.work_hours * (r.hourly_rate || p.default_hourly_rate), 0);
    const supervisor = memoryStore.users.find(u => u.user_id === p.supervisor_id);

    return {
      project_id: p.project_id,
      project_name: p.name,
      project_key: p.project_key,
      slug: p.slug,
      github_repo_url: p.github_repo_url,
      github_default_branch: p.github_default_branch,
      project_status: p.status,
      active: p.active,
      currency: p.currency,
      budget: p.budget,
      supervisor_name: supervisor?.name || 'Admin',
      supervisor_email: supervisor?.email || 'admin@tickethub.local',
      total_hours_logged: totalHours,
      current_expenses: expenses,
      remaining_budget: p.budget - expenses,
      budget_consumed_pct: p.budget > 0 ? (expenses / p.budget) * 100 : 0,
      budget_health_status: expenses > p.budget ? 'OVER_BUDGET' : (expenses >= p.budget * 0.8 ? 'WARNING_NEAR_LIMIT' : 'HEALTHY'),
      total_tickets: pTickets.length,
      open_tickets: pTickets.length - completed,
      completed_tickets: completed,
      ticket_completion_pct: pTickets.length > 0 ? (completed / pTickets.length) * 100 : 0,
      team_member_count: 4,
      created_at: p.created_at
    };
  });
}

export async function getProjectByKey(key: string) {
  const projects = await getProjects();
  return projects.find((p: any) => p.project_key?.toLowerCase() === key.toLowerCase() || p.slug === key);
}

export async function createProject(data: Partial<MockProject>): Promise<MockProject> {
  const newProj: MockProject = {
    project_id: memoryStore.nextProjectId++,
    name: data.name || 'Nový Projekt',
    description: data.description || '',
    supervisor_id: data.supervisor_id || 1,
    budget: data.budget || 100000.00,
    active: true,
    project_key: data.project_key?.toUpperCase() || `P${memoryStore.projects.length + 1}`,
    slug: data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `proj-${memoryStore.projects.length + 1}`,
    github_repo_url: data.github_repo_url || '',
    github_repo_owner: data.github_repo_owner || '',
    github_repo_name: data.github_repo_name || '',
    github_default_branch: data.github_default_branch || 'main',
    status: 'Active',
    currency: data.currency || 'CZK',
    default_hourly_rate: data.default_hourly_rate || 750.00,
    budget_alert_threshold: data.budget_alert_threshold || 80.00,
    created_at: new Date().toISOString()
  };

  memoryStore.projects.push(newProj);
  memoryStore.budgetLogs.push({
    log_id: memoryStore.nextLogId++,
    project_id: newProj.project_id,
    change_type: 'Initial Allocation',
    amount: newProj.budget,
    balance_before: 0.00,
    balance_after: newProj.budget,
    related_project_id: null,
    changed_by_user_id: newProj.supervisor_id,
    note: 'Počáteční alokace rozpočtu nového projektu',
    created_at: new Date().toISOString()
  });

  return newProj;
}

// ============================================================================
// TICKETS REPOSITORY
// ============================================================================

export async function getTickets(projectId?: number) {
  const rows = await queryDb(`SELECT * FROM v_ticket_detail ${projectId ? 'WHERE project_id = $1' : ''} ORDER BY ticket_id DESC`, projectId ? [projectId] : []);
  if (rows && rows.length > 0) return rows;

  let tickets = memoryStore.tickets;
  if (projectId) {
    tickets = tickets.filter(t => t.project_id === projectId);
  }

  return tickets.map(t => {
    const project = memoryStore.projects.find(p => p.project_id === t.project_id);
    const author = memoryStore.users.find(u => u.user_id === t.author_id);
    const assignee = memoryStore.users.find(u => u.user_id === t.assignee_id);
    const milestone = memoryStore.milestones.find(m => m.milestone_id === t.milestone_id);
    const reports = memoryStore.workReports.filter(r => r.ticket_id === t.ticket_id);
    const loggedHours = reports.reduce((acc, r) => acc + r.work_hours, 0);
    const price = reports.filter(r => r.billable).reduce((acc, r) => acc + r.work_hours * (r.hourly_rate || project?.default_hourly_rate || 750), 0);

    return {
      ticket_id: t.ticket_id,
      project_id: t.project_id,
      project_name: project?.name || 'Project',
      project_key: project?.project_key || 'PRJ',
      ticket_number: t.ticket_number,
      ticket_code: `${project?.project_key || 'PRJ'}-${t.ticket_number}`,
      name: t.name,
      description: t.description,
      priority: t.priority,
      state: t.state,
      ticket_type: t.ticket_type,
      author_id: t.author_id,
      author_name: author?.name || 'System',
      assignee_id: t.assignee_id,
      assignee_name: assignee?.name || 'Unassigned',
      milestone_id: t.milestone_id,
      milestone_title: milestone?.title || null,
      estimated_hours: t.estimated_hours,
      logged_hours: loggedHours,
      remaining_hours: Math.max(0, t.estimated_hours - loggedHours),
      ticket_total_price: price,
      github_issue_number: t.github_issue_number,
      github_issue_url: t.github_issue_url,
      parent_ticket_id: t.parent_ticket_id,
      created_at: t.created_at,
      tags: t.tags
    };
  });
}

export async function getTicketById(ticketId: number) {
  const tickets = await getTickets();
  return tickets.find((t: any) => t.ticket_id === ticketId);
}

export async function getSubTickets(parentTicketId: number) {
  const tickets = await getTickets();
  return tickets.filter((t: any) => t.parent_ticket_id === parentTicketId);
}

export async function getParentTicket(parentTicketId: number | null | undefined) {
  if (!parentTicketId) return null;
  return getTicketById(parentTicketId);
}

/**
 * Recursive Ancestor Chain (walks UP to the root)
 * Returns [Root, Level 1, Level 2, ... Immediate Parent]
 */
export async function getTicketAncestors(ticketId: number): Promise<any[]> {
  const allTickets = await getTickets();
  const current = allTickets.find((t: any) => t.ticket_id === ticketId);
  if (!current || !current.parent_ticket_id) return [];

  const chain: any[] = [];
  let currParentId: number | null = current.parent_ticket_id;
  const visited = new Set<number>();

  while (currParentId && !visited.has(currParentId)) {
    visited.add(currParentId);
    const parent = allTickets.find((t: any) => t.ticket_id === currParentId);
    if (!parent) break;
    chain.unshift(parent);
    currParentId = parent.parent_ticket_id || null;
  }

  return chain.map((item, index) => ({
    ...item,
    level: index // 0 = Root, 1 = Sub-task, 2 = Sub-sub-task, etc.
  }));
}

/**
 * Recursive Descendant Tree (walks DOWN infinitely to 2nd, 3rd, 4th, 5th... Nth level)
 * Returns flat list ordered by depth-first traversal, tagged with exact depth.
 */
export async function getTicketDescendantTree(ticketId: number): Promise<any[]> {
  const allTickets = await getTickets();
  const results: any[] = [];
  const visited = new Set<number>();

  function walk(parentId: number, depth: number) {
    const children = allTickets.filter((t: any) => t.parent_ticket_id === parentId);
    for (const child of children) {
      if (visited.has(child.ticket_id)) continue;
      visited.add(child.ticket_id);
      results.push({ ...child, depth });
      walk(child.ticket_id, depth + 1);
    }
  }

  walk(ticketId, 1);
  return results;
}

export async function getTicketWorkReports(ticketId: number) {
  const reports = await getTimesheet();
  return reports.filter((r: any) => r.ticket_id === ticketId);
}

export async function createTicket(data: Partial<MockTicket>): Promise<any> {
  const project = memoryStore.projects.find(p => p.project_id === data.project_id);
  const nextNum = memoryStore.tickets.filter(t => t.project_id === data.project_id).length + 1;

  const newTicket: MockTicket = {
    ticket_id: memoryStore.nextTicketId++,
    project_id: data.project_id || 1,
    author_id: data.author_id || 1,
    assignee_id: data.assignee_id || null,
    parent_ticket_id: data.parent_ticket_id || null,
    name: data.name || 'Nový úkol',
    description: data.description || '',
    priority: data.priority || 'Medium',
    state: data.state || 'New',
    ticket_number: nextNum,
    ticket_type: data.ticket_type || 'Issue',
    estimated_hours: data.estimated_hours || 0,
    due_date: data.due_date,
    milestone_id: data.milestone_id || null,
    github_issue_number: data.github_issue_number || null,
    github_issue_url: data.github_issue_url || '',
    created_at: new Date().toISOString(),
    tags: data.tags || []
  };

  memoryStore.tickets.push(newTicket);
  return getTicketById(newTicket.ticket_id);
}

export async function updateTicketState(ticketId: number, newState: MockTicket['state']) {
  const ticket = memoryStore.tickets.find(t => t.ticket_id === ticketId);
  if (ticket) {
    ticket.state = newState;
    return true;
  }
  return false;
}

// ============================================================================
// WORK REPORTS & TIMESHEETS
// ============================================================================

export async function getTimesheet(userId?: number) {
  const rows = await queryDb(`SELECT * FROM v_user_timesheet ${userId ? 'WHERE user_id = $1' : ''} ORDER BY work_date DESC`, userId ? [userId] : []);
  if (rows && rows.length > 0) return rows;

  let reports = memoryStore.workReports;
  if (userId) {
    reports = reports.filter(r => r.user_id === userId);
  }

  return reports.map(r => {
    const user = memoryStore.users.find(u => u.user_id === r.user_id);
    const ticket = memoryStore.tickets.find(t => t.ticket_id === r.ticket_id);
    const project = memoryStore.projects.find(p => p.project_id === ticket?.project_id);

    return {
      report_id: r.report_id,
      user_id: r.user_id,
      user_name: user?.name || 'Uživatel',
      user_email: user?.email || '',
      project_id: project?.project_id || 1,
      project_name: project?.name || 'Project',
      project_key: project?.project_key || 'PRJ',
      ticket_id: r.ticket_id,
      ticket_code: `${project?.project_key || 'PRJ'}-${ticket?.ticket_number || 1}`,
      ticket_name: ticket?.name || 'Úkol',
      ticket_state: ticket?.state || 'In Progress',
      ticket_priority: ticket?.priority || 'Medium',
      work_date: r.work_date,
      work_hours: r.work_hours,
      applied_hourly_rate: r.hourly_rate,
      total_cost: r.work_hours * r.hourly_rate,
      billable: r.billable,
      work_description: r.work_description,
      logged_at: r.created_at
    };
  });
}

export async function createWorkReport(data: {
  ticket_id: number;
  user_id: number;
  work_hours: number;
  work_description: string;
  work_date?: string;
  hourly_rate?: number;
  billable?: boolean;
}) {
  const ticket = memoryStore.tickets.find(t => t.ticket_id === data.ticket_id);
  const project = memoryStore.projects.find(p => p.project_id === ticket?.project_id);
  const user = memoryStore.users.find(u => u.user_id === data.user_id);

  const rate = data.hourly_rate ?? user?.hourly_rate ?? project?.default_hourly_rate ?? 750.00;

  const newReport: MockWorkReport = {
    report_id: memoryStore.nextReportId++,
    ticket_id: data.ticket_id,
    user_id: data.user_id,
    work_date: data.work_date || new Date().toISOString().split('T')[0],
    work_hours: data.work_hours,
    work_description: data.work_description,
    hourly_rate: rate,
    billable: data.billable ?? true,
    created_at: new Date().toISOString()
  };

  memoryStore.workReports.unshift(newReport);
  return newReport;
}

// ============================================================================
// MILESTONES & BUDGET LOGS & USERS
// ============================================================================

export async function getMilestones(projectId?: number) {
  let list = memoryStore.milestones;
  if (projectId) {
    list = list.filter(m => m.project_id === projectId);
  }
  return list.map(m => {
    const p = memoryStore.projects.find(proj => proj.project_id === m.project_id);
    const mTickets = memoryStore.tickets.filter(t => t.milestone_id === m.milestone_id);
    const completed = mTickets.filter(t => t.state === 'Closed' || t.state === 'Resolved').length;

    return {
      ...m,
      project_name: p?.name || '',
      project_key: p?.project_key || 'PRJ',
      total_tickets: mTickets.length,
      open_tickets: mTickets.length - completed,
      closed_tickets: completed,
      completion_pct: mTickets.length > 0 ? (completed / mTickets.length) * 100 : 0
    };
  });
}

export async function getProjectBudgetLogs(projectId: number) {
  return memoryStore.budgetLogs
    .filter(l => l.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getUsers() {
  return memoryStore.users.map(({ password_hash, ...rest }) => rest);
}

export async function getUserByEmail(email: string) {
  return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function getComments(ticketId: number) {
  return memoryStore.comments
    .filter(c => c.ticket_id === ticketId)
    .map(c => {
      const author = memoryStore.users.find(u => u.user_id === c.author_id);
      return {
        ...c,
        author_name: author?.name || 'Uživatel',
        author_avatar: author?.avatar_url
      };
    });
}

export async function createComment(ticketId: number, authorId: number, content: string) {
  const newComment: MockComment = {
    comment_id: memoryStore.nextCommentId++,
    ticket_id: ticketId,
    author_id: authorId,
    content,
    created_at: new Date().toISOString()
  };
  memoryStore.comments.push(newComment);
  return newComment;
}

