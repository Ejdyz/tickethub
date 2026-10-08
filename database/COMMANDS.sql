WITH pocty_radku AS (
    SELECT 'users' AS tabulka, COUNT(*) AS pocet FROM users
    UNION ALL
    SELECT 'project', COUNT(*) FROM project
    UNION ALL
    SELECT 'ticket', COUNT(*) FROM ticket
    UNION ALL
    SELECT 'comment', COUNT(*) FROM comment
    UNION ALL
    SELECT 'audit_log', COUNT(*) FROM audit_log
    UNION ALL
    SELECT 'tag', COUNT(*) FROM tag
    UNION ALL
    SELECT 'tag_ticket', COUNT(*) FROM tag_ticket
    UNION ALL
    SELECT 'work_report', COUNT(*) FROM work_report
)
SELECT 
    ROUND(AVG(pocet), 2) AS prumerny_pocet_zaznamu_na_tabulku,
    SUM(pocet) AS celkem_zaznamu_v_db,
    COUNT(*) AS pocet_tabulek
FROM pocty_radku;



-- ---------------------------------------------------------




SELECT 
    u.user_id,
    u.name,
    u.role,
    SUM(wr.work_hours) AS odpracovane_hodiny
FROM users u
JOIN work_report wr ON u.user_id = wr.user_id
GROUP BY u.user_id, u.name, u.role
HAVING SUM(wr.work_hours) > (
    -- Vnořený poddotaz: spočítá průměrný součet hodin připadající na jednoho uživatele
    SELECT AVG(soucty_uzivatelu.celkem_hodin)
    FROM (
        SELECT user_id, SUM(work_hours) AS celkem_hodin
        FROM work_report
        GROUP BY user_id
    ) AS soucty_uzivatelu
)
ORDER BY odpracovane_hodiny DESC;




-- ---------------------------------------------------------




SELECT 
    p.name AS projekt,
    t.ticket_id,
    t.name AS tiket,
    t.priority,
    COALESCE(SUM(wr.work_hours), 0) AS hodin_na_tiketu,
    -- Window funkce 1: Celkový součet hodin pro celý daný projekt
    SUM(COALESCE(SUM(wr.work_hours), 0)) OVER (
        PARTITION BY p.project_id
    ) AS celkem_hodin_projektu,
    -- Window funkce 2: Pořadí tiketu v rámci daného projektu (nejpracnější má rank 1)
    DENSE_RANK() OVER (
        PARTITION BY p.project_id 
        ORDER BY COALESCE(SUM(wr.work_hours), 0) DESC
    ) AS poradi_v_projektu
FROM project p
JOIN ticket t ON p.project_id = t.project_id
LEFT JOIN work_report wr ON t.ticket_id = wr.ticket_id
GROUP BY p.project_id, p.name, t.ticket_id, t.name, t.priority
ORDER BY p.name, poradi_v_projektu;




-- ---------------------------------------------------------





WITH RECURSIVE strom_uloh AS (
    -- 1. Kotevní člen (Anchor member): Tikety nejvyšší úrovně (nemají rodiče)
    SELECT 
        ticket_id,
        parent_ticket_id,
        name,
        state,
        1 AS uroven,
        name::TEXT AS hierarchie_cesta
    FROM ticket
    WHERE parent_ticket_id IS NULL

    UNION ALL

    -- 2. Rekurzivní člen (Recursive member): Podúkoly napojené na předchozí úroveň
    SELECT 
        t.ticket_id,
        t.parent_ticket_id,
        t.name,
        t.state,
        su.uroven + 1,
        su.hierarchie_cesta || ' -> ' || t.name
    FROM ticket t
    JOIN strom_uloh su ON t.parent_ticket_id = su.ticket_id
)
SELECT 
    ticket_id,
    REPEAT('  |-- ', uroven - 1) || name AS strom_zobrazeni,
    uroven,
    hierarchie_cesta,
    state
FROM strom_uloh
ORDER BY hierarchie_cesta;