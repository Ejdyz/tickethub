-- ROLES

-- 1. Vytvoření role bez možnosti přímého přihlášení (funguje jako skupina)
CREATE ROLE ticket_operator;

-- 2. Přidělení základního přístupu ke schématu public
GRANT USAGE ON SCHEMA public TO ticket_operator;

-- 3. Přidělení práv pro čtení ze všech stávajících tabulek
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ticket_operator;

-- 4. Přidělení práv pro vkládání a úpravy vybraných tabulek
GRANT INSERT, UPDATE ON ticket, comment, work_report TO ticket_operator;

-- 5. Přidělení práv k sekvencím (aby uživatel mohl generovat ID při INSERTu)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ticket_operator;






-- 1. Vytvoření uživatele s přihlašovacím heslem
CREATE USER dev_novak WITH PASSWORD 'Heslo1234!';

-- 2. Přiřazení role uživateli
GRANT ticket_operator TO dev_novak;



-- Přepneme se na nového uživatele
SET ROLE dev_novak;

-- Ověříme, pod kým aktuálně vystupujeme
SELECT current_user; -- Vrátí: dev_novak

-- Test 1: SELECT projde (máme právo SELECT)
SELECT ticket_id, name, state FROM ticket LIMIT 3;

-- Test 2: UPDATE na ticket projde (máme právo UPDATE)
UPDATE ticket SET state = 'In Progress' WHERE ticket_id = 1;

-- Test 3: DELETE na project SELŽE (nemáme oprávnění mazat projekty)
DELETE FROM project WHERE project_id = 1;
-- Výsledek: ERROR: permission denied for table project

-- Návrat zpět pod administrátorský účet
RESET ROLE;
SELECT current_user; -- Vrátí: postgres





-- TABLE LOCKING

-- 1. Otevření transakce
BEGIN;

-- 2. Zamčení tabulky ticket
LOCK TABLE ticket IN EXCLUSIVE MODE;

-- 3. Transakci zatím NEPOTVRZUJ (nech okno otevřené bez COMMITu)


-- druhý uživatel v jiném okně
SET ROLE dev_novak;

-- Pokus o úpravu tiketu
UPDATE ticket 
SET state = 'Closed' 
WHERE ticket_id = 2;


-- V prvním okně
COMMIT;






-- ROW LOCKING

-- Okno 1
BEGIN;

-- Zamkneme pouze řádek s ticket_id = 5 pro editaci
SELECT ticket_id, name, state 
FROM ticket 
WHERE ticket_id = 5 
FOR UPDATE;

-- Transakci necháme otevřenou...



-- Okno 2jj
-- Pokus A: Úprava zamčeného řádku (ID = 5) -> ČEKÁ NA ZÁMEK
UPDATE ticket SET priority = 'High' WHERE ticket_id = 5;

-- Pokus B: Úprava jiného řádku (ID = 6) -> PROJDE OKAMŽITĚ BEZ ČEKÁNÍ!
-- (Ověřuje, že zámek blokuje pouze dotčený záznam, nikoli celou tabulku)


-- Okno 1
COMMIT; -- Uvolní řádek 5 a Okno 2 dokončí svou úpravu



-- PERMISSION RESET AND USER DELETE
-- 1. Zrušíme případná práva na objekty
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ticket_operator;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ticket_operator;
REVOKE USAGE ON SCHEMA public FROM ticket_operator;

-- 2. Odebereme roli uživateli
REVOKE ticket_operator FROM dev_novak;

-- 3. Odstranění uživatele a role
DROP USER IF EXISTS dev_novak;
DROP ROLE IF EXISTS ticket_operator;