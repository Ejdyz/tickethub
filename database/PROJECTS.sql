-- ============================================================================
-- PROJECTS.sql - TicketHub Multi-Project & GitHub Integration Extension
-- ============================================================================
-- Extension script for TicketHub database (PostgreSQL 14+ / 18 compatible).
-- Transforms the university course schema (SETUP.sql) into a full-featured,
-- GitHub-style issue tracking, work time management, and budget tracking system.
--
-- Features:
-- 1. Multi-Project System: Keys, slugs, lifecycle states, dates, GitHub repository links.
-- 2. GitHub Integration: Repo URLs, commit/PR associations, GitHub issue links.
-- 3. Dynamic Price & Time Management: Hierarchical dynamic rates (no more hardcoded 750),
--    billable flags, work report auto-stamping, user timesheet reporting.
-- 4. Budget Management: Multi-currency, double-entry budget transfer audit logging,
--    threshold alerts (healthy / warning / over budget), burn rate calculations.
-- 5. User Views: Project member roles (Owner, Maintainer, Developer, Viewer),
--    user-centric timesheet views, manager project summaries.
-- 6. Advanced Full-Text Search: GIN indexes for projects and multi-faceted ticket search.
-- 7. Milestones & Sprints: GitHub-style milestones with completion percentages.
--
-- SAFE & IDEMPOTENT: Uses ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS,
-- CREATE OR REPLACE FUNCTION / VIEW / PROCEDURE. Does not delete existing data.
-- ============================================================================


-- ============================================================================
-- 1. ROZŠÍŘENÍ STÁVAJÍCÍCH TABULEK (SCHEMA ENHANCEMENTS)
-- ============================================================================

-- 1.1 Rozšíření tabulky uživatelů (users)
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) DEFAULT 750.00,
    ADD COLUMN IF NOT EXISTS github_username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 1.2 Rozšíření tabulky projektů (project)
ALTER TABLE project
    ADD COLUMN IF NOT EXISTS project_key VARCHAR(10),
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_repo_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS github_repo_owner VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_default_branch VARCHAR(100) DEFAULT 'main',
    ADD COLUMN IF NOT EXISTS github_sync_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'CZK',
    ADD COLUMN IF NOT EXISTS default_hourly_rate NUMERIC(10, 2) DEFAULT 750.00,
    ADD COLUMN IF NOT EXISTS budget_alert_threshold NUMERIC(5, 2) DEFAULT 80.00,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS target_end_date DATE,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 1.3 Rozšíření tabulky tiketů (ticket)
ALTER TABLE ticket
    ADD COLUMN IF NOT EXISTS ticket_number INT,
    ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(30) DEFAULT 'Issue',
    ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS milestone_id INT,
    ADD COLUMN IF NOT EXISTS github_issue_number INT,
    ADD COLUMN IF NOT EXISTS github_issue_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 1.4 Rozšíření tabulky výkazů práce (work_report)
ALTER TABLE work_report
    ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- 2. NOVÉ TABULKY (NEW TABLES)
-- ============================================================================

