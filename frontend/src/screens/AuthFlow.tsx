import React, {useEffect, useState, type ReactNode} from 'react';
import {BackHandler, PermissionsAndroid, Platform, Pressable, TextInput, View, Image} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {
  ArrowRight, BriefcaseBusiness, Camera, Check, FileUp, Home, LockKeyhole, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Star, User, Wallet,
} from 'lucide-react-native';
import {AUTH_OTP, professionals, services} from '../lib/domain';
import {clientSignupError, loginError, phoneOk, proSignupError, type Persona} from '../lib/auth';
import {photos, serviceIcons} from '../lib/assets';
import {colors, shadows, text} from '../theme';
import {Aurora, Blob, Floating, Marquee} from '../components/motion';
import {Choice, HStaffLogo, ScreenTop, Verified} from '../components/primitives';
import {
  CheckRow, ErrorText, FieldLabel, Field, GradientText, Outline, PillField, Primary, Quiet, ScreenTitle, Subtle, TextArea, Txt, bareInput, Eyebrow,
} from '../components/ui';

export type AuthResult = {role: Persona; name: string; phone: string; email: string; city?: string};
type View_ = 'landing' | 'login' | 'signup-customer' | 'signup-professional';

const TERMS: Record<Persona, string[]> = {
  customer: ['Treat professionals with respect and provide a safe workplace.', 'Pay the price shown — professional charge plus the H-Staff service fee.', 'Share Start and End codes only when the professional is with you.', 'Cancellations after a professional is en route may carry a fee.', 'Contact professionals only through H-Staff calls and messages.'],
  professional: ['You are 18+ and all identity details and documents are genuine.', 'H-Staff may verify your photo and documents before you receive jobs.', 'Arrive on time, verify the Start code and finish with the End code.', 'Earnings are paid to your UPI ID after each completed job.', 'Never ask customers for payment outside H-Staff or share their details.'],
};

function AuthField({label, icon, children, right}: {label: string; icon: ReactNode; children: ReactNode; right?: ReactNode}) {
  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <PillField left={icon} right={right}>{children}</PillField>
    </>
  );
}
const ic = (I: any) => <I size={19} color={colors.mutedForeground} />;

function PhoneVerify({phone, setPhone, verified, setVerified}: {phone: string; setPhone: (v: string) => void; verified: boolean; setVerified: (v: boolean) => void}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  return (
    <>
      <AuthField
        label="Mobile number"
        icon={<Txt w="bold">+91</Txt>}
        right={
          verified ? (
            <Verified icon={<Check size={12} color={colors.success} />}>Verified</Verified>
          ) : (
            <Quiet title={sent ? 'Resend' : 'Send OTP'} style={{minHeight: 40}} onPress={() => {
              if (!phoneOk(phone)) return setErr('Enter a valid 10-digit mobile number.');
              setErr(''); setSent(true);
            }} />
          )
        }>
        <TextInput accessibilityLabel="Mobile number" keyboardType="number-pad" placeholder="98765 43210" placeholderTextColor={colors.mutedForeground} maxLength={10} value={phone} editable={!verified} style={bareInput}
          onChangeText={v => {setPhone(v.replace(/\D/g, '')); setSent(false);}} />
      </AuthField>
      {sent && !verified && (
        <View style={{flexDirection: 'row', gap: 8, marginTop: 10}}>
          <Field accessibilityLabel="Mobile OTP" keyboardType="number-pad" maxLength={6} placeholder="6-digit code" value={code} onChangeText={v => setCode(v.replace(/\D/g, ''))} style={{flex: 1}} />
          <Primary title="Verify" full={false} onPress={() => {
            if (code === AUTH_OTP) {setVerified(true); setErr('');} else setErr('That code doesn’t match.');
          }} />
        </View>
      )}
      {sent && !verified && <Subtle style={{marginTop: 8}}>Demo code: {AUTH_OTP}</Subtle>}
      {!!err && <ErrorText>{err}</ErrorText>}
    </>
  );
}

function Terms({persona, accepted, setAccepted}: {persona: Persona; accepted: boolean; setAccepted: (v: boolean) => void}) {
  const [open, setOpen] = useState(false);
  const label = persona === 'customer' ? 'Customer' : 'Professional';
  return (
    <View style={{marginTop: 22, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.muted}}>
      <Quiet title={`${label} Terms & Conditions`} onPress={() => setOpen(!open)} icon={<ArrowRight size={16} color={colors.foreground} />} />
      {open && (
        <View style={{marginTop: 8, marginLeft: 4}}>
          {TERMS[persona].map((t, i) => (
            <Txt key={t} size={12} lh={1.7} color={colors.mutedForeground}>{i + 1}. {t}</Txt>
          ))}
        </View>
      )}
      <CheckRow checked={accepted} onChange={setAccepted}>
        <Txt size={12} lh={1.6}>I have read and agree to the {label} Terms & Conditions and Privacy Policy.</Txt>
      </CheckRow>
    </View>
  );
}

