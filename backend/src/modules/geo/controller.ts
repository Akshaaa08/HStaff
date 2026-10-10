import type { Request, Response } from 'express';
import { db } from '../../config/db';
import { me, ok } from '../../utils/http';
import { badRequest, notFound } from '../../utils/errors';
import type { EtaQuery } from './schema';
import { getEta, searchPlaces } from './service';

export const search = async (req: Request, res: Response) => {
  const q = req.valid.query as { q: string; countrycodes: string };
  const r = await searchPlaces(q.q, q.countrycodes);
  ok(res, r.results, { cached: r.cached });
};

export const eta = async (req: Request, res: Response) => {
  const q = req.valid.query as EtaQuery;
  if (q.shiftId) {
    // Tracking screen: worker's last known position to the shift location, only for the two parties.
    const user = me(req);
    const { rows } = await db.raw(
      `SELECT s.client_id, s.worker_id, ST_Y(s.location::geometry) AS to_lat, ST_X(s.location::geometry) AS to_lng,
              ST_Y(wp.location::geometry) AS from_lat, ST_X(wp.location::geometry) AS from_lng
         FROM shifts s LEFT JOIN worker_profiles wp ON wp.user_id = s.worker_id WHERE s.id = ?`,
      [q.shiftId],
    );
    const r = rows[0];
    if (!r || (r.client_id !== user.id && r.worker_id !== user.id))
      throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    if (r.from_lat === null)
      throw badRequest('NO_WORKER_LOCATION', 'The worker has not shared a location yet');
    return ok(res, await getEta({ lat: r.from_lat, lng: r.from_lng }, { lat: r.to_lat, lng: r.to_lng }));
  }
  ok(res, await getEta({ lat: q.fromLat!, lng: q.fromLng! }, { lat: q.toLat!, lng: q.toLng! }));
};
