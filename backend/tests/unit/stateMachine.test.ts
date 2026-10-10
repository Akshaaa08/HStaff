import { describe, expect, it } from 'vitest';
import { SHIFT_STATUSES, type Actor, type ShiftStatus } from '../../src/shared/enums';
import { AppError } from '../../src/utils/errors';
import {
  assertTransition,
  canTransition,
  initialStatus,
  TRANSITIONS,
} from '../../src/modules/shifts/stateMachine';

describe('shift state machine (TRD section 8)', () => {
  const happy: Array<[ShiftStatus, ShiftStatus, Actor]> = [
    ['REQUESTED', 'ACCEPTED', 'worker'],
    ['OPEN', 'ACCEPTED', 'worker'],
    ['REQUESTED', 'DECLINED', 'worker'],
    ['REQUESTED', 'EXPIRED', 'system'],
    ['ACCEPTED', 'EN_ROUTE', 'worker'],
    ['ACCEPTED', 'ARRIVED', 'worker'],
    ['EN_ROUTE', 'ARRIVED', 'worker'],
    ['ARRIVED', 'IN_PROGRESS', 'worker'],
    ['IN_PROGRESS', 'AWAITING_APPROVAL', 'worker'],
    ['AWAITING_APPROVAL', 'APPROVED', 'client'],
    ['AWAITING_APPROVAL', 'APPROVED', 'system'],
    ['AWAITING_APPROVAL', 'DISPUTED', 'client'],
    ['APPROVED', 'PAID', 'client'],
    ['REQUESTED', 'CANCELLED', 'client'],
    ['ACCEPTED', 'CANCELLED', 'worker'],
    ['DECLINED', 'REQUESTED', 'client'],
    ['EXPIRED', 'REQUESTED', 'client'],
  ];
  it.each(happy)('%s -> %s by %s is allowed', (from, to, actor) => {
    expect(canTransition(from, to, actor)).toBe(true);
  });

  const illegal: Array<[ShiftStatus, ShiftStatus, Actor]> = [
    ['REQUESTED', 'IN_PROGRESS', 'worker'], // cannot skip arrival
    ['ACCEPTED', 'IN_PROGRESS', 'worker'], // cannot skip OTP check-in
    ['IN_PROGRESS', 'PAID', 'client'], // cannot skip approval
    ['AWAITING_APPROVAL', 'PAID', 'client'],
    ['REQUESTED', 'ACCEPTED', 'client'], // wrong actor
    ['AWAITING_APPROVAL', 'APPROVED', 'worker'],
    ['APPROVED', 'PAID', 'worker'],
    ['IN_PROGRESS', 'CANCELLED', 'client'], // cancel only before the job starts
    ['ARRIVED', 'CANCELLED', 'worker'],
    ['PAID', 'CANCELLED', 'admin'],
    ['PAID', 'APPROVED', 'system'],
    ['CANCELLED', 'REQUESTED', 'client'],
    ['ACCEPTED', 'EXPIRED', 'worker'],
  ];
  it.each(illegal)('%s -> %s by %s is rejected with 409', (from, to, actor) => {
    expect(canTransition(from, to, actor)).toBe(false);
    try {
      assertTransition(from, to, actor);
      throw new Error('expected assertTransition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(409);
      expect((err as AppError).code).toBe('ILLEGAL_TRANSITION');
    }
  });

  it('PAID is final: nothing leaves it for any actor', () => {
    for (const to of SHIFT_STATUSES)
      for (const a of ['client', 'worker', 'admin', 'system'] as Actor[])
        expect(canTransition('PAID', to, a)).toBe(false);
  });
  it('CANCELLED is final', () => {
    for (const to of SHIFT_STATUSES)
      for (const a of ['client', 'worker', 'admin', 'system'] as Actor[])
        expect(canTransition('CANCELLED', to, a)).toBe(false);
  });
  it('every non-initial status is reachable from some transition', () => {
    const targets = new Set(TRANSITIONS.map((t) => t.to));
    for (const s of SHIFT_STATUSES) if (s !== 'OPEN') expect(targets.has(s)).toBe(true);
  });
  it('creation: DIRECT starts REQUESTED, OPEN starts OPEN', () => {
    expect(initialStatus('DIRECT')).toBe('REQUESTED');
    expect(initialStatus('OPEN')).toBe('OPEN');
  });
});
