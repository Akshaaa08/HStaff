import { db, type DbOrTrx } from '../../config/db';
import { conflict, notFound } from '../../utils/errors';
import type { AuthUser } from '../../shared/enums';
import type { CreateReviewBody } from './schema';

/** Rule 8: only after PAID, or after an admin resolved a dispute; one review per party per shift. */
export async function createReview(user: AuthUser, body: CreateReviewBody) {
  const shift = await db('shifts')
    .where({ id: body.shiftId })
    .first<{ client_id: string; worker_id: string | null; status: string } | undefined>(
      'client_id',
      'worker_id',
      'status',
    );
  const isClient = shift?.client_id === user.id;
  const isWorker = !!shift && shift.worker_id === user.id;
  if (!shift || (!isClient && !isWorker)) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  if (!shift.worker_id) throw conflict('REVIEW_NOT_ALLOWED', 'This shift had no worker');

  const resolved = await db('disputes').where({ shift_id: body.shiftId, status: 'RESOLVED' }).first('id');
  if (shift.status !== 'PAID' && !resolved) {
    throw conflict('REVIEW_NOT_ALLOWED', 'You can rate once the shift is paid or the dispute is resolved', {
      status: shift.status,
    });
  }
  const revieweeId = isClient ? shift.worker_id : shift.client_id;

  try {
    return await db.transaction(async (trx) => {
      const [review] = await trx('reviews')
        .insert({
          shift_id: body.shiftId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          stars: body.stars,
          tags: body.tags,
          comment: body.comment ?? null,
        })
        .returning('*');
      if (isClient) {
        // Incremental aggregate (rule 8); rating_avg is numeric(3,2).
        await trx.raw(
          `UPDATE worker_profiles SET rating_avg = ROUND((rating_avg * rating_count + ?) / (rating_count + 1.0), 2), rating_count = rating_count + 1 WHERE user_id = ?`,
          [body.stars, revieweeId],
        );
      }
      return review;
    });
  } catch (err) {
    if ((err as { code?: string }).code === '23505')
      throw conflict('REVIEW_EXISTS', 'You already rated this shift');
    throw err;
  }
}

export async function reportReview(user: AuthUser, reviewId: string) {
  const [row] = await db('reviews')
    .where({ id: reviewId, reviewee_id: user.id })
    .update({ reported: true })
    .returning('*');
  if (!row) throw notFound('Review not found');
  return row;
}

/** Full recompute from visible reviews; used when an admin hides or restores one so the aggregate never drifts. */
export async function recomputeWorkerRating(workerId: string, conn: DbOrTrx = db) {
  await conn.raw(
    `UPDATE worker_profiles wp SET
       rating_avg = COALESCE((SELECT ROUND(AVG(stars)::numeric, 2) FROM reviews WHERE reviewee_id = wp.user_id AND hidden = false), 0),
       rating_count = (SELECT count(*)::int FROM reviews WHERE reviewee_id = wp.user_id AND hidden = false)
     WHERE wp.user_id = ?`,
    [workerId],
  );
}
