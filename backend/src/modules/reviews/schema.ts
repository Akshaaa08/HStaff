import { z } from 'zod';

export const createReviewSchema = z.object({
  shiftId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateReviewBody = z.infer<typeof createReviewSchema>;
