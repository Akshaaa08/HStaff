import { z } from 'zod';

export const searchQuery = z.object({
  q: z.string().trim().min(3).max(200),
  countrycodes: z
    .string()
    .regex(/^[a-z]{2}(,[a-z]{2})*$/)
    .default('in'),
});
export const etaQuery = z
  .object({
    shiftId: z.string().uuid().optional(),
    fromLat: z.coerce.number().min(-90).max(90).optional(),
    fromLng: z.coerce.number().min(-180).max(180).optional(),
    toLat: z.coerce.number().min(-90).max(90).optional(),
    toLng: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine(
    (v) =>
      !!v.shiftId ||
      (v.fromLat !== undefined && v.fromLng !== undefined && v.toLat !== undefined && v.toLng !== undefined),
    'Provide shiftId, or fromLat/fromLng/toLat/toLng',
  );
export type EtaQuery = z.infer<typeof etaQuery>;
