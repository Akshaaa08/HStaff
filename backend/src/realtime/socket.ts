import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { db } from '../config/db';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../modules/auth/tokens';

let io: Server | null = null;

export const userRoom = (id: string) => `user:${id}`;
export const shiftRoom = (id: string) => `shift:${id}`;

const ACTIVE_STATUSES = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_APPROVAL'];

export function initSocket(server: HttpServer): Server {
  io = new Server(server, { cors: { origin: env.corsOrigins, credentials: true } });

  // Handshake auth with the access token (TRD section 12). Suspended users are refused like in the REST middleware.
  io.use(async (socket, next) => {
    try {
      const raw =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers.authorization?.replace(/^Bearer /, '');
      if (!raw) return next(new Error('UNAUTHORIZED'));
      const payload = verifyAccessToken(raw);
      const user = await db('users')
        .where({ id: payload.sub })
        .first<{ id: string; status: string } | undefined>('id', 'status');
      if (!user || user.status !== 'ACTIVE') return next(new Error('UNAUTHORIZED'));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
    try {
      const rows = await db('shifts')
        .where((q) => q.where({ client_id: userId }).orWhere({ worker_id: userId }))
        .whereIn('status', ACTIVE_STATUSES)
        .select<{ id: string }[]>('id');
      for (const r of rows) socket.join(shiftRoom(r.id));
    } catch (err) {
      logger.error('socket: could not join active shift rooms', err);
    }

    // Clients should refetch on reconnect; this lets them (re)join a shift room explicitly, ownership-checked.
    socket.on('shift:join', async (shiftId: string, ack?: (r: { ok: boolean }) => void) => {
      try {
        const row = await db('shifts')
          .where({ id: shiftId })
          .andWhere((q) => q.where({ client_id: userId }).orWhere({ worker_id: userId }))
          .first<{ id: string } | undefined>('id');
        if (row) socket.join(shiftRoom(row.id));
        ack?.({ ok: !!row });
      } catch {
        ack?.({ ok: false });
      }
    });
    socket.on('shift:leave', (shiftId: string) => {
      if (typeof shiftId === 'string') socket.leave(shiftRoom(shiftId));
    });
  });
  return io;
}

export const getIO = () => io;

export async function closeSocket(): Promise<void> {
  if (io) await io.close();
  io = null;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(userRoom(userId)).emit(event, payload);
}

export function emitToShift(shiftId: string, event: string, payload: unknown) {
  io?.to(shiftRoom(shiftId)).emit(event, payload);
}

/** Puts a user's live sockets into a shift room (idempotent). Needed because sockets usually connect before the shift exists. */
export function joinShiftRoom(userId: string, shiftId: string) {
  io?.in(userRoom(userId)).socketsJoin(shiftRoom(shiftId));
}

export async function hasLiveSocket(userId: string): Promise<boolean> {
  if (!io) return false;
  return (await io.in(userRoom(userId)).fetchSockets()).length > 0;
}
