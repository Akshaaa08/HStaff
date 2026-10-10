import { z } from 'zod';
import { paginationQuery } from '../../utils/http';

const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().toLowerCase().email().max(200).optional(),
    bio: z.string().trim().max(1000).optional(),
    experience_years: z.number().int().min(0).max(60).optional(),
    hourly_rate: z.number().positive().max(100000).optional(),
    equipment: z.string().trim().max(500).optional(),
    skill_ids: z.array(z.number().int().positive()).min(1).max(10).optional(),
    upi_id: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID, like name@okbank')
      .optional(),
    age: z.number().int().min(18, 'You must be at least 18 to work on H-Staff').max(75).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

const fix = { mocked: z.boolean().optional(), accuracy_m: z.number().nonnegative().optional() };

export const onlineSchema = z
  .object({
    online: z.boolean(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    ...fix,
  })
  .refine((v) => !v.online || (v.lat !== undefined && v.lng !== undefined), {
    message: 'lat and lng are required to go online',
    path: ['lat'],
  });
export type OnlineBody = z.infer<typeof onlineSchema>;

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  ...fix,
});
export type LocationBody = z.infer<typeof locationSchema>;

export const earningsQuery = z.object({ ...paginationQuery });

const boolStr = z.enum(['true', 'false']).transform((v) => v === 'true');
export const nearbyQuery = z.object({
  lat,
  lng,
  skill: z.string().trim().min(1).optional(), // skill id or name
  radius: z.coerce.number().positive().max(50).default(10), // km
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRate: z.coerce.number().positive().optional(),
  online: boolStr.default('true'),
  sort: z.enum(['distance', 'rating', 'rate']).default('distance'),
  page: paginationQuery.page,
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type NearbyQuery = z.infer<typeof nearbyQuery>;

export const myShiftsQuery = z.object({ status: z.string().optional(), ...paginationQuery });
