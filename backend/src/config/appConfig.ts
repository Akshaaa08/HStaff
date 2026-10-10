import { db } from './db';
import { env } from './env';

// Admin-editable settings live in app_config (TRD section 7). When a key has no row we fall back to the env value.
export const CONFIG_KEYS = {
  commission_pct: { env: () => env.COMMISSION_PCT, min: 0, max: 100 },
  geofence_m: { env: () => env.GEOFENCE_RADIUS_M, min: 10, max: 5000 },
  request_ttl_min: { env: () => env.REQUEST_TTL_MIN, min: 1, max: 1440 },
  approval_sla_hours: { env: () => env.APPROVAL_SLA_HOURS, min: 1, max: 720 },
} as const;
export type ConfigKey = keyof typeof CONFIG_KEYS;

export async function getAllConfig(): Promise<Record<ConfigKey, number>> {
  const rows = await db('app_config').select<{ key: string; value: string }[]>('key', 'value');
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<ConfigKey, number>;
  for (const key of Object.keys(CONFIG_KEYS) as ConfigKey[]) {
    const raw = stored.get(key);
    const n = raw === undefined ? NaN : Number(raw);
    out[key] = Number.isFinite(n) ? n : CONFIG_KEYS[key].env();
  }
  return out;
}

export async function getConfig(key: ConfigKey): Promise<number> {
  const row = await db('app_config').where({ key }).first<{ value: string } | undefined>('value');
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) ? n : CONFIG_KEYS[key].env();
}
