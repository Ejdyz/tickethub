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