import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatically detect host computer IP for physical devices running Expo Go,
// with seamless fallback to 10.0.2.2 for Android Studio emulators and localhost for web
const getHostAddress = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return null;
};

const detectedHost = getHostAddress();
const ENV_URL = (process.env as any)?.EXPO_PUBLIC_API_URL;

const PRODUCTION_API_URL = 'https://hourly-fxya.onrender.com/api/v1';

const DEFAULT_URL =
  ENV_URL ||
  PRODUCTION_API_URL;

let baseUrl = DEFAULT_URL;
let authToken: string | null = null;

export const setApiBaseUrl = (url: string) => {
  baseUrl = url;
};

export const getApiBaseUrl = () => baseUrl;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

export const ApiClient = {
  // Health check
  health: async () => {
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${rootUrl}/health`);
    return res.json();
  },

  // Auth endpoints
  auth: {
    requestOtp: (phone: string, role: string = 'client') =>
      request<{
        success: boolean;
        message: string;
        phone: string;
        notification?: { id: string; title: string; detail: string; otp: string };
      }>('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, role }),
      }),

    verifyOtp: async (phone: string, otp: string) => {
      const res = await request<{
        access_token: string;
        token_type: string;
        isProfileComplete?: boolean;
        user: { id: string; phone: string; name: string; role: string; city: string; address?: string; isProfileComplete?: boolean; imageUrl?: string };
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
      if (res?.access_token) {
        setAuthToken(res.access_token);
      }
      return res;
    },

    signup: async (data: any) => {
      const res = await request<{
        success: boolean;
        access_token: string;
        user: any;
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res?.access_token) {
        setAuthToken(res.access_token);
      }
      return res;
    },

    updateProfile: (data: any) =>
      request<any>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    me: () => request<any>('/auth/me'),
  },

  // Map and Geolocation Search API (OpenStreetMap Nominatim)
  maps: {
    searchAddress: async (query: string): Promise<Array<{
      displayName: string;
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      lat: number;
      lon: number;
    }>> => {
      if (!query || query.trim().length < 3) return [];
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=6`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'HourlyApp/1.0 (contact: support@hourly.com)',
            'Accept-Language': 'en',
          },
        });
        const items = await res.json();
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => ({
          displayName: item.display_name,
          street: item.address?.road || item.address?.suburb || item.address?.neighbourhood,
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || 'Pune',
          state: item.address?.state || 'Maharashtra',
          postcode: item.address?.postcode || '',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
      } catch {
        return [];
      }
    },

    reverseGeocode: async (lat: number, lon: number): Promise<{
      displayName: string;
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      suburb?: string;
    } | null> => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'HourlyApp/1.0 (contact: support@hourly.com)',
            'Accept-Language': 'en',
          },
        });
        const item = await res.json();
        if (!item || !item.address) return null;
        return {
          displayName: item.display_name,
          street: item.address?.road || item.address?.suburb || item.address?.neighbourhood,
          city: item.address?.city || item.address?.town || item.address?.village || 'Pune',
          state: item.address?.state || 'Maharashtra',
          postcode: item.address?.postcode || '',
        };
      } catch {
        return null;
      }
    },
  },

  // Services
  services: {
    getAll: () => request<any[]>('/services'),
    getByName: (name: string) => request<any>(`/services/${name}`),
  },

  // Workers
  workers: {
    getAll: (params?: { service?: string; city?: string; sort?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/workers${query ? `?${query}` : ''}`);
    },
    getById: (workerId: string) => request<any>(`/workers/${workerId}`),
  },

  // Bookings
  bookings: {
    create: (data: {
      service: string;
      workerId: string;
      hours: number;
      mode?: 'INSTANT' | 'SCHEDULED';
      date?: string;
      time?: string;
      task?: string;
      materials?: string;
      notes?: string;
      address: string;
      latitude?: number;
      longitude?: number;
    }) =>
      request<any>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAll: (status?: string) =>
      request<any[]>(`/bookings${status ? `?status=${status}` : ''}`),

    getById: (id: string) => request<any>(`/bookings/${id}`),

    updateStatus: (id: string, status: string) =>
      request<any>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    verifyStartOtp: (id: string, code: string) =>
      request<any>(`/bookings/${id}/start-otp`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    verifyEndOtp: (id: string, code: string) =>
      request<any>(`/bookings/${id}/end-otp`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    cancel: (id: string) =>
      request<any>(`/bookings/${id}/cancel`, {
        method: 'POST',
      }),
  },

  // Payments
  payments: {
    process: (data: {
      bookingId: string;
      amount: number;
      method: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    }) =>
      request<any>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByBooking: (bookingId: string) => request<any>(`/payments/booking/${bookingId}`),
  },

  // Reviews
  reviews: {
    submit: (data: {
      bookingId: string;
      workerId: string;
      rating: number;
      tags?: string[];
      comment?: string;
    }) =>
      request<any>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByWorker: (workerId: string) => request<any[]>(`/reviews/worker/${workerId}`),
  },

  // Notifications
  notifications: {
    getAll: () => request<any[]>('/notifications'),
    markAsRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllRead: () =>
      request<{ success: boolean; message: string }>('/notifications/mark-all-read', {
        method: 'POST',
      }),
  },
};
