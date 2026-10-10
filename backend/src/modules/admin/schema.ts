import { z } from 'zod';
import { ADMIN_ROLES, SHIFT_STATUSES, VERIFICATION_STATUSES } from '../../shared/enums';
import { CONFIG_KEYS } from '../../config/appConfig';
import { paginationQuery } from '../../utils/http';

const q = z.string().trim().max(100).optional();
const boolStr = z.enum(['true', 'false']).transform((v) => v === 'true');
const date = z.string().datetime({ offset: true }).optional();

export const pageQuery = z.object(paginationQuery);
export const workersQuery = z.object({
  verification: z.enum(VERIFICATION_STATUSES).optional(),
  q,
  ...paginationQuery,
});
export const verifyWorkerSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED', 'NEEDS_INFO']),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.decision === 'APPROVED' || (v.note && v.note.length >= 3), {
    message: 'A note is required to reject or ask for more info',
    path: ['note'],
  });
export const usersQuery = z.object({
  role: z.enum(['client', 'worker']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  q,
  ...paginationQuery,
});
export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().trim().max(300).optional(),
});
export const shiftsQuery = z.object({
  status: z.enum(SHIFT_STATUSES).optional(),
  client_id: z.string().uuid().optional(),
  worker_id: z.string().uuid().optional(),
  flagged: boolStr.optional(),
  from: date,
  to: date,
  ...paginationQuery,
});
export const adminReassignSchema = z.object({ worker_id: z.string().uuid().optional() });
export const adminCancelSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const paymentsQuery = z.object({
  status: z.enum(['CREATED', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  from: date,
  to: date,
  ...paginationQuery,
});
export const payoutsQuery = z.object({
  payout_status: z.enum(['PENDING', 'SETTLED']).optional(),
  ...paginationQuery,
});
export const disputesQuery = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED']).optional(),
  ...paginationQuery,
});
export const disputePatchSchema = z
  .object({
    status: z.enum(['IN_REVIEW', 'RESOLVED', 'ESCALATED']),
    resolution: z.string().trim().min(5).max(1000).optional(),
    shift_outcome: z.enum(['APPROVE', 'CANCEL']).optional(),
  })
  .refine((v) => v.status !== 'RESOLVED' || !!v.resolution, {
    message: 'A resolution note is required',
    path: ['resolution'],
  });
export const reviewsQuery = z.object({
  reported: boolStr.optional(),
  hidden: boolStr.optional(),
  ...paginationQuery,
});
export const reviewPatchSchema = z.object({ hidden: z.boolean() });
export const skillCreateSchema = z.object({ name: z.string().trim().min(2).max(60) });
export const skillPatchSchema = z
  .object({ name: z.string().trim().min(2).max(60).optional(), active: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');
export const skillIdParam = z.object({ id: z.coerce.number().int().positive() });
export const configSchema = z
  .object(
    Object.fromEntries(
      Object.entries(CONFIG_KEYS).map(([k, v]) => [k, z.number().min(v.min).max(v.max).optional()]),
    ),
  )
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one setting');
export const auditQuery = z.object({ admin_id: z.string().uuid().optional(), action: q, ...paginationQuery });
export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(2).max(500),
  audience: z.enum(['all', 'clients', 'workers']).default('all'),
});
export const adminCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(100),
  name: z.string().trim().min(2).max(80),
  admin_role: z.enum(ADMIN_ROLES),
});
export const adminPatchSchema = z
  .object({
    admin_role: z.enum(ADMIN_ROLES).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
    password: z.string().min(10).max(100).optional(),
    name: z.string().trim().min(2).max(80).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');
