// Coordinates are always (lng, lat) when building PostGIS points (TRD section 7).
export interface LatLng {
  lat: number;
  lng: number;
}

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Straight-line fallback ETA when OpenRouteService is unavailable. Default 25 km/h urban average. */
export function estimateEtaSeconds(distanceM: number, kmh = 25): number {
  return Math.round(distanceM / ((kmh * 1000) / 3600));
}

export interface LocationFix extends LatLng {
  mocked?: boolean;
  accuracy_m?: number;
}

export const MAX_ACCURACY_M = 200;

/** Returns a reason string if the fix looks spoofed or unusable ("where detectable", TRD section 9 rule 3). */
export function suspiciousLocationReason(fix: Pick<LocationFix, 'mocked' | 'accuracy_m'>): string | null {
  if (fix.mocked === true) return 'MOCK_LOCATION';
  if (fix.accuracy_m !== undefined && fix.accuracy_m > MAX_ACCURACY_M) return 'LOW_ACCURACY';
  return null;
}
