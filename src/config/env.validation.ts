const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'] as const;

const DEV_DEFAULTS: Record<string, string> = {
  JWT_SECRET: 'dev-only-secret-do-not-use-in-production',
  REDIS_URL: 'redis://localhost:6379',
};

const PLACEHOLDER_SECRETS = ['change-me-in-real-life', 'changeme', 'secret'];

export function validateEnv(config: Record<string, unknown>) {
  const isProd = config.NODE_ENV === 'production';
  const result: Record<string, unknown> = { ...config };
  const problems: string[] = [];

  for (const key of REQUIRED) {
    const value = config[key];
    const missing = typeof value !== 'string' || value.trim() === '';

    if (missing) {
      if (!isProd && DEV_DEFAULTS[key]) {
        result[key] = DEV_DEFAULTS[key];
      } else {
        problems.push(`${key} is required`);
      }
    }
  }

  if (isProd && PLACEHOLDER_SECRETS.includes(String(config.JWT_SECRET))) {
    problems.push('JWT_SECRET is a placeholder value; set a real secret');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration: ${problems.join('; ')}`);
  }

  return result;
}