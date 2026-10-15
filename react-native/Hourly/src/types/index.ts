// ── Booking status state machine & domain models ──────────────────────────────

export type BookingStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED_PENDING_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'FAILED';

export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'DRAFT': return 'Draft';
    case 'OPEN': return 'Ready to request';
    case 'REQUESTED': return 'Awaiting response';
    case 'ACCEPTED': return 'Accepted';
    case 'CONFIRMED': return 'Confirmed';
    case 'EN_ROUTE': return 'On the way';
    case 'ARRIVED': return 'Arrived';
    case 'IN_PROGRESS': return 'In progress';
    case 'COMPLETED_PENDING_PAYMENT': return 'Completion requested';
    case 'PAYMENT_PENDING': return 'Payment pending';
    case 'PAYMENT_COMPLETED': return 'Paid';
    case 'COMPLETED': return 'Completed';
    case 'CLOSED': return 'Completed';
    case 'DECLINED': return 'Declined';
    case 'EXPIRED': return 'No response';
    case 'CANCELLED': return 'Cancelled';
    case 'DISPUTED': return 'Issue reported';
    case 'FAILED': return 'Payment failed';
    default: return status;
  }
}

export function canTrackStatus(status: BookingStatus): boolean {
  return status === 'EN_ROUTE' || status === 'ARRIVED';
}

export function canFallbackStatus(status: BookingStatus): boolean {
  return status === 'DECLINED' || status === 'EXPIRED';
}

export function isPastStatus(status: BookingStatus | string): boolean {
  return (
    status === 'PAYMENT_COMPLETED' ||
    status === 'COMPLETED' ||
    status === 'CLOSED' ||
    status === 'CANCELLED' ||
    status === 'DECLINED' ||
    status === 'EXPIRED' ||
    status === 'FAILED'
  );
}

export function isActiveStatus(status: BookingStatus | string): boolean {
  return !isPastStatus(status);
}

export function getAllowedTransitions(status: BookingStatus): BookingStatus[] {
  switch (status) {
    case 'DRAFT': return ['OPEN', 'CANCELLED'];
    case 'OPEN': return ['REQUESTED', 'CANCELLED'];
    case 'REQUESTED': return ['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'];
    case 'ACCEPTED': return ['CONFIRMED', 'CANCELLED'];
    case 'CONFIRMED': return ['EN_ROUTE', 'CANCELLED'];
    case 'EN_ROUTE': return ['ARRIVED', 'CANCELLED'];
    case 'ARRIVED': return ['IN_PROGRESS', 'DISPUTED'];
    case 'IN_PROGRESS': return ['COMPLETED_PENDING_PAYMENT', 'DISPUTED'];
    case 'COMPLETED_PENDING_PAYMENT': return ['PAYMENT_PENDING', 'DISPUTED'];
    case 'PAYMENT_PENDING': return ['PAYMENT_COMPLETED', 'FAILED'];
    case 'FAILED': return ['PAYMENT_PENDING'];
    case 'PAYMENT_COMPLETED': return ['CLOSED'];
    case 'DECLINED': return ['OPEN', 'CANCELLED'];
    case 'EXPIRED': return ['OPEN', 'CANCELLED'];
    case 'CLOSED':
    case 'CANCELLED':
    case 'DISPUTED':
      return [];
    default:
      return [];
  }
}

export function canTransitionTo(current: BookingStatus, next: BookingStatus): boolean {
  return getAllowedTransitions(current).includes(next);
}

// ── Booking draft mode ───────────────────────────────────────────────────────

export type BookingMode = 'INSTANT' | 'SCHEDULED';

// ── Core booking entity ──────────────────────────────────────────────────────

export interface Booking {
  id: string;
  bookingId?: string;
  service: string;
  professionalId: string;
  workerId?: string;
  mode: BookingMode;
  date: string;
  time: string;
  hours: number;
  task: string;
  materials: string;
  notes: string;
  address: string;
  status: BookingStatus;
  startedAt?: number | null;
  rating?: number | null;
  review?: string | null;
  paymentMethod?: string | null;
  startOtp?: string;
  endOtp?: string;
  totalAmount?: number;
  clientName?: string;
  clientPhone?: string;
  workerPayout?: number;
  workerRate?: number;
  clientRate?: number;
  latitude?: number;
  longitude?: number;
}

export interface AppNotification {
  id: string;
  _id?: string;
  title: string;
  detail: string;
  time?: string;
  icon?: string;
  color?: string;
  isRead?: boolean;
  createdAt?: string;
}

export function moveBooking(booking: Booking, nextStatus: BookingStatus): Booking {
  if (!canTransitionTo(booking.status, nextStatus)) {
    return booking;
  }
  return {
    ...booking,
    status: nextStatus,
    startedAt: nextStatus === 'IN_PROGRESS' ? Date.now() : booking.startedAt,
  };
}

// ── Professional (worker) ─────────────────────────────────────────────────────

export interface Professional {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  jobs: number;
  years: number;
  distanceKm: number;
  ratePerHour: number;
  skills: string[];
  bio: string;
  equipment: string;
  languages: string;
  onTimePercent: string;
  city?: string;
  address?: string;
  serviceCategory?: string;
  latitude?: number;
  longitude?: number;
}

export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.max(0.4, Math.round(dist * 10) / 10);
}

