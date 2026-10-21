import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

const TOKEN_KEY = 'hstaff_jwt_token';

let cachedToken: string | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // best-effort persistence
  }
}

export type ApiErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Universal HTTP client with automatic Authorization header injection,
 * JSON serialization, query parameter handling, and unified error handling.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
    requireAuth?: boolean;
    customToken?: string;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params, requireAuth = true, customToken } = options;

  let url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = customToken ?? (requireAuth ? await getAuthToken() : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.message)) {
          errMsg = data.message.join('. ');
        } else if (typeof data.message === 'string') {
          errMsg = data.message;
        } else if (typeof data.error === 'string') {
          errMsg = data.error;
        }
      }
      throw new ApiError(res.status, errMsg, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(408, 'Connection timed out. Please check your network and server.');
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, err?.message ?? 'Network connection failed. Backend is unreachable.');
  }
}

/**
 * Service API Endpoints matching NestJS Controllers
 */
export const api = {
  // --- Auth (/auth) ---
  auth: {
    requestOtp: (phone: string) =>
      apiRequest<{ message: string }>('/auth/request-otp', {
        method: 'POST',
        body: { phone },
        requireAuth: false,
      }),

    verifyOtp: (phone: string, code: string, role?: 'USER' | 'WORKER') =>
      apiRequest<{ token: string; user: { id: string; phone: string; role: 'USER' | 'WORKER' } }>(
        '/auth/verify-otp',
        {
          method: 'POST',
          body: { phone, code, role },
          requireAuth: false,
        }
      ),
  },

  // --- Service Requests (/service-requests) ---
  serviceRequests: {
    create: (data: {
      categoryId: number;
      bookingMode?: 'INSTANT' | 'SCHEDULED';
      startAt?: string;
      durationHours?: number;
      latitude: number;
      longitude: number;
      address?: string;
      notes?: string;
      skillIds?: number[];
    }) =>
      apiRequest('/service-requests', {
        method: 'POST',
        body: data,
      }),

    list: () => apiRequest<any[]>('/service-requests'),

    get: (id: string) => apiRequest(`/service-requests/${id}`),

    findWorkers: (id: string) => apiRequest<any[]>(`/service-requests/${id}/workers`),
  },

  // --- Offers (/offers) ---
  offers: {
    create: (serviceRequestId: string, workerId: string) =>
      apiRequest('/offers', {
        method: 'POST',
        body: { serviceRequestId, workerId },
      }),

    listForWorker: () => apiRequest<any[]>('/offers/mine'),

    respond: (offerId: string, accept: boolean) =>
      apiRequest(`/offers/${offerId}/respond`, {
        method: 'POST',
        body: { accept },
      }),
  },

  // --- Assignments (/assignments & /timesheets) ---
  assignments: {
    mine: () => apiRequest<any[]>('/assignments/mine'),

    get: (id: string) => apiRequest(`/assignments/${id}`),

    enRoute: (id: string) =>
      apiRequest(`/assignments/${id}/en-route`, {
        method: 'POST',
      }),

    arrived: (id: string) =>
      apiRequest(`/assignments/${id}/arrived`, {
        method: 'POST',
      }),

    issueStartOtp: (id: string) =>
      apiRequest<{ otp: string; expiresInMinutes: number }>(`/assignments/${id}/start-otp`, {
        method: 'POST',
      }),

    verifyStart: (id: string, otp: string, latitude: number, longitude: number) =>
      apiRequest(`/assignments/${id}/start`, {
        method: 'POST',
        body: { otp, latitude, longitude },
      }),

    issueEndOtp: (id: string) =>
      apiRequest<{ otp: string; expiresInMinutes: number }>(`/assignments/${id}/end-otp`, {
        method: 'POST',
      }),

    verifyEnd: (id: string, otp: string, latitude: number, longitude: number) =>
      apiRequest(`/assignments/${id}/end`, {
        method: 'POST',
        body: { otp, latitude, longitude },
      }),

    timesheet: (id: string) => apiRequest(`/assignments/${id}/timesheet`),

    approveTimesheet: (timesheetId: string) =>
      apiRequest(`/timesheets/${timesheetId}/approve`, {
        method: 'POST',
      }),
  },

  // --- Workers (/workers) ---
  workers: {
    getMe: () => apiRequest('/workers/me'),

    updateMe: (data: {
      experienceYears?: number;
      baseHourlyRate?: number;
      serviceRadiusKm?: number;
      latitude?: number;
      longitude?: number;
      profileImageUrl?: string;
      categoryIds?: number[];
      skillIds?: number[];
    }) =>
      apiRequest('/workers/me', {
        method: 'PUT',
        body: data,
      }),

    getAvailability: () => apiRequest('/workers/availability'),

    setAvailability: (slots: { dayOfWeek: number; startMinute: number; endMinute: number }[]) =>
      apiRequest('/workers/availability', {
        method: 'PUT',
        body: { slots },
      }),

    submitForReview: () =>
      apiRequest('/workers/me/submit', {
        method: 'POST',
      }),
  },

  // --- Payments (/payments) ---
  payments: {
    pay: (timesheetId: string, simulateFail?: boolean) =>
      apiRequest('/payments', {
        method: 'POST',
        body: { timesheetId, simulateFail },
      }),

    get: (timesheetId: string) => apiRequest(`/payments/${timesheetId}`),
  },

  // --- Feedback & Ratings (/ratings & /complaints) ---
  feedback: {
    rate: (data: {
      assignmentId: string;
      rating?: number;
      score?: number;
      tags?: string[];
      comment?: string;
    }) =>
      apiRequest('/ratings', {
        method: 'POST',
        body: data,
      }),

    complain: (data: {
      assignmentId: string;
      category: 'NO_SHOW' | 'POOR_QUALITY' | 'OVERCHARGING' | 'UNPROFESSIONAL' | 'DAMAGED_PROPERTY' | 'OTHER';
      description: string;
    }) =>
      apiRequest('/complaints', {
        method: 'POST',
        body: data,
      }),
  },

  // --- Notifications (/notifications) ---
  notifications: {
    list: () => apiRequest<any[]>('/notifications'),

    markRead: (id: string) =>
      apiRequest(`/notifications/${id}/read`, {
        method: 'POST',
      }),
  },
};
