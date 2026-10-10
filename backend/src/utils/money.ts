// Money is handled as integer paise internally, never floats (TRD section 9 rule 6).
// All rounding is half-up to 2 decimals. Values go to/from Postgres numeric as strings.

export function toPaise(value: string | number): number {
  const s = typeof value === 'number' ? value.toFixed(2) : value.trim();
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) throw new Error(`Invalid money value: ${s}`);
  const [, sign, whole, frac = ''] = m;
  const f = (frac + '00').slice(0, 2);
  const roundUp = frac.length > 2 && Number(frac[2]) >= 5 ? 1 : 0; // half-up on the third decimal
  const paise = Number(whole) * 100 + Number(f) + roundUp;
  return sign === '-' ? -paise : paise;
}

export function fromPaise(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** round-half-up of numerator/denominator for non-negative integers */
export function divRoundHalfUp(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

export interface Billing {
  gross: string;
  commission: string;
  worker_payout: string;
}

/** gross = minutes / 60 x hourly_rate; commission = gross x pct; payout = gross - commission. */
export function computeBilling(minutes: number, hourlyRate: string | number, commissionPct: number): Billing {
  const ratePaise = toPaise(hourlyRate);
  const grossPaise = divRoundHalfUp(minutes * ratePaise, 60);
  const pctBp = Math.round(commissionPct * 100); // basis points, supports 12.5 etc.
  const commissionPaise = divRoundHalfUp(grossPaise * pctBp, 10000);
  return {
    gross: fromPaise(grossPaise),
    commission: fromPaise(commissionPaise),
    worker_payout: fromPaise(grossPaise - commissionPaise),
  };
}
