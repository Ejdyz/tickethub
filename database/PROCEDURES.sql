CREATE OR REPLACE PROCEDURE pr_close_resolved_tickets(
    p_admin_user_id INT,
    INOUT p_closed_count INT DEFAULT 0
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- 1. Deklarace explicitního kurzoru pro tikety ve stavu 'Resolved'
    cur_tickets CURSOR FOR 
        SELECT ticket_id, name 
        FROM ticket 
        WHERE state = 'Resolved';

    -- Proměnné pro uložení hodnot z kurzoru
    v_ticket_id INT;
    v_ticket_name VARCHAR(200);
    v_user_exists BOOLEAN;
BEGIN
    p_closed_count := 0;

    -- Validace: Ověříme, zda existuje uživatel (správce), pod kterým budeme komentovat
    SELECT EXISTS(SELECT 1 FROM users WHERE user_id = p_admin_user_id) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Zadaný uživatel s ID % pro systémový podpis neexistuje!', p_admin_user_id;
    END IF;

    -- 2. Otevření kurzoru
    OPEN cur_tickets;

    -- 3. Procházení záznamů řádek po řádku pomocí smyčky LOOP
    LOOP
        -- Načtení jednoho řádku z kurzoru do proměnných
        FETCH cur_tickets INTO v_ticket_id, v_ticket_name;
        
        -- Ukončení smyčky, pokud už v kurzoru nejsou další řádky
        EXIT WHEN NOT FOUND;

        -- Provedení změn nad aktuálním tiketem
        UPDATE ticket 
        SET state = 'Closed' 
        WHERE ticket_id = v_ticket_id;

        -- Vložení automatického systémového komentáře
        INSERT INTO comment (ticket_id, author_id, content)
        VALUES (
            v_ticket_id, 
            p_admin_user_id, 
            'Systémové hlášení: Tiket byl automaticky přepnut do stavu Closed procedurou.'
        );

        p_closed_count := p_closed_count + 1;
        RAISE NOTICE 'Tiket ID % (%) byl úspěšně uzavřen.', v_ticket_id, v_ticket_name;
    END LOOP;

    -- 4. Zavření kurzoru a uvolnění paměti
    CLOSE cur_tickets;

    RAISE NOTICE 'Procedura dokončena. Celkem uzavřeno tiketů: %', p_closed_count;

-- 5. Blok pro ošetření chyb (splnění podmínky EXCEPTION ze zadání)
EXCEPTION
    WHEN OTHERS THEN
        -- V případě jakékoliv chyby zavřeme kurzor, pokud zůstal otevřený
        IF cur_tickets%ISOPEN THEN
            CLOSE cur_tickets;
        END IF;
        
        -- Zalogování chyby do konzole databáze
        RAISE WARNING 'V proceduře došlo k chybě: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        
        -- Opětovné vyvolání výjimky pro přerušení transakce
        RAISE;
END;
$$;



-- USAGE
-- 1. Podíváme se, kolik tiketů je aktuálně ve stavu 'Resolved'
SELECT ticket_id, name, state FROM ticket WHERE state = 'Resolved';

-- 2. Zavoláme proceduru (jako první parametr předáme ID existujícího uživatele, např. 1)
CALL pr_close_resolved_tickets(1);

-- 3. Ověříme, že vyřešené tikety se přesunuly do 'Closed'
SELECT ticket_id, name, state FROM ticket WHERE state = 'Closed';

-- 4. Zkontrolujeme, zda v tabulce comment přibyly automatické systémové komentáře
SELECT * FROM comment WHERE content LIKE 'Systémové hlášení%' ORDER BY created_at DESC;

-- 5. Test ošetření chyb: Zavolání s neexistujícím uživatelem (např. ID 99999)
CALL pr_close_resolved_tickets(99999);
-- Výsledek: Zachyceno výjimkou, vypíše chybové hlášení.