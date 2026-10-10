import { randomUUID } from 'node:crypto';
import { db } from '../../config/db';
import { KYC_BUCKET, storage } from '../../config/storage';
import { assertFileSignature, extensionFor } from '../../middleware/upload';
import { conflict, notFound } from '../../utils/errors';
import { notifyUser } from '../notifications/service';
import { adminRecipients, announceTransition } from '../shifts/announce';
import { getShiftDetail } from '../shifts/service';
import { lockShift, logShiftEvent, transitionShift, type ActorRef } from '../shifts/transitions';
import type { AuthUser } from '../../shared/enums';
import { DISPUTABLE } from './schema';

/** Either party can raise an issue. From AWAITING_APPROVAL it moves the shift to DISPUTED, which also pauses the 24 h auto-approve. */
export async function raiseDispute(
  user: AuthUser,
  shiftId: string,
  reason: string,
  files: Express.Multer.File[] = [],
) {
  const actor: ActorRef = { type: user.role === 'worker' ? 'worker' : 'client', id: user.id };
  files.forEach(assertFileSignature);
  const keys: string[] = [];
  for (const f of files) {
    const key = `evidence/${shiftId}/${randomUUID()}.${extensionFor(f.mimetype)}`;
    await storage.upload(KYC_BUCKET, key, f.buffer, f.mimetype); // private bucket; only the key is stored
    keys.push(key);
  }

  const { dispute, shift } = await db.transaction(async (trx) => {
    const s = await lockShift(trx, shiftId);
    if (s.client_id !== user.id && s.worker_id !== user.id)
      throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    if (!(DISPUTABLE as readonly string[]).includes(s.status)) {
      throw conflict('DISPUTE_NOT_ALLOWED', 'An issue can only be reported once the job has started', {
        status: s.status,
      });
    }
    const dup = await trx('disputes')
      .where({ shift_id: shiftId, raised_by: user.id })
      .whereIn('status', ['OPEN', 'IN_REVIEW', 'ESCALATED'])
      .first('id');
    if (dup) throw conflict('DISPUTE_EXISTS', 'You already have an open issue for this shift');
    const [d] = await trx('disputes')
      .insert({ shift_id: shiftId, raised_by: user.id, reason, evidence_urls: keys })
      .returning('*');
    let row = s;
    if (s.status === 'AWAITING_APPROVAL') {
      row = await transitionShift(trx, s, 'DISPUTED', actor, { meta: { dispute_id: d.id, reason } });
      await trx('timesheets').where({ shift_id: shiftId }).update({ status: 'DISPUTED' });
    } else {
      await logShiftEvent(trx, shiftId, user.id, 'DISPUTE_RAISED', {
        meta: { dispute_id: d.id, reason, status: s.status },
      });
    }
    return { dispute: d, shift: row };
  });

  if (shift.status === 'DISPUTED') await announceTransition(shift, actor);
  const other = user.id === shift.client_id ? shift.worker_id : shift.client_id;
  if (other && shift.status !== 'DISPUTED') {
    await notifyUser(other, {
      title: 'Issue reported',
      body: 'An issue was reported on this booking. Support will review it.',
      data: { shiftId },
    });
  }
  for (const adminId of await adminRecipients()) {
    await notifyUser(adminId, {
      title: 'New dispute',
      body: `A dispute was raised on shift ${shiftId.slice(0, 8)}`,
      data: { shiftId, disputeId: dispute.id },
    });
  }
  return {
    dispute: {
      id: dispute.id,
      status: dispute.status,
      reason: dispute.reason,
      evidence_count: keys.length,
      created_at: dispute.created_at,
    },
    shift: await getShiftDetail(user, shiftId),
  };
}
