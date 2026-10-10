import knex from 'knex';

// Rebuilds the test schema from the real migrations once per run.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgres://hstaff:hstaff@localhost:5432/hstaff_test';
  const db = knex({ client: 'pg', connection: url, migrations: { directory: './migrations' } });
  await db.raw('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await db.raw('CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  await db.migrate.latest();
  await db.destroy();
}
