CREATE OR REPLACE VIEW v_ticket_overview AS
SELECT 
    t.name AS ticket_name,
    p.name AS project_name,
    t.priority,
    t.state,
    author.name AS author_name,
    COALESCE(assignee.name, 'Unassigned') AS assignee_name,
    COALESCE(SUM(wr.work_hours), 0.00) AS total_logged_hours,
    t.created_at::DATE AS created_date
FROM ticket t
-- 1. INNER JOIN: Každý tiket musí mít projekt a autora
INNER JOIN project p ON t.project_id = p.project_id
INNER JOIN users author ON t.author_id = author.user_id

-- 2. LEFT JOIN: Řešitel (assignee) může být NULL (tiket ještě nikdo nepřevzal)
LEFT JOIN users assignee ON t.assignee_id = assignee.user_id

-- 3. LEFT JOIN: Tiket nemusí mít zatím žádný výkaz práce (0 odpracovaných hodin)
LEFT JOIN work_report wr ON t.ticket_id = wr.ticket_id

GROUP BY 
    t.ticket_id,
    t.name, 
    p.name, 
    t.priority, 
    t.state, 
    author.name, 
    assignee.name, 
    t.created_at;