import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, type ScrollViewInstance} from 'react-native';
import {
  AUTH_OTP, moveBooking, money, priceFor, professionalFor, professionals, services, todayISO, verifyCode,
  serviceCategoryMap, workerToProfessional,
  type Booking, type Professional,
} from '../lib/domain';
import {loadSession, saveSession} from '../lib/storage';
import {api, setAuthToken, getAuthToken} from '../lib/api';
import type {AuthResult} from '../screens/AuthFlow';

export type Role = 'customer' | 'professional';
export type Session = {role: Role; booking: Booking | null; past: Booking[]; name: string; phone: string; authenticated: boolean; online: boolean; setup: boolean; city: string};
const initial: Session = {role: 'customer', booking: null, past: [], name: 'Akshaa', phone: '', authenticated: false, online: false, setup: false, city: 'Pune'};
export const makeDraft = () => ({service: 'Cleaning', mode: 'Instant' as 'Instant' | 'Scheduled', date: todayISO(), time: '10:00', hours: 1, task: 'Regular Cleaning', materials: "I'll provide them", notes: '', address: 'Home · 24, Green Park, Baner, Pune'});
export type Draft = ReturnType<typeof makeDraft>;

/**
 * All app state and actions. API-first with automatic mock fallback.
 * Every backend call is wrapped in try/catch so the app works with or
 * without a live NestJS server.
 */