// ── Service category ──────────────────────────────────────────────────────────

export type ServiceTone = 'PEACH' | 'MINT' | 'PINK' | 'LAVENDER' | 'YELLOW';

export interface ServiceCategory {
  name: string;
  fullName: string;
  tone: ServiceTone;
  iconName?: string;
}

// ── Price breakdown & Platform Margin ─────────────────────────────────────────

export const PLATFORM_HOURLY_MARGIN = 40; // ₹40/hr gap for platform services

export function clientRateFor(workerRate: number): number {
  return (workerRate || 250) + PLATFORM_HOURLY_MARGIN;
}

export interface PriceBreakdown {
  clientHourlyRate: number;
  workerHourlyRate: number;
  charge: number;
  fee: number;
  total: number;
}

export function priceFor(ratePerHour: number, hours: number): PriceBreakdown {
  const clientRate = clientRateFor(ratePerHour);
  const charge = clientRate * (hours || 1);
  return {
    clientHourlyRate: clientRate,
    workerHourlyRate: ratePerHour,
    charge,
    fee: 0,
    total: charge,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ── Demo OTP constants ───────────────────────────────────────────────────────

export const DemoOtp = {
  AUTH: '123456',
  START: '482713',
  END: '724819',
} as const;

export function visibleOtp(status: BookingStatus, booking?: Booking | null): string | null {
  if (status === 'ARRIVED') return booking?.startOtp || DemoOtp.START;
  if (status === 'COMPLETED_PENDING_PAYMENT') return booking?.endOtp || DemoOtp.END;
  return null;
}

export function verifyCode(status: BookingStatus, code: string, booking?: Booking | null): boolean {
  if (status === 'ARRIVED') return code === (booking?.startOtp || DemoOtp.START);
  if (status === 'COMPLETED_PENDING_PAYMENT') return code === (booking?.endOtp || DemoOtp.END);
  return false;
}

// ── Cities ────────────────────────────────────────────────────────────────────

export const hstaffCities = [
  'Pune',
  'Mumbai',
  'Amravati',
  'Nandgaon-Khandeshwar',
  'Nashik',
  'Ahilyanagar',
  'Chhatrapati Sambhajinagar',
  'All Maharashtra',
] as const;

export type HStaffCity = typeof hstaffCities[number];

// ── Professionals Catalog ──────────────────────────────────────────────────

export const DEFAULT_PROFESSIONAL: Professional = {
  id: 'pro',
  name: 'Verified Staff',
  imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
  rating: 5.0,
  jobs: 0,
  years: 2,
  distanceKm: 1.5,
  ratePerHour: 250,
  skills: ['Home Help'],
  bio: 'Verified domestic professional.',
  equipment: 'Standard equipment',
  languages: 'Hindi, Marathi, English',
  onTimePercent: '100%',
};

export const sampleProfessionals: Professional[] = [];

let _cachedWorkers: Professional[] = [];
export function setCachedProfessionals(list: Professional[]) {
  _cachedWorkers = list;
}
export function getCachedProfessionals(): Professional[] {
  return _cachedWorkers;
}

export function professionalFor(id: string, list?: Professional[]): Professional {
  const pool = list && list.length > 0 ? list : _cachedWorkers;
  if (pool && pool.length > 0) {
    const match = pool.find((p) => p.id === id || (p as any).workerId === id);
    if (match) return match;
  }
  return {
    ...DEFAULT_PROFESSIONAL,
    id: id || 'pro',
  };
}

export const sampleServices: ServiceCategory[] = [
  { name: 'Cleaning', fullName: 'Housekeeping / Cleaner', tone: 'PEACH', iconName: 'sparkles' },
  { name: 'Cooking', fullName: 'Cook / Kitchen Staff', tone: 'YELLOW', iconName: 'restaurant' },
  { name: 'Plumbing', fullName: 'Plumber', tone: 'MINT', iconName: 'water' },
  { name: 'Electrical', fullName: 'Electrician', tone: 'LAVENDER', iconName: 'flash' },
  { name: 'Carpentry', fullName: 'Carpenter', tone: 'PINK', iconName: 'hammer' },
  { name: 'General Help', fullName: 'General Helper / Labourer', tone: 'MINT', iconName: 'hand-left' },
  { name: 'Service Staff', fullName: 'Waiter / Service Staff', tone: 'PEACH', iconName: 'people' },
  { name: 'Security', fullName: 'Security Guard', tone: 'LAVENDER', iconName: 'shield-checkmark' },
  { name: 'Driver', fullName: 'Driver', tone: 'YELLOW', iconName: 'car' },
  { name: 'Delivery', fullName: 'Delivery / Logistics Worker', tone: 'PINK', iconName: 'bicycle' },
  { name: 'Warehouse', fullName: 'Warehouse Worker', tone: 'MINT', iconName: 'cube' },
  { name: 'Painting', fullName: 'Painter', tone: 'PEACH', iconName: 'color-palette' },
  { name: 'AC Service', fullName: 'AC / Refrigeration Technician', tone: 'LAVENDER', iconName: 'snow' },
  { name: 'Appliance Repair', fullName: 'Appliance Repair Technician', tone: 'YELLOW', iconName: 'construct' },
  { name: 'Welding', fullName: 'Welder / Fabricator', tone: 'PINK', iconName: 'flame' },
];
