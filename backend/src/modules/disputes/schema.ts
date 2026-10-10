import { z } from 'zod';

export const raiseDisputeSchema = z.object({ reason: z.string().trim().min(5).max(1000) });
export const DISPUTABLE = [
  'ARRIVED',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'DISPUTED',
  'APPROVED',
  'PAID',
] as const;
