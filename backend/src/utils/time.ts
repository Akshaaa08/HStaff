export const MS_PER_MIN = 60_000;

/** Whole minutes between two instants, floor (a worker is never billed for a partial minute). */
export function diffMinutesFloor(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS_PER_MIN));
}

export function roundUpTo15(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

export function scheduledMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_MIN);
}

/** billable = min(round_up_to_15(verified), scheduled + 30)  (TRD section 9 rule 5) */
export function billableMinutes(verified: number, scheduled: number): number {
  return Math.min(roundUpTo15(verified), scheduled + 30);
}

export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * MS_PER_MIN);
export const addHours = (d: Date, h: number) => addMinutes(d, h * 60);

/** Half-open overlap [aStart, aEnd) vs [bStart, bEnd) */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
