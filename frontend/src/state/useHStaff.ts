import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, type ScrollViewInstance} from 'react-native';
import {
  AUTH_OTP, moveBooking, professionalFor, professionals, services, todayISO, verifyCode, type Booking,
} from '../lib/domain';
import {loadSession, saveSession} from '../lib/storage';
import type {AuthResult} from '../screens/AuthFlow';

export type Role = 'customer' | 'professional';
export type Session = {role: Role; booking: Booking | null; past: Booking[]; name: string; phone: string; authenticated: boolean; online: boolean; setup: boolean; city: string};
const initial: Session = {role: 'customer', booking: null, past: [], name: 'Akshaa', phone: '', authenticated: false, online: false, setup: false, city: 'Pune'};
export const makeDraft = () => ({service: 'Cleaning', mode: 'Instant' as 'Instant' | 'Scheduled', date: todayISO(), time: '10:00', hours: 1, task: 'Regular Cleaning', materials: "I'll provide them", notes: '', address: 'Home · 24, Green Park, Baner, Pune'});
export type Draft = ReturnType<typeof makeDraft>;

/**
 * All app state and actions. This is a line-for-line port of the state machine that lived inside
 * `HStaffApp` in the web prototype; screens are now pure functions of this controller.
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
  const scrollRef = useRef<ScrollViewInstance>(null);

  const b = session.booking;
  const person = professionalFor(b?.professionalId ?? selected);
  const isPro = session.role === 'professional';

  /* ---- persistence (localStorage -> AsyncStorage) ---- */
  useEffect(() => {
    let alive = true;
    loadSession<Session>().then(data => {
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

  /* ---- simulated professional response (3s) ---- */
  useEffect(() => {
    if (b?.status !== 'REQUESTED') return;
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
  }, [b?.status, outcome]);

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
  const transition = (status: Booking['status']) => setSession(s => ({...s, booking: s.booking ? moveBooking(s.booking, status) : null}));
  const selectService = (service: string) => {
    setDraft({...makeDraft(), service, task: service === 'Cleaning' ? 'Regular Cleaning' : `${service} service`});
    setSelected(service === 'Electrical' ? 'rahul' : 'sunita');
    go('mode');
  };
  const browse = () => {setLoading(true); go('professionals'); setTimeout(() => setLoading(false), 550);};
  const sendRequest = () => {
    const booking: Booking = {...draft, id: `HS-${Math.floor(100000 + Math.random() * 899999)}`, professionalId: selected, status: 'DRAFT'};
    patch({booking: moveBooking(moveBooking(booking, 'OPEN'), 'REQUESTED')});
    go('service');
  };
  const makeProRequest = () => {
    const booking: Booking = {...makeDraft(), id: 'HS-106824', professionalId: 'rahul', hours: 2, notes: 'Please focus on the kitchen and living room. We have a friendly dog.', status: 'REQUESTED'};
    patch({booking}); setOutcome('Timeout');
  };
  const acceptPro = () => {
    if (!b) return;
    patch({booking: moveBooking(moveBooking(b, 'ACCEPTED'), 'CONFIRMED')});
    go('service');
  };
  const finishReview = () => {
    if (!b || rating === 0) {setError('Please choose a rating.'); return;}
    const closed = moveBooking({...b, rating, review: [...tags, review].filter(Boolean).join(' · ')}, 'CLOSED');
    patch({booking: closed, past: [closed, ...session.past.filter(x => x.id !== closed.id)]});
    go('complete');
  };
  const simulatedPayment = (fail = false) => {
    if (!b) return;
    setLoading(true);
    if (b.status === 'COMPLETED_PENDING_PAYMENT' || b.status === 'FAILED') transition('PAYMENT_PENDING');
    setTimeout(() => {
      setSession(s => (s.booking ? {...s, booking: {...moveBooking(s.booking, fail ? 'FAILED' : 'PAYMENT_COMPLETED'), paymentMethod: payment}} : s));
      setLoading(false);
      if (!fail) go('rating');
      else setError("Payment couldn't be completed. Your booking is safe.");
    }, 700);
  };
  const verifyOtp = () => {
    if (!b) return;
    if (!verifyCode(b.status, otp)) {setError('That code doesn’t match. Please check all six digits.'); return;}
    if (b.status === 'ARRIVED') {transition('IN_PROGRESS'); setOtp(''); setSheet(null);}
    else if (isPro) {
      let paid = moveBooking(b, 'PAYMENT_PENDING');
      paid = moveBooking(paid, 'PAYMENT_COMPLETED');
      const closed = moveBooking({...paid, rating: 5}, 'CLOSED');
      patch({booking: closed, past: [closed, ...session.past.filter(x => x.id !== closed.id)]});
      setSheet(null); go('complete');
    } else {transition('PAYMENT_PENDING'); setSheet(null); go('payment');}
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
  const onAuthDone = (r: AuthResult) => {
    patch({authenticated: true, role: r.role, name: r.name, phone: r.phone, setup: r.role === 'professional' ? true : session.setup});
    if (r.role === 'professional') setSetupName(r.name);
    setHistory([]); setTab('Home'); setScreen('home');
  };

  const filteredServices = services.filter(s => (s.name + ' ' + s.full).toLowerCase().includes(query.toLowerCase()));
  const sorted = [...professionals].sort((a, c) => (sort === 'Nearest' ? a.distance - c.distance : sort === 'Top Rated' ? c.rating - a.rating : sort === 'Price' ? a.rate - c.rate : 0));
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
    makeProRequest, acceptPro, finishReview, simulatedPayment, verifyOtp, authSubmit, authenticate, onAuthDone,
    filteredServices, sorted, dockVisible,
  };
}
export type C = ReturnType<typeof useHStaff>;
