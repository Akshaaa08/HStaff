import {describe,it,expect} from 'vitest';
import {canFallback,canTrack,canTransition,priceFor,services,verifyCode,visibleOtp,START_OTP,END_OTP,moveBooking,type Booking} from '@/lib/hstaff-domain';
describe('H-Staff booking rules',()=>{
 it('keeps 15 service categories discoverable',()=>expect(services).toHaveLength(15));
 it('shows professional charge 250 plus explicit fee 50 and total 300',()=>expect(priceFor(250,1)).toEqual({charge:250,fee:50,total:300}));
 it('multiplies hourly charges by duration without hiding fees',()=>expect(priceFor(250,2)).toEqual({charge:500,fee:50,total:550}));
 it('does not allow silent fallback while a chosen professional is responding',()=>{expect(canFallback('REQUESTED')).toBe(false);expect(canFallback('CONFIRMED')).toBe(false);expect(canFallback('DECLINED')).toBe(true);expect(canFallback('EXPIRED')).toBe(true)});
 it('only reveals exact tracking en route or arrived',()=>{expect(canTrack('REQUESTED')).toBe(false);expect(canTrack('CONFIRMED')).toBe(false);expect(canTrack('EN_ROUTE')).toBe(true);expect(canTrack('ARRIVED')).toBe(true);expect(canTrack('CLOSED')).toBe(false)});
 it('keeps separate start 482713 and end 724819 codes',()=>{expect(START_OTP).toBe('482713');expect(END_OTP).toBe('724819');expect(verifyCode('ARRIVED','724819')).toBe(false);expect(verifyCode('COMPLETED_PENDING_PAYMENT','482713')).toBe(false);expect(verifyCode('ARRIVED','482713')).toBe(true);expect(verifyCode('COMPLETED_PENDING_PAYMENT','724819')).toBe(true)});
 it('only reveals OTP at arrival and completion request',()=>{expect(visibleOtp('REQUESTED')).toBeNull();expect(visibleOtp('EN_ROUTE')).toBeNull();expect(visibleOtp('ARRIVED')).toBe('482713');expect(visibleOtp('IN_PROGRESS')).toBeNull();expect(visibleOtp('COMPLETED_PENDING_PAYMENT')).toBe('724819')});
 it('prevents skipping arrival verification or completion to close',()=>{expect(canTransition('CONFIRMED','IN_PROGRESS')).toBe(false);expect(canTransition('ARRIVED','IN_PROGRESS')).toBe(true);expect(canTransition('IN_PROGRESS','CLOSED')).toBe(false)});
 it('allows payment failure retry without failing the service',()=>{expect(canTransition('PAYMENT_PENDING','FAILED')).toBe(true);expect(canTransition('FAILED','PAYMENT_PENDING')).toBe(true)});
 it('rejects an invalid transition without losing the selected professional',()=>{const b={status:'REQUESTED',professionalId:'sunita'} as Booking;expect(moveBooking(b,'CLOSED')).toBe(b)});
});
