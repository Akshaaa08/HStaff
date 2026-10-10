import { redis } from '../../config/redis';
import { computeBilling } from '../../utils/money';
import { scheduledMinutes } from '../../utils/time';
import type { AuthUser } from '../../shared/enums';

export const SHIFT_DETAIL_SELECT = `
  s.id, s.client_id, s.worker_id, s.skill_id, s.mode, s.title, s.description, s.materials, s.start_at, s.end_at,
  s.is_instant, s.address, s.hourly_rate, s.status, s.request_expires_at, s.created_at, s.updated_at,
  ST_Y(s.location::geometry) AS lat, ST_X(s.location::geometry) AS lng,
  sk.name AS skill_name,
  c.name AS client_name, c.photo_url AS client_photo,
  w.name AS worker_name, w.photo_url AS worker_photo, wp.rating_avg AS worker_rating_avg, wp.rating_count AS worker_rating_count,
  ST_Distance(s.location, vwp.location) AS viewer_distance_m,
  t.clock_in_at, t.clock_out_at, t.verified_minutes, t.billable_minutes, t.gross AS t_gross, t.commission AS t_commission,
  t.worker_payout AS t_payout, t.approval_deadline, t.status AS timesheet_status`;

export const SHIFT_DETAIL_FROM = (viewerParam = '?') => `
  FROM shifts s
  LEFT JOIN skills sk ON sk.id = s.skill_id
  LEFT JOIN users c ON c.id = s.client_id
  LEFT JOIN users w ON w.id = s.worker_id
  LEFT JOIN worker_profiles wp ON wp.user_id = s.worker_id
  LEFT JOIN worker_profiles vwp ON vwp.user_id = ${viewerParam}::uuid
  LEFT JOIN timesheets t ON t.shift_id = s.id`;

type Row = Record<string, any>;

async function pendingOtp(row: Row): Promise<'start' | 'end' | null> {
  if (row.status === 'ARRIVED' && (await redis.exists(`otp:start:${row.id}`))) return 'start';
  if (row.status === 'IN_PROGRESS' && (await redis.exists(`otp:end:${row.id}`))) return 'end';
  return null;
}

/** Shapes a joined row for one viewer. Clients never see commission; workers do not see the exact address before accepting. */
export async function toShiftDto(row: Row, viewer: AuthUser, commissionPct: number) {
  const isWorkerView = viewer.role === 'worker';
  const hideLocation =
    isWorkerView && row.worker_id !== viewer.id && ['REQUESTED', 'OPEN'].includes(row.status)
      ? true
      : isWorkerView && row.worker_id === viewer.id && row.status === 'REQUESTED';
  const sched = scheduledMinutes(new Date(row.start_at), new Date(row.end_at));
  const final = row.t_gross !== null && row.t_gross !== undefined;
  const bill = final
    ? { gross: row.t_gross, commission: row.t_commission, worker_payout: row.t_payout }
    : computeBilling(sched, row.hourly_rate, commissionPct);

  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    title: row.title,
    description: row.description,
    materials: row.materials,
    skill: row.skill_id ? { id: row.skill_id, name: row.skill_name } : null,
    start_at: row.start_at,
    end_at: row.end_at,
    is_instant: row.is_instant,
    scheduled_minutes: sched,
    address: hideLocation ? null : row.address,
    location: hideLocation ? null : { lat: row.lat, lng: row.lng },
    distance_m:
      isWorkerView && row.viewer_distance_m !== null ? Math.round(Number(row.viewer_distance_m)) : null,
    hourly_rate: row.hourly_rate,
    request_expires_at: row.request_expires_at,
    client: { id: row.client_id, name: row.client_name, photo_url: row.client_photo },
    worker: row.worker_id
      ? {
          id: row.worker_id,
          name: row.worker_name,
          photo_url: row.worker_photo,
          rating_avg: row.worker_rating_avg,
          rating_count: row.worker_rating_count,
        }
      : null,
    pricing: {
      estimate: !final,
      billable_minutes: final ? row.billable_minutes : sched,
      gross: bill.gross,
      commission_pct: commissionPct,
      ...(isWorkerView ? { commission: bill.commission, worker_payout: bill.worker_payout } : {}),
    },
    timesheet: row.clock_in_at
      ? {
          clock_in_at: row.clock_in_at,
          clock_out_at: row.clock_out_at,
          verified_minutes: row.verified_minutes,
          billable_minutes: row.billable_minutes,
          approval_deadline: row.approval_deadline,
          status: row.timesheet_status,
        }
      : null,
    pending_otp: await pendingOtp(row),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
