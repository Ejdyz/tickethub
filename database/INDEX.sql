-- CLASSIC INDEX
CREATE UNIQUE INDEX uq_ticket_project_active_title 
ON ticket (project_id, LOWER(name)) 
WHERE state != 'Closed';


-- 1. Zkusíme vložit tiket
INSERT INTO ticket (project_id, author_id, name, description, state)
VALUES (1, 1, 'Bug v platbe', 'Popis chyby', 'New');

-- 2. Druhé vložení se stejným názvem (i jinou velikostí písmen) v témže projektu SELŽE s chybou o porušení unikátního indexu:
INSERT INTO ticket (project_id, author_id, name, description, state)
VALUES (1, 1, 'BUG V PLATBE', 'Jiný popis', 'In Progress');
-- Výsledek: ERROR: duplicate key value violates unique constraint "uq_ticket_project_active_title"



-- FULL TEXT INDEXes

CREATE INDEX idx_ticket_fulltext 
ON ticket 
USING gin (to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_comment_fulltext 
ON comment 
USING gin (to_tsvector('english', content));




-- Dotaz 1: Hledání tiketů, které obsahují slovo 'error' NEBO 'system'
SELECT 
    ticket_id,
    name,
    priority,
    state
FROM ticket
WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('english', 'error | system');


