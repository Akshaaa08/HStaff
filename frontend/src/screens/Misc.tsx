import React, {useEffect, useState} from 'react';
import {Pressable, TextInput, View, useWindowDimensions} from 'react-native';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {ArrowRight, Check, CheckCircle2, FileUp, Navigation, Phone, ShieldCheck} from 'lucide-react-native';
import {canTrack, money, services, visibleOtp, AUTH_OTP} from '../lib/domain';
import {photos} from '../lib/assets';
import {colors} from '../theme';
import {DetailRow, EmptyState, HStaffLogo, ScreenTop, SectionHeading, StatusChip, Summary} from '../components/primitives';
import {Bell} from 'lucide-react-native';
import {BrandGradient, Eyebrow, Field, FieldLabel, Outline, PillField, Photo, Primary, Quiet, SelectField, Subtle, TextArea, Txt, bareInput} from '../components/ui';
import {Choice} from '../components/primitives';
import {StateSymbol} from './Flow';
import {Header, Page, Title} from './shared';
import {BriefcaseBusiness, Home} from 'lucide-react-native';
import type {C} from '../state/useHStaff';

const Top = ({c, label}: {c: C; label: string}) => <ScreenTop title={label} onBack={c.back} />;

export function Notifications({c}: {c: C}) {
  const {b, person} = c;
  const [apiNotifs, setApiNotifs] = useState<any[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const {api} = await import('../lib/api');
        const list = await api.notifications.list();
        if (alive && Array.isArray(list)) setApiNotifs(list);
      } catch { /* use local fallback */ }
      if (alive) setFetched(true);
    })();
    return () => {alive = false;};
  }, []);

  /* Backend notifications mapped to display rows */
  const apiRows = apiNotifs.map(n => ({
    icon: CheckCircle2,
    text: n.body ?? n.message ?? 'Notification',
    time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}) : 'Just now',
  }));

  /* Fallback rows from local booking state */
  const localRows = b ? [
    {icon: CheckCircle2, text: ['REQUESTED', 'DECLINED', 'EXPIRED'].includes(b.status) ? `Your request to ${person.name} was sent.` : `${person.name} accepted your request.`, time: 'Just now'},
    {icon: Navigation, text: canTrack(b.status) ? `${person.name.split(' ')[0]} is ${b.status === 'ARRIVED' ? 'at your location' : 'on the way'}.` : 'Your booking details are ready.', time: 'Booking'},
    {icon: ShieldCheck, text: visibleOtp(b.status) ? 'Your service verification code is ready.' : 'Your service uses separate arrival and completion codes.', time: 'Safety'},
  ] : [];

  const rows = apiRows.length > 0 ? apiRows : localRows;

  return (
    <>
      <Top c={c} label="Notifications" />
      <Title heading="You're in the loop." />
      <SectionHeading title="Booking updates" />
      {rows.length > 0 ? rows.map((n, i) => (
        <View key={i} style={{flexDirection: 'row', gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderColor: colors.border}}>
          <View style={{width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? colors.peach : colors.muted}}><n.icon size={20} color={colors.foreground} /></View>
          <View style={{flex: 1}}>
            <Txt size={13} w="medium" lh={1.6}>{n.text}</Txt>
            <Txt size={10} color={colors.mutedForeground}>{n.time}</Txt>
          </View>
        </View>
      )) : <EmptyState icon={<Bell size={40} color={colors.mutedForeground} />} title="All quiet for now" description="Booking, payment and safety updates will appear here." />}
    </>
  );
}

export function Welcome({c}: {c: C}) {
  const {width} = useWindowDimensions();
  const w = (width - 48) * 0.53;
  return (
    <>
      <Top c={c} label="Welcome to H-Staff" />
      <HStaffLogo />
      <BrandGradient radius={28} style={{height: 285, marginTop: 20, marginBottom: 30, overflow: 'hidden'}}>
        <View style={{position: 'absolute', left: 0, bottom: 0}}><Photo source={photos.sunita} width={w} height={240} radiusStyle={{borderTopLeftRadius: 80, borderTopRightRadius: 80}} alt="Sunita, a cleaning professional" /></View>
        <View style={{position: 'absolute', right: 0, bottom: 0}}><Photo source={photos.rahul} width={w} height={215} radiusStyle={{borderTopLeftRadius: 80, borderTopRightRadius: 80}} alt="Rahul, a service professional" /></View>
      </BrandGradient>
      <Eyebrow>Home. Humans. Help.</Eyebrow>
      <Title heading="Good people. A little closer." description="Find the right person for the job, when you need them." />
      <Primary title="Get started" icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('role')} />
      <Quiet center style={{marginTop: 16}} title="Explore H-Staff" onPress={() => c.navigateTab('Home')} />
    </>
  );
}

