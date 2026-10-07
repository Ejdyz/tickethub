-- AUDIT TRIGGER

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

-- USAGE

-- 1. Zkontrolujeme, že audit_log je pro tiket s ID 1 prázdný
SELECT * FROM audit_log WHERE ticket_id = 1;

-- 2. Provedeme změnu stavu tiketu (simulace práce vývojáře)
UPDATE ticket 
SET state = 'In Progress' 
WHERE ticket_id = 1;

-- 3. Změníme stav podruhé
UPDATE ticket 
SET state = 'Resolved' 
WHERE ticket_id = 1;

-- 4. Podíváme se do auditní tabulky
SELECT 
    audit_id,
    ticket_id,
    action,
    before_state,
    new_state,
    created_at
FROM audit_log
WHERE ticket_id = 1
ORDER BY created_at ASC;