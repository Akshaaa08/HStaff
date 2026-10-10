// Used by the knex CLI (migrate/seed). The app itself builds its connection in src/config/db.ts.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on the real environment */
}
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: './migrations', tableName: 'knex_migrations' },
  seeds: { directory: './seeds' },
};
