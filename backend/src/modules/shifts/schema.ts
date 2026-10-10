import { z } from 'zod';
import { paginationQuery } from '../../utils/http';

const isoDate = z
  .string()
  .datetime({ offset: true })
  .transform((s) => new Date(s));

export const createShiftSchema = z
  .object({
    mode: z.enum(['DIRECT', 'OPEN']).default('DIRECT'),
    worker_id: z.string().uuid().optional(),
    skill_id: z.number().int().positive(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    materials: z.string().trim().max(500).optional(),
    is_instant: z.boolean().default(false),
    start_at: isoDate.optional(),
    end_at: isoDate.optional(),
    duration_minutes: z.number().int().min(30).max(720).optional(),
    address: z.string().trim().min(5).max(300),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    hourly_rate: z.number().positive().max(100000).optional(), // OPEN mode only: the client's offer
  })
  .superRefine((v, ctx) => {
    const bad = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (v.mode === 'DIRECT' && !v.worker_id) bad('worker_id', 'worker_id is required for DIRECT shifts');
    if (v.mode === 'OPEN' && v.worker_id)
      bad('worker_id', 'OPEN shifts have no worker until someone accepts');
    if (v.mode === 'OPEN' && v.hourly_rate === undefined)
      bad('hourly_rate', 'hourly_rate is required for OPEN shifts');
    if (v.is_instant) {
      if (v.duration_minutes === undefined)
        bad('duration_minutes', 'duration_minutes is required for instant shifts');
    } else {
      if (!v.start_at) bad('start_at', 'start_at is required for scheduled shifts');
      if (!v.end_at && v.duration_minutes === undefined) bad('end_at', 'Provide end_at or duration_minutes');
    }
  });
export type CreateShiftBody = z.infer<typeof createShiftSchema>;

export const quoteQuery = z.object({
  workerId: z.string().uuid(),
  skill: z.coerce.number().int().positive().optional(),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
  duration_minutes: z.coerce.number().int().min(30).max(720).optional(),
});
export type QuoteQuery = z.infer<typeof quoteQuery>;

export const reasonSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const reassignSchema = z.object({ worker_id: z.string().uuid().optional() });
export const enRouteSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export const listQuery = z.object({ status: z.string().optional(), ...paginationQuery });
