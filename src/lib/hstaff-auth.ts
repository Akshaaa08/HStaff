export type Persona = 'customer' | 'professional';
export const MIN_PRO_AGE = 18;
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const phoneOk = (p: string) => /^[6-9]\d{9}$/.test(p);
export const upiOk = (u: string) => /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(u.trim());
export const ageOk = (a: number) => Number.isInteger(a) && a >= MIN_PRO_AGE && a <= 75;

export function loginError(email: string, password: string) {
  if (!emailOk(email)) return 'Please enter a valid email address.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
}
export type ClientSignup = { name: string; phone: string; phoneVerified: boolean; email: string; google: boolean; address: string; locationGranted: boolean; contactAccess: boolean; terms: boolean };
export function clientSignupError(s: ClientSignup) {
  if (s.name.trim().length < 2) return 'Please enter your name.';
  if (!s.phoneVerified) return 'Please verify your mobile number.';
  if (!s.google && !emailOk(s.email)) return 'Add your email or continue with Google.';
  if (!s.locationGranted && s.address.trim().length < 5) return 'Allow location or enter your address manually.';
  if (!s.contactAccess) return 'Allow call and message access so professionals can reach you.';
  if (!s.terms) return 'Please accept the Customer Terms & Conditions.';
  return '';
}
export type ProSignup = { name: string; phone: string; phoneVerified: boolean; email: string; age: number; photo: boolean; document: boolean; upi: string; terms: boolean };
export function proSignupError(s: ProSignup) {
  if (s.name.trim().length < 2) return 'Please enter your full name as on your ID.';
  if (!s.phoneVerified) return 'Please verify your mobile number.';
  if (!emailOk(s.email)) return 'Please enter a valid email address.';
  if (!ageOk(s.age)) return `You must be at least ${MIN_PRO_AGE} years old to work on H-Staff.`;
  if (!s.photo) return 'Please take a clear, well-lit photo of your face.';
  if (!s.document) return 'Please upload a verification document.';
  if (!upiOk(s.upi)) return 'Enter a valid UPI ID, like name@okbank.';
  if (!s.terms) return 'Please accept the Professional Terms & Conditions.';
  return '';
}
