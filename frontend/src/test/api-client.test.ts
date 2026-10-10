import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@/lib/api-client';

describe('H-Staff API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('manages auth sessions in localStorage', () => {
    expect(api.getToken()).toBeNull();
    api.setSession({
      access_token: 'fake-jwt-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 900,
      user: {
        id: 'u-123',
        role: 'client',
        name: 'Akshaa',
        phone: '9000000001',
        email: 'test@example.com',
        photo_url: null,
        status: 'ACTIVE',
      },
    });

    expect(api.getToken()).toBe('fake-jwt-token');
    expect(api.getSavedUser()?.name).toBe('Akshaa');

    api.setSession(null);
    expect(api.getToken()).toBeNull();
    expect(api.getSavedUser()).toBeNull();
  });

  it('formats worker nearby queries correctly', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 'w1', name: 'Sunita' }] }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    );

    const workers = await api.getNearbyWorkers({ lat: 18.559, lng: 73.7868, skill: 'Cleaning' });
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/workers/nearby');
    expect(calledUrl).toContain('lat=18.559');
    expect(calledUrl).toContain('skill=Cleaning');
    expect(workers).toHaveLength(1);
  });

  it('handles health check gracefully when offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));
    const health = await api.checkHealth();
    expect(health.status).toBe('offline');
    expect(health.db).toBe(false);
  });
});
