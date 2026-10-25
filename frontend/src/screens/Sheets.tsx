import React, {useState, type ReactNode} from 'react';
import {View} from 'react-native';
import {Check, CreditCard, Home, Phone, Send, ShieldCheck, Star} from 'lucide-react-native';
import {colors} from '../theme';
import {BottomSheet, Choice, EmptyState, PriceBreakdown, DetailRow, Summary} from '../components/primitives';
import {ComplaintForm} from '../components/extras';
import {Destructive, ErrorText, Eyebrow, Field, FieldLabel, IconButton, Outline, Primary, SelectField, SuccessText, Subtle, TextArea, Txt, BrandGradient} from '../components/ui';
import {START_OTP, END_OTP, cities} from '../lib/domain';
import type {C} from '../state/useHStaff';

const titles: Record<string, string> = {
  'start-otp': 'Verify Start Code', 'end-otp': 'Verify completion', cancel: 'Cancel booking?', location: 'Your neighbourhood', 'add-address': 'Add address',
  'booking-details': 'Booking details', 'request-options': 'Demo response', report: 'Report a problem', complaint: 'Raise a complaint',
};

function ReportBody({c}: {c: C}) {
  const [type, setType] = useState('Service quality');
  const [detail, setDetail] = useState('');
  return (
    <>
      <Subtle>Tell us what went wrong. Your safety matters.</Subtle>
      <View style={{marginTop: 16}}><SelectField label="Issue type" value={type} onChange={setType} options={['Service quality', 'Safety concern', 'Professional not arrived', 'Payment issue']} /></View>
      <TextArea rows={3} accessibilityLabel="Issue details" placeholder="Describe the issue…" value={detail} onChangeText={setDetail} style={{marginTop: 12}} />
      <Primary title="Submit report" icon={<ShieldCheck size={16} color="#fff" />} onPress={() => {c.submitComplaint(type, detail); c.setSheet(null);}} />
    </>
  );
}

function TimesheetDisputeBody({c}: {c: C}) {
  const [reason, setReason] = useState('');
  return (
    <>
      <Subtle>Describe what looks incorrect. You can dispute a timesheet within 24 hours of submission.</Subtle>
      <TextArea rows={4} accessibilityLabel="Timesheet dispute reason" placeholder="Explain the issue…" value={reason} onChangeText={setReason} style={{marginTop: 12}} />
      <Primary title="Submit dispute" disabled={!reason.trim()} icon={<ShieldCheck size={16} color="#fff" />} onPress={() => c.submitTimesheetDispute(reason.trim())} />
    </>
  );
}

