import { describe, expect, it } from 'vitest';
import { computeBilling, divRoundHalfUp, fromPaise, toPaise } from '../../src/utils/money';

describe('money', () => {
  it('converts to and from paise without float drift', () => {
    expect(toPaise('250.00')).toBe(25000);
    expect(toPaise('0.1') + toPaise('0.2')).toBe(30);
    expect(toPaise(19.99)).toBe(1999);
    expect(toPaise('10.005')).toBe(1001); // half-up on the third decimal
    expect(fromPaise(31250)).toBe('312.50');
    expect(fromPaise(5)).toBe('0.05');
  });
  it('rounds half up', () => {
    expect(divRoundHalfUp(5, 2)).toBe(3);
    expect(divRoundHalfUp(4, 3)).toBe(1);
    expect(divRoundHalfUp(1, 3)).toBe(0);
  });
  it('hand-calculated case: 1h at 250/h, 15% commission', () => {
    expect(computeBilling(60, '250.00', 15)).toEqual({
      gross: '250.00',
      commission: '37.50',
      worker_payout: '212.50',
    });
  });
  it('hand-calculated case: 75 min at 300/h', () => {
    expect(computeBilling(75, '300.00', 15)).toEqual({
      gross: '375.00',
      commission: '56.25',
      worker_payout: '318.75',
    });
  });
  it('hand-calculated case: 75 min at 250/h rounds commission half-up (46.875 -> 46.88)', () => {
    expect(computeBilling(75, '250.00', 15)).toEqual({
      gross: '312.50',
      commission: '46.88',
      worker_payout: '265.62',
    });
  });
  it('rounds gross half-up: 15 min at 100.10 = 25.025 -> 25.03', () => {
    expect(computeBilling(15, '100.10', 0).gross).toBe('25.03');
  });
  it('supports fractional commission percentages', () => {
    expect(computeBilling(60, '100.10', 12.5)).toEqual({
      gross: '100.10',
      commission: '12.51',
      worker_payout: '87.59',
    });
  });
  it('payout + commission always equals gross', () => {
    for (const minutes of [15, 30, 45, 75, 105, 135, 450]) {
      for (const rate of ['99.99', '250.00', '333.33', '1.01']) {
        for (const pct of [0, 7.5, 15, 33.33, 100]) {
          const b = computeBilling(minutes, rate, pct);
          expect(toPaise(b.commission) + toPaise(b.worker_payout)).toBe(toPaise(b.gross));
        }
      }
    }
  });
  it('zero minutes bill zero', () => {
    expect(computeBilling(0, '250.00', 15)).toEqual({
      gross: '0.00',
      commission: '0.00',
      worker_payout: '0.00',
    });
  });
});
