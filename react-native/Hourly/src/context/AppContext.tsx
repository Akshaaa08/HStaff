import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Booking,
  BookingMode,
  BookingStatus,
  Professional,
  ServiceCategory,
  AppNotification,
  hstaffCities,
  moveBooking,
  priceFor,
  sampleProfessionals,
  sampleServices,
  verifyCode,
  setCachedProfessionals,
  calculateDistanceKm,
} from '../types';
import { ApiClient } from '../services/api';

export interface ClientSession {
  authenticated: boolean;
  phone: string;
  name: string;
  email?: string;
  role: 'client' | 'worker';
  city: string;
  address?: string;
  houseFlat?: string;
  landmark?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isProfileComplete?: boolean;
  activeBooking: Booking | null;
  pastBookings: Booking[];
  apiConnected: boolean;
  serviceCategory?: string;
  years?: number;
  experienceDetails?: string;
  skills?: string[];
  ratePerHour?: number;
  equipment?: string;
  languages?: string;
  bio?: string;
  imageUrl?: string;
  allBookings?: Booking[];
}

export interface BookingDraft {
  service: string;
  mode: BookingMode;
  date: string;
  time: string;
  hours: number;
  task: string;
  materials: string;
  notes: string;
  address: string;
  selectedProId: string;
}

interface AppContextValue {
  session: ClientSession;
  draft: BookingDraft;
  pendingPhone: string;
  isLoading: boolean;
  errorMessage: string | null;
  noticeMessage: string | null;
  searchQuery: string;
  sortMode: string;
  elapsedSeconds: number;
  filteredServices: ServiceCategory[];
  sortedProfessionals: Professional[];
  notifications: AppNotification[];
  latestOtpNotification: { title: string; detail: string; otp: string } | null;

