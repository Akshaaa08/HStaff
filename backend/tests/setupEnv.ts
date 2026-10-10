// Runs before any module imports config/env, in every test file.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://hstaff:hstaff@localhost:5432/hstaff_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/1';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NOMINATIM_USER_AGENT = 'hstaff-tests (test@example.com)';
process.env.OTP_PROVIDER = 'console';
process.env.PAYMENT_PROVIDER = 'simulated';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.GEOFENCE_RADIUS_M = '150';
process.env.COMMISSION_PCT = '15';
