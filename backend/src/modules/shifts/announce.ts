import { db } from '../../config/db';
import { EVENTS } from '../../realtime/events';
import { emitToUser, joinShiftRoom } from '../../realtime/socket';
import { notifyUser } from '../notifications/service';
import type { ShiftStatus } from '../../shared/enums';
import type { ActorRef, ShiftRow } from './transitions';

type Audience = 'client' | 'worker' | 'both';
interface Message {
  to: Audience;
  title: string;
  body: string;
}

const MESSAGES: Partial<Record<ShiftStatus, Message>> = {
  REQUESTED: { to: 'worker', title: 'New job request', body: 'A customer has requested you for a job.' },
  ACCEPTED: { to: 'client', title: 'Request accepted', body: 'Your professional accepted the request.' },
  DECLINED: {
    to: 'client',
    title: 'Request declined',
    body: 'Your professional is not available. You can choose someone else.',
  },
  EXPIRED: {
    to: 'client',
    title: 'No response',
    body: 'Nobody responded in time. You can choose another professional.',
  },
  EN_ROUTE: { to: 'client', title: 'On the way', body: 'Your professional is on the way.' },
  ARRIVED: {
    to: 'client',
    title: 'Your professional has arrived',
    body: 'Share the start code once you have confirmed arrival.',
  },
  IN_PROGRESS: { to: 'client', title: 'Service started', body: 'The timer is running.' },
  AWAITING_APPROVAL: { to: 'client', title: 'Timesheet ready', body: 'Review and approve the hours worked.' },
  APPROVED: {
    to: 'worker',
    title: 'Timesheet approved',
    body: 'The client approved your hours. Payment is next.',
  },
  PAID: {
    to: 'worker',
    title: 'Payment received',
    body: 'The client has paid. Your payout is being processed.',
  },
  CANCELLED: { to: 'both', title: 'Booking cancelled', body: 'This booking was cancelled.' },
  DISPUTED: {
    to: 'both',
    title: 'Issue reported',
    body: 'An issue was reported on this booking. Support will review it.',
  },
};

/**
 * Post-commit side effects of a status change: `shift:updated` to both parties over Socket.IO, plus a persisted
 * notification (socket or push) for the party who did NOT cause the change (TRD section 8 and 12). Never throws.
 */
export async function announceTransition(
  shift: ShiftRow,
  actor: ActorRef,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const parties = [shift.client_id, shift.worker_id].filter((x): x is string => !!x);
  if (shift.worker_id && !['REQUESTED', 'OPEN', 'DECLINED', 'EXPIRED', 'CANCELLED'].includes(shift.status)) {
    for (const id of parties) joinShiftRoom(id, shift.id);
  }
  for (const id of parties)
    emitToUser(id, EVENTS.shiftUpdated, { shiftId: shift.id, status: shift.status, ...extra });

  const msg = MESSAGES[shift.status];
  if (!msg) return;
  const targets = new Set<string>();
  if (msg.to === 'client' || msg.to === 'both') targets.add(shift.client_id);
  if ((msg.to === 'worker' || msg.to === 'both') && shift.worker_id) targets.add(shift.worker_id);
  if (actor.id) targets.delete(actor.id);
  const data = { shiftId: shift.id, status: shift.status, ...extra };
  await Promise.all([...targets].map((uid) => notifyUser(uid, { title: msg.title, body: msg.body, data })));
}

export interface RequestSummary {
  shiftId: string;
  mode: string;
  skill: string | null;
  start_at: Date;
  end_at: Date;
  hours: number;
  hourly_rate: string;
  distance_m?: number | null;
}

/** `shift:requested` to a worker (direct request or OPEN broadcast), persisted as a notification as well. */
export async function sendRequestToWorker(workerId: string, summary: RequestSummary): Promise<void> {
  emitToUser(workerId, EVENTS.shiftRequested, summary);
  await notifyUser(workerId, {
    title: 'New job request',
    body: `${summary.skill ?? 'Job'} · ${summary.hours} h`,
    data: { shiftId: summary.shiftId, status: summary.mode === 'OPEN' ? 'OPEN' : 'REQUESTED' },
  });
}

export async function adminRecipients(roles: string[] = ['support', 'super_admin']): Promise<string[]> {
  return db('users')
    .where({ role: 'admin', status: 'ACTIVE' })
    .whereIn('admin_role', roles)
    .pluck<string[]>('id');
}