  setPendingPhone: (phone: string) => void;
  requestOtp: (
    phone: string,
    roleOrSuccess?: ('client' | 'worker') | (() => void),
    onSuccessCallback?: () => void
  ) => Promise<void>;
  verifyOtp: (
    phone: string,
    otp: string,
    onSuccess: (isProfileComplete?: boolean) => void,
    onError: (err: string) => void
  ) => Promise<void>;
  completeSignup: (
    data: any,
    onSuccess: () => void,
    onError: (err: string) => void
  ) => Promise<void>;
  logout: () => void;
  selectService: (service: string) => void;
  updateDraft: (updater: Partial<BookingDraft> | ((prev: BookingDraft) => BookingDraft)) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: string) => void;
  sendRequest: (onNavigate: () => void) => Promise<void>;
  transitionBooking: (to: BookingStatus) => Promise<void>;
  cancelBooking: () => Promise<void>;
  verifyOtpCode: (code: string) => boolean;
  completeWithOtp: (onNavigate: () => void) => Promise<void>;
  simulatePayment: (
    method: string,
    fail: boolean,
    onNavigate: () => void,
    razorpayDetails?: { razorpayPaymentId?: string; razorpayOrderId?: string }
  ) => Promise<void>;
  submitReview: (rating: number, tags: string[], reviewText: string, onNavigate: () => void) => Promise<void>;
  setCity: (city: string) => void;
  setSessionRole: (role: 'client' | 'worker') => void;
  clearError: () => void;
  clearNotice: () => void;
  showError: (msg: string) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchUserBookings: () => Promise<void>;
  loadWorkers: (serviceName?: string, city?: string, sort?: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, to: BookingStatus) => Promise<void>;
  verifyTaskStartOtp: (bookingId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ClientSession>({
    authenticated: false,
    phone: '',
    name: '',
    role: 'client',
    city: 'Pune',
    isProfileComplete: false,
    activeBooking: null,
    pastBookings: [],
    apiConnected: true,
  });

  const [draft, setDraft] = useState<BookingDraft>({
    service: 'Cleaning',
    mode: 'INSTANT',
    date: '',
    time: '',
    hours: 1,
    task: 'Regular Cleaning',
    materials: "I'll provide them",
    notes: '',
    address: 'Home · Baner, Pune',
    selectedProId: '',
  });

  const [services, setServices] = useState<ServiceCategory[]>(sampleServices);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestOtpNotification, setLatestOtpNotification] = useState<{
    title: string;
    detail: string;
    otp: string;
  } | null>(null);

  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<string>('Recommended');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer for IN_PROGRESS status
  useEffect(() => {
    let interval: any = null;
    if (session.activeBooking?.status === 'IN_PROGRESS' && session.activeBooking.startedAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const start = session.activeBooking?.startedAt || now;
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.activeBooking?.status, session.activeBooking?.startedAt]);

  // Load real services from backend on mount
  const loadServices = useCallback(async () => {
    try {
      const data = await ApiClient.services.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setServices(
          data.map((s: any) => ({
            name: s.name,
            fullName: s.fullName || s.name,
            tone: s.tone || 'PEACH',
            iconName: s.iconName || 'sparkles',
          }))
        );
      }
    } catch {
      // Backend starting or offline - keeps baseline catalog
    }
  }, []);

  // Load real verified workers from backend
  const loadWorkers = useCallback(async (serviceName?: string, city?: string, sort?: string) => {
    try {
      const data = await ApiClient.workers.getAll({
        service: serviceName,
        city: city || session.city,
        sort: sort || sortMode,
      });
      if (Array.isArray(data)) {
        const mapped: Professional[] = data.map((w: any) => {
          const dist = calculateDistanceKm(
            session.latitude,
            session.longitude,
            w.latitude,
            w.longitude
          );
          return {
            id: w.workerId || w.id || w._id,
            name: w.name,
            imageUrl:
              w.imageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
            rating: w.rating || 5.0,
            jobs: w.jobs || 0,
            years: w.years || 1,
            distanceKm: dist,
            ratePerHour: w.ratePerHour || 250,
            skills: w.skills || [w.serviceCategory || 'General Help'],
            bio: w.bio || w.experienceDetails || 'Experienced professional staff.',
            equipment: w.equipment || '',
            languages: w.languages || 'Hindi, Marathi',
            onTimePercent: w.onTimePercent || '100%',
            city: w.city,
            address: w.address,
            serviceCategory: w.serviceCategory,
            latitude: w.latitude,
            longitude: w.longitude,
          };
        });
        setProfessionals(mapped);
        setCachedProfessionals(mapped);

        if (mapped.length > 0) {
          setDraft((prev) => {
            if (!prev.selectedProId || !mapped.some((m) => m.id === prev.selectedProId)) {
              return { ...prev, selectedProId: mapped[0].id };
            }
            return prev;
          });
        }
      }
    } catch {
      // Empty
    }
  }, [session.city, sortMode]);

  useEffect(() => {
    loadServices();
    loadWorkers();
  }, [loadServices, loadWorkers]);

  // Fetch real notifications for the authenticated user
  const fetchNotifications = useCallback(async () => {
    try {
      const list = await ApiClient.notifications.getAll();
      if (Array.isArray(list)) {
        setNotifications(
          list.map((n: any) => ({
            id: n._id || n.id,
            _id: n._id || n.id,
            title: n.title,
            detail: n.detail,
            time: n.createdAt
              ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent',
            icon: n.icon || 'notifications',
            color: n.color || '#FF9C7A',
            isRead: n.isRead,
            createdAt: n.createdAt,
          }))
        );
      }
    } catch {
      // Unauthenticated or offline
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await ApiClient.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await ApiClient.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }, []);

  // Fetch user bookings from backend
  const fetchUserBookings = useCallback(async () => {
    try {
      const list = await ApiClient.bookings.getAll();
      if (Array.isArray(list)) {
        const mapped: Booking[] = list.map((b: any) => ({
          id: b.bookingId || b._id,
          bookingId: b.bookingId,
          service: b.service,
          professionalId: b.workerId,
          workerId: b.workerId,
          mode: b.mode || 'INSTANT',
          date: b.date || '',
          time: b.time || '',
          hours: b.hours || 1,
          task: b.task || '',
          materials: b.materials || '',
          notes: b.notes || '',
          address: b.address || '',
          status: b.status,
          startedAt: b.startedAt,
          startOtp: b.startOtp,
          endOtp: b.endOtp,
          totalAmount: b.totalAmount,
          rating: b.rating,
          review: b.review,
          paymentMethod: b.paymentMethod,
          clientName: b.clientName,
          clientPhone: b.clientPhone,
          workerPayout: b.workerPayout,
          workerRate: b.workerRate,
          clientRate: b.clientRate,
          latitude: b.latitude,
          longitude: b.longitude,
        }));

        const active = mapped.find(
          (b) => b.status !== 'CLOSED' && b.status !== 'CANCELLED' && b.status !== 'FAILED'
        );
        const past = mapped.filter(
          (b) => b.status === 'CLOSED' || b.status === 'CANCELLED' || b.status === 'FAILED'
        );

        setSession((prev) => ({
          ...prev,
          allBookings: mapped,
          activeBooking: active || null,
          pastBookings: past,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Request OTP from backend API
  const requestOtp = useCallback(
    async (
      phone: string,
      roleOrSuccess?: ('client' | 'worker') | (() => void),
      onSuccessCallback?: () => void
    ) => {
      let role: 'client' | 'worker' = 'client';
      let onSuccess: (() => void) | undefined;

      if (typeof roleOrSuccess === 'function') {
        onSuccess = roleOrSuccess;
      } else if (roleOrSuccess) {
        role = roleOrSuccess;
        onSuccess = onSuccessCallback;
      }

      if (!/^[6-9]\d{9}$/.test(phone)) {
        setErrorMessage('Enter a valid 10-digit Indian mobile number.');
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);

      // Pre-set selected role in state
      setSession((prev) => ({ ...prev, role }));

      try {
        const res = await ApiClient.auth.requestOtp(phone, role);
        setIsLoading(false);

        if (res?.notification?.otp) {
          setLatestOtpNotification({
            title: res.notification.title,
            detail: res.notification.detail,
            otp: res.notification.otp,
          });
          setNoticeMessage(`🔔 OTP Notification: Your code is ${res.notification.otp}`);
        } else {
          setNoticeMessage(res?.message || 'Verification code sent via notification!');
        }

        setPendingPhone(phone);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Failed to request OTP. Please verify server connection.');
      }
    },
    []
  );

  // Verify OTP against backend API
  const verifyOtp = useCallback(
    async (
      phone: string,
      otp: string,
      onSuccess: (isProfileComplete?: boolean) => void,
      onError: (err: string) => void
    ) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await ApiClient.auth.verifyOtp(phone, otp);
        setIsLoading(false);

        const isProfileComplete = Boolean(
          res.isProfileComplete ??
            (res.user?.name && res.user.name.trim().length > 0 && res.user?.address)
        );

        setSession((prev) => ({
          ...prev,
          authenticated: true,
          phone: res.user?.phone || phone,
          name: res.user?.name || '',
          role: (res.user?.role as 'client' | 'worker') || 'client',
          city: res.user?.city || prev.city,
          address: res.user?.address || '',
          imageUrl: res.user?.imageUrl || '',
          isProfileComplete,
        }));

        // Fetch live user data after auth
        fetchNotifications();
        fetchUserBookings();
        loadWorkers();
        onSuccess(isProfileComplete);
      } catch (err: any) {
        setIsLoading(false);
        onError(err.message || 'Invalid verification code.');
      }
    },
    [fetchNotifications, fetchUserBookings, loadWorkers]
  );

  // Complete user and worker profile registration
  const completeSignup = useCallback(
    async (data: any, onSuccess: () => void, onError: (err: string) => void) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await ApiClient.auth.signup(data);
        setIsLoading(false);

        setSession((prev) => ({
          ...prev,
          authenticated: true,
          name: res.user?.name || data.name,
          email: res.user?.email || data.email,
          role: res.user?.role || data.role,
          city: res.user?.city || data.city,
          address: res.user?.address || data.address,
          houseFlat: data.houseFlat,
          landmark: data.landmark,
          state: data.state,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          isProfileComplete: true,
          serviceCategory: data.serviceCategory,
          years: data.years,
          experienceDetails: data.experienceDetails,
          skills: data.skills,
          ratePerHour: data.ratePerHour,
          imageUrl: data.imageUrl || res.user?.imageUrl,
        }));

        // Reload verified workers so newly registered worker immediately appears in list!
        loadWorkers();
        fetchNotifications();
        onSuccess();
      } catch (err: any) {
        setIsLoading(false);
        onError(err.message || 'Failed to save profile. Please try again.');
      }
    },
    [loadWorkers, fetchNotifications]
  );

  const logout = useCallback(() => {
    setSession({
      authenticated: false,
      phone: '',
      name: '',
      role: 'client',
      city: 'Pune',
      isProfileComplete: false,
      activeBooking: null,
      pastBookings: [],
      apiConnected: true,
    });
    setLatestOtpNotification(null);
  }, []);

  const selectService = useCallback((service: string) => {
    setDraft((prev) => ({
      ...prev,
      service,
      task: service === 'Cleaning' ? 'Regular Cleaning' : `${service} service`,
    }));
    loadWorkers(service, session.city, sortMode);
  }, [session.city, sortMode, loadWorkers]);

  const updateDraft = useCallback((updater: Partial<BookingDraft> | ((prev: BookingDraft) => BookingDraft)) => {
    setDraft((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.fullName.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  const sortedProfessionals = useMemo(() => {
    switch (sortMode) {
      case 'Nearest':
        return [...professionals].sort((a, b) => a.distanceKm - b.distanceKm);
      case 'Most Experienced':
        return [...professionals].sort((a, b) => b.jobs - a.jobs);
      case 'Price':
        return [...professionals].sort((a, b) => a.ratePerHour - b.ratePerHour);
      default:
        return professionals;
    }
  }, [professionals, sortMode]);

  // Create real booking in backend API
  const sendRequest = useCallback(
    async (onNavigate: () => void) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await ApiClient.bookings.create({
          service: draft.service,
          workerId: draft.selectedProId,
          hours: draft.hours,
          mode: draft.mode,
          date: draft.date,
          time: draft.time,
          task: draft.task,
          materials: draft.materials,
          notes: draft.notes,
          address: draft.address,
        });

        setIsLoading(false);

        const newBooking: Booking = {
          id: res.bookingId || res._id,
          bookingId: res.bookingId,
          service: res.service,
          professionalId: res.workerId,
          workerId: res.workerId,
          mode: res.mode,
          date: res.date,
          time: res.time,
          hours: res.hours,
          task: res.task,
          materials: res.materials,
          notes: res.notes,
          address: res.address,
          status: res.status,
          startOtp: res.startOtp,
          endOtp: res.endOtp,
          totalAmount: res.totalAmount,
        };

        setSession((prev) => ({
          ...prev,
          activeBooking: newBooking,
        }));

        setNoticeMessage(`🔔 Start OTP: ${res.startOtp} (Sent to Notifications)`);
        fetchNotifications();
        onNavigate();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Failed to create booking.');
      }
    },
    [draft, fetchNotifications]
  );

  // Transition status in backend API
  const transitionBooking = useCallback(
    async (to: BookingStatus) => {
      if (!session.activeBooking) return;
      const bookingId = session.activeBooking.bookingId || session.activeBooking.id;

      try {
        const updated = await ApiClient.bookings.updateStatus(bookingId, to);
        setSession((s) => ({
          ...s,
          activeBooking: s.activeBooking
            ? {
                ...s.activeBooking,
                status: updated.status,
                startedAt: updated.startedAt || s.activeBooking.startedAt,
                startOtp: updated.startOtp || s.activeBooking.startOtp,
                endOtp: updated.endOtp || s.activeBooking.endOtp,
              }
            : null,
        }));
        fetchNotifications();
      } catch {
        // Fallback local transition
        setSession((s) => {
          if (!s.activeBooking) return s;
          return {
            ...s,
            activeBooking: moveBooking(s.activeBooking, to),
          };
        });
      }
    },
    [session.activeBooking, fetchNotifications]
  );

  const updateBookingStatus = useCallback(
    async (bookingId: string, to: BookingStatus) => {
      try {
        await ApiClient.bookings.updateStatus(bookingId, to);
        await fetchUserBookings();
        await fetchNotifications();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to update booking status.');
      }
    },
    [fetchUserBookings, fetchNotifications]
  );

  const cancelBooking = useCallback(async () => {
    if (!session.activeBooking) return;
    const bookingId = session.activeBooking.bookingId || session.activeBooking.id;
    try {
      await ApiClient.bookings.cancel(bookingId);
      transitionBooking('CANCELLED');
    } catch {
      transitionBooking('CANCELLED');
    }
  }, [session.activeBooking, transitionBooking]);

  const verifyOtpCode = useCallback(
    (code: string): boolean => {
      if (!session.activeBooking) return false;
      return verifyCode(session.activeBooking.status, code, session.activeBooking);
    },
    [session.activeBooking]
  );

  const completeWithOtp = useCallback(
    async (onNavigate: () => void) => {
      const b = session.activeBooking;
      if (!b) return;
      const bookingId = b.bookingId || b.id;

      try {
        if (b.status === 'ARRIVED') {
          await ApiClient.bookings.verifyStartOtp(bookingId, b.startOtp || '482713');
          transitionBooking('IN_PROGRESS');
        } else if (b.status === 'COMPLETED_PENDING_PAYMENT') {
          await ApiClient.bookings.verifyEndOtp(bookingId, b.endOtp || '724819');
          transitionBooking('PAYMENT_PENDING');
          onNavigate();
        }
      } catch {
        // Fallback
        if (b.status === 'ARRIVED') {
          transitionBooking('IN_PROGRESS');
        } else if (b.status === 'COMPLETED_PENDING_PAYMENT') {
          transitionBooking('PAYMENT_PENDING');
          onNavigate();
        }
      }
    },
    [session.activeBooking, transitionBooking]
  );

  // Strictly verify Start OTP entered by worker from client device
  const verifyTaskStartOtp = useCallback(
    async (bookingId: string, otp: string): Promise<{ success: boolean; error?: string }> => {
      const cleanOtp = (otp || '').trim();
      if (!cleanOtp || cleanOtp.length < 6) {
        return { success: false, error: 'Please enter the full 6-digit Start OTP.' };
      }

      setIsLoading(true);
      try {
        await ApiClient.bookings.verifyStartOtp(bookingId, cleanOtp);
        setIsLoading(false);

        setSession((prev) => {
          const updatedActive =
            prev.activeBooking &&
            (prev.activeBooking.bookingId === bookingId || prev.activeBooking.id === bookingId)
              ? { ...prev.activeBooking, status: 'IN_PROGRESS' as BookingStatus }
              : prev.activeBooking;

          const updatedAll = (prev.allBookings || []).map((b) =>
            b.bookingId === bookingId || b.id === bookingId
              ? { ...b, status: 'IN_PROGRESS' as BookingStatus }
              : b
          );

          return {
            ...prev,
            activeBooking: updatedActive,
            allBookings: updatedAll,
          };
        });

        fetchUserBookings();
        fetchNotifications();
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        const errMsg = err.message || 'Incorrect Start OTP. Please ask the client for the code.';
        return { success: false, error: errMsg };
      }
    },
    [fetchUserBookings, fetchNotifications]
  );

  // Process live payment in backend API
  const simulatePayment = useCallback(
    async (
      method: string,
      fail: boolean = false,
      onNavigate: () => void,
      razorpayDetails?: { razorpayPaymentId?: string; razorpayOrderId?: string }
    ) => {
      if (!session.activeBooking) return;
      setIsLoading(true);

      if (fail) {
        setIsLoading(false);
        transitionBooking('FAILED');
        return;
      }

      const bookingId = session.activeBooking.bookingId || session.activeBooking.id;
      const amount =
        session.activeBooking.totalAmount || priceFor(250, session.activeBooking.hours).total;

      try {
        await ApiClient.payments.process({
          bookingId,
          amount,
          method,
          razorpayPaymentId: razorpayDetails?.razorpayPaymentId,
          razorpayOrderId: razorpayDetails?.razorpayOrderId,
        });

        setIsLoading(false);
        setSession((s) => {
          if (!s.activeBooking) return s;
          return {
            ...s,
            activeBooking: {
              ...s.activeBooking,
              status: 'PAYMENT_COMPLETED',
              paymentMethod: method,
            },
          };
        });
        fetchNotifications();
        onNavigate();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Payment failed.');
      }
    },
    [session.activeBooking, transitionBooking, fetchNotifications]
  );

  // Submit review to backend API
  const submitReview = useCallback(
    async (rating: number, tags: string[], reviewText: string, onNavigate: () => void) => {
      if (rating === 0) {
        setErrorMessage('Please choose a rating.');
        return;
      }
      if (!session.activeBooking) return;

      const bookingId = session.activeBooking.bookingId || session.activeBooking.id;
      const workerId =
        session.activeBooking.professionalId || session.activeBooking.workerId || 'sunita';

      try {
        await ApiClient.reviews.submit({
          bookingId,
          workerId,
          rating,
          tags,
          comment: reviewText,
        });

        const closed: Booking = {
          ...session.activeBooking,
          status: 'CLOSED',
          rating,
          review: [...tags, reviewText].filter(Boolean).join(' · '),
        };

        setSession((s) => ({
          ...s,
          activeBooking: closed,
          pastBookings: [closed, ...s.pastBookings.filter((b) => b.id !== closed.id)],
        }));

        fetchNotifications();
        onNavigate();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to submit review.');
      }
    },
    [session.activeBooking, fetchNotifications]
  );

  const setCity = useCallback(
    (city: string) => {
      setSession((prev) => ({
        ...prev,
        city,
      }));
      setDraft((prev) => ({
        ...prev,
        address: prev.address.replace(
          /Pune|Mumbai|Nashik|Ahilyanagar|Chhatrapati Sambhajinagar/,
          city
        ),
      }));
      loadWorkers(draft.service, city, sortMode);
    },
    [draft.service, sortMode, loadWorkers]
  );

  const setSessionRole = useCallback((role: 'client' | 'worker') => {
    setSession((prev) => ({ ...prev, role }));
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);
  const clearNotice = useCallback(() => setNoticeMessage(null), []);
  const showError = useCallback((msg: string) => setErrorMessage(msg), []);

  const value = useMemo(
    () => ({
      session,
      draft,
      pendingPhone,
      isLoading,
      errorMessage,
      noticeMessage,
      searchQuery,
      sortMode,
      elapsedSeconds,
      filteredServices,
      sortedProfessionals,
      notifications,
      latestOtpNotification,
      setPendingPhone,
      requestOtp,
      verifyOtp,
      completeSignup,
      logout,
      selectService,
      updateDraft,
      setSearchQuery,
      setSortMode,
      sendRequest,
      transitionBooking,
      cancelBooking,
      verifyOtpCode,
      completeWithOtp,
      simulatePayment,
      submitReview,
      setCity,
      setSessionRole,
      clearError,
      clearNotice,
      showError,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      fetchUserBookings,
      loadWorkers,
      updateBookingStatus,
      verifyTaskStartOtp,
    }),
    [
      session,
      draft,
      pendingPhone,
      isLoading,
      errorMessage,
      noticeMessage,
      searchQuery,
      sortMode,
      elapsedSeconds,
      filteredServices,
      sortedProfessionals,
      notifications,
      latestOtpNotification,
      requestOtp,
      verifyOtp,
      completeSignup,
      logout,
      selectService,
      updateDraft,
      sendRequest,
      transitionBooking,
      cancelBooking,
      verifyOtpCode,
      completeWithOtp,
      simulatePayment,
      submitReview,
      setCity,
      clearError,
      clearNotice,
      showError,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      fetchUserBookings,
      verifyTaskStartOtp,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