export function SheetHost({c}: {c: C}) {
  const {sheet, b, person, session, isPro} = c;
  if (!sheet) return null;
  const mapIcon = <Home size={20} color={colors.foreground} />;
  let body: ReactNode = null;
  switch (sheet) {
    case 'location':
      body = (<><Subtle style={{marginBottom: 16}}>Choose your city</Subtle><View style={{gap: 12}}>{cities.map(city => (
        <Choice key={city} title={city} selected={session.city === city} onPress={() => {c.patch({city}); c.setDraft(d => ({...d, address: 'Home · 24, Green Park, Baner, ' + city})); c.setSheet(null);}} />))}</View></>);
      break;
    case 'add-address': case 'Saved Addresses':
      body = (<>
        <Choice title="Home" detail={'24, Green Park, Baner, ' + session.city} icon={mapIcon} selected onPress={() => {c.setDraft(d => ({...d, address: 'Home · 24, Green Park, Baner, ' + session.city})); c.setSheet(null);}} />
        <FieldLabel>New address</FieldLabel>
        <TextArea rows={3} accessibilityLabel="New service address" placeholder="Flat, building, street and city" value={c.address} onChangeText={c.setAddress} />
        <Primary title="Save address" icon={<Check size={16} color="#fff" />} onPress={() => {
          if (c.address.trim().length < 10) {c.setError('Please add a complete address.'); return;}
          c.setDraft(d => ({...d, address: c.address.trim()})); c.setSheet(null);
        }} />
      </>);
      break;
    case 'start-otp': case 'end-otp': {
      const start = sheet === 'start-otp';
      body = (<>
        <Subtle>{start ? 'Verify arrival before the service starts.' : 'Verify that the service is complete.'}</Subtle>
        {!isPro && c.assignmentId ? (
          <Primary title="Send Completion Code by SMS" icon={<ShieldCheck size={16} color="#fff" />} onPress={() => c.sendJobOtp(start ? 'start' : 'end')} />
        ) : <>
          <FieldLabel>{start ? 'Start' : 'Completion'} code</FieldLabel>
          <Field accessibilityLabel={start ? 'Start OTP' : 'End OTP'} keyboardType="number-pad" maxLength={6} value={c.otp} onChangeText={v => c.setOtp(v.replace(/\D/g, ''))} />
          {!c.assignmentId && <Subtle style={{marginTop: 12}}>Demo {start ? 'Start' : 'End'} code: {start ? START_OTP : END_OTP}</Subtle>}
          <Primary title="Verify code" icon={<ShieldCheck size={16} color="#fff" />} onPress={c.verifyOtp} />
        </>}
      </>);
      break;
    }
    case 'timesheet-dispute':
      body = <TimesheetDisputeBody c={c} />;
      break;
    case 'cancel':
      body = (<><Subtle>Cancel this booking? This prototype has no cancellation charge. No payment has been taken.</Subtle>
        <Destructive title="Yes, cancel booking" onPress={() => {c.transition('CANCELLED'); c.setSheet(null);}} />
        <Outline title="Keep my booking" mt={12} onPress={() => c.setSheet(null)} /></>);
      break;
    case 'request-options':
      body = (<><Subtle>Choose the response for this simulated request.</Subtle><View style={{gap: 12, marginTop: 20}}>{['Accept', 'Decline', 'Timeout'].map(t => (
        <Choice key={t} title={t} selected={c.outcome === t} onPress={() => {c.setOutcome(t); c.setSheet(null);}} />))}</View></>);
      break;
    case 'booking-details':
      body = (<><Eyebrow>{b?.id}</Eyebrow><Txt size={20} w="bold" style={{marginTop: 8}}>{b?.service}</Txt><Subtle>{person.name}</Subtle>
        <DetailRow label="Requirements" value={b?.task ?? ''} /><DetailRow label="Materials" value={b?.materials ?? ''} />
        <Subtle>{b?.address}</Subtle><Subtle style={{marginTop: 12}}>{b?.notes || 'No special instructions.'}</Subtle>
        <PriceBreakdown rate={person.rate} hours={b?.hours ?? 1} /></>);
      break;
    case 'Contact':
      body = (<>
        <Subtle>Your conversation stays on H-Staff. Private numbers aren’t shared.</Subtle>
        <Outline title="Masked call" leading={<Phone size={16} color={colors.foreground} />} onPress={() => c.setNotice('Demo masked call connected. No real call has been placed.')} />
        <View style={{backgroundColor: colors.muted, padding: 13, borderRadius: 17, marginVertical: 12, marginRight: 30}}><Txt size={13} lh={1.6}>Hi! I have your booking details. You can message me here if there’s anything else I should know.</Txt></View>
        {c.messages.map((m, i) => <View key={i} style={{backgroundColor: colors.peach, padding: 13, borderRadius: 17, marginVertical: 12, marginLeft: 30}}><Txt size={13} lh={1.6}>{m}</Txt></View>)}
        <View style={{flexDirection: 'row', gap: 8, marginTop: 16, alignItems: 'center'}}>
          <Field accessibilityLabel="Message to professional" placeholder="Write a message…" value={c.chat} onChangeText={c.setChat} style={{flex: 1, minWidth: 0}} />
          <IconButton label="Send message" style={{backgroundColor: colors.primary}} onPress={() => {if (c.chat.trim()) {c.setMessages(v => [...v, c.chat.trim()]); c.setChat('');}}}><Send size={16} color="#fff" /></IconButton>
        </View>
      </>);
      break;
    case 'report': body = <ReportBody c={c} />; break;
    case 'Personal Information':
      body = (<><FieldLabel>Name</FieldLabel><Field accessibilityLabel="Your name" value={session.name} onChangeText={v => c.patch({name: v})} />
        <Primary title="Save changes" icon={<Check size={16} color="#fff" />} onPress={() => c.setSheet(null)} /></>);
      break;
    case 'Payment Methods':
      body = (<><Subtle>Choose your preferred payment category. No private card or bank details are stored.</Subtle><View style={{gap: 12, marginTop: 20}}>{['UPI', 'Cards', 'Net Banking'].map(t => (
        <Choice key={t} title={t} icon={<CreditCard size={20} color={colors.foreground} />} selected={c.payment === t} onPress={() => c.setPayment(t)} />))}</View></>);
      break;
    case 'Reviews':
      body = session.past.length ? (<>{session.past.map(item => (
        <View key={item.id} style={{paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border}}><Txt size={12} w="bold">{item.service} · {item.rating ?? 5} ★</Txt>
          <Txt size={12} color={colors.mutedForeground} lh={1.8} style={{marginTop: 6}}>{item.review || 'Thanks for a job well done.'}</Txt></View>))}</>)
        : <EmptyState icon={<Star size={40} color={colors.mutedForeground} />} title="No reviews yet" description="Your reviews will appear after completed services." />;
      break;
    case 'Language':
      body = (
        <View style={{gap: 10}}>
          {(() => {
            const {SUPPORTED_LANGUAGES} = require('../lib/translator');
            return SUPPORTED_LANGUAGES.map((lang: any) => (
              <Choice
                key={lang.code}
                title={`${lang.nativeName} (${lang.label})`}
                selected={c.language === lang.code}
                onPress={() => {
                  c.setLanguage(lang.code);
                  c.setNotice(`${lang.label} selected.`);
                  c.closeSheet();
                }}
              />
            ));
          })()}
        </View>
      );
      break;
    case 'Help & Safety':
      body = (<><Subtle>Keep conversations on H-Staff. Only share the Start Code after arrival and the End Code when the work is complete.</Subtle>
        <Summary><ShieldCheck size={24} color={colors.foreground} /><Txt size={16} w="semibold" style={{marginTop: 12}}>Need help with a booking?</Txt>
          <Subtle style={{marginTop: 8}}>Our support team can review service and payment concerns.</Subtle><Primary title="Report an issue" onPress={() => c.setSheet('report')} /></Summary>
        <Subtle style={{marginTop: 16}}>In an immediate emergency, contact local emergency services. H-Staff is not an emergency response service.</Subtle></>);
      break;
    case 'complaint':
      body = <ComplaintForm persona={isPro ? 'professional' : 'customer'} onDone={id => {c.setSheet(null); c.setNotice(`Complaint ${id} received. We’ll update you within 24 hours.`);}} />;
      break;
    default: body = <Subtle>Your account preferences are saved.</Subtle>;
  }
  return (
    <BottomSheet title={sheet === 'end-otp' && !isPro && c.assignmentId ? 'Send completion code' : titles[sheet] ?? sheet} onClose={c.closeSheet}>
      {body}
      {!!c.error && <ErrorText>{c.error}</ErrorText>}
      {!!c.notice && <SuccessText>{c.notice}</SuccessText>}
    </BottomSheet>
  );
}
export {BrandGradient};
