import { defineConfig } from 'vitest/config';

// Integration tests use real Postgres+PostGIS and Redis (docker compose up postgres redis).
// Override with TEST_DATABASE_URL / TEST_REDIS_URL. Test DB is rebuilt by tests/globalSetup.ts.
export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setupEnv.ts'],
    include: ['tests/**/*.test.ts'],
    fileParallelism: false, // integration files share one database
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
