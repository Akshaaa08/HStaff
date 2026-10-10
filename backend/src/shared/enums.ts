// Single source of truth for enums used by API validation. TRD section 4 asks for /packages/shared;
// this folder is the extraction seed (see docs/decisions.md D-01).
export const USER_ROLES = ['client', 'worker', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES = ['super_admin', 'verifier', 'finance', 'support'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const VERIFICATION_STATUSES = ['PENDING', 'NEEDS_INFO', 'APPROVED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SHIFT_STATUSES = [
  'OPEN',
  'REQUESTED',
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'PAID',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
  'DISPUTED',
] as const;
export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

export const SHIFT_MODES = ['DIRECT', 'OPEN'] as const;
export type ShiftMode = (typeof SHIFT_MODES)[number];

export const KYC_DOC_TYPES = [
  'AADHAAR',
  'PAN',
  'VOTER_ID',
  'DRIVING_LICENCE',
  'PASSPORT',
  'SELFIE',
  'OTHER',
] as const;
export type KycDocType = (typeof KYC_DOC_TYPES)[number];

export type Actor = 'client' | 'worker' | 'admin' | 'system';

export interface AuthUser {
  id: string;
  role: UserRole;
  adminRole: AdminRole | null;
  name: string | null;
}
