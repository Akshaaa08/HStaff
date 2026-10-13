import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Booking,
  BookingMode,
  BookingStatus,
  DemoOtp,
  Professional,
  ServiceCategory,
  hstaffCities,
  moveBooking,
  priceFor,
  professionalFor,
  sampleProfessionals,
  sampleServices,
  verifyCode,
} from '../types';

export interface ClientSession {
  authenticated: boolean;
  phone: string;
  name: string;
  city: string;
  activeBooking: Booking | null;
  pastBookings: Booking[];
  apiConnected: boolean;
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

  setPendingPhone: (phone: string) => void;
  requestOtp: (phone: string, onSuccess: () => void) => void;
  verifyOtp: (phone: string, otp: string, onSuccess: () => void, onError: (err: string) => void) => void;
  logout: () => void;
  selectService: (service: string) => void;
  updateDraft: (updater: Partial<BookingDraft> | ((prev: BookingDraft) => BookingDraft)) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: string) => void;
  sendRequest: (onNavigate: () => void) => void;
  transitionBooking: (to: BookingStatus) => void;
  cancelBooking: () => void;
  verifyOtpCode: (code: string) => boolean;
  completeWithOtp: (onNavigate: () => void) => void;
  simulatePayment: (method: string, fail: boolean, onNavigate: () => void) => void;
  submitReview: (rating: number, tags: string[], reviewText: string, onNavigate: () => void) => void;
  setCity: (city: string) => void;
  clearError: () => void;
  clearNotice: () => void;
  showError: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ClientSession>({
    authenticated: false,
    phone: '',
    name: 'Akshaa',
    city: 'Pune',
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
    address: 'Home · 24, Green Park, Baner, Pune',
    selectedProId: 'sunita',
  });

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

  const requestOtp = useCallback((phone: string, onSuccess: () => void) => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMessage('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 600);
  }, []);

  const verifyOtp = useCallback(
    (phone: string, otp: string, onSuccess: () => void, onError: (err: string) => void) => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (otp === DemoOtp.AUTH || otp.length === 6) {
          setSession((prev) => ({
            ...prev,
            authenticated: true,
            phone,
          }));
          onSuccess();
        } else {
          onError('Please enter the six-digit demo code 123456.');
        }
      }, 700);
    },
    []
  );

  const logout = useCallback(() => {
    setSession({
      authenticated: false,
      phone: '',
      name: 'Akshaa',
      city: 'Pune',
      activeBooking: null,
      pastBookings: [],
      apiConnected: true,
    });
  }, []);

  const selectService = useCallback((service: string) => {
    setDraft((prev) => ({
      ...prev,
      service,
      task: service === 'Cleaning' ? 'Regular Cleaning' : `${service} service`,
      selectedProId: service === 'Electrical' ? 'rahul' : 'sunita',
    }));
  }, []);

  const updateDraft = useCallback((updater: Partial<BookingDraft> | ((prev: BookingDraft) => BookingDraft)) => {
    setDraft((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sampleServices;
    return sampleServices.filter(
      (s) => s.name.toLowerCase().includes(q) || s.fullName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const sortedProfessionals = useMemo(() => {
    switch (sortMode) {
      case 'Nearest':
        return [...sampleProfessionals].sort((a, b) => a.distanceKm - b.distanceKm);
      case 'Top Rated':
        return [...sampleProfessionals].sort((a, b) => b.rating - a.rating);
      case 'Price':
        return [...sampleProfessionals].sort((a, b) => a.ratePerHour - b.ratePerHour);
      default:
        return sampleProfessionals;
    }
  }, [sortMode]);

  const sendRequest = useCallback(
    (onNavigate: () => void) => {
      const randomId = `HS-${Math.floor(100000 + Math.random() * 900000)}`;
      const newBooking: Booking = {
        id: randomId,
        service: draft.service,
        professionalId: draft.selectedProId,
        mode: draft.mode,
        date: draft.date,
        time: draft.time,
        hours: draft.hours,
        task: draft.task,
        materials: draft.materials,
        notes: draft.notes,
        address: draft.address,
        status: 'REQUESTED',
      };

      setSession((prev) => ({
        ...prev,
        activeBooking: newBooking,
      }));

      onNavigate();

      // Simulate worker auto-accept after 3 seconds
      setTimeout(() => {
        setSession((s) => {
          if (!s.activeBooking || s.activeBooking.status !== 'REQUESTED') return s;
          return {
            ...s,
            activeBooking: {
              ...s.activeBooking,
              status: 'CONFIRMED',
            },
          };
        });
      }, 3000);
    },
    [draft]
  );

  const transitionBooking = useCallback((to: BookingStatus) => {
    setSession((s) => {
      if (!s.activeBooking) return s;
      const moved = moveBooking(s.activeBooking, to);
      return {
        ...s,
        activeBooking: moved,
      };
    });
  }, []);

  const cancelBooking = useCallback(() => {
    transitionBooking('CANCELLED');
  }, [transitionBooking]);

  const verifyOtpCode = useCallback(
    (code: string): boolean => {
      if (!session.activeBooking) return false;
      return verifyCode(session.activeBooking.status, code);
    },
    [session.activeBooking]
  );

  const completeWithOtp = useCallback(
    (onNavigate: () => void) => {
      const b = session.activeBooking;
      if (!b) return;
      if (b.status === 'ARRIVED') {
        transitionBooking('IN_PROGRESS');
      } else if (b.status === 'COMPLETED_PENDING_PAYMENT') {
        transitionBooking('PAYMENT_PENDING');
        onNavigate();
      }
    },
    [session.activeBooking, transitionBooking]
  );

  const simulatePayment = useCallback(
    (method: string, fail: boolean = false, onNavigate: () => void) => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSession((s) => {
          if (!s.activeBooking) return s;
          if (fail) {
            return {
              ...s,
              activeBooking: {
                ...s.activeBooking,
                status: 'FAILED',
              },
            };
          }
          const paid: Booking = {
            ...s.activeBooking,
            status: 'PAYMENT_COMPLETED',
            paymentMethod: method,
          };
          return {
            ...s,
            activeBooking: paid,
          };
        });
        if (!fail) onNavigate();
      }, 700);
    },
    []
  );

  const submitReview = useCallback(
    (rating: number, tags: string[], reviewText: string, onNavigate: () => void) => {
      if (rating === 0) {
        setErrorMessage('Please choose a rating.');
        return;
      }
      setSession((s) => {
        if (!s.activeBooking) return s;
        const closed: Booking = {
          ...s.activeBooking,
          status: 'CLOSED',
          rating,
          review: [...tags, reviewText].filter(Boolean).join(' · '),
        };
        return {
          ...s,
          activeBooking: closed,
          pastBookings: [closed, ...s.pastBookings.filter((b) => b.id !== closed.id)],
        };
      });
      onNavigate();
    },
    []
  );

  const setCity = useCallback((city: string) => {
    setSession((prev) => ({
      ...prev,
      city,
      draft: {
        ...draft,
        address: draft.address.replace(/Pune|Mumbai|Nashik|Ahilyanagar|Chhatrapati Sambhajinagar/, city),
      },
    }));
  }, [draft]);

  const clearError = useCallback(() => setErrorMessage(null), []);
  const clearNotice = useCallback(() => setNoticeMessage(null), []);
  const showError = useCallback((msg: string) => setErrorMessage(msg), []);

  return (
    <AppContext.Provider
      value={{
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
        setPendingPhone,
        requestOtp,
        verifyOtp,
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
        clearError,
        clearNotice,
        showError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