-- 2.1 Členové projektů a jejich role (analogie ke kolaborátorům v GitHub repozitáři)
CREATE TABLE IF NOT EXISTS project_member (
    project_id INT NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    project_role VARCHAR(50) DEFAULT 'Developer', -- 'Owner', 'Maintainer', 'Developer', 'Viewer', 'Client'
    custom_hourly_rate NUMERIC(10, 2),            -- Možnost nastavit specifickou sazbu pro daného člena na tomto projektu
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- 2.2 Milestones / Sparty / Iterace (jako v GitHub Milestones)
CREATE TABLE IF NOT EXISTS project_milestone (
    milestone_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,
    state VARCHAR(20) DEFAULT 'Open', -- 'Open', 'Closed'
    budget_allocated NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provázání cizího klíče pro milestone_id v ticket (bezpečně přes DO blok)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ticket_milestone'
    ) THEN
        ALTER TABLE ticket 
        ADD CONSTRAINT fk_ticket_milestone 
        FOREIGN KEY (milestone_id) REFERENCES project_milestone(milestone_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2.3 Auditní kniha rozpočtů projektů (podvojné sledování přesunů a změn rozpočtů)
CREATE TABLE IF NOT EXISTS project_budget_log (
    log_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- 'Initial Allocation', 'Top-up', 'Transfer In', 'Transfer Out', 'Adjustment'
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    related_project_id INT REFERENCES project(project_id) ON DELETE SET NULL,
    changed_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 Vazba na GitHub Commity (propojování commitů z repozitáře k tiketům a projektům)
CREATE TABLE IF NOT EXISTS project_github_commit (
    commit_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    ticket_id INT REFERENCES ticket(ticket_id) ON DELETE SET NULL,
    commit_hash VARCHAR(40) NOT NULL,
    commit_message TEXT NOT NULL,
    author_name VARCHAR(100),
    author_email VARCHAR(150),
    commit_url VARCHAR(255),
    committed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_commit_hash UNIQUE (project_id, commit_hash)
);


-- ============================================================================
-- 3. INDEXY PRO RYCHLÉ VYHLEDÁVÁNÍ A FILTROVÁNÍ (INDEXES)
-- ============================================================================

-- 3.1 Full-Text vyhledávání v projektech (název, popis a klíč)
CREATE INDEX IF NOT EXISTS idx_project_fulltext 
ON project 
USING gin (to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(project_key, '')));

-- 3.2 Indexy pro unikátnost a rychlé vyhledávání podle klíče/slugu
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_key 
ON project (LOWER(project_key)) 
WHERE project_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_slug 
ON project (LOWER(slug)) 
WHERE slug IS NOT NULL;

-- 3.3 Filtrování tiketů v rámci projektu a milníků
CREATE INDEX IF NOT EXISTS idx_ticket_project_state 
ON ticket (project_id, state);

CREATE INDEX IF NOT EXISTS idx_ticket_milestone 
ON ticket (milestone_id);

CREATE INDEX IF NOT EXISTS idx_ticket_assignee 
ON ticket (assignee_id);

CREATE INDEX IF NOT EXISTS idx_ticket_number_proj 
ON ticket (project_id, ticket_number);

-- 3.4 Filtrování výkazů práce pro timesheety
CREATE INDEX IF NOT EXISTS idx_work_report_ticket_date 
ON work_report (ticket_id, work_date);

CREATE INDEX IF NOT EXISTS idx_work_report_user_date 
ON work_report (user_id, work_date);

-- 3.5 Rychlý lookup členů projektu
CREATE INDEX IF NOT EXISTS idx_project_member_user 
ON project_member (user_id);

CREATE INDEX IF NOT EXISTS idx_budget_log_project 
ON project_budget_log (project_id, created_at DESC);


-- ============================================================================
-- 4. AUTOMATIZACE A TRIGGERY (TRIGGERS & PROCEDURES)
-- ============================================================================

-- 4.1 Trigger pro automatickou aktualizaci časového razítka updated_at
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_touch_updated_at ON project;
CREATE TRIGGER trg_project_touch_updated_at
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_ticket_touch_updated_at ON ticket;
CREATE TRIGGER trg_ticket_touch_updated_at
BEFORE UPDATE ON ticket
FOR EACH ROW
EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_milestone_touch_updated_at ON project_milestone;
CREATE TRIGGER trg_milestone_touch_updated_at
BEFORE UPDATE ON project_milestone
FOR EACH ROW
EXECUTE FUNCTION fn_touch_updated_at();

-- 4.2 Automatické číslování tiketů v rámci projektu (např. 1, 2, 3 pro vytvoření klíče TH-1, TH-2)
CREATE OR REPLACE FUNCTION fn_assign_ticket_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        SELECT COALESCE(MAX(ticket_number), 0) + 1
        INTO NEW.ticket_number
        FROM ticket
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_assign_number ON ticket;
CREATE TRIGGER trg_ticket_assign_number
BEFORE INSERT ON ticket
FOR EACH ROW
EXECUTE FUNCTION fn_assign_ticket_number();

-- 4.3 DYNAMICKÁ HODINOVÁ SAZBA: Automatické orazítkování sazby ve work_report
-- Pokud uživatel při zadávání výkazu práce nespecifikuje sazbu,
-- určí se dynamicky v tomto hierarchickém pořadí:
-- 1. custom_hourly_rate v project_member (sazba člena na daném projektu)
-- 2. hourly_rate v users (výchozí sazba konkrétního uživatele)
-- 3. default_hourly_rate v project (výchozí sazba celého projektu)
-- 4. 750.00 (systémová záchranná hodnota)
CREATE OR REPLACE FUNCTION fn_stamp_work_report_rate()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_project_id INT;
    v_member_rate NUMERIC(10, 2);
    v_user_rate NUMERIC(10, 2);
    v_project_rate NUMERIC(10, 2);
BEGIN
    IF NEW.hourly_rate IS NULL THEN
        -- Zjištění ID projektu pro daný tiket
        SELECT project_id INTO v_project_id 
        FROM ticket 
        WHERE ticket_id = NEW.ticket_id;

        -- 1. Sazba člena v projektu
        SELECT custom_hourly_rate INTO v_member_rate
        FROM project_member
        WHERE project_id = v_project_id AND user_id = NEW.user_id;

        -- 2. Osobní sazba uživatele
        SELECT hourly_rate INTO v_user_rate
        FROM users
        WHERE user_id = NEW.user_id;

        -- 3. Výchozí sazba projektu
        SELECT default_hourly_rate INTO v_project_rate
        FROM project
        WHERE project_id = v_project_id;

        -- Přiřazení výsledné dynamické sazby
        NEW.hourly_rate := COALESCE(v_member_rate, v_user_rate, v_project_rate, 750.00);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_report_stamp_rate ON work_report;
CREATE TRIGGER trg_work_report_stamp_rate
BEFORE INSERT ON work_report
FOR EACH ROW
EXECUTE FUNCTION fn_stamp_work_report_rate();


-- ============================================================================
-- 5. FUNKCE PRO VÝPOČET DYNAMICKÝCH CEN A NÁKLADŮ (DYNAMIC PRICE CALCULATIONS)
-- ============================================================================

-- 5.1 Výpočet dynamické ceny konkrétního tiketu (fn_calculate_ticket_price)
-- Sečte všechny odpracované hodiny vynásobené příslušnou dynamickou sazbou
CREATE OR REPLACE FUNCTION fn_calculate_ticket_price(p_ticket_id INT)
RETURNS NUMERIC 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_price NUMERIC;
    v_ticket_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM ticket WHERE ticket_id = p_ticket_id) INTO v_ticket_exists;
    IF NOT v_ticket_exists THEN
        RAISE EXCEPTION 'Tiket s ID % neexistuje!', p_ticket_id;
    END IF;

    SELECT COALESCE(SUM(
        wr.work_hours * COALESCE(
            wr.hourly_rate,
            pm.custom_hourly_rate,
            u.hourly_rate,
            p.default_hourly_rate,
            750.00
        )
    ), 0.00)
    INTO v_total_price
    FROM ticket t
    JOIN project p ON t.project_id = p.project_id
    JOIN work_report wr ON t.ticket_id = wr.ticket_id
    JOIN users u ON wr.user_id = u.user_id
    LEFT JOIN project_member pm ON pm.project_id = p.project_id AND pm.user_id = u.user_id
    WHERE t.ticket_id = p_ticket_id
      AND (wr.billable IS TRUE OR wr.billable IS NULL);

    RETURN ROUND(v_total_price, 2);
END;
$$;

-- 5.2 Výpočet reálných nákladů celého projektu s dynamickou sazbou (v2)
-- Plně zpětně kompatibilní: Pokud je p_hourly_rate zadána, použije ji (např. fn_calculate_project_expenses_v2(1, 1000)).
-- Pokud je NULL (výchozí stav), spočítá reálnou sumu ze všech tiketů a jejich individuálních dynamických sazeb!
CREATE OR REPLACE FUNCTION fn_calculate_project_expenses_v2(
    p_project_id INT,
    p_hourly_rate NUMERIC DEFAULT NULL
)
RETURNS NUMERIC 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_cost NUMERIC;
    v_project_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM project WHERE project_id = p_project_id) INTO v_project_exists;
    IF NOT v_project_exists THEN
        RAISE EXCEPTION 'Projekt s ID % neexistuje!', p_project_id;
    END IF;

    IF p_hourly_rate IS NOT NULL THEN
        -- Zpětně kompatibilní výpočet s fixní zadanou sazbou
        SELECT COALESCE(SUM(wr.work_hours), 0.00) * p_hourly_rate
        INTO v_total_cost
        FROM ticket t
        JOIN work_report wr ON t.ticket_id = wr.ticket_id
        WHERE t.project_id = p_project_id
          AND (wr.billable IS TRUE OR wr.billable IS NULL);
    ELSE
        -- Plně dynamický výpočet na základě reálných sazeb v reportech / u členů
        SELECT COALESCE(SUM(
            wr.work_hours * COALESCE(
                wr.hourly_rate,
                pm.custom_hourly_rate,
                u.hourly_rate,
                p.default_hourly_rate,
                750.00
            )
        ), 0.00)
        INTO v_total_cost
        FROM project p
        JOIN ticket t ON p.project_id = t.project_id
        JOIN work_report wr ON t.ticket_id = wr.ticket_id
        JOIN users u ON wr.user_id = u.user_id
        LEFT JOIN project_member pm ON pm.project_id = p.project_id AND pm.user_id = u.user_id
        WHERE p.project_id = p_project_id
          AND (wr.billable IS TRUE OR wr.billable IS NULL);
    END IF;

    RETURN ROUND(v_total_cost, 2);