function Glass({children, style}: {children: ReactNode; style?: any}) {
  return <View style={[{flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 100, backgroundColor: colors.glass}, style]}>{children}</View>;
}

function Landing({go}: {go: (v: View_) => void}) {
  const titleStyle = text(36, 'extrabold', colors.foreground, 1.1);
  const tstyle = {...titleStyle, letterSpacing: -0.72};
  const doubled = [...services, ...services];
  return (
    <Aurora colorsList={[colors.peach, colors.softPink, colors.lavender, colors.yellow]} duration={12000} style={{minHeight: '100%'}}>
      <Floating duration={9000} style={{position: 'absolute', top: -100, right: -110}}><Blob size={240} color={colors.pink} /></Floating>
      <Floating duration={9000} delay={4000} style={{position: 'absolute', bottom: 60, left: -120}}><Blob size={200} color={colors.coral} /></Floating>
      <View style={{paddingTop: 8, paddingHorizontal: 24, paddingBottom: 28}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <HStaffLogo />
          <Quiet title="Log in" onPress={() => go('login')} />
        </View>
        <Glass style={{alignSelf: 'flex-start', marginTop: 18, paddingVertical: 7}}>
          <Sparkles size={13} color={colors.pink} />
          <Txt size={11} w="semibold">Verified help across Maharashtra</Txt>
        </Glass>
        <View style={{marginTop: 16, marginBottom: 10}}>
          <Txt style={tstyle} accessibilityRole="header">Good people.</Txt>
          <GradientText size={36} style={tstyle}>Great help.</GradientText>
          <Txt style={tstyle}>Right next door.</Txt>
        </View>
        <Subtle style={{maxWidth: 290}}>Book trusted local professionals in minutes — or earn on your own terms.</Subtle>

        <View style={{height: 220, marginTop: 22, marginBottom: 10}}>
          {[0, 1].map(i => (
            <View key={i} accessibilityLabel={i === 0 ? 'Sunita, a verified cleaning professional' : 'Rahul, a verified electrician'}
              style={[{position: 'absolute', width: 150, height: 190, borderRadius: 28, borderWidth: 4, borderColor: colors.background, backgroundColor: colors.background, overflow: 'hidden'}, shadows.dock,
                i === 0 ? {left: 10, top: 20, transform: [{rotate: '-6deg'}]} : {right: 10, top: 0, transform: [{rotate: '5deg'}]}]}>
              <Image source={photos[professionals[i].id]} style={{width: 142, height: 182}} resizeMode="cover" />
            </View>
          ))}
          <Floating style={{position: 'absolute', left: 0, bottom: 10}}><Glass style={shadows.card}><Star size={13} color={colors.foreground} /><Txt size={11} w="bold">4.9 rated</Txt></Glass></Floating>
          <Floating delay={2000} style={{position: 'absolute', right: 0, bottom: 40}}><Glass style={shadows.card}><ShieldCheck size={13} color={colors.foreground} /><Txt size={11} w="bold">ID verified</Txt></Glass></Floating>
          <Floating delay={3000} style={{position: 'absolute', left: 90, top: -6}}><Glass style={shadows.card}><Txt size={11} w="bold">₹250/hr · no hidden fees</Txt></Glass></Floating>
        </View>

        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Marquee>
            {doubled.map((s, i) => {
              const Icon = serviceIcons[s.name];
              return (
                <Glass key={i} style={{marginRight: 8, flexShrink: 0}}>
                  <Icon size={14} color={colors.foreground} />
                  <Txt size={12} w="semibold">{s.name}</Txt>
                </Glass>
              );
            })}
          </Marquee>
        </View>

        <View style={{marginTop: 6}}>
          <Primary title="Sign up to hire help" mt={12} leading={<Home size={16} color="#fff" />} icon={<ArrowRight size={16} color="#fff" />} onPress={() => go('signup-customer')} />
          <Outline title="Sign up to work as a helper" mt={12} leading={<BriefcaseBusiness size={16} color={colors.foreground} />} style={{backgroundColor: colors.glass}} onPress={() => go('signup-professional')} />
          <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, flexWrap: 'wrap'}}>
            <Subtle>Already have an account? </Subtle>
            <Quiet title="Log in" onPress={() => go('login')} style={{minHeight: 40}} />
          </View>
        </View>
      </View>
    </Aurora>
  );
}

