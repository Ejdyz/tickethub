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


-- USAGE
-- 1. Samostatné volání s výchozí hodinovou sazbou (750 Kč)
SELECT fn_calculate_project_expenses(1);

-- 2. Volání s vlastní hodinovou sazbou (např. 1200 Kč/h)
SELECT fn_calculate_project_expenses(1, 1200.00);

-- 3. Praktické srovnání rozpočtu a reálných nákladů pro všechny projekty
SELECT 
    project_id,
    name,
    budget AS schvaleny_rozpocet,
    fn_calculate_project_expenses(project_id, 850.00) AS realne_naklady,
    budget - fn_calculate_project_expenses(project_id, 850.00) AS zbyvajici_rozpocet
FROM project;

-- 4. Test ošetření chyb (zadání neexistujícího projektu)
SELECT fn_calculate_project_expenses(99999);
-- Výsledek: ERROR: Projekt s ID 99999 neexistuje!