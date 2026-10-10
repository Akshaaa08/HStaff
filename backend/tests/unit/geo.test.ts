import { describe, expect, it } from 'vitest';
import { estimateEtaSeconds, haversineM, suspiciousLocationReason } from '../../src/utils/geo';
import { maskPhone, redact } from '../../src/utils/logger';
import { normalizePhone } from '../../src/utils/phone';

describe('geo', () => {
  it('haversine is ~0 for the same point and ~111 km per degree of latitude', () => {
    expect(haversineM({ lat: 18.559, lng: 73.7868 }, { lat: 18.559, lng: 73.7868 })).toBe(0);
    const d = haversineM({ lat: 18, lng: 73 }, { lat: 19, lng: 73 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_500);
  });
  it('a point 100 m away is inside a 150 m geofence, 300 m away is not', () => {
    const base = { lat: 18.559, lng: 73.7868 };
    const near = haversineM(base, { lat: base.lat + 0.0009, lng: base.lng }); // ~100 m
    const far = haversineM(base, { lat: base.lat + 0.0027, lng: base.lng }); // ~300 m
    expect(near).toBeLessThan(150);
    expect(far).toBeGreaterThan(150);
  });
  it('estimates ETA from distance', () => {
    expect(estimateEtaSeconds(25_000, 25)).toBe(3600);
  });
  it('flags mock or imprecise locations', () => {
    expect(suspiciousLocationReason({ mocked: true })).toBe('MOCK_LOCATION');
    expect(suspiciousLocationReason({ accuracy_m: 500 })).toBe('LOW_ACCURACY');
    expect(suspiciousLocationReason({ mocked: false, accuracy_m: 12 })).toBeNull();
    expect(suspiciousLocationReason({})).toBeNull();
  });
});

describe('phone and log redaction', () => {
  it('normalises Indian 10-digit numbers and E.164', () => {
    expect(normalizePhone('98765 43210')).toBe('+919876543210');
    expect(normalizePhone('+44 7911 123456')).toBe('+447911123456');
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('5876543210')).toBeNull();
  });
  it('masks phones and tokens in log lines', () => {
    expect(maskPhone('+919876543210')).toBe('+91******3210'); // keeps country digits + last 4
    const line = redact(
      'login for +919876543210 with eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.abcdefghijk',
    );
    expect(line).not.toContain('9876543210');
    expect(line).not.toContain('eyJhbGci');
    expect(line).toContain('[token]');
  });
});
