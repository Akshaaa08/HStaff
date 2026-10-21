import React, {type ReactNode} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Clock, CreditCard, HelpCircle, LockKeyhole, MapPin, MessageCircle, Minus, Navigation, Plus, Receipt, Send, Settings, ShieldCheck, Star, Zap,
} from 'lucide-react-native';
import {
  END_OTP, START_OTP, canFallback, canTrack, clock, money, priceFor, statusLabel, type Professional,
} from '../lib/domain';
import {photos} from '../lib/assets';
import {brandGradient, colors} from '../theme';
import {Pulse} from '../components/motion';
import {
  Choice, DetailRow, EmptyState, MapMockup, OTPDisplay, PriceBreakdown, ProfessionalCard, ScreenTop, SectionHeading, StatusChip, Summary, Tag, VerificationBadge,
} from '../components/primitives';
import {BrandGradient, Chip, Eyebrow, FieldLabel, IconButton, Outline, Photo, Primary, Quiet, Subtle, TextArea, Txt, WrapChip} from '../components/ui';
import LinearGradient from 'react-native-linear-gradient';
import {Title} from './shared';
import type {C} from '../state/useHStaff';

const Top = ({c, label}: {c: C; label: string}) => <ScreenTop title={label} onBack={c.back} />;
const Progress = ({step}: {step: number}) => (
  <View accessibilityLabel={`Booking step ${step} of 5`} style={{flexDirection: 'row', gap: 5, marginBottom: 24}}>
    {[1, 2, 3, 4, 5].map(n => (n <= step
      ? <LinearGradient key={n} {...brandGradient} style={{height: 3, flex: 1, borderRadius: 9}} />
      : <View key={n} style={{height: 3, flex: 1, borderRadius: 9, backgroundColor: colors.border}} />))}
  </View>
);
const Stack = ({children}: {children: ReactNode}) => <View style={{gap: 12, marginTop: 20}}>{children}</View>;
export function StateSymbol({icon, waiting}: {icon: ReactNode; waiting?: boolean}) {
  const body = (
    <BrandGradient radius={41} style={{width: 82, height: 82, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 32, marginBottom: 24}}>{icon}</BrandGradient>
  );
  return waiting ? <Pulse>{body}</Pulse> : body;
}
const Strong = ({children}: {children: ReactNode}) => <Txt w="bold" size={13}>{children}</Txt>;

