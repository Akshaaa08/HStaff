/**
 * H-Staff Full End-to-End API Client
 * Connects frontend to the Express + PostgreSQL/PostGIS + Redis backend
 */

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UserProfile {
  id: string;
  role: 'client' | 'worker' | 'admin';
  name: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  status: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserProfile;
}

export interface WorkerNearby {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string;
  rating_avg: number;
  jobs_completed: number;
  experience_years: number;
  hourly_rate: string;
  distance_m: number;
  skills: string[];
}

export interface ShiftQuote {
  gross_amount: number;
  hours: number;
  duration_minutes: number;
  hourly_rate: number;
}

const TOKEN_KEY = 'hstaff_access_token';
const REFRESH_KEY = 'hstaff_refresh_token';
const USER_KEY = 'hstaff_user_session';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(session: AuthSession | null): void {
    if (typeof window === 'undefined') return;
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(REFRESH_KEY, session.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  getSavedUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  async checkHealth(): Promise<{ status: string; db: boolean; redis: boolean; uptime_sec: number }> {
    try {
      const res = await fetch('/health', { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      return { status: 'offline', db: false, redis: false, uptime_sec: 0 };
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const json = isJson ? await res.json() : null;

    if (!res.ok) {
      const message = json?.error?.message || json?.message || `HTTP error ${res.status}`;
      const err = new Error(message) as Error & { code?: string; details?: unknown; status: number };
      err.code = json?.error?.code || 'API_ERROR';
      err.details = json?.error?.details;
      err.status = res.status;
      throw err;
    }

    return (json?.data !== undefined ? json.data : json) as T;
  }

  // --- Auth Endpoints ---
  async requestOtp(phone: string, role: 'client' | 'worker' | 'customer' | 'professional') {
    return this.request<{ expires_in: number; debug_code?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  }

  async verifyOtp(payload: {
    phone: string;
    otp: string;
    role: 'client' | 'worker' | 'customer' | 'professional';
    name?: string;
  }) {
    const session = await this.request<AuthSession>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setSession(session);
    return session;
  }

  async logout() {
    try {
      const refresh_token = localStorage.getItem(REFRESH_KEY) || undefined;
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
      });
    } catch {
      // ignore logout network errors
    } finally {
      this.setSession(null);
    }
  }

  // --- Skills ---
  async getSkills() {
    return this.request<Array<{ id: string; name: string; icon?: string; base_price_hr: number }>>('/skills');
  }

  // --- Workers & Discovery ---
  async getNearbyWorkers(params: {
    lat: number;
    lng: number;
    skill?: string;
    radius?: number;
    minRating?: number;
    maxRate?: number;
    sort?: string;
  }) {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
      ...(params.skill ? { skill: params.skill } : {}),
      ...(params.radius ? { radius: String(params.radius) } : {}),
      ...(params.minRating ? { minRating: String(params.minRating) } : {}),
      ...(params.maxRate ? { maxRate: String(params.maxRate) } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
    });
    return this.request<WorkerNearby[]>(`/workers/nearby?${query.toString()}`);
  }

  async getWorker(id: string) {
    return this.request<any>(`/workers/${id}`);
  }

  async getMe() {
    return this.request<any>('/workers/me');
  }

  async updateMe(body: {
    name?: string;
    hourly_rate?: number;
    skills?: string[];
    bio?: string;
    upi_id?: string;
    age?: number;
  }) {
    return this.request<any>('/workers/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async setOnline(is_online: boolean) {
    return this.request<any>('/workers/me/online', {
      method: 'POST',
      body: JSON.stringify({ is_online }),
    });
  }

  async updateLocation(lat: number, lng: number) {
    return this.request<any>('/workers/me/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  }

  async getEarnings() {
    return this.request<any>('/workers/me/earnings');
  }

  async getMyShifts(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<any[]>(`/workers/me/shifts${q}`);
  }

  // --- Shifts ---
  async getQuote(workerId: string, duration_minutes: number) {
    return this.request<ShiftQuote>(
      `/shifts/quote?workerId=${encodeURIComponent(workerId)}&duration_minutes=${duration_minutes}`
    );
  }

  async createShift(payload: {
    worker_id: string;
    skill: string;
    duration_minutes: number;
    is_instant: boolean;
    start_at?: string;
    lat: number;
    lng: number;
    address: string;
    notes?: string;
    materials?: string;
  }) {
    return this.request<any>('/shifts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listShifts(params?: { status?: string; role?: string }) {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<any[]>(`/shifts${q ? `?${q}` : ''}`);
  }

  async getShift(id: string) {
    return this.request<any>(`/shifts/${id}`);
  }

  async acceptShift(id: string) {
    return this.request<any>(`/shifts/${id}/accept`, { method: 'POST' });
  }

  async declineShift(id: string) {
    return this.request<any>(`/shifts/${id}/decline`, { method: 'POST' });
  }

  async enRoute(id: string, origin?: { lat: number; lng: number }) {
    return this.request<any>(`/shifts/${id}/en-route`, {
      method: 'POST',
      body: JSON.stringify(origin || { lat: 18.559, lng: 73.7868 }),
    });
  }

  async arrive(id: string, lat: number, lng: number) {
    return this.request<any>(`/shifts/${id}/arrive`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  }

  async getShiftOtp(id: string) {
    return this.request<{ otp: string; type: 'start' | 'end' }>(`/shifts/${id}/otp`);
  }

  async startShift(id: string, otp: string) {
    return this.request<any>(`/shifts/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async requestEndOtp(id: string) {
    return this.request<any>(`/shifts/${id}/end-otp`, { method: 'POST' });
  }

  async endShift(id: string, otp: string) {
    return this.request<any>(`/shifts/${id}/end`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async approveShift(id: string) {
    return this.request<any>(`/shifts/${id}/approve`, { method: 'POST' });
  }

  async cancelShift(id: string, reason = 'Client cancelled') {
    return this.request<any>(`/shifts/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reassignShift(id: string, worker_id: string) {
    return this.request<any>(`/shifts/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ worker_id }),
    });
  }

  async disputeShift(id: string, reason: string) {
    return this.request<any>(`/shifts/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Payments ---
  async createPaymentOrder(shiftId: string) {
    return this.request<any>(`/payments/shifts/${shiftId}/order`, { method: 'POST' });
  }

  async verifyPayment(provider_order_id: string, result: 'success' | 'failure') {
    return this.request<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ provider_order_id, result }),
    });
  }

  // --- Reviews ---
  async createReview(payload: {
    shift_id: string;
    rating: number;
    tags?: string[];
    comment?: string;
  }) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Notifications ---
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }
}

export const api = new ApiClient();
export default api;
