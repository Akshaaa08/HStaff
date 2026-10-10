import { db } from '../../config/db';
import { logger } from '../../utils/logger';
import { notFound } from '../../utils/errors';
import { EVENTS } from '../../realtime/events';
import { emitToUser, hasLiveSocket } from '../../realtime/socket';
import { sendPush, type PushMessage } from './push';

export interface NotificationInput {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Persists a notification, then delivers it: socket if the user is connected, Expo push if not
 * (TRD section 12). `push` lets a caller send richer text to the device than what is stored
 * (used for shift OTPs, which must never be written to Postgres).
 * Never throws.
 */
export async function notifyUser(userId: string, n: NotificationInput, push?: PushMessage): Promise<void> {
  try {
    const [row] = await db('notifications')
      .insert({ user_id: userId, title: n.title, body: n.body, data: n.data ?? {} })
      .returning('*');
    if (await hasLiveSocket(userId)) emitToUser(userId, EVENTS.notificationNew, row);
    else await sendPush([userId], push ?? { title: n.title, body: n.body, data: n.data });
  } catch (err) {
    logger.error('notifyUser failed', err);
  }
}

/** Broadcast (admin announcements): one batch insert, one push fan-out. */
export async function notifyMany(userIds: string[], n: NotificationInput): Promise<number> {
  let sent = 0;
  for (let i = 0; i < userIds.length; i += 500) {
    const chunk = userIds.slice(i, i + 500);
    const rows = await db('notifications')
      .insert(chunk.map((user_id) => ({ user_id, title: n.title, body: n.body, data: n.data ?? {} })))
      .returning('*');
    const offline: string[] = [];
    for (const row of rows) {
      if (await hasLiveSocket(row.user_id as string))
        emitToUser(row.user_id as string, EVENTS.notificationNew, row);
      else offline.push(row.user_id as string);
    }
    await sendPush(offline, { title: n.title, body: n.body, data: n.data });
    sent += rows.length;
  }
  return sent;
}

export async function listNotifications(userId: string, page: number, limit: number) {
  const rows = await db('notifications')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  const [{ count: total }] = await db('notifications')
    .where({ user_id: userId })
    .count<{ count: string }[]>('* as count');
  const [{ count: unread }] = await db('notifications')
    .where({ user_id: userId, read: false })
    .count<{ count: string }[]>('* as count');
  return { rows, meta: { page, limit, total: Number(total), unread: Number(unread) } };
}

export async function markRead(userId: string, id: string) {
  const [row] = await db('notifications')
    .where({ id, user_id: userId })
    .update({ read: true })
    .returning('*');
  if (!row) throw notFound('Notification not found');
  return row;
}

export async function markAllRead(userId: string) {
  const n = await db('notifications').where({ user_id: userId, read: false }).update({ read: true });
  return { updated: n };
}