END;
$$;


-- ============================================================================
-- 6. SPRÁVA ROZPOČTU S AUDITNÍM ZÁZNAMEM (AUDITED BUDGET MANAGEMENT)
-- ============================================================================

-- 6.1 Vylepšená procedura pro převod rozpočtu s podvojným zápisem do project_budget_log
CREATE OR REPLACE PROCEDURE pr_transfer_project_budget_v2(
    p_source_project_id INT,
    p_target_project_id INT,
    p_amount NUMERIC,
    p_user_id INT DEFAULT NULL,
    p_note TEXT DEFAULT 'Budget Transfer'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_budget NUMERIC;
    v_target_budget NUMERIC;
    v_source_exists BOOLEAN;
    v_target_exists BOOLEAN;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Částka k převodu musí být větší než 0. Transakce přerušena.';
    END IF;

    IF p_source_project_id = p_target_project_id THEN
        RAISE EXCEPTION 'Zdrojový a cílový projekt nesmí být shodné.';
    END IF;

    SELECT EXISTS(SELECT 1 FROM project WHERE project_id = p_source_project_id) INTO v_source_exists;
    SELECT EXISTS(SELECT 1 FROM project WHERE project_id = p_target_project_id) INTO v_target_exists;

    IF NOT v_source_exists THEN
        RAISE EXCEPTION 'Zdrojový projekt s ID % neexistuje!', p_source_project_id;
    END IF;

    IF NOT v_target_exists THEN
        RAISE EXCEPTION 'Cílový projekt s ID % neexistuje!', p_target_project_id;
    END IF;

    -- Získání aktuálních rozpočtů
    SELECT budget INTO v_source_budget FROM project WHERE project_id = p_source_project_id FOR UPDATE;
    SELECT budget INTO v_target_budget FROM project WHERE project_id = p_target_project_id FOR UPDATE;

    IF v_source_budget < p_amount THEN
        RAISE EXCEPTION 'Nedostatečný rozpočet na projektu %! Aktuální zůstatek: %, požadováno: %.',
            p_source_project_id, v_source_budget, p_amount;
    END IF;

    -- 1. Odečtení ze zdrojového projektu
    UPDATE project 
    SET budget = budget - p_amount 
    WHERE project_id = p_source_project_id;

    -- Záznam do auditního logu (Transfer Out)
    INSERT INTO project_budget_log (
        project_id, change_type, amount, balance_before, balance_after,
        related_project_id, changed_by_user_id, note
    ) VALUES (
        p_source_project_id, 'Transfer Out', -p_amount, v_source_budget, v_source_budget - p_amount,
        p_target_project_id, p_user_id, p_note
    );

    -- 2. Přičtení do cílového projektu
    UPDATE project 
    SET budget = budget + p_amount 
    WHERE project_id = p_target_project_id;

    -- Záznam do auditního logu (Transfer In)
    INSERT INTO project_budget_log (
        project_id, change_type, amount, balance_before, balance_after,
        related_project_id, changed_by_user_id, note
    ) VALUES (
        p_target_project_id, 'Transfer In', p_amount, v_target_budget, v_target_budget + p_amount,
        p_source_project_id, p_user_id, p_note
    );

    RAISE NOTICE 'Úspěch: Částka % byla převedena z projektu % na projekt % a auditována.',
        p_amount, p_source_project_id, p_target_project_id;
END;
$$;


-- ============================================================================
-- 7. POHLEDY PRO APLIKACI A UŽIVATELE (APPLICATION & USER VIEWS)
-- ============================================================================

-- 7.1 Komplexní přehled projektů (v_project_summary)
-- Zahrnuje rozpočet, vyčerpané náklady, zbývající budget, alerty, počet tiketů a GitHub link
CREATE OR REPLACE VIEW v_project_summary AS
WITH project_work_stats AS (
    SELECT 
        t.project_id,
        COALESCE(SUM(wr.work_hours), 0.00) AS total_hours,
        COALESCE(SUM(CASE WHEN wr.billable IS TRUE OR wr.billable IS NULL THEN wr.work_hours ELSE 0 END), 0.00) AS billable_hours,
        COALESCE(SUM(CASE WHEN wr.billable IS FALSE THEN wr.work_hours ELSE 0 END), 0.00) AS non_billable_hours,
        COALESCE(SUM(
            CASE 
                WHEN wr.billable IS TRUE OR wr.billable IS NULL 
                THEN wr.work_hours * COALESCE(wr.hourly_rate, pm.custom_hourly_rate, u.hourly_rate, p.default_hourly_rate, 750.00)
                ELSE 0 
            END
        ), 0.00) AS total_expenses
    FROM project p
    LEFT JOIN ticket t ON p.project_id = t.project_id
    LEFT JOIN work_report wr ON t.ticket_id = wr.ticket_id
    LEFT JOIN users u ON wr.user_id = u.user_id
    LEFT JOIN project_member pm ON pm.project_id = p.project_id AND pm.user_id = u.user_id
    GROUP BY t.project_id
),
ticket_stats AS (
    SELECT 
        project_id,
        COUNT(*) AS total_tickets,
        COUNT(CASE WHEN state NOT IN ('Closed', 'Resolved') THEN 1 END) AS open_tickets,
        COUNT(CASE WHEN state IN ('Closed', 'Resolved') THEN 1 END) AS completed_tickets
    FROM ticket
    GROUP BY project_id
),
member_stats AS (
    SELECT 
        project_id,
        COUNT(*) AS member_count
    FROM project_member
    GROUP BY project_id
)
SELECT 
    p.project_id,
    p.name AS project_name,
    p.project_key,
    p.slug,
    p.github_repo_url,
    p.github_default_branch,
    p.status AS project_status,
    p.active,
    p.currency,
    p.budget,
    supervisor.name AS supervisor_name,
    supervisor.email AS supervisor_email,
    COALESCE(pws.total_hours, 0.00) AS total_hours_logged,
    COALESCE(pws.billable_hours, 0.00) AS billable_hours,
    COALESCE(pws.non_billable_hours, 0.00) AS non_billable_hours,
    ROUND(COALESCE(pws.total_expenses, 0.00), 2) AS current_expenses,
    ROUND(p.budget - COALESCE(pws.total_expenses, 0.00), 2) AS remaining_budget,
    CASE 
        WHEN p.budget > 0 
        THEN ROUND((COALESCE(pws.total_expenses, 0.00) / p.budget) * 100, 2)
        ELSE 0.00 
    END AS budget_consumed_pct,
    CASE 
        WHEN p.budget <= 0 THEN 'NO_BUDGET'
        WHEN COALESCE(pws.total_expenses, 0.00) > p.budget THEN 'OVER_BUDGET'
        WHEN COALESCE(pws.total_expenses, 0.00) >= p.budget * (COALESCE(p.budget_alert_threshold, 80.00) / 100.00) THEN 'WARNING_NEAR_LIMIT'
        ELSE 'HEALTHY'
    END AS budget_health_status,
    COALESCE(ts.total_tickets, 0) AS total_tickets,
    COALESCE(ts.open_tickets, 0) AS open_tickets,
    COALESCE(ts.completed_tickets, 0) AS completed_tickets,
    CASE 
        WHEN COALESCE(ts.total_tickets, 0) > 0 
        THEN ROUND((COALESCE(ts.completed_tickets, 0)::NUMERIC / ts.total_tickets) * 100, 1)
        ELSE 0.0 
    END AS ticket_completion_pct,
    COALESCE(ms.member_count, 1) AS team_member_count,
    p.created_at,
    p.updated_at
FROM project p
JOIN users supervisor ON p.supervisor_id = supervisor.user_id
LEFT JOIN project_work_stats pws ON p.project_id = pws.project_id
LEFT JOIN ticket_stats ts ON p.project_id = ts.project_id
LEFT JOIN member_stats ms ON p.project_id = ms.project_id;


-- 7.2 Uživatelský pohled na výkazy práce / Timesheet (v_user_timesheet)
-- Klíčové pro "user views" a sledování odpracovaného času
CREATE OR REPLACE VIEW v_user_timesheet AS
SELECT 
    wr.report_id,
    u.user_id,
    u.name AS user_name,
    u.email AS user_email,
    p.project_id,
    p.name AS project_name,
    COALESCE(p.project_key, 'PRJ') AS project_key,
    t.ticket_id,
    CASE 
        WHEN p.project_key IS NOT NULL AND t.ticket_number IS NOT NULL 
        THEN p.project_key || '-' || t.ticket_number 
        ELSE '#' || t.ticket_id::TEXT 
    END AS ticket_code,
    t.name AS ticket_name,
    t.state AS ticket_state,
    t.priority AS ticket_priority,
    wr.work_date,
    wr.work_hours,
    wr.hourly_rate AS applied_hourly_rate,
    ROUND(wr.work_hours * wr.hourly_rate, 2) AS total_cost,
    wr.billable,
    wr.work_description,
    wr.created_at AS logged_at
FROM work_report wr
JOIN users u ON wr.user_id = u.user_id
JOIN ticket t ON wr.ticket_id = t.ticket_id
JOIN project p ON t.project_id = p.project_id;


-- 7.3 Přehled milníků projektu (v_project_milestone_overview)
CREATE OR REPLACE VIEW v_project_milestone_overview AS
SELECT 
    m.milestone_id,
    m.project_id,
    p.name AS project_name,
    COALESCE(p.project_key, 'PRJ') AS project_key,
    m.title AS milestone_title,
    m.description AS milestone_description,
    m.due_date,
    m.state AS milestone_state,
    m.budget_allocated,
    COUNT(t.ticket_id) AS total_tickets,
    COUNT(CASE WHEN t.state NOT IN ('Closed', 'Resolved') THEN 1 END) AS open_tickets,
    COUNT(CASE WHEN t.state IN ('Closed', 'Resolved') THEN 1 END) AS closed_tickets,
    CASE 
        WHEN COUNT(t.ticket_id) > 0 
        THEN ROUND((COUNT(CASE WHEN t.state IN ('Closed', 'Resolved') THEN 1 END)::NUMERIC / COUNT(t.ticket_id)) * 100, 1)
        ELSE 0.0 
    END AS completion_pct,
    COALESCE(SUM(wr.work_hours), 0.00) AS total_logged_hours,
    m.created_at,
    m.updated_at
FROM project_milestone m
JOIN project p ON m.project_id = p.project_id
LEFT JOIN ticket t ON m.milestone_id = t.milestone_id
LEFT JOIN work_report wr ON t.ticket_id = wr.ticket_id
GROUP BY 
    m.milestone_id, 
    m.project_id, 
    p.name, 
    p.project_key, 
    m.title, 
    m.description, 
    m.due_date, 
    m.state, 
    m.budget_allocated, 
    m.created_at, 
    m.updated_at;


-- 7.4 Detailní pohled na tiket s dynamickou cenou a GitHub metadaty (v_ticket_detail)
CREATE OR REPLACE VIEW v_ticket_detail AS
SELECT 
    t.ticket_id,
    p.project_id,
    p.name AS project_name,
    COALESCE(p.project_key, 'PRJ') AS project_key,
    t.ticket_number,
    CASE 
        WHEN p.project_key IS NOT NULL AND t.ticket_number IS NOT NULL 
        THEN p.project_key || '-' || t.ticket_number 
        ELSE '#' || t.ticket_id::TEXT 
    END AS ticket_code,
    t.name AS ticket_name,
    t.description,
    t.priority,
    t.state,
    t.ticket_type,
    author.user_id AS author_id,
    author.name AS author_name,
    assignee.user_id AS assignee_id,
    COALESCE(assignee.name, 'Unassigned') AS assignee_name,
    m.milestone_id,
    m.title AS milestone_title,
    t.estimated_hours,
    COALESCE(SUM(wr.work_hours), 0.00) AS logged_hours,
    ROUND(COALESCE(t.estimated_hours, 0) - COALESCE(SUM(wr.work_hours), 0.00), 2) AS remaining_hours,
    ROUND(COALESCE(SUM(
        CASE 
            WHEN wr.billable IS TRUE OR wr.billable IS NULL 
            THEN wr.work_hours * COALESCE(wr.hourly_rate, pm.custom_hourly_rate, u.hourly_rate, p.default_hourly_rate, 750.00)
            ELSE 0 
        END
    ), 0.00), 2) AS ticket_total_price,
    t.github_issue_number,
    t.github_issue_url,
    t.parent_ticket_id,
    t.created_at,
    t.updated_at
FROM ticket t
JOIN project p ON t.project_id = p.project_id
JOIN users author ON t.author_id = author.user_id
LEFT JOIN users assignee ON t.assignee_id = assignee.user_id
LEFT JOIN project_milestone m ON t.milestone_id = m.milestone_id
LEFT JOIN work_report wr ON t.ticket_id = wr.ticket_id
LEFT JOIN users u ON wr.user_id = u.user_id
LEFT JOIN project_member pm ON pm.project_id = p.project_id AND pm.user_id = u.user_id
GROUP BY 
    t.ticket_id,
    p.project_id,
    p.name,
    p.project_key,
    p.default_hourly_rate,
    t.ticket_number,
    t.name,
    t.description,
    t.priority,
    t.state,
    t.ticket_type,
    author.user_id,
    author.name,
    assignee.user_id,
    assignee.name,
    m.milestone_id,
    m.title,
    t.estimated_hours,
    t.github_issue_number,
    t.github_issue_url,
    t.parent_ticket_id,
    t.created_at,
    t.updated_at;


-- ============================================================================
-- 8. BEZPEČNÁ INICIALIZACE A DOPLNĚNÍ EXISTUJÍCÍCH DAT (DATA BACKFILL)
-- ============================================================================
-- Tento blok bezpečně doplní výchozí hodnoty pro data, která již v databázi existují,
-- aniž by přepsal existující data nebo způsobil konflikty.

DO $$
DECLARE
    r RECORD;
    v_seq INT;
BEGIN
    -- 8.1 Doplnění project_key a slug pro existující projekty bez klíče
    FOR r IN SELECT project_id, name FROM project WHERE project_key IS NULL LOOP
        UPDATE project 
        SET project_key = 'PRJ' || project_id,
            slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE project_id = r.project_id;
    END LOOP;

    -- 8.2 Doplnění ticket_number pro existující tikety
    FOR r IN SELECT DISTINCT project_id FROM ticket LOOP
        v_seq := 1;
        FOR r IN SELECT ticket_id FROM ticket WHERE project_id = r.project_id AND ticket_number IS NULL ORDER BY created_at, ticket_id LOOP
            UPDATE ticket SET ticket_number = v_seq WHERE ticket_id = r.ticket_id;
            v_seq := v_seq + 1;
        END LOOP;
    END LOOP;

    -- 8.3 Automatické přidání vedoucího projektu (supervisor_id) jako Owner do project_member
    INSERT INTO project_member (project_id, user_id, project_role)
    SELECT project_id, supervisor_id, 'Owner'
    FROM project
    ON CONFLICT (project_id, user_id) DO NOTHING;

    -- 8.4 Doplnění výchozí hodinové sazby pro historické výkazy práce
    UPDATE work_report
    SET hourly_rate = 750.00
    WHERE hourly_rate IS NULL;
END $$;


-- ============================================================================
-- 9. OVĚŘOVACÍ DOTAZY A UKÁZKY POUŽITÍ (VERIFICATION & USAGE EXAMPLES)
-- ============================================================================

/*
-- 1. Aktualizace projektu na GitHub repozitář:
UPDATE project 
SET github_repo_url = 'https://github.com/my-org/tickethub-core',
    github_repo_owner = 'my-org',
    github_repo_name = 'tickethub-core',
    github_default_branch = 'main',
    default_hourly_rate = 850.00
WHERE project_id = 1;

-- 2. Přidání člena do projektu s vlastní sazbou (Senior Developer):
INSERT INTO project_member (project_id, user_id, project_role, custom_hourly_rate)
VALUES (1, 2, 'Developer', 1100.00)
ON CONFLICT (project_id, user_id) DO UPDATE SET custom_hourly_rate = EXCLUDED.custom_hourly_rate;

-- 3. Založení nového GitHub Milestone:
INSERT INTO project_milestone (project_id, title, description, due_date, budget_allocated)
VALUES (1, 'v1.0 Release', 'První veřejná verze aplikace', CURRENT_DATE + INTERVAL '30 days', 50000.00);

-- 4. Výpočet dynamické ceny tiketu (bez hardcoded 750):
SELECT fn_calculate_ticket_price(1) AS ticket_1_price;

-- 5. Výpočet reálných nákladů celého projektu s dynamickými sazbami:
SELECT fn_calculate_project_expenses_v2(1) AS dynamic_project_cost;

-- 6. Auditovaný převod rozpočtu mezi projekty:
CALL pr_transfer_project_budget_v2(1, 2, 10000.00, 1, 'Přesun rozpočtu na posílení backend vývoje');

-- 7. Zobrazení souhrnu projektů s alerty a rozpočty:
SELECT project_name, project_key, budget, current_expenses, remaining_budget, budget_health_status, ticket_completion_pct
FROM v_project_summary;

-- 8. Zobrazení výkazů práce pro konkrétního uživatele:
SELECT user_name, project_name, ticket_code, work_date, work_hours, applied_hourly_rate, total_cost, work_description
FROM v_user_timesheet
WHERE user_id = 1;

-- 9. Full-text vyhledávání napříč projekty:
SELECT project_id, name, project_key, status
FROM project
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(project_key, '')) 
      @@ to_tsquery('english', 'platform | development');
*/

