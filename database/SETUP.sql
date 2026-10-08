-- 1. Uživatelé / zaměstnanci systému
CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL, -- např. 'Manažer', 'Vývojář', 'Tester'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projekty, pod které tikety spadají
CREATE TABLE project (
    project_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    supervisor_id INT NOT NULL REFERENCES users(user_id),
    budget NUMERIC(12, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE
);

-- 3. Jádro systému: Tikety / Úkoly
CREATE TABLE ticket (
    ticket_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(project_id),
    author_id INT NOT NULL REFERENCES users(user_id),
    assignee_id INT REFERENCES users(user_id),
    parent_ticket_id INT REFERENCES ticket(ticket_id) ON DELETE CASCADE, -- Hierarchie pro rekurzivní CTE
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- 'Nízká', 'Střední', 'Kritická'
    state VARCHAR(30) DEFAULT 'New',       -- 'Nový', 'V řešení', 'Vyřešeno', 'Uzavřeno'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Komentáře k tiketům
CREATE TABLE comment (
    comment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
  audit_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
  action VARCHAR(200) NOT NULL,
  before_state TEXT,
  new_state TEXT,
  change_user_id INT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tag (
  tag_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color_hex VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tag_ticket (
  tag_id INT NOT NULL REFERENCES tag(tag_id) ON DELETE CASCADE,
  ticket_id INT NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
  PRIMARY KEY(tag_id, ticket_id)
);

CREATE TABLE work_report (
  report_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES ticket(ticket_id),
  user_id INT NOT NULL REFERENCES users(user_id),
  work_date DATE DEFAULT CURRENT_DATE,
  work_hours NUMERIC(4,2) NOT NULL,
  work_description TEXT NOT NULL
);




CREATE OR REPLACE FUNCTION fn_calculate_project_expenses(
    p_project_id INT,
    p_hourly_rate NUMERIC DEFAULT 750.00
) 
RETURNS NUMERIC AS $$
DECLARE
    v_total_hours NUMERIC;
    v_total_cost NUMERIC;
    v_project_exists BOOLEAN;
BEGIN
    -- 1. Ověření, zda zadaný projekt vůbec existuje
    SELECT EXISTS(
        SELECT 1 FROM project WHERE project_id = p_project_id
    ) INTO v_project_exists;

    IF NOT v_project_exists THEN
        RAISE EXCEPTION 'Projekt s ID % neexistuje!', p_project_id;
    END IF;

    -- 2. Spočítání všech odpracovaných hodin pro daný projekt
    -- (spojujeme tiket a work_report)
    SELECT COALESCE(SUM(wr.work_hours), 0.00)
    INTO v_total_hours
    FROM ticket t
    JOIN work_report wr ON t.ticket_id = wr.ticket_id
    WHERE t.project_id = p_project_id;

    -- 3. Výpočet celkových nákladů
    v_total_cost := ROUND(v_total_hours * p_hourly_rate, 2);

    -- 4. Vrácení výsledné hodnoty
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;


CREATE INDEX idx_ticket_fulltext 
ON ticket 
USING gin (to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_comment_fulltext 
ON comment 
USING gin (to_tsvector('english', content));


-- CLASSIC INDEX
CREATE UNIQUE INDEX uq_ticket_project_active_title 
ON ticket (project_id, LOWER(name)) 
WHERE state != 'Closed';



CREATE OR REPLACE PROCEDURE pr_transfer_project_budget(
    p_source_project_id INT,
    p_target_project_id INT,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_budget NUMERIC;
    v_target_exists BOOLEAN;
BEGIN
    -- 1. Validace kladné částky
    IF p_amount <= 0 THEN
        RAISE WARNING 'Částka k převodu musí být větší než 0. Transakce zrušena.';
        ROLLBACK;
        RETURN;
    END IF;

    -- 2. Ověření existence cílového projektu
    SELECT EXISTS(SELECT 1 FROM project WHERE project_id = p_target_project_id)
    INTO v_target_exists;

    IF NOT v_target_exists THEN
        RAISE WARNING 'Cílový projekt s ID % neexistuje. Provádím ROLLBACK.', p_target_project_id;
        ROLLBACK;
        RETURN;
    END IF;

    -- 3. Zjištění zůstatku zdrojového projektu
    SELECT budget 
    INTO v_source_budget 
    FROM project 
    WHERE project_id = p_source_project_id;

    IF v_source_budget IS NULL THEN
        RAISE WARNING 'Zdrojový projekt s ID % neexistuje. Provádím ROLLBACK.', p_source_project_id;
        ROLLBACK;
        RETURN;
    END IF;

    -- 4. Kontrola dostatku financí (Klíčová byznys podmínka)
    IF v_source_budget < p_amount THEN
        RAISE WARNING 'Nedostatečný rozpočet na projektu %! Aktuálně: %, požadováno: %. Provádím ROLLBACK.', 
            p_source_project_id, v_source_budget, p_amount;
        ROLLBACK;
        RETURN;
    END IF;

    -- 5. Krok A transakce: Odečtení financí ze zdrojového projektu
    UPDATE project 
    SET budget = budget - p_amount 
    WHERE project_id = p_source_project_id;

    -- 6. Krok B transakce: Přičtení financí do cílového projektu
    UPDATE project 
    SET budget = budget + p_amount 
    WHERE project_id = p_target_project_id;

    -- 7. Vše proběhlo úspěšně -> trvalé potvrzení do databáze
    COMMIT;
    RAISE NOTICE 'Úspěch: Částka % byla převedena z projektu % na projekt %.', 
        p_amount, p_source_project_id, p_target_project_id;
END;
$$;



CREATE OR REPLACE FUNCTION fn_audit_ticket_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Případ 1: Vložení nového tiketu (INSERT)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (
            ticket_id, 
            action, 
            before_state, 
            new_state, 
            change_user_id
        )
        VALUES (
            NEW.ticket_id, 
            'INSERT', 
            NULL, 
            NEW.state, 
            NEW.author_id
        );
        RETURN NEW;

    -- Případ 2: Úprava existujícího tiketu (UPDATE)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Auditujeme pouze situace, kdy se skutečně změnil stav tiketu
        IF (OLD.state IS DISTINCT FROM NEW.state) THEN
            INSERT INTO audit_log (
                ticket_id, 
                action, 
                before_state, 
                new_state, 
                change_user_id
            )
            VALUES (
                NEW.ticket_id, 
                'UPDATE', 
                OLD.state, 
                NEW.state, 
                NEW.assignee_id -- případně autor úpravy
            );
        END IF;
        RETURN NEW;

    -- Případ 3: Smazání tiketu (DELETE)
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (
            ticket_id, 
            action, 
            before_state, 
            new_state, 
            change_user_id
        )
        VALUES (
            OLD.ticket_id, 
            'DELETE', 
            OLD.state, 
            NULL, 
            NULL
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;


-- IMPLEMENTING TRIGGER

CREATE OR REPLACE TRIGGER trg_ticket_audit
AFTER INSERT OR UPDATE OR DELETE ON ticket
FOR EACH ROW
EXECUTE FUNCTION fn_audit_ticket_changes();




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