export function useHStaff() {
  const [session, setSession] = useState<Session>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState('home');
  const [tab, setTab] = useState('Home');
  const [history, setHistory] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(makeDraft);
  const [selected, setSelected] = useState('sunita');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Recommended');
  const [sheet, setSheet] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [otp, setOtp] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [payment, setPayment] = useState('UPI');
  const [pastTab, setPastTab] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [chat, setChat] = useState('');
  const [address, setAddress] = useState('');
  const [outcome, setOutcome] = useState('Accept');
  const [setupName, setSetupName] = useState('Rahul Shinde');
  const [setupSkill, setSetupSkill] = useState('Cleaning');
  const [setupRate, setSetupRate] = useState('250');
  const [language, setLanguage] = useState<import('../lib/translator').SupportedLang>('en');
  const scrollRef = useRef<ScrollViewInstance>(null);

  /* ---- backend entity IDs (null = using mock fallback) ---- */
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [timesheetId, setTimesheetId] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [apiWorkers, setApiWorkers] = useState<Professional[]>([]);

  const b = session.booking;
  const isPro = session.role === 'professional';

  /** Unified professionals list — API workers take precedence over demo data. */
  const allProfessionals = apiWorkers.length > 0 ? apiWorkers : professionals;
  const person = professionalFor(b?.professionalId ?? selected, allProfessionals);

  /* ---- persistence (localStorage -> AsyncStorage) ---- */
  useEffect(() => {
    let alive = true;
    loadSession<Session>().then(async data => {
      if (alive && data && Array.isArray((data as Session).past) && ['customer', 'professional'].includes((data as Session).role as string)) {
        setSession({...initial, ...data});
      }
      if (alive) setHydrated(true);
    });
    return () => {alive = false;};
  }, []);
  useEffect(() => {if (hydrated) saveSession(session);}, [session, hydrated]);

  /* ---- reset transient UI whenever the screen changes ---- */
  useEffect(() => {
    scrollRef.current?.scrollTo({y: 0, animated: false});
    setError(''); setNotice(''); setOtp('');
  }, [screen]);

  /* ---- professional response: API polling or mock timer ---- */
  useEffect(() => {
    if (b?.status !== 'REQUESTED') return;

    if (serviceRequestId) {
      /* Backend is live — poll for status change every 3 s */
      let alive = true;
      const poll = async () => {
        try {
          const sr = await api.serviceRequests.get(serviceRequestId);
          if (!alive) return;
          const srs = sr?.status ?? '';
          if (['ASSIGNED', 'IN_PROGRESS', 'CONFIRMED'].includes(srs)) {
            const list = await api.assignments.mine();
            const asgn = Array.isArray(list)
              ? list.find((a: any) => a.serviceRequestId === serviceRequestId)
              : null;
            if (asgn) setAssignmentId(asgn.id);
            setSession(s => {
              if (s.booking?.status !== 'REQUESTED') return s;
              let bk = moveBooking(s.booking, 'ACCEPTED');
              bk = moveBooking(bk, 'CONFIRMED');
              return {...s, booking: bk};
            });
          } else if (['CANCELLED', 'EXPIRED'].includes(srs)) {
            setSession(s => {
              if (s.booking?.status !== 'REQUESTED') return s;
              return {...s, booking: moveBooking(s.booking, 'EXPIRED')};
            });
          }
        } catch { /* ignore polling errors */ }
      };
      poll();
      const timer = setInterval(poll, 3000);
      return () => {alive = false; clearInterval(timer);};
    }

    /* Mock fallback — simulated 3 s response */
    const timer = setTimeout(() => {
      setSession(s => {
        if (s.booking?.status !== 'REQUESTED') return s;
        const next = outcome === 'Decline' ? 'DECLINED' : outcome === 'Timeout' ? 'EXPIRED' : 'ACCEPTED';
        let booking = moveBooking(s.booking, next);
        if (next === 'ACCEPTED') booking = moveBooking(booking, 'CONFIRMED');
        return {...s, booking};
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [b?.status, outcome, serviceRequestId]);

  /* ---- service timer ---- */
  useEffect(() => {
    if (!b?.startedAt || b.status !== 'IN_PROGRESS') return;
    const update = () => setElapsed(Math.floor((Date.now() - (b.startedAt ?? Date.now())) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [b?.startedAt, b?.status]);

  /* ---- actions ---- */
  const patch = (p: Partial<Session>) => setSession(s => ({...s, ...p}));
  const go = (next: string) => {setHistory(h => [...h, screen]); setScreen(next);};
  const back = useCallback(() => {
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setScreen(last ?? 'home');
  }, [history]);
  const navigateTab = (next: string) => {setTab(next); setHistory([]); setScreen(next.toLowerCase()); setQuery('');};
  const closeSheet = () => {setSheet(null); setError(''); setNotice('');};
  const switchRole = () => {
    patch({role: isPro ? 'customer' : 'professional'});
    setTab('Home'); setHistory([]); setSheet(null);
    setScreen(!isPro && !session.setup ? 'setup' : 'home');
  };

  /**
   * Transition booking status — calls the backend assignment endpoints
   * when we have an assignmentId, or falls back to local state change.
   */
  const transition = async (status: Booking['status']) => {
    /* Optimistic local update */
    setSession(s => ({...s, booking: s.booking ? moveBooking(s.booking, status) : null}));

    if (assignmentId) {
      try {
        switch (status) {
          case 'EN_ROUTE':
            await api.assignments.enRoute(assignmentId);
            break;
          case 'ARRIVED':
            await api.assignments.arrived(assignmentId);
            break;
          /* IN_PROGRESS and COMPLETED_PENDING_PAYMENT are handled by OTP verification */
        }
      } catch { /* optimistic update already applied */ }
    }
  };

  const selectService = (service: string) => {
    setDraft({...makeDraft(), service, task: service === 'Cleaning' ? 'Regular Cleaning' : `${service} service`});
    setSelected(service === 'Electrical' ? 'rahul' : 'sunita');
    go('mode');
  };

  /**
   * Browse professionals: create a service request on the backend, then
   * query for matching workers. Falls back to demo data on error.
   */
  const browse = async () => {
    setLoading(true);
    go('professionals');

    try {
      const sr = await api.serviceRequests.create({
        categoryId: serviceCategoryMap[draft.service] ?? 1,
        bookingMode: draft.mode === 'Instant' ? 'INSTANT' : 'SCHEDULED',
        startAt: draft.mode === 'Scheduled'
          ? `${draft.date}T${draft.time}:00.000Z`
          : undefined,
        durationHours: draft.hours,
        latitude: 18.5596,
        longitude: 73.7810,
        address: draft.address,
        notes: draft.notes,
      });
      setServiceRequestId(sr.id);

      const workers = await api.serviceRequests.findWorkers(sr.id);
      if (Array.isArray(workers) && workers.length > 0) {
        const mapped = workers.map(workerToProfessional);
        setApiWorkers(mapped);
        setSelected(mapped[0].id);
      }
    } catch {
      /* Backend unreachable — use hardcoded professionals */
      setApiWorkers([]);
      setServiceRequestId(null);
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  /**
   * Send the service request to the selected professional. Creates an
   * offer on the backend, or falls back to mock booking flow.
   */
  const sendRequest = async () => {
    const bookingId = serviceRequestId ?? `HS-${Math.floor(100000 + Math.random() * 899999)}`;
    const booking: Booking = {...draft, id: bookingId, professionalId: selected, status: 'DRAFT'};
    patch({booking: moveBooking(moveBooking(booking, 'OPEN'), 'REQUESTED')});
    go('service');

    if (serviceRequestId) {
      try {
        const offer = await api.offers.create(serviceRequestId, selected);
        if (offer?.id) setOfferId(offer.id);
      } catch { /* polling / mock timer handles the response */ }
    }
  };

  /**
   * Worker fetches incoming offers from the backend, or creates a
   * simulated request when offline.
   */
  const makeProRequest = async () => {
    try {
      const offers = await api.offers.listForWorker();
      if (Array.isArray(offers) && offers.length > 0) {
        const latest = offers[0];
        setOfferId(latest.id);
        const sr = latest.serviceRequest ?? {};
        const booking: Booking = {
          ...makeDraft(),
          id: sr.id ?? latest.id,
          professionalId: 'rahul',
          hours: sr.durationHours ?? 2,
          service: sr.category?.name ?? 'Cleaning',
          notes: sr.notes ?? '',
          address: sr.address ?? 'Baner, Pune',
          status: 'REQUESTED',
        };
        patch({booking});
        return;
      }
    } catch { /* fallback below */ }

    /* Mock fallback */
    const booking: Booking = {...makeDraft(), id: 'HS-106824', professionalId: 'rahul', hours: 2, notes: 'Please focus on the kitchen and living room. We have a friendly dog.', status: 'REQUESTED'};
    patch({booking}); setOutcome('Timeout');
  };

  /**
   * Worker accepts a service request. Responds to the offer on the
   * backend and updates local state.
   */
  const acceptPro = async () => {
    if (!b) return;

    if (offerId) {
      try {
        const result = await api.offers.respond(offerId, true);
        if (result?.assignmentId) setAssignmentId(result.assignmentId);
      } catch { /* proceed with local state update */ }
    }

    patch({booking: moveBooking(moveBooking(b, 'ACCEPTED'), 'CONFIRMED')});
    go('service');
  };

  /**
   * Verify OTP for start / end of service. Calls backend assignment
   * verify endpoints, or falls back to matching against demo codes.
   */
  const verifyOtp = async () => {
    if (!b) return;

    /* --- Try backend verification first --- */
    if (assignmentId) {
      try {
        if (b.status === 'ARRIVED') {
          await api.assignments.verifyStart(assignmentId, otp, 18.5596, 73.7810);
          await transition('IN_PROGRESS');
          setOtp(''); setSheet(null);
          return;
        }
        if (b.status === 'COMPLETED_PENDING_PAYMENT') {
          await api.assignments.verifyEnd(assignmentId, otp, 18.5596, 73.7810);
          /* Fetch timesheet for payment */
          try {
            const ts = await api.assignments.timesheet(assignmentId);
            if (ts?.id) setTimesheetId(ts.id);
          } catch { /* timesheet will be created by backend */ }

          if (isPro) {
            let paid = moveBooking(b, 'PAYMENT_PENDING');
            paid = moveBooking(paid, 'PAYMENT_COMPLETED');
            const closed = moveBooking({...paid, rating: 5}, 'CLOSED');
            patch({booking: closed, past: [closed, ...session.past.filter(x => x.id !== closed.id)]});
            setSheet(null); go('complete');
          } else {
            await transition('PAYMENT_PENDING');
            setSheet(null); go('payment');
          }
          return;
        }
      } catch (e: any) {
        /* Backend rejected the OTP — show error unless we also fail locally */
        if (e?.statusCode && e.statusCode !== 0) {
          setError(e.message || "That code doesn't match.");
          return;
        }
        /* Network error — try local fallback */
      }
    }

    /* --- Mock fallback --- */
    if (!verifyCode(b.status, otp)) {setError("That code doesn\u2019t match. Please check all six digits."); return;}
    if (b.status === 'ARRIVED') {await transition('IN_PROGRESS'); setOtp(''); setSheet(null);}
    else if (isPro) {
      let paid = moveBooking(b, 'PAYMENT_PENDING');
      paid = moveBooking(paid, 'PAYMENT_COMPLETED');
      const closed = moveBooking({...paid, rating: 5}, 'CLOSED');
      patch({booking: closed, past: [closed, ...session.past.filter(x => x.id !== closed.id)]});
      setSheet(null); go('complete');
    } else {await transition('PAYMENT_PENDING'); setSheet(null); go('payment');}
  };

  const sendJobOtp = async (kind: 'start' | 'end') => {
    if (!assignmentId) {
      setNotice(`Demo ${kind} code: ${kind === 'start' ? '482713' : '724819'}`);
      return;
    }
    setError('');
    try {
      if (kind === 'start') await api.assignments.issueStartOtp(assignmentId);
      else await api.assignments.issueEndOtp(assignmentId);
      setNotice(`The ${kind === 'start' ? 'start' : 'completion'} code was sent by SMS.`);
    } catch (e: any) {
      setError(e?.message || 'Could not send the code by SMS. Please try again.');
    }
  };

  const submitTimesheetDispute = async (reason: string) => {
    if (!timesheetId) {
      setError('Timesheet details are not available yet.');
      return;
    }
    setError('');
    try {
      await api.assignments.disputeTimesheet(timesheetId, reason);
      setSession(s => s.booking ? { ...s, booking: { ...s.booking, status: 'DISPUTED' } } : s);
      setSheet(null);
      setNotice('Your dispute was submitted for review.');
      go('service');
    } catch (e: any) {
      setError(e?.message || 'Could not submit the timesheet dispute.');
    }
  };

  /**
   * Process payment via Razorpay test mode checkout with backend settlement,
   * handling API fallouts, network timeouts, and load handling gracefully.
   */
  const simulatedPayment = async (fail = false) => {
    if (!b) return;
    setLoading(true);
    setError('');
    if (b.status === 'COMPLETED_PENDING_PAYMENT' || b.status === 'FAILED') await transition('PAYMENT_PENDING');

    const hrs = b.hours ?? 1;
    const pricing = priceFor(person.rate, hrs);

    try {
      if (fail) {
        throw new Error('Simulated test failure triggered by user');
      }

      if (timesheetId && assignmentId) {
        const timesheet = await api.assignments.timesheet(assignmentId);
        if (timesheet.status === 'PENDING_APPROVAL') {
          await api.assignments.approveTimesheet(timesheetId);
        } else if (timesheet.status !== 'APPROVED') {
          throw new Error(`This timesheet is ${String(timesheet.status).toLowerCase()} and cannot be paid.`);
        }
      }

      // Step 1: Trigger Razorpay Checkout (test mode)
      const {openRazorpayCheckout} = await import('../lib/razorpay');
      const rzpResponse = await openRazorpayCheckout({
        amount: pricing.total * 100, // paise
        description: `${b.service} - ${hrs}h (Worker: ${money(pricing.charge)}, Platform: ${money(pricing.fee)})`,
        name: 'H-Staff Services',
        prefill: {
          name: session.name,
          contact: session.phone,
        },
      });

      // Step 2: Post payment to backend if connected
      if (timesheetId) {
        try {
          await api.payments.pay(timesheetId);
        } catch (apiErr: any) {
          console.warn('[Payment] Backend record notice:', apiErr?.message);
        }
      }

      // Step 3: Transition state to paid & proceed
      setSession(s => (s.booking
        ? {...s, booking: {...moveBooking(s.booking, 'PAYMENT_COMPLETED'), paymentMethod: `${payment} (Razorpay ${rzpResponse.razorpay_payment_id.slice(0, 8)})`}}
        : s));
      setLoading(false);
      setNotice(`Payment of ${money(pricing.total)} successful.`);
      go('rating');
    } catch (err: any) {
      setLoading(false);
      setSession(s => (s.booking ? {...s, booking: {...moveBooking(s.booking, 'FAILED'), paymentMethod: payment}} : s));
      setError(err?.description || err?.message || 'Payment could not be completed. Your booking is safe.');
    }
  };

  /**
   * Submit rating + review for the completed service. Sends to backend
   * feedback endpoint if connected.
   */
  const finishReview = async () => {
    if (!b || rating === 0) {setError('Please choose a rating.'); return;}

    if (assignmentId) {
      try {
        await api.feedback.rate({assignmentId, rating, score: rating, tags, comment: review});
      } catch { /* continue with local update */ }
    }

    const closed = moveBooking({...b, rating, review: [...tags, review].filter(Boolean).join(' · ')}, 'CLOSED');
    patch({booking: closed, past: [closed, ...session.past.filter(x => x.id !== closed.id)]});
    go('complete');
  };

  const authSubmit = () => {
    if (!/^[6-9]\d{9}$/.test(authPhone)) {setError('Enter a valid 10-digit Indian mobile number.'); return;}
    setError(''); go('auth-otp');
  };

  const authenticate = () => {
    if (otp !== AUTH_OTP) {setError('Please enter the six-digit demo code shown below.'); return;}
    patch({authenticated: true, phone: authPhone});
    setHistory([]); setScreen(isPro && !session.setup ? 'setup' : 'home');
  };

  /**
   * Called when the full AuthFlow completes (login or signup).
   * Token is already stored by the AuthFlow component.
   */
  const onAuthDone = async (r: AuthResult) => {
    patch({
      authenticated: true,
      role: r.role === 'professional' ? 'professional' : 'customer',
      name: r.name,
      phone: r.phone,
      setup: r.role === 'professional' ? true : session.setup,
    });
    if (r.role === 'professional') setSetupName(r.name);

    /* Fetch existing worker profile if pro */
    if (r.role === 'professional') {
      try {
        const me = await api.workers.getMe();
        if (me?.baseHourlyRate) setSetupRate(String(me.baseHourlyRate));
      } catch { /* new worker — setup will create profile */ }
    }

    setHistory([]); setTab('Home'); setScreen('home');
  };

  /**
   * Logout: clear token, reset API state, restore to initial.
   */
  const logout = async () => {
    await setAuthToken(null);
    setServiceRequestId(null);
    setAssignmentId(null);
    setTimesheetId(null);
    setOfferId(null);
    setApiWorkers([]);
    patch({authenticated: false, phone: '', booking: null});
    setHistory([]); setTab('Home'); setScreen('home');
  };

  /**
   * Worker completes professional setup — updates backend worker
   * profile, then marks local state as set up.
   */
  const completeSetup = async (name: string, skill: string, rate: string, experience: string) => {
    if (!name.trim() || Number(rate) <= 0) {
      setError('Add your name and a valid hourly rate.');
      return false;
    }

    try {
      await api.workers.updateMe({
        experienceYears: Number(experience) || 8,
        baseHourlyRate: Number(rate),
        categoryIds: [serviceCategoryMap[skill] ?? 1],
      });
      await api.workers.submitForReview();
    } catch { /* demo mode — continue */ }

    patch({setup: true, role: 'professional'});
    navigateTab('Home');
    return true;
  };

  /**
   * Submit a complaint to the backend.
   */
  const submitComplaint = async (category: string, description: string) => {
    if (assignmentId) {
      try {
        const categoryMap: Record<string, string> = {
          'Service quality': 'POOR_QUALITY',
          'Safety concern': 'UNPROFESSIONAL',
          'Professional not arrived': 'NO_SHOW',
          'Payment issue': 'OVERCHARGING',
        };
        await api.feedback.complain({
          assignmentId,
          category: (categoryMap[category] ?? 'OTHER') as any,
          description,
        });
      } catch { /* local state transition handles it */ }
    }
    await transition('DISPUTED');
  };

  const filteredServices = services.filter(s => (s.name + ' ' + s.full).toLowerCase().includes(query.toLowerCase()));
  const sorted = [...allProfessionals].sort((a, c) => (sort === 'Nearest' ? a.distance - c.distance : sort === 'Top Rated' ? c.rating - a.rating : sort === 'Price' ? a.rate - c.rate : 0));
  const dockVisible = ['home', 'discover', 'bookings', 'profile', 'jobs', 'earnings'].includes(screen);

  /* ---- Android hardware / gesture back ---- */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!session.authenticated) return false; // AuthFlow handles its own back
      if (sheet) {closeSheet(); return true;}
      if (history.length) {back(); return true;}
      if (screen !== 'home') {navigateTab('Home'); return true;}
      return false; // let Android leave the app
    });
    return () => sub.remove();
  });

  return {
    session, hydrated, screen, tab, history, draft, setDraft, selected, setSelected, query, setQuery, sort, setSort, sheet, setSheet,
    error, setError, notice, setNotice, otp, setOtp, rating, setRating, review, setReview, tags, setTags, payment, setPayment,
    pastTab, setPastTab, elapsed, loading, authPhone, setAuthPhone, messages, setMessages, chat, setChat, address, setAddress,
    outcome, setOutcome, setupName, setSetupName, setupSkill, setSetupSkill, setupRate, setSetupRate, scrollRef,
    b, person, isPro, patch, go, back, navigateTab, closeSheet, switchRole, transition, selectService, browse, sendRequest,
    makeProRequest, acceptPro, finishReview, simulatedPayment, verifyOtp, sendJobOtp, submitTimesheetDispute, authSubmit, authenticate, onAuthDone,
    filteredServices, sorted, dockVisible,
    /* New API-specific exports */
    allProfessionals, assignmentId, serviceRequestId, timesheetId, logout, completeSetup, submitComplaint,
    language, setLanguage,
  };
}
export type C = ReturnType<typeof useHStaff>;
