import { conflict } from '../../utils/errors';
import type { Actor, ShiftMode, ShiftStatus } from '../../shared/enums';

/** Pure transition table for TRD section 8 (no I/O, unit-tested). Rows marked [D-xx] extend the TRD, see docs/decisions.md. */
export interface Transition {
  from: ShiftStatus[];
  to: ShiftStatus;
  actors: Actor[];
}

const CANCELLABLE_BY_ADMIN: ShiftStatus[] = [
  'OPEN',
  'REQUESTED',
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'DISPUTED',
  'DECLINED',
  'EXPIRED',
];

export const TRANSITIONS: Transition[] = [
  { from: ['REQUESTED', 'OPEN'], to: 'ACCEPTED', actors: ['worker'] },
  { from: ['REQUESTED'], to: 'DECLINED', actors: ['worker'] },
  { from: ['REQUESTED', 'OPEN'], to: 'EXPIRED', actors: ['system'] }, // [D-10] OPEN also expires
  { from: ['ACCEPTED'], to: 'EN_ROUTE', actors: ['worker'] },
  { from: ['ACCEPTED', 'EN_ROUTE'], to: 'ARRIVED', actors: ['worker'] },
  { from: ['ARRIVED'], to: 'IN_PROGRESS', actors: ['worker'] },
  { from: ['IN_PROGRESS'], to: 'AWAITING_APPROVAL', actors: ['worker'] },
  { from: ['AWAITING_APPROVAL'], to: 'APPROVED', actors: ['client', 'system'] },
  { from: ['AWAITING_APPROVAL'], to: 'DISPUTED', actors: ['client', 'worker'] }, // [D-11] endpoint allows either party
  { from: ['DISPUTED'], to: 'APPROVED', actors: ['admin'] }, // [D-11] admin resolution outcomes
  { from: ['DISPUTED'], to: 'CANCELLED', actors: ['admin'] },
  { from: ['APPROVED'], to: 'PAID', actors: ['client', 'system'] },
  { from: ['REQUESTED', 'OPEN', 'ACCEPTED'], to: 'CANCELLED', actors: ['client', 'worker'] },
  { from: CANCELLABLE_BY_ADMIN, to: 'CANCELLED', actors: ['admin'] },
  // reassign / reopen (section 8: "client can pick another worker")
  { from: ['DECLINED', 'EXPIRED'], to: 'REQUESTED', actors: ['client', 'admin'] },
  { from: ['OPEN', 'REQUESTED', 'ACCEPTED'], to: 'REQUESTED', actors: ['admin'] },
  { from: ['EXPIRED'], to: 'OPEN', actors: ['client', 'admin'] },
];

export function canTransition(from: ShiftStatus, to: ShiftStatus, actor: Actor): boolean {
  return TRANSITIONS.some((t) => t.to === to && t.from.includes(from) && t.actors.includes(actor));
}

/** Illegal transitions are 409 (TRD section 8). */
export function assertTransition(from: ShiftStatus, to: ShiftStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) {
    throw conflict('ILLEGAL_TRANSITION', `A shift in status ${from} cannot move to ${to}`, {
      from,
      to,
      actor,
    });
  }
}

export const initialStatus = (mode: ShiftMode): ShiftStatus => (mode === 'DIRECT' ? 'REQUESTED' : 'OPEN');

/** Statuses during which a worker is committed to the time slot (used by the overlap check). */
export const COMMITTED_STATUSES: ShiftStatus[] = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];

export const STATUS_GROUPS: Record<string, ShiftStatus[]> = {
  incoming: ['REQUESTED', 'OPEN'], // for workers: direct requests plus nearby OPEN jobs
  upcoming: ['OPEN', 'REQUESTED', 'ACCEPTED'],
  active: ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'APPROVED', 'DISPUTED'],
  completed: ['PAID'],
  cancelled: ['CANCELLED', 'DECLINED', 'EXPIRED'],
  history: ['PAID', 'CANCELLED', 'DECLINED', 'EXPIRED'],
};