export function Role({c}: {c: C}) {
  return (
    <>
      <Top c={c} label="Get started" />
      <Title heading="What brings you here?" description="A helping hand, or an opportunity to help." />
      <View style={{gap: 12, marginTop: 20}}>
        <Choice title="Hire a professional" detail="Trusted people for everyday tasks and repairs." icon={<Home size={20} color={colors.foreground} />} selected={!c.isPro} onPress={() => c.patch({role: 'customer'})} />
        <Choice title="Work as a professional" detail="Put your skills to work. Choose your own jobs." icon={<BriefcaseBusiness size={20} color={colors.foreground} />} selected={c.isPro} onPress={() => c.patch({role: 'professional'})} />
      </View>
      <Primary title="Continue" icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('auth')} />
    </>
  );
}

export function MobileAuth({c}: {c: C}) {
  return (
    <>
      <Top c={c} label="Your mobile number" />
      <StateSymbol icon={<Phone size={33} color={colors.foreground} />} />
      <Title heading="Let’s stay connected." description="We’ll send a code to verify your mobile number." />
      <FieldLabel>Mobile number</FieldLabel>
      <PillField left={<Txt w="bold">+91</Txt>}>
        <TextInput accessibilityLabel="Mobile number" keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile number" placeholderTextColor={colors.mutedForeground} value={c.authPhone} onChangeText={v => c.setAuthPhone(v.replace(/\D/g, ''))} style={bareInput} />
      </PillField>
      <Primary title="Send verification code" icon={<ArrowRight size={16} color="#fff" />} onPress={c.authSubmit} />
      <Subtle center style={{marginTop: 16}}>Prototype sign-in. No SMS will be sent.</Subtle>
    </>
  );
}

export function MobileOtp({c}: {c: C}) {
  return (
    <>
      <Top c={c} label="Verify your mobile" />
      <Title heading="A quick check." description="Enter the six-digit code to continue." />
      <FieldLabel>Verification code</FieldLabel>
      <Field accessibilityLabel="Mobile verification code" keyboardType="number-pad" maxLength={6} value={c.otp} onChangeText={v => c.setOtp(v.replace(/\D/g, ''))} />
      <Subtle style={{marginTop: 12}}>Demo code: {AUTH_OTP}</Subtle>
      <Primary title="Verify & continue" icon={<ShieldCheck size={16} color="#fff" />} onPress={c.authenticate} />
      <Quiet center style={{marginTop: 16}} title="Resend code" onPress={() => c.setNotice('A new demo code is ready: 123456.')} />
    </>
  );
}

export function Setup({c}: {c: C}) {
  const [doc, setDoc] = useState('');
  const [experience, setExperience] = useState('8');
  const pickDoc = async () => {
    try {const [f] = await pick({type: [types.images, types.pdf]}); setDoc(f?.name ?? 'Document selected');}
    catch (e) {if (!isErrorWithCode(e) || e.code !== errorCodes.OPERATION_CANCELED) c.setError('Could not open the file picker.');}
  };
  return (
    <>
      <Top c={c} label="Professional setup" />
      <Title heading="Let your skills shine." description="Tell customers a little about the person behind the work." />
      <FieldLabel>Full name</FieldLabel>
      <Field accessibilityLabel="Professional name" value={c.setupName} onChangeText={c.setSetupName} />
      <FieldLabel>Your service category</FieldLabel>
      <SelectField label="Professional category" value={c.setupSkill} options={services.map(s => s.name)} onChange={c.setSetupSkill} />
      <View style={{flexDirection: 'row', gap: 10}}>
        <View style={{flex: 1}}><FieldLabel>Hourly rate (₹)</FieldLabel><Field accessibilityLabel="Hourly rate" keyboardType="number-pad" value={c.setupRate} onChangeText={v => c.setSetupRate(v.replace(/\D/g, ''))} /></View>
        <View style={{flex: 1}}><FieldLabel>Experience (years)</FieldLabel><Field accessibilityLabel="Years experience" keyboardType="number-pad" value={experience} onChangeText={v => setExperience(v.replace(/\D/g, ''))} /></View>
      </View>
      <FieldLabel>Tools & equipment</FieldLabel>
      <TextArea rows={2} accessibilityLabel="Tools and equipment" placeholder="Tell customers what you bring" defaultValue="Cleaning kit, brushes and supplies" />
      <FieldLabel>Verification documents</FieldLabel>
      <Pressable accessibilityRole="button" accessibilityLabel="Upload identity document" onPress={pickDoc} style={{flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 50, padding: 14}}>
        <FileUp size={18} color={colors.mutedForeground} />
        <Txt size={14} color={doc ? colors.foreground : colors.mutedForeground} numberOfLines={1} style={{flex: 1}}>{doc || 'Choose a file (image or PDF)'}</Txt>
      </Pressable>
      <Subtle style={{marginTop: 8}}>Demo verification only. Please do not upload private documents.</Subtle>
      <Primary title="Complete demo setup" icon={<Check size={16} color="#fff" />} onPress={() => {
        c.completeSetup(c.setupName, c.setupSkill, c.setupRate, experience);
      }} />
    </>
  );
}

