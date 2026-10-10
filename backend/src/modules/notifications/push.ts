import { db } from '../../config/db';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// In tests nothing leaves the process; assertions read this list instead.
export const sentPushes: Array<PushMessage & { userId: string }> = [];

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';

/** Best-effort Expo push (FCM under it). Never throws: a failed push must not fail the request that caused it. */
export async function sendPush(userIds: string[], msg: PushMessage): Promise<void> {
  if (!userIds.length) return;
  if (env.NODE_ENV === 'test') {
    for (const userId of userIds) sentPushes.push({ userId, ...msg });
    return;
  }
  try {
    const rows = await db('push_tokens')
      .whereIn('user_id', userIds)
      .select<{ user_id: string; token: string }[]>('user_id', 'token');
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const res = await fetch(EXPO_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(
          chunk.map((r) => ({
            to: r.token,
            title: msg.title,
            body: msg.body,
            data: msg.data ?? {},
            sound: 'default',
          })),
        ),
      });
      if (!res.ok) {
        logger.warn(`expo push responded ${res.status}`);
        continue;
      }
      const json = (await res.json()) as { data?: Array<{ status: string; details?: { error?: string } }> };
      const dead = chunk.filter((_, idx) => json.data?.[idx]?.details?.error === 'DeviceNotRegistered');
      for (const d of dead) await db('push_tokens').where({ user_id: d.user_id, token: d.token }).del();
    }
  } catch (err) {
    logger.warn('expo push failed', err instanceof Error ? err.message : String(err));
  }
}
