import { z } from 'zod';

// Node >= 20.12 / 21.7. Absent .env is fine (Docker/Render inject real env vars).
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

const str = (def = '') => z.string().default(def);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
    JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters'),
    JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
    OTP_PROVIDER: z.enum(['console', 'firebase', 'msg91']).default('console'),
    SUPABASE_URL: str(),
    SUPABASE_SERVICE_ROLE_KEY: str(),
    SUPABASE_KYC_BUCKET: str('kyc-documents'),
    SUPABASE_PUBLIC_BUCKET: str('profile-photos'),
    ORS_API_KEY: str(),
    NOMINATIM_USER_AGENT: z.string().min(3, 'NOMINATIM_USER_AGENT is required (Nominatim usage policy)'),
    GEOFENCE_RADIUS_M: z.coerce.number().positive().default(150),
    COMMISSION_PCT: z.coerce.number().min(0).max(100).default(15),
    REQUEST_TTL_MIN: z.coerce.number().positive().default(10),
    APPROVAL_SLA_HOURS: z.coerce.number().positive().default(24),
    PAYMENT_PROVIDER: z.enum(['simulated', 'razorpay']).default('simulated'),
    RAZORPAY_KEY_ID: str(),
    RAZORPAY_KEY_SECRET: str(),
    CORS_ORIGINS: str('http://localhost:5173'),
    API_PUBLIC_URL: str('http://localhost:4000'),
  })
  .superRefine((e, ctx) => {
    const need = (cond: boolean, path: string, message: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    if (e.PAYMENT_PROVIDER === 'razorpay') {
      need(!!e.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_ID', 'required when PAYMENT_PROVIDER=razorpay');
      need(!!e.RAZORPAY_KEY_SECRET, 'RAZORPAY_KEY_SECRET', 'required when PAYMENT_PROVIDER=razorpay');
    }
    if (e.NODE_ENV === 'production') {
      need(!!e.SUPABASE_URL, 'SUPABASE_URL', 'required in production');
      need(!!e.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY', 'required in production');
      need(
        !e.JWT_ACCESS_SECRET.startsWith('change-me'),
        'JWT_ACCESS_SECRET',
        'must not be the example value',
      );
      need(
        !e.JWT_REFRESH_SECRET.startsWith('change-me'),
        'JWT_REFRESH_SECRET',
        'must not be the example value',
      );
      need(
        e.JWT_ACCESS_SECRET !== e.JWT_REFRESH_SECRET,
        'JWT_REFRESH_SECRET',
        'must differ from JWT_ACCESS_SECRET',
      );
    }
  });

export type Env = z.infer<typeof envSchema> & { corsOrigins: string[] };

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.parse(raw);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function load(): Env {
  try {
    return parseEnv();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const lines = err.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      console.error(`Invalid environment configuration. Refusing to start:\n${lines}`);
      process.exit(1);
    }
    throw err;
  }
}

export const env: Env = load();
