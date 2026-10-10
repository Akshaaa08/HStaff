// Normalises to E.164. The prototype UI collects 10-digit Indian mobiles ([6-9]xxxxxxxxx): those get +91.
export function normalizePhone(raw: string): string | null {
  const s = raw.replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(s)) return `+91${s}`;
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  return null;
}
