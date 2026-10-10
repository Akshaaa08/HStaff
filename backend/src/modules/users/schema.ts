import { z } from 'zod';

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().toLowerCase().email().max(200).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');
export type UpdateMeBody = z.infer<typeof updateMeSchema>;
