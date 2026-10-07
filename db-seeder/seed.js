import { faker } from '@faker-js/faker';
import pg from 'pg';

const { Client } = pg;

// Uprav své přihlašovací údaje k PostgreSQL
const client = new Client({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'tickethub',
});

async function seed() {
  await client.connect();
  console.log('Připojeno k PostgreSQL...');

  try {
    // 1. Uživatelé (15 záznamů)
    const userIds = [];
    const roles = ['Project Manager', 'Frontend Developer', 'Backend Developer', 'QA Tester', 'DevOps'];
    
    for (let i = 0; i < 15; i++) {
      const res = await client.query(
        `INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING user_id`,
        [faker.person.fullName(), faker.internet.email().toLowerCase(), faker.helpers.arrayElement(roles)]
      );
      userIds.push(res.rows[0].user_id);
    }
    console.log(`Vloženo ${userIds.length} uživatelů.`);

    // 2. Projekty (5 záznamů)
    const projectIds = [];
    for (let i = 0; i < 5; i++) {
      const res = await client.query(
        `INSERT INTO project (name, description, supervisor_id, budget, active) 
         VALUES ($1, $2, $3, $4, $5) RETURNING project_id`,
        [
          faker.commerce.productName() + ' Platform',
          faker.company.catchPhrase(),
          faker.helpers.arrayElement(userIds),
          faker.finance.amount({ min: 50000, max: 500000, dec: 2 }),
          true
        ]
      );
      projectIds.push(res.rows[0].project_id);
    }
    console.log(`Vloženo ${projectIds.length} projektů.`);

    // 3. Štítky / Tagy (8 záznamů)
    const tagIds = [];
    const tagNames = ['Bug', 'Feature', 'Frontend', 'Backend', 'Security', 'Performance', 'Documentation', 'DevOps'];
    for (const name of tagNames) {
      const res = await client.query(
        `INSERT INTO tag (name, color_hex) VALUES ($1, $2) RETURNING tag_id`,
        [name, faker.color.rgb({ format: 'hex' })]
      );
      tagIds.push(res.rows[0].tag_id);
    }
    console.log(`Vloženo ${tagIds.length} štítků.`);

    // 4. Tikety (45 záznamů s hierarchií pro rekurzi)
    const ticketIds = [];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const states = ['New', 'In Progress', 'Resolved', 'Closed'];

    // Krok 4a: Hlavní tikety (bez parenta)
    for (let i = 0; i < 20; i++) {
      const res = await client.query(
        `INSERT INTO ticket (project_id, author_id, assignee_id, parent_ticket_id, name, description, priority, state)
         VALUES ($1, $2, $3, NULL, $4, $5, $6, $7) RETURNING ticket_id`,
        [
          faker.helpers.arrayElement(projectIds),
          faker.helpers.arrayElement(userIds),
          faker.helpers.arrayElement(userIds),
          faker.hacker.phrase(),
          faker.lorem.paragraph(),
          faker.helpers.arrayElement(priorities),
          faker.helpers.arrayElement(states),
        ]
      );
      ticketIds.push(res.rows[0].ticket_id);
    }

    // Krok 4b: Podúkoly (mají parent_ticket_id z existujících tiketů)
    for (let i = 0; i < 25; i++) {
      const res = await client.query(
        `INSERT INTO ticket (project_id, author_id, assignee_id, parent_ticket_id, name, description, priority, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ticket_id`,
        [
          faker.helpers.arrayElement(projectIds),
          faker.helpers.arrayElement(userIds),
          faker.helpers.arrayElement(userIds),
          faker.helpers.arrayElement(ticketIds), // hierarchická vazba
          faker.hacker.phrase(),
          faker.lorem.paragraph(),
          faker.helpers.arrayElement(priorities),
          faker.helpers.arrayElement(states),
        ]
      );
      ticketIds.push(res.rows[0].ticket_id);
    }
    console.log(`Vloženo ${ticketIds.length} tiketů (včetně hierarchických vazeb).`);

    // 5. Vazba M:N tag_ticket (cca 60 záznamů, hlídáme unikátnost)
    const existingPairs = new Set();
    let tagLinksCount = 0;
    while (tagLinksCount < 60) {
      const tId = faker.helpers.arrayElement(ticketIds);
      const tgId = faker.helpers.arrayElement(tagIds);
      const pairKey = `${tgId}_${tId}`;

      if (!existingPairs.has(pairKey)) {
        existingPairs.add(pairKey);
        await client.query(
          `INSERT INTO tag_ticket (tag_id, ticket_id) VALUES ($1, $2)`,
          [tgId, tId]
        );
        tagLinksCount++;
      }
    }
    console.log(`Vloženo ${tagLinksCount} vazeb mezi štítky a tikety.`);

    // 6. Komentáře (50 záznamů)
    for (let i = 0; i < 50; i++) {
      await client.query(
        `INSERT INTO comment (ticket_id, author_id, content) VALUES ($1, $2, $3)`,
        [
          faker.helpers.arrayElement(ticketIds),
          faker.helpers.arrayElement(userIds),
          faker.lorem.sentences({ min: 1, max: 3 }),
        ]
      );
    }
    console.log('Vloženo 50 komentářů.');

    // 7. Výkazy práce (50 záznamů)
    for (let i = 0; i < 50; i++) {
      await client.query(
        `INSERT INTO work_report (ticket_id, user_id, work_date, work_hours, work_description) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          faker.helpers.arrayElement(ticketIds),
          faker.helpers.arrayElement(userIds),
          faker.date.recent({ days: 30 }),
          faker.number.float({ min: 0.5, max: 8.0, fractionDigits: 2 }),
          faker.company.buzzPhrase(),
        ]
      );
    }
    console.log('Vloženo 50 výkazů práce.');

    console.log('\nHotovo! Databáze byla úspěšně naplněna testovacími daty.');
  } catch (err) {
    console.error('Chyba při plnění databáze:', err);
  } finally {
    await client.end();
  }
}

seed();