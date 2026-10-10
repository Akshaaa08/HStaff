import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  billableMinutes,
  diffMinutesFloor,
  overlaps,
  roundUpTo15,
  scheduledMinutes,
} from '../../src/utils/time';

const t = (s: string) => new Date(s);

describe('time rules (TRD section 9 rule 5)', () => {
  it('rounds up to 15 minutes', () => {
    expect([0, 1, 14, 15, 16, 60, 61].map(roundUpTo15)).toEqual([0, 15, 15, 15, 30, 60, 75]);
  });
  it('caps billable at scheduled + 30', () => {
    expect(billableMinutes(200, 120)).toBe(150);
    expect(billableMinutes(125, 120)).toBe(135);
    expect(billableMinutes(90, 120)).toBe(90);
    expect(billableMinutes(150, 120)).toBe(150);
    expect(billableMinutes(151, 120)).toBe(150);
  });
  it('floors partial minutes of verified time', () => {
    expect(diffMinutesFloor(t('2026-01-01T10:00:00Z'), t('2026-01-01T11:00:59Z'))).toBe(60);
    expect(diffMinutesFloor(t('2026-01-01T10:00:00Z'), t('2026-01-01T09:00:00Z'))).toBe(0);
  });
  it('computes scheduled minutes and adds minutes', () => {
    expect(scheduledMinutes(t('2026-01-01T10:00:00Z'), t('2026-01-01T12:30:00Z'))).toBe(150);
    expect(addMinutes(t('2026-01-01T10:00:00Z'), 90).toISOString()).toBe('2026-01-01T11:30:00.000Z');
  });
  it('overlap is half-open: back-to-back shifts do not clash', () => {
    const a = [t('2026-01-01T10:00:00Z'), t('2026-01-01T12:00:00Z')] as const;
    expect(overlaps(...a, t('2026-01-01T12:00:00Z'), t('2026-01-01T13:00:00Z'))).toBe(false);
    expect(overlaps(...a, t('2026-01-01T11:59:00Z'), t('2026-01-01T13:00:00Z'))).toBe(true);
    expect(overlaps(...a, t('2026-01-01T08:00:00Z'), t('2026-01-01T10:00:00Z'))).toBe(false);
  });
});
