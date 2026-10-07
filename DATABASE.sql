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