/* ---------- date / time pickers (Android native dialogs) ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
function DateTimeFields({c}: {c: C}) {
  const {draft} = c;
  const asDate = (d: string, t: string) => {
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    return new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0);
  };
  const box = (label: string, value: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 50, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: colors.background}}>
      <Txt size={14}>{value}</Txt>
    </Pressable>
  );
  return (
    <View style={{flexDirection: 'row', gap: 10}}>
      {box('Service date', draft.date, () =>
        DateTimePickerAndroid.open({mode: 'date', value: asDate(draft.date, draft.time), minimumDate: new Date(new Date().setHours(0, 0, 0, 0)),
          onChange: (e, d) => {if (e.type === 'set' && d) c.setDraft(x => ({...x, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`}));}}))}
      {box('Service time', draft.time, () =>
        DateTimePickerAndroid.open({mode: 'time', is24Hour: true, value: asDate(draft.date, draft.time),
          onChange: (e, d) => {if (e.type === 'set' && d) c.setDraft(x => ({...x, time: `${pad(d.getHours())}:${pad(d.getMinutes())}`}));}}))}
    </View>
  );
}

export function Mode({c}: {c: C}) {
  const {draft, setDraft} = c;
  return (
    <>
      <Top c={c} label={draft.service} /><Progress step={1} />
      <Title heading="Your day. Your timing." description="How do you want to book?" />
      <Stack>
        <Choice title="Instant" detail="Need someone soon? Usually within ~30 minutes." icon={<Zap size={20} color={colors.foreground} />} selected={draft.mode === 'Instant'} onPress={() => setDraft(d => ({...d, mode: 'Instant'}))} />
        <Choice title="Scheduled" detail="Plan ahead. Choose a date and time." icon={<CalendarDays size={20} color={colors.foreground} />} selected={draft.mode === 'Scheduled'} onPress={() => setDraft(d => ({...d, mode: 'Scheduled'}))} />
      </Stack>
      {draft.mode === 'Scheduled' && (<><FieldLabel>Choose a date and time</FieldLabel><DateTimeFields c={c} /></>)}
      <Primary title="Continue" icon={<ArrowRight size={16} color="#fff" />} onPress={() => {
        if (draft.mode === 'Scheduled' && (!draft.date || !draft.time)) {c.setError('Choose your preferred date and time.'); return;}
        c.go('requirements');
      }} />
    </>
  );
}

export function Requirements({c}: {c: C}) {
  const {draft, setDraft} = c;
  const tasks = draft.service === 'Cleaning' ? ['Regular Cleaning', 'Deep Cleaning', 'Kitchen', 'Bathroom'] : [`${draft.service} service`, 'Repair & maintenance', 'Inspection & advice'];
  return (
    <>
      <Top c={c} label={draft.service} /><Progress step={2} />
      <Title heading="A little more about the job." description="Tell us what you need. We’ll find the right people." />
      <FieldLabel>What do you need help with?</FieldLabel>
      <Stack>{tasks.map(t => <Choice key={t} title={t} selected={draft.task === t} onPress={() => setDraft(d => ({...d, task: t}))} />)}</Stack>
      <FieldLabel>How long do you need help?</FieldLabel>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, minHeight: 58, borderWidth: 1, borderColor: colors.border, borderRadius: 18}}>
        <IconButton label="Decrease duration" onPress={() => draft.hours > 1 && setDraft(d => ({...d, hours: d.hours - 1}))} style={{opacity: draft.hours <= 1 ? 0.5 : 1}}><Minus size={16} color={colors.foreground} /></IconButton>
        <Txt w="bold" size={15}>{draft.hours} {draft.hours === 1 ? 'hour' : 'hours'}</Txt>
        <IconButton label="Increase duration" onPress={() => draft.hours < 8 && setDraft(d => ({...d, hours: d.hours + 1}))} style={{opacity: draft.hours >= 8 ? 0.5 : 1}}><Plus size={16} color={colors.foreground} /></IconButton>
      </View>
      <Primary title="Continue" icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('materials')} />
    </>
  );
}

export function Materials({c}: {c: C}) {
  const {draft, setDraft} = c;
  return (
    <>
      <Top c={c} label="Job requirements" /><Progress step={2} />
      <Title heading="Ready for a great start." description="A few details help your professional prepare." />
      <FieldLabel>Who provides the materials?</FieldLabel>
      <Stack>{["I'll provide them", 'Professional should bring tools'].map(t => <Choice key={t} title={t} selected={draft.materials === t} onPress={() => setDraft(d => ({...d, materials: t}))} />)}</Stack>
      <FieldLabel optional>Anything they should know?</FieldLabel>
      <TextArea rows={4} placeholder="Tell us about your space, pets, or any special instructions…" value={draft.notes} onChangeText={v => setDraft(d => ({...d, notes: v}))} />
      <Primary title="Choose location" icon={<MapPin size={16} color="#fff" />} onPress={() => c.go('location')} />
    </>
  );
}

export function Location({c}: {c: C}) {
  const {draft, session} = c;
  const addrs = ['Home · 24, Green Park, Baner, ' + session.city, 'Office · 12, Business Square, ' + session.city];
  return (
    <>
      <Top c={c} label="Service location" /><Progress step={3} />
      <Title heading="Where can we help?" description="Choose where your professional should arrive." />
      <Outline title="Use current location" leading={<Navigation size={16} color={colors.foreground} />} onPress={() => c.setError('We couldn’t access your location. Please choose a saved address or enter it manually.')} />
      <MapMockup address={draft.address} />
      <Stack>
        {addrs.map(a => (
          <Choice key={a} title={a.split(' · ')[0] ?? 'Address'} detail={a.split(' · ')[1] ?? a} icon={<MapPin size={20} color={colors.foreground} />} selected={draft.address === a}
            onPress={() => {c.setDraft(d => ({...d, address: a})); c.setError('');}} />
        ))}
      </Stack>
      <Quiet title="Add a new address" style={{marginTop: 12}} leading={<Plus size={16} color={colors.foreground} />} onPress={() => c.setSheet('add-address')} />
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16}}><Check size={12} color={colors.success} /><Txt size={10} w="semibold" color={colors.success}>H-Staff services are available here</Txt></View>
      <Primary title="Find professionals" icon={<ArrowRight size={16} color="#fff" />} onPress={c.browse} />
    </>
  );
}

export function Professionals({c}: {c: C}) {
  return (
    <>
      <Top c={c} label="Choose your professional" /><Progress step={4} />
      <Title heading="Good people. Great help." description={`${c.allProfessionals.length} verified professionals nearby for ${c.draft.service.toLowerCase()}.`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 16}} contentContainerStyle={{gap: 7}}>
        {['Recommended', 'Nearest', 'Top Rated', 'Price'].map(t => <Chip key={t} title={t} selected={c.sort === t} onPress={() => c.setSort(t)} />)}
      </ScrollView>
      {c.loading ? (
        <View accessibilityLabel="Loading professionals">
          {[0, 1].map(i => <Pulse key={i} duration={1000}><View style={{height: 116, marginVertical: 14, borderRadius: 22, backgroundColor: colors.muted}} /></Pulse>)}
        </View>
      ) : c.sorted.map(p => <ProfessionalCard key={p.id} person={p} service={c.draft.service} onPress={() => {c.setSelected(p.id); c.go('professional-profile');}} />)}
      <Subtle center style={{marginTop: 16}}>You choose who comes to your home.</Subtle>
    </>
  );
}

export function ProfessionalProfile({c}: {c: C}) {
  const p: Professional = c.allProfessionals.find(w => w.id === c.selected) ?? c.person;
  const Review = ({who, text}: {who: string; text: string}) => (
    <View style={{paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border}}>
      <Txt size={12} w="bold">{who}</Txt>
      <Txt size={12} color={colors.mutedForeground} lh={1.8} style={{marginTop: 6}}>{text}</Txt>
    </View>
  );
  return (
    <>
      <Top c={c} label="Meet your professional" />
      <Photo source={photos[p.id]} height={235} radius={25} posY={0.24} alt={p.name} style={{marginBottom: 18}} />
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Txt size={26} w="bold" accessibilityRole="header" style={{flex: 1}}>{p.name}</Txt>
        <StatusChip>Available</StatusChip>
      </View>
      <VerificationBadge />
      <Subtle style={{marginTop: 8}}>{c.draft.service} · {p.distance} km away</Subtle>
      <View style={{flexDirection: 'row', paddingVertical: 18, marginVertical: 19, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border}}>
        {[[`${p.rating} ★`, 'Rating'], [`${p.jobs}`, 'Jobs completed'], [`${p.years} yrs`, 'Experience']].map(([v, l]) => (
          <View key={l} style={{flex: 1, alignItems: 'center'}}><Txt size={20} w="bold">{v}</Txt><Txt size={10} color={colors.mutedForeground}>{l}</Txt></View>
        ))}
      </View>
      <SectionHeading title="A little about me" />
      <Subtle>{p.bio}</Subtle>
      <SectionHeading title="Skills & experience" />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 11}}>{p.skills.map(t => <Tag key={t}>{t}</Tag>)}</View>
      <DetailRow label="On-time arrival" value={p.ontime} />
      <SectionHeading title="Equipment & languages" />
      <Subtle>{p.equipment}</Subtle>
      <Subtle style={{marginTop: 8}}>Speaks {p.languages}</Subtle>
      <SectionHeading title="Kind words from customers" />
      <Review who="Meera K. · ★ 5.0" text="“Punctual, thoughtful and very thorough. Our home felt wonderful afterwards. Would happily book again.”" />
      <Review who="Amit D. · ★ 4.9" text="“Really professional and easy to communicate with. A great experience.”" />
      <DetailRow label="Hourly rate" value={`${money(p.rate)}/hr`} style={{marginTop: 20}} />
      <Primary title={`Request ${p.name.split(' ')[0]}`} icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('summary')} />
    </>
  );
}

export function BookingSummary({c}: {c: C}) {
  const p = c.allProfessionals.find(w => w.id === c.selected) ?? c.person;
  const {draft} = c;
  return (
    <>
      <Top c={c} label="Booking summary" /><Progress step={5} />
      <Title heading="Let’s make it happen." description="Everything upfront. Just the way it should be." />
      <Summary>
        <View style={{flexDirection: 'row', gap: 13, alignItems: 'center'}}>
          <Photo source={photos[p.id]} width={75} height={91} radius={16} posY={0.22} alt={p.name} />
          <View style={{flex: 1}}><Txt size={15} w="bold" style={{marginBottom: 4}}>{p.name}</Txt><VerificationBadge /><Subtle>★ {p.rating} · {p.jobs} jobs</Subtle></View>
        </View>
        <DetailRow style={{marginTop: 12}} label="Service" value={draft.service} />
        <DetailRow label="When" value={draft.mode === 'Instant' ? 'Today · As soon as possible' : `${draft.date} · ${draft.time}`} />
        <DetailRow label="Duration" value={`${draft.hours} ${draft.hours === 1 ? 'hour' : 'hours'}`} />
        <DetailRow label="Task" value={draft.task} />
        <View style={{flexDirection: 'row', gap: 4, marginTop: 12, alignItems: 'flex-start'}}><View style={{marginTop: 4}}><MapPin size={13} color={colors.mutedForeground} /></View><Subtle style={{flex: 1}}>{draft.address}</Subtle></View>
      </Summary>
      <PriceBreakdown rate={p.rate} hours={draft.hours} />
      <Subtle center style={{marginTop: 16}}>{'Your professional will confirm the request.\nYou pay after the service is complete.'}</Subtle>
      <Primary title="Send service request" icon={<Send size={16} color="#fff" />} onPress={c.sendRequest} />
    </>
  );
}

export function Service({c}: {c: C}) {
  const {b, person, isPro, session} = c;
  if (!b) return (<><Top c={c} label="Your booking" /><EmptyState icon={<CalendarDays size={40} color={colors.mutedForeground} />} title="No active booking" description="Find the right person for your next task." action="Find a service" onAction={() => c.navigateTab('Discover')} /></>);
  const first = person.name.split(' ')[0];
  const pending = b.status === 'REQUESTED';
  const failed = canFallback(b.status);
  const total = priceFor(person.rate, b.hours).total;
  const t = elapsedParts(c.elapsed);
  const sym = (icon: ReactNode, waiting?: boolean) => <StateSymbol icon={icon} waiting={waiting} />;
  const active = ['CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED_PENDING_PAYMENT'].includes(b.status);
  return (
    <>
      <Top c={c} label={isPro ? 'Your job' : 'Your booking'} />
      {pending ? (
        <View style={{alignItems: 'stretch'}}>
          {sym(<Send size={33} color={colors.foreground} />, true)}
          <Title center heading={isPro ? 'A new opportunity' : 'Request sent'} description={isPro ? `${session.name} needs help with ${b.service.toLowerCase()}.` : `Waiting for ${first} to respond…`} />
          <Subtle center style={{marginTop: 16}}>{b.service} · {b.hours} {b.hours === 1 ? 'hour' : 'hours'}</Subtle>
          {isPro ? <Primary title="Accept request" onPress={c.acceptPro} /> : <Outline title="Cancel request" onPress={() => c.setSheet('cancel')} />}
        </View>
      ) : failed ? (
        <EmptyState icon={<Clock size={40} color={colors.mutedForeground} />} title={b.status === 'DECLINED' ? `${first} isn’t available` : 'No response yet'} description="Your request hasn’t been accepted. You can choose another professional." action="Find someone else" onAction={() => {c.transition('OPEN'); c.browse();}} />
      ) : b.status === 'CANCELLED' ? (
        <EmptyState icon={<CalendarDays size={40} color={colors.mutedForeground} />} title="Request cancelled" description="No payment was taken. Find help whenever you need it." action="Find a service" onAction={() => c.navigateTab('Discover')} />
      ) : b.status === 'CLOSED' ? (
        <>
          <Title heading="All taken care of." description="Your service is complete. Thanks for choosing H-Staff." />
          {sym(<Check size={33} color={colors.foreground} />)}
        </>
      ) : (
        <>
          {b.status === 'CONFIRMED' && (<>{sym(<Check size={33} color={colors.foreground} />)}<Title center heading="Booking confirmed" description={`${first} is getting ready ${isPro ? 'for the job.' : 'to help.'}`} /></>)}
          {canTrack(b.status) && (
            <>
              <Title heading={b.status === 'ARRIVED' ? 'Your professional has arrived' : isPro ? 'On your way' : 'A little help is on its way'} description={b.status === 'ARRIVED' ? 'Confirm arrival before sharing your Start Code.' : `Arriving in 14 min · ${b.address}`} />
              <MapMockup tracking address={b.address} />
            </>
          )}
          {b.status === 'IN_PROGRESS' && (
            <View style={{alignItems: 'center'}}>
              {sym(<Clock size={33} color={colors.foreground} />)}
              <Eyebrow>Service in progress</Eyebrow>
              <Title center heading={person.name} />
              <Subtle center>{b.service} · {money(person.rate)}/hr</Subtle>
              <Txt size={38} w="bold" style={{marginVertical: 23}}>{t}</Txt>
              <Subtle center>Started at {clock(b.startedAt ?? Date.now())}</Subtle>
            </View>
          )}
          {b.status === 'COMPLETED_PENDING_PAYMENT' && (
            <View style={{alignItems: 'stretch'}}>
              {sym(<LockKeyhole size={33} color={colors.foreground} />)}
              <Title center heading="Complete service" description="Please verify that the service is complete." />
              <Subtle center style={{marginTop: 16}}>{isPro ? 'Ask your customer for the completion code.' : 'Your completion code'}</Subtle>
              {!isPro && <OTPDisplay code={END_OTP} />}
              <Subtle center>{isPro ? 'Only enter the code after completing the work.' : 'Share this code with your professional only when you’re satisfied the work is complete.'}</Subtle>
            </View>
          )}
          {['PAYMENT_PENDING', 'FAILED'].includes(b.status) && (
            <>
              <Title heading="Ready for payment" description="Your service is complete. Your booking is safe." />
              <PriceBreakdown rate={person.rate} hours={b.hours} />
              <Primary title="Continue to payment" icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('payment')} />
            </>
          )}
          {b.status === 'DISPUTED' && (
            <>
              <Title heading="We’re here to help" description="Your issue has been recorded. Your service details are safe." />
              <Primary title="Contact support" onPress={() => c.setSheet('Help & Safety')} />
            </>
          )}
          <Summary>
            <View style={{flexDirection: 'row', gap: 13, alignItems: 'center'}}>
              <Photo source={photos[person.id]} width={75} height={91} radius={16} posY={0.22} alt={person.name} />
              <View style={{flex: 1}}>
                <Txt size={15} w="bold" style={{marginBottom: 4}}>{isPro ? `${session.name} · Customer` : person.name}</Txt>
                <VerificationBadge />
                <Subtle>{b.service} · {b.hours} hr</Subtle>
                <StatusChip style={{marginTop: 4}}>{statusLabel(b.status)}</StatusChip>
              </View>
            </View>
            <DetailRow style={{marginTop: 12}} label={isPro ? 'Expected earnings' : 'Total estimate'} value={money(isPro ? Number(c.setupRate) * b.hours : total)} />
            <Subtle>{b.address}</Subtle>
            <Subtle>Booking {b.id}</Subtle>
          </Summary>
          {b.status === 'CONFIRMED' && <Primary title={isPro ? 'Start journey' : 'Track professional'} icon={<Navigation size={16} color="#fff" />} onPress={() => c.transition('EN_ROUTE')} />}
          {b.status === 'EN_ROUTE' && <Primary title={isPro ? 'I’ve arrived' : 'Confirm professional has arrived'} icon={<Check size={16} color="#fff" />} onPress={() => c.transition('ARRIVED')} />}
          {b.status === 'ARRIVED' && (
            <>
              {!isPro && (<><OTPDisplay code={START_OTP} /><Subtle center>Only share this code after your professional has arrived.</Subtle></>)}
              <Primary title={isPro ? 'Enter Start OTP' : 'Verify Start Code'} icon={<ShieldCheck size={16} color="#fff" />} onPress={() => c.setSheet('start-otp')} />
            </>
          )}
          {b.status === 'IN_PROGRESS' && <Primary title={isPro ? 'Request completion' : 'Review completed service'} icon={<Check size={16} color="#fff" />} onPress={() => c.transition('COMPLETED_PENDING_PAYMENT')} />}
          {b.status === 'COMPLETED_PENDING_PAYMENT' && <Primary title={isPro ? 'Enter End OTP' : 'Verify completion code'} icon={<ShieldCheck size={16} color="#fff" />} onPress={() => c.setSheet('end-otp')} />}
          {active && (
            <View style={{flexDirection: 'row', gap: 10, marginTop: 16}}>
              <Outline full={false} style={{flex: 1}} title="Contact" leading={<MessageCircle size={16} color={colors.foreground} />} onPress={() => c.setSheet('Contact')} />
              <Outline full={false} style={{flex: 1}} title="Details" icon={<Receipt size={16} color={colors.foreground} />} onPress={() => c.setSheet('booking-details')} />
            </View>
          )}
          {['ARRIVED', 'IN_PROGRESS', 'COMPLETED_PENDING_PAYMENT'].includes(b.status) && <Quiet center size={14} style={{marginTop: 20}} title="Report a problem" icon={<HelpCircle size={16} color={colors.foreground} />} onPress={() => c.setSheet('report')} />}
          {['CONFIRMED', 'EN_ROUTE'].includes(b.status) && <Quiet center size={14} style={{marginTop: 20}} title="Cancel booking" onPress={() => c.setSheet('cancel')} />}
        </>
      )}
      {pending && !isPro && <Quiet center size={12} style={{marginTop: 20}} title="Request options" leading={<Settings size={16} color={colors.foreground} />} onPress={() => c.setSheet('request-options')} />}
    </>
  );
}
const elapsedParts = (e: number) => [Math.floor(e / 3600), Math.floor(e / 60) % 60, e % 60].map(n => String(n).padStart(2, '0')).join(':');

export function Payment({c}: {c: C}) {
  const {b, person} = c;
  const hrs = b?.hours ?? 1;
  return (
    <>
      <Top c={c} label="Payment" />
      <Eyebrow>A job well done</Eyebrow>
      <Title heading="The finishing touch." description="Pay securely after your service is complete." />
      <Summary><Txt w="bold" size={16}>{b?.service}</Txt><Subtle>{person.name}</Subtle><Subtle>{b?.id}</Subtle></Summary>
      <PriceBreakdown rate={person.rate} hours={hrs} />
      <FieldLabel>Payment method</FieldLabel>
      <Stack>{['UPI', 'Cards', 'Net Banking'].map(t => <Choice key={t} title={t} icon={t === 'UPI' ? <Zap size={20} color={colors.foreground} /> : <CreditCard size={20} color={colors.foreground} />} selected={c.payment === t} onPress={() => c.setPayment(t)} />)}</Stack>
      <Primary title={c.loading ? 'Processing…' : `Pay ${money(priceFor(person.rate, hrs).total)}`} disabled={c.loading} icon={<LockKeyhole size={16} color="#fff" />} onPress={() => c.simulatedPayment()} />
      <Subtle center style={{marginTop: 12}}>Prototype payment · No money will be charged</Subtle>
      <Quiet center size={12} style={{marginTop: 16}} title="Try payment failure" onPress={() => c.simulatedPayment(true)} />
    </>
  );
}

export function Rating({c}: {c: C}) {
  const {isPro, rating} = c;
  return (
    <>
      <Top c={c} label={isPro ? 'Rate your customer' : 'Your experience'} />
      <View style={{alignItems: 'stretch'}}>
        <StateSymbol icon={<Check size={33} color={colors.foreground} />} />
        <Eyebrow center>Payment complete</Eyebrow>
        <Title center heading="How did it go?" description={`Your feedback helps ${isPro ? 'customers' : 'good professionals'} grow.`} />
        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 5, marginVertical: 20}}>
          {[1, 2, 3, 4, 5].map(n => (
            <IconButton key={n} label={`Rate ${n} stars`} onPress={() => c.setRating(n)} style={{width: 44}}>
              <Star size={29} color={colors.foreground} fill={n <= rating ? colors.coral : 'none'} />
            </IconButton>
          ))}
        </View>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7}}>
          {['Punctual', 'Professional', 'Polite', 'Skilled', 'Good Quality'].map(t => <Chip key={t} title={t} selected={c.tags.includes(t)} onPress={() => c.setTags(v => (v.includes(t) ? v.filter(x => x !== t) : [...v, t]))} />)}
        </View>
      </View>
      <FieldLabel optional>Anything else?</FieldLabel>
      <TextArea rows={4} accessibilityLabel="Your review" placeholder="Share a little about your experience…" value={c.review} onChangeText={c.setReview} />
      <Primary title="Submit review" icon={<ArrowRight size={16} color="#fff" />} onPress={c.finishReview} />
    </>
  );
}

export function Complete({c}: {c: C}) {
  const {b, person, isPro, session} = c;
  return (
    <>
      <Top c={c} label="All done" />
      <View style={{alignItems: 'stretch'}}>
        <StateSymbol icon={<CheckCircle2 size={33} color={colors.foreground} />} />
        <Eyebrow center>One less thing on your list</Eyebrow>
        <Title center heading={isPro ? 'Great work today.' : 'Home feels better.'} description="Your service is complete. Thank you for being part of H-Staff." />
        <Summary>
          <Txt w="bold" size={16}>{b?.service}</Txt>
          <Subtle>{isPro ? session.name : person.name}</Subtle>
          <Subtle>{b?.id}</Subtle>
          <DetailRow label={isPro ? 'Your earnings' : 'Amount paid'} value={money(isPro ? Number(c.setupRate) * (b?.hours ?? 1) : priceFor(person.rate, b?.hours ?? 1).total)} />
          {!!b?.rating && <Subtle>Your rating: {b.rating} ★</Subtle>}
        </Summary>
        <Primary title={isPro ? 'View earnings' : 'View my bookings'} icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.navigateTab(isPro ? 'Earnings' : 'Bookings')} />
        {isPro && <Quiet center style={{marginTop: 16}} title="Rate your customer" icon={<Star size={16} color={colors.foreground} />} onPress={() => {c.setRating(0); c.go('rating');}} />}
        <Quiet center style={{marginTop: 16}} title="Back to home" onPress={() => c.navigateTab('Home')} />
      </View>
    </>
  );
}
export {WrapChip, Strong};