export function JobDetails({c}: {c: C}) {
  const {b, session} = c;
  return (
    <>
      <Top c={c} label="Job request" />
      <Title heading="A home that needs your help." />
      <StatusChip>New request · 2.4 km away</StatusChip>
      <Summary>
        <Txt size={20} w="bold">{b?.service ?? 'Cleaning'}</Txt>
        <Subtle>{session.name} · Customer</Subtle>
        <DetailRow label="When" value="Today · Now" />
        <DetailRow label="Duration" value={`${b?.hours ?? 2} hours`} />
        <DetailRow label="Task" value={b?.task ?? 'Regular Cleaning'} />
        <DetailRow label="Materials" value={b?.materials ?? ''} />
        <Subtle style={{marginTop: 12}}>{b?.address}</Subtle>
      </Summary>
      <SectionHeading title="A note from the customer" />
      <Subtle>{b?.notes || 'No special instructions.'}</Subtle>
      <DetailRow total style={{marginTop: 24}} label="Expected earnings" value={money(Number(c.setupRate) * (b?.hours ?? 2))} />
      <Primary title="Accept request" icon={<Check size={16} color="#fff" />} onPress={c.acceptPro} />
      <Outline title="Decline" onPress={() => {c.transition('DECLINED'); c.navigateTab('Home');}} />
    </>
  );
}

export function Earnings({c}: {c: C}) {
  const {session} = c;
  const rows: [string, number][] = [['Cleaning', 500], ['Plumbing', 750], ['Cleaning', 500]];
  return (
    <>
      <Header c={c} />
      <Page>
        <Title heading="Hard work. Well earned." description="Your earnings, clear and simple." />
        <BrandGradient radius={24} style={{padding: 24, marginTop: 24}}>
          <Eyebrow>This week</Eyebrow>
          <Txt size={36} w="extrabold" style={{marginTop: 6}}>{money(6850 + session.past.reduce((sum, item) => sum + Number(c.setupRate) * item.hours, 0))}</Txt>
          <Subtle>Your time and talent, recognised.</Subtle>
        </BrandGradient>
        <View style={{flexDirection: 'row', paddingVertical: 18, marginVertical: 19, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border}}>
          {[[`${24 + session.past.length}`, 'Jobs completed'], ['32.5', 'Active hours'], ['4.9 ★', 'Average rating']].map(([v, l]) => (
            <View key={l} style={{flex: 1, alignItems: 'center'}}><Txt size={20} w="bold">{v}</Txt><Txt size={10} color={colors.mutedForeground}>{l}</Txt></View>
          ))}
        </View>
        <SectionHeading title="Recent jobs" />
        {session.past.map(item => <DetailRow key={item.id} label={`${item.service} · ${item.id}`} value={money(Number(c.setupRate) * item.hours)} />)}
        {rows.map(([name, value], i) => (
          <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 17, borderBottomWidth: 1, borderColor: colors.border, gap: 12}}>
            <View><Txt size={14} w="bold">{name}</Txt><Subtle>{['Today', 'Yesterday', '07 Oct'][i]} · Completed</Subtle></View>
            <Txt size={14} w="bold">{money(value)}</Txt>
          </View>
        ))}
        <Subtle center style={{marginTop: 24}}>Illustrative earnings for the H-Staff prototype.</Subtle>
      </Page>
    </>
  );
}
