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

export function isActiveStatus(status: BookingStatus): boolean {
  return status !== 'CLOSED' && status !== 'CANCELLED' && status !== 'FAILED';
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
  service: string;
  professionalId: string;
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
}

// ── Service category ──────────────────────────────────────────────────────────

export type ServiceTone = 'PEACH' | 'MINT' | 'PINK' | 'LAVENDER' | 'YELLOW';

export interface ServiceCategory {
  name: string;
  fullName: string;
  tone: ServiceTone;
  iconName?: string;
}

// ── Price breakdown ───────────────────────────────────────────────────────────

export interface PriceBreakdown {
  charge: number;
  fee: number;
  total: number;
}

export function priceFor(ratePerHour: number, hours: number): PriceBreakdown {
  const charge = ratePerHour * hours;
  return {
    charge,
    fee: 50,
    total: charge + 50,
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

export function visibleOtp(status: BookingStatus): string | null {
  if (status === 'ARRIVED') return DemoOtp.START;
  if (status === 'COMPLETED_PENDING_PAYMENT') return DemoOtp.END;
  return null;
}

export function verifyCode(status: BookingStatus, code: string): boolean {
  if (status === 'ARRIVED') return code === DemoOtp.START;
  if (status === 'COMPLETED_PENDING_PAYMENT') return code === DemoOtp.END;
  return false;
}

// ── Cities ────────────────────────────────────────────────────────────────────

export const hstaffCities = [
  'Pune',
  'Mumbai',
  'Ahilyanagar',
  'Chhatrapati Sambhajinagar',
  'Nashik',
] as const;

export type HStaffCity = typeof hstaffCities[number];

// ── Sample data ──────────────────────────────────────────────────────────────

export const sampleProfessionals: Professional[] = [
  {
    id: 'sunita',
    name: 'Sunita Patil',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    rating: 4.9,
    jobs: 184,
    years: 8,
    distanceKm: 1.2,
    ratePerHour: 250,
    skills: ['Regular cleaning', 'Deep cleaning', 'Kitchen care'],
    bio: "A little care makes a house feel like home. I've been helping Pune families keep their spaces fresh and organised for eight years.",
    equipment: 'Cleaning kit, brushes and eco-friendly supplies',
    languages: 'Marathi, Hindi',
    onTimePercent: '98%',
  },
  {
    id: 'rahul',
    name: 'Rahul Shinde',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.8,
    jobs: 156,
    years: 6,
    distanceKm: 1.8,
    ratePerHour: 300,
    skills: ['Wiring', 'Repairs', 'Home maintenance'],
    bio: 'Reliable help for the little things and the big fixes. I take pride in careful work, a tidy space and arriving on time.',
    equipment: 'Professional toolkit and safety equipment',
    languages: 'Marathi, Hindi, English',
    onTimePercent: '97%',
  },
  {
    id: 'anita',
    name: 'Anita Deshmukh',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    rating: 4.95,
    jobs: 210,
    years: 7,
    distanceKm: 2.1,
    ratePerHour: 280,
    skills: ['Maharashtrian cuisine', 'North Indian', 'Diet cooking'],
    bio: 'Warm, nutritious home meals made with love. Fresh ingredients and hygiene are always my top priorities.',
    equipment: 'Custom spice kit, chef apron and knife roll',
    languages: 'Marathi, Hindi',
    onTimePercent: '99%',
  },
];

export function professionalFor(id: string): Professional {
  return sampleProfessionals.find((p) => p.id === id) || sampleProfessionals[0];
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
