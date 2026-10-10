import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { AppError, tooMany } from '../../utils/errors';
import { estimateEtaSeconds, haversineM, type LatLng } from '../../utils/geo';
import { logger } from '../../utils/logger';

const SEARCH_TTL_SEC = 24 * 3600;
const ETA_TTL_SEC = 60;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nominatim policy: max 1 request/second, identifying User-Agent, cache results (TRD section 11). */
async function waitForNominatimSlot(): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const got = await redis.set('geo:nominatim:slot', '1', 'PX', 1000, 'NX');
    if (got === 'OK') return;
    await sleep(250);
  }
  throw tooMany('GEO_BUSY', 'Address search is busy, try again in a moment');
}

export interface GeoResult {
  display_name: string;
  lat: number;
  lng: number;
  type?: string;
}

export async function searchPlaces(
  q: string,
  countrycodes = 'in',
): Promise<{ results: GeoResult[]; cached: boolean }> {
  const norm = q.trim().toLowerCase().replace(/\s+/g, ' ');
  const cacheKey = `geo:search:${countrycodes}:${norm}`;
  const hitCache = await redis.get(cacheKey);
  if (hitCache) return { results: JSON.parse(hitCache) as GeoResult[], cached: true };

  await waitForNominatimSlot();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '6',
    addressdetails: '0',
    countrycodes,
  }).toString();
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': env.NOMINATIM_USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    logger.warn('nominatim unreachable', err instanceof Error ? err.message : String(err));
    throw new AppError(502, 'GEOCODER_UNAVAILABLE', 'Address search is unavailable right now');
  }
  if (!res.ok) throw new AppError(502, 'GEOCODER_UNAVAILABLE', `Address search failed (${res.status})`);
  const raw = (await res.json()) as Array<{ display_name: string; lat: string; lon: string; type?: string }>;
  const results = raw.map((r) => ({
    display_name: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    type: r.type,
  }));
  await redis.set(cacheKey, JSON.stringify(results), 'EX', SEARCH_TTL_SEC);
  return { results, cached: false };
}

export interface Eta {
  distance_m: number;
  duration_sec: number;
  source: 'openrouteservice' | 'estimate';
}

/** ORS driving ETA with a straight-line fallback so tracking never hard-fails (docs/decisions.md D-13). */
export async function getEta(from: LatLng, to: LatLng): Promise<Eta> {
  const key = `geo:eta:${from.lat.toFixed(4)},${from.lng.toFixed(4)}:${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as Eta;

  let eta: Eta | null = null;
  if (env.ORS_API_KEY) {
    try {
      const url = new URL('https://api.openrouteservice.org/v2/directions/driving-car');
      url.search = new URLSearchParams({
        api_key: env.ORS_API_KEY,
        start: `${from.lng},${from.lat}`,
        end: `${to.lng},${to.lat}`,
      }).toString();
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = (await res.json()) as {
          features?: Array<{ properties?: { summary?: { distance: number; duration: number } } }>;
        };
        const s = json.features?.[0]?.properties?.summary;
        if (s)
          eta = {
            distance_m: Math.round(s.distance),
            duration_sec: Math.round(s.duration),
            source: 'openrouteservice',
          };
      } else logger.warn(`openrouteservice responded ${res.status}`);
    } catch (err) {
      logger.warn('openrouteservice failed', err instanceof Error ? err.message : String(err));
    }
  }
  if (!eta) {
    const d = Math.round(haversineM(from, to) * 1.3); // road distance is typically longer than the straight line
    eta = { distance_m: d, duration_sec: estimateEtaSeconds(d), source: 'estimate' };
  }
  await redis.set(key, JSON.stringify(eta), 'EX', ETA_TTL_SEC);
  return eta;
}
