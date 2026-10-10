import { z } from 'zod';
import { KYC_DOC_TYPES } from '../../shared/enums';

export const kycUploadSchema = z.object({ doc_type: z.enum(KYC_DOC_TYPES) });
export type KycUploadBody = z.infer<typeof kycUploadSchema>;
