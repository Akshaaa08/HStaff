import React, {type ReactNode} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {BriefcaseBusiness, CalendarDays, Home, Search, User, Wallet} from 'lucide-react-native';
import {brandGradient, colors, shadows} from './theme';
import {PageIn} from './components/motion';
import {Txt, ErrorText, SuccessText} from './components/ui';
import {useHStaff, type C} from './state/useHStaff';
import {AuthFlow} from './screens/AuthFlow';
import {Bookings, CustomerHome, Discover, Profile, ProHome} from './screens/Home';
import {BookingSummary, Complete, Location, Materials, Mode, Payment, ProfessionalProfile, Professionals, Rating, Requirements, Service} from './screens/Flow';
import {Earnings, JobDetails, MobileAuth, MobileOtp, Notifications, Role, Setup, Welcome} from './screens/Misc';
import {SheetHost} from './screens/Sheets';
import {Page} from './screens/shared';

const customerTabs = [{title: 'Home', icon: Home}, {title: 'Discover', icon: Search}, {title: 'Bookings', icon: CalendarDays}, {title: 'Profile', icon: User}];
const proTabs = [{title: 'Home', icon: Home}, {title: 'Jobs', icon: BriefcaseBusiness}, {title: 'Earnings', icon: Wallet}, {title: 'Profile', icon: User}];

function content(c: C): ReactNode {
  switch (c.screen) {
    case 'home': return c.isPro ? <ProHome c={c} /> : <CustomerHome c={c} />;
    case 'discover': return <Discover c={c} />;
    case 'mode': return <Mode c={c} />;
    case 'requirements': return <Requirements c={c} />;
    case 'materials': return <Materials c={c} />;
    case 'location': return <Location c={c} />;
    case 'professionals': return <Professionals c={c} />;
    case 'professional-profile': return <ProfessionalProfile c={c} />;
    case 'summary': return <BookingSummary c={c} />;
    case 'service': return <Service c={c} />;
    case 'payment': return <Payment c={c} />;
    case 'rating': return <Rating c={c} />;
    case 'complete': return <Complete c={c} />;
    case 'bookings': case 'jobs': return <Bookings c={c} />;
    case 'profile': return <Profile c={c} />;
    case 'notifications': return <Notifications c={c} />;
    case 'welcome': return <Welcome c={c} />;
    case 'role': return <Role c={c} />;
    case 'auth': return <MobileAuth c={c} />;
    case 'auth-otp': return <MobileOtp c={c} />;
    case 'setup': return <Setup c={c} />;
    case 'job-details': return <JobDetails c={c} />;
    case 'earnings': return <Earnings c={c} />;
    default: return <CustomerHome c={c} />;
  }
}

function Dock({c, bottom}: {c: C; bottom: number}) {
  const tabs = c.isPro ? proTabs : customerTabs;
  return (
    <View accessibilityLabel={c.isPro ? 'Professional navigation' : 'Customer navigation'}
      style={[{position: 'absolute', left: 18, right: 18, bottom, height: 73, zIndex: 20, flexDirection: 'row', borderRadius: 100, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.background, paddingVertical: 7, paddingHorizontal: 9}, shadows.dock]}>
      {tabs.map(({title, icon: Icon}) => {
        const active = c.tab === title;
        return (
          <Pressable key={title} accessibilityRole="tab" accessibilityState={{selected: active}} onPress={() => c.navigateTab(title)} style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3}}>
            {active ? (
              <LinearGradient {...brandGradient} style={{width: 36, height: 31, borderRadius: 100, alignItems: 'center', justifyContent: 'center'}}><Icon size={20} strokeWidth={1.7} color={colors.foreground} /></LinearGradient>
            ) : (
              <View style={{width: 36, height: 31, alignItems: 'center', justifyContent: 'center'}}><Icon size={20} strokeWidth={1.7} color={colors.foreground} /></View>
            )}
            <Txt size={9} w={active ? 'bold' : 'regular'}>{title}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HStaffApp() {
  const c = useHStaff();
  const insets = useSafeAreaInsets();
  const kav = Platform.OS === 'ios' ? 'padding' : 'padding';
  if (!c.hydrated) return <View style={{flex: 1, backgroundColor: colors.background}} />;

  if (!c.session.authenticated) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, paddingTop: insets.top}}>
        <StatusBar barStyle="dark-content" />
        <KavWrap kav={kav}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow: 1, paddingBottom: 24 + insets.bottom}} showsVerticalScrollIndicator={false}>
            <AuthFlow onDone={c.onAuthDone} />
          </ScrollView>
        </KavWrap>
      </View>
    );
  }

  const body = content(c);
  return (
    <View style={{flex: 1, backgroundColor: colors.background, paddingTop: insets.top}}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient pointerEvents="none" colors={[colors.background, colors.background, '#FFF1F4', colors.background, '#FFF3EE']} locations={[0, 0.3, 0.55, 0.75, 1]} style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}} />
      <KavWrap kav={kav}>
        <ScrollView ref={c.scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 112 + (c.dockVisible ? insets.bottom : 0) + (c.dockVisible ? 0 : insets.bottom)}}>
          <PageIn k={c.screen}>
            {c.dockVisible ? body : <Page>{body}</Page>}
            {!c.sheet && !!c.error && <Page><ErrorText>{c.error}</ErrorText></Page>}
            {!c.sheet && !!c.notice && <Page><SuccessText>{c.notice}</SuccessText></Page>}
          </PageIn>
        </ScrollView>
      </KavWrap>
      {c.dockVisible && <Dock c={c} bottom={Math.max(14, insets.bottom)} />}
      <SheetHost c={c} />
    </View>
  );
}

function KavWrap({children, kav}: {children: ReactNode; kav: 'padding' | 'height'}) {
  return <KeyboardAvoidingView style={{flex: 1}} behavior={kav}>{children}</KeyboardAvoidingView>;
}