async function askLocation(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const r = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]);
    return Object.values(r).some(v => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

function UploadCard({leading, title, hint, onPress}: {leading: ReactNode; title: string; hint: string; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.coral, borderRadius: 18}}>
      {leading}
      <View style={{flex: 1}}>
        <Txt size={14} w="bold">{title}</Txt>
        <Txt size={11} color={colors.mutedForeground} style={{marginTop: 3}}>{hint}</Txt>
      </View>
    </Pressable>
  );
}

export function AuthFlow({onDone}: {onDone: (r: AuthResult) => void}) {
  const [view, setView] = useState<View_>('landing');
  const [err, setErr] = useState('');
  const [role, setRole] = useState<Persona>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verified, setVerified] = useState(false);
  const [terms, setTerms] = useState(false);
  const [google, setGoogle] = useState(false);
  const [loc, setLoc] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState(false);
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState('');
  const [doc, setDoc] = useState('');
  const [upi, setUpi] = useState('');

  const go = (v: View_) => {
    setView(v); setErr(''); setTerms(false); setVerified(false);
    if (v === 'signup-customer') setRole('customer');
    if (v === 'signup-professional') setRole('professional');
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view !== 'landing') {go('landing'); return true;}
      return false;
    });
    return () => sub.remove();
  });
  const top = (t: string) => <ScreenTop title={t} onBack={() => go('landing')} />;

  const requestLocation = async () => setLoc((await askLocation()) ? 'granted' : 'denied');
  const takeSelfie = async () => {
    const res = await launchCamera({mediaType: 'photo', cameraType: 'front', saveToPhotos: false, quality: 0.7});
    const uri = res.assets?.[0]?.uri;
    if (uri) setPhoto(uri);
    else if (res.errorMessage) setErr('Camera unavailable: ' + res.errorMessage);
  };
  const pickDoc = async () => {
    try {
      const [file] = await pick({type: [types.images, types.pdf]});
      setDoc(file?.name ?? 'Document selected');
    } catch (e) {
      if (!isErrorWithCode(e) || e.code !== errorCodes.OPERATION_CANCELED) setErr('Could not open the file picker.');
    }
  };

  const submit = () => {
    let e = '';
    if (view === 'login') {
      e = loginError(email, password) || (!verified ? 'Please verify your mobile number.' : '');
      if (!e) onDone({role, name: role === 'customer' ? 'Akshaa' : 'Rahul Shinde', phone, email});
    }
    if (view === 'signup-customer') {
      e = clientSignupError({name, phone, phoneVerified: verified, email, google, address, locationGranted: loc === 'granted', contactAccess: contact, terms});
      if (!e) onDone({role: 'customer', name, phone, email: google ? 'google account' : email});
    }
    if (view === 'signup-professional') {
      e = proSignupError({name, phone, phoneVerified: verified, email, age: Number(age), photo: !!photo, document: !!doc, upi, terms});
      if (!e) onDone({role: 'professional', name, phone, email});
    }
    setErr(e);
  };
  const errNode = !!err && <ErrorText>{err}</ErrorText>;
  const page = (children: ReactNode) => <View style={{paddingHorizontal: 24, paddingBottom: 24}}>{children}</View>;

  if (view === 'landing') return <Landing go={go} />;

  if (view === 'login')
    return page(
      <>
        {top('Log in')}
        <ScreenTitle heading="Welcome back." />
        <Subtle>Log in with email, then confirm your mobile.</Subtle>
        <View style={{gap: 12, marginTop: 20}}>
          <Choice title="I hire help" icon={<Home size={20} color={colors.foreground} />} selected={role === 'customer'} onPress={() => setRole('customer')} />
          <Choice title="I work as a helper" icon={<BriefcaseBusiness size={20} color={colors.foreground} />} selected={role === 'professional'} onPress={() => setRole('professional')} />
        </View>
        <AuthField label="Email" icon={ic(Mail)}>
          <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} style={bareInput} />
        </AuthField>
        <AuthField label="Password" icon={ic(LockKeyhole)}>
          <TextInput accessibilityLabel="Password" secureTextEntry autoCapitalize="none" placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} style={bareInput} />
        </AuthField>
        <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
        {errNode}
        <Primary title="Log in" icon={<ArrowRight size={16} color="#fff" />} onPress={submit} />
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, flexWrap: 'wrap'}}>
          <Subtle>New here? </Subtle>
          <Quiet title="Create an account" onPress={() => go('signup-customer')} style={{minHeight: 40}} />
        </View>
      </>,
    );

  if (view === 'signup-customer')
    return page(
      <>
        {top('Create your account')}
        <ScreenTitle heading="Help is a tap away." />
        <Subtle>A few details and you’re ready to book.</Subtle>
        <AuthField label="Full name" icon={ic(User)}>
          <TextInput accessibilityLabel="Full name" placeholder="Your name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} style={bareInput} />
        </AuthField>
        <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
        {google ? (
          <Verified style={{marginTop: 16}} icon={<Check size={12} color={colors.success} />}>Google account connected</Verified>
        ) : (
          <>
            <AuthField label="Email" icon={ic(Mail)}>
              <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} style={bareInput} />
            </AuthField>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16}}>
              <View style={{flex: 1, height: 1, backgroundColor: colors.border}} />
              <Subtle>or</Subtle>
              <View style={{flex: 1, height: 1, backgroundColor: colors.border}} />
            </View>
            <Outline title="Sign up with Google" mt={12} leading={<GradientText size={16} from={colors.peach} to={colors.pink}>G</GradientText>} onPress={() => setGoogle(true)} />
          </>
        )}
        <FieldLabel>Location</FieldLabel>
        {loc === 'granted' ? (
          <Verified icon={<MapPin size={12} color={colors.success} />}>Location access allowed</Verified>
        ) : (
          <Outline title="Allow location access" mt={0} leading={<MapPin size={16} color={colors.foreground} />} onPress={requestLocation} />
        )}
        {loc === 'denied' && (
          <>
            <Subtle style={{marginTop: 8}}>No location access — please enter your address.</Subtle>
            <TextArea rows={2} accessibilityLabel="Address" placeholder="House no., street, area, city" value={address} onChangeText={setAddress} style={{marginTop: 8}} />
          </>
        )}
        {loc === 'idle' && <Quiet title="Enter address manually instead" style={{marginTop: 8}} onPress={() => setLoc('denied')} />}
        <CheckRow checked={contact} onChange={setContact}>
          <View style={{flexDirection: 'row', gap: 8}}>
            <View style={{flexDirection: 'row', gap: 3, marginTop: 2}}><Phone size={14} color={colors.foreground} /><MessageCircle size={14} color={colors.foreground} /></View>
            <Txt size={12} lh={1.6} style={{flex: 1}}>Allow call and message access so your professional can reach you through H-Staff.</Txt>
          </View>
        </CheckRow>
        <Terms persona="customer" accepted={terms} setAccepted={setTerms} />
        {errNode}
        <Primary title="Create account" icon={<ArrowRight size={16} color="#fff" />} onPress={submit} />
      </>,
    );

  return page(
    <>
      {top('Join as a helper')}
      <ScreenTitle heading="Your skills. Your schedule." />
      <Subtle>We verify every helper to keep everyone safe. Review takes up to 24 hours.</Subtle>
      <AuthField label="Full name (as on ID)" icon={ic(User)}>
        <TextInput accessibilityLabel="Full name" placeholder="Your full name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} style={bareInput} />
      </AuthField>
      <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
      <AuthField label="Email" icon={ic(Mail)}>
        <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} style={bareInput} />
      </AuthField>
      <AuthField label="Age" icon={ic(User)}>
        <TextInput accessibilityLabel="Age" keyboardType="number-pad" maxLength={3} placeholder="18 or older" placeholderTextColor={colors.mutedForeground} value={age} onChangeText={v => setAge(v.replace(/\D/g, ''))} style={bareInput} />
      </AuthField>
      <FieldLabel>Your photo</FieldLabel>
      <UploadCard
        onPress={takeSelfie}
        leading={photo ? <Image source={{uri: photo}} accessibilityLabel="Your selfie preview" style={{width: 56, height: 56, borderRadius: 28}} /> : <Camera size={26} color={colors.foreground} />}
        title={photo ? 'Retake photo' : 'Take a selfie'}
        hint="Face the light, remove sunglasses or masks, keep your whole face visible."
      />
      <FieldLabel>Verification document</FieldLabel>
      <UploadCard onPress={pickDoc} leading={<FileUp size={26} color={colors.foreground} />} title={doc || 'Upload ID document'} hint="Aadhaar, PAN, Voter ID or Driving Licence · JPG, PNG or PDF" />
      <AuthField label="UPI ID for payouts" icon={ic(Wallet)}>
        <TextInput accessibilityLabel="UPI ID" autoCapitalize="none" autoCorrect={false} placeholder="name@okbank" placeholderTextColor={colors.mutedForeground} value={upi} onChangeText={setUpi} style={bareInput} />
      </AuthField>
      <Terms persona="professional" accepted={terms} setAccepted={setTerms} />
      {errNode}
      <Primary title="Submit for verification" icon={<ArrowRight size={16} color="#fff" />} onPress={submit} />
    </>,
  );
}
export {Eyebrow};
