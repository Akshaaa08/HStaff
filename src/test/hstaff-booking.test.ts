import { describe, it, expect } from 'vitest';
import { canTransition, services, startCode, endCode } from '@/lib/hstaff-data';

describe('H-Staff booking model',()=>{
  it('supports all 15 categories',()=>expect(services).toHaveLength(15));
  it('keeps start and end verification separate',()=>expect(startCode).not.toBe(endCode));
  it('permits the complete customer journey',()=>{
    const steps=['DRAFT','REQUESTED','ACCEPTED','CONFIRMED','EN_ROUTE','ARRIVED','IN_PROGRESS','COMPLETED_PENDING_PAYMENT','PAYMENT_PENDING','PAYMENT_COMPLETED','CLOSED'] as const;
    for(let i=0;i<steps.length-1;i++)expect(canTransition(steps[i],steps[i+1])).toBe(true);
  });
  it('prevents skipping arrival, OTP or payment',()=>{
    expect(canTransition('EN_ROUTE','IN_PROGRESS')).toBe(false);
    expect(canTransition('ARRIVED','CLOSED')).toBe(false);
    expect(canTransition('IN_PROGRESS','PAYMENT_COMPLETED')).toBe(false);
    expect(canTransition('CLOSED','REQUESTED')).toBe(false);
  });
  it('offers fallback only after a failed request',()=>{
    expect(canTransition('REQUESTED','DECLINED')).toBe(true);
    expect(canTransition('REQUESTED','EXPIRED')).toBe(true);
    expect(canTransition('CONFIRMED','DECLINED')).toBe(false);
  });
});