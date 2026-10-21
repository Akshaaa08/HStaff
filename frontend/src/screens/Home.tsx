import React from 'react';
import {Pressable, View} from 'react-native';
import {
  ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, Brush, CalendarDays, ChevronDown, Clock, CreditCard, Flower2, HelpCircle, Languages, LogOut, MapPin, Search, ShieldCheck, Star, User,
} from 'lucide-react-native';
import {money, professionals} from '../lib/domain';
import {photos} from '../lib/assets';
import {colors} from '../theme';
import {Blob} from '../components/motion';
import {AppFooter, Testimonials} from '../components/extras';
import {EmptyState, MenuRow, ProfessionalCard, SectionHeading, StatusChip, Summary, DetailRow, Tag, VerificationBadge, Verified} from '../components/primitives';
import {Chip, Eyebrow, Photo, Primary, Quiet, Subtle, Txt, BrandGradient} from '../components/ui';
import {BookingCard, Header, Page, SearchBox, ServiceGrid, Title} from './shared';
import {makeDraft, type C} from '../state/useHStaff';

const footerLinks = (c: C) => [
  {label: 'Home', onClick: () => c.navigateTab('Home')},
  {label: c.isPro ? 'Jobs' : 'Discover', onClick: () => c.navigateTab(c.isPro ? 'Jobs' : 'Discover')},
  {label: 'Notifications', onClick: () => c.go('notifications')},
  {label: 'Help & Safety', onClick: () => c.setSheet('Help & Safety')},
  {label: 'Raise a complaint', onClick: () => c.setSheet('complaint')},
];

export function CustomerHome({c}: {c: C}) {
  const {b} = c;
  return (
    <>
      <Header c={c} />
      <Page>
        <Pressable accessibilityRole="button" onPress={() => c.setSheet('location')} style={{flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 38}}>
          <MapPin size={14} color={colors.mutedForeground} />
          <Txt size={12} color={colors.mutedForeground}>Home · <Txt size={12} w="semibold">Baner, {c.session.city}</Txt></Txt>
          <ChevronDown size={14} color={colors.mutedForeground} />
        </Pressable>
        <View style={{marginTop: 17, marginBottom: 22}}>
          <View pointerEvents="none" style={{position: 'absolute', top: -80, right: -110, opacity: 0.4}}><Blob size={220} color={colors.pink} /></View>
          <Eyebrow>Help when you need it</Eyebrow>
          <Txt size={32} w="extrabold" lh={1.17} style={{marginTop: 9, marginBottom: 12, maxWidth: 310}} accessibilityRole="header">{'Who do you need\ntoday?'}</Txt>
          <View style={{position: 'absolute', right: 3, top: 30, transform: [{rotate: '12deg'}]}}><Flower2 size={40} strokeWidth={1.4} color={colors.pink} /></View>
          <Txt size={13} lh={1.65} color={colors.mutedForeground} style={{maxWidth: 265}}>{'Trusted people. Everyday tasks.\nA little help makes a big difference.'}</Txt>
        </View>
        <SearchBox c={c} onFocus={() => c.navigateTab('Discover')} />
        {b && !['CLOSED', 'CANCELLED'].includes(b.status) && (
          <>
            <SectionHeading title="Your active service" />
            <BookingCard booking={b} onPress={() => c.go('service')} />
          </>
        )}
        <BrandGradient radius={22} style={{marginTop: 18, marginBottom: 25, padding: 20, minHeight: 155, overflow: 'hidden'}}>
          <View pointerEvents="none" style={{position: 'absolute', right: 10, top: 10, width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)'}}>
            <View style={{position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)'}} />
          </View>
          <View style={{position: 'absolute', right: -7, bottom: -29}}>
            <Photo source={photos.sunita} width={143} height={180} radiusStyle={{borderTopLeftRadius: 80, borderTopRightRadius: 80}} posY={0.25} alt="Sunita, a home cleaning professional" />
          </View>
          <Eyebrow size={9} color={colors.foreground}>A helping hand, right now</Eyebrow>
          <Txt size={18} w="bold" lh={1.3} style={{marginTop: 5, marginBottom: 13, width: 185}}>{'Life happens.\nWe’re here to help.'}</Txt>
          <Primary title="Get help now" full={false} size={11} style={{alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16}} icon={<ArrowUpRight size={16} color="#fff" />} onPress={() => {c.setDraft(makeDraft()); c.go('discover');}} />
        </BrandGradient>
        <SectionHeading title="Popular services" action="View all" onAction={() => c.navigateTab('Discover')} />
        <ServiceGrid c={c} />
        <SectionHeading title="Good people, nearby" action="See all" onAction={() => {c.setDraft(makeDraft()); c.browse();}} />
        <ProfessionalCard person={professionals[0]} service="Cleaning specialist" onPress={() => {c.setSelected('sunita'); c.setDraft(makeDraft()); c.go('professional-profile');}} />
        <View style={{flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 25}}>
          <ShieldCheck size={14} color={colors.mutedForeground} />
          <Txt size={10} color={colors.mutedForeground}>Verified people. Transparent prices. Peace of mind.</Txt>
        </View>
        <Testimonials author={c.session.name} />
        <AppFooter links={footerLinks(c)} cta="Book help now" onCta={() => {c.setDraft(makeDraft()); c.go('discover');}} />
      </Page>
    </>
  );
}

export function ProHome({c}: {c: C}) {
  const {b, session} = c;
  const online = session.online;
  return (
    <>
      <Header c={c} />
      <Page>
        <Eyebrow>Your work, your way</Eyebrow>
        <Title heading={`Hello, ${c.setupName.split(' ')[0]}.`} description="A good day starts with a new opportunity." />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 22}}>
          <View style={{flex: 1}}>
            <Txt size={14} w="bold">{online ? 'You’re online' : 'You’re offline'}</Txt>
            <Subtle>{online ? 'Available for nearby jobs.' : 'Go online when you’re ready.'}</Subtle>
          </View>
          <Pressable accessibilityRole="switch" accessibilityState={{checked: online}} onPress={() => {c.patch({online: !online}); if (!online && (!b || b.status === 'CLOSED' || b.status === 'CANCELLED')) c.makeProRequest();}}
            style={{minWidth: 92, minHeight: 48, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: online ? colors.successSoft : colors.muted}}>
            <StatusChip>{online ? 'Online' : 'Offline'}</StatusChip>
          </Pressable>
        </View>
        <BrandGradient radius={24} style={{padding: 24, marginTop: 24}}>
          <Eyebrow>Today’s earnings</Eyebrow>
          <Txt size={36} w="extrabold" style={{marginTop: 6}}>{money(1250 + session.past.length * 500)}</Txt>
          <Subtle>{5 + session.past.length} jobs · 6.2 hours active</Subtle>
          <Quiet title="View earnings" style={{marginTop: 12}} onPress={() => c.navigateTab('Earnings')} icon={<ArrowRight size={16} color={colors.foreground} />} />
        </BrandGradient>
        {b && ['CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED_PENDING_PAYMENT'].includes(b.status) && (
          <>
            <SectionHeading title="Your active job" />
            <BookingCard booking={b} onPress={() => c.go('service')} />
          </>
        )}
        <SectionHeading title="New requests" action={online ? 'Online' : 'Offline'} />
        {online && b?.status === 'REQUESTED' ? (
          <Summary>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View style={{width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.peach}}><Brush size={20} color={colors.foreground} /></View>
              <StatusChip>New request</StatusChip>
            </View>
            <Txt size={20} w="bold" style={{marginTop: 16}}>{b.service}</Txt>
            <Subtle>Baner, {session.city} · 2.4 km away</Subtle>
            <DetailRow label="Today · Now" value={`${b.hours} hours`} />
            <DetailRow label="Expected earnings" value={money(Number(c.setupRate) * b.hours)} />
            <Primary title="View request" icon={<ArrowRight size={16} color="#fff" />} onPress={() => c.go('job-details')} />
          </Summary>
        ) : (
          <EmptyState icon={<BriefcaseBusiness size={40} color={colors.mutedForeground} />} title="A little space between jobs"
            description={online ? 'New opportunities will appear here.' : 'Go online to receive nearby requests.'}
            action={online ? 'Refresh requests' : 'Go online'} onAction={() => {c.patch({online: true}); c.makeProRequest();}} />
        )}
        <View style={{flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 25}}>
          <ShieldCheck size={14} color={colors.mutedForeground} />
          <Txt size={10} color={colors.mutedForeground}>Your time. Your skills. Your choice.</Txt>
        </View>
        <Testimonials author={c.setupName} />
        <AppFooter links={footerLinks(c)} cta="Go online" onCta={() => c.patch({online: true})} />
      </Page>
    </>
  );
}

export function Discover({c}: {c: C}) {
  return (
    <>
      <Header c={c} />
      <Page>
        <Title heading="A person for every task." description="Find the right help for your home and your day." />
        <View style={{marginTop: 20, marginBottom: 24}}><SearchBox c={c} placeholder="Search services" /></View>
        <SectionHeading title="All services" action={`${c.filteredServices.length} services`} />
        {c.filteredServices.length ? <ServiceGrid c={c} all /> : (
          <EmptyState icon={<Search size={40} color={colors.mutedForeground} />} title="No services found" description="Try cleaning, cooking or a repair service." action="Clear search" onAction={() => c.setQuery('')} />
        )}
        <Summary style={{marginTop: 28}}>
          <View style={{marginBottom: 12}}><ShieldCheck size={24} color={colors.foreground} /></View>
          <Txt size={16} w="semibold">Good help starts with trust.</Txt>
          <Subtle style={{marginTop: 8}}>Choose your professional. See their experience, reviews and rates before you book.</Subtle>
        </Summary>
      </Page>
    </>
  );
}

export function Bookings({c}: {c: C}) {
  const {b, isPro, session} = c;
  return (
    <>
      <Header c={c} />
      <Page>
        <Title heading={isPro ? 'Your work, in one place.' : 'Your helping hands.'} description="Every service, from first hello to a job well done." />
        <View style={{flexDirection: 'row', gap: 7, marginVertical: 16}}>
          <Chip title={isPro ? 'Active' : 'Upcoming'} selected={!c.pastTab} onPress={() => c.setPastTab(false)} />
          <Chip title="Past" selected={c.pastTab} onPress={() => c.setPastTab(true)} />
        </View>
        {c.pastTab ? (
          session.past.length ? session.past.map(item => <BookingCard key={item.id} booking={item} onPress={() => {c.patch({booking: item}); c.go('service');}} />)
            : <EmptyState icon={<Clock size={40} color={colors.mutedForeground} />} title="Nothing here just yet" description="Your completed services will appear here." />
        ) : b && !['CLOSED', 'CANCELLED'].includes(b.status) ? (
          <BookingCard booking={b} onPress={() => c.go(isPro && b.status === 'REQUESTED' ? 'job-details' : 'service')} />
        ) : (
          <EmptyState icon={<CalendarDays size={40} color={colors.mutedForeground} />} title={isPro ? 'No active jobs' : 'No bookings yet'}
            description={isPro ? 'New opportunities will appear when you go online.' : 'Your next booking will appear here.'}
            action={isPro ? 'Go to home' : 'Find a service'} onAction={() => c.navigateTab(isPro ? 'Home' : 'Discover')} />
        )}
      </Page>
    </>
  );
}

export function Profile({c}: {c: C}) {
  const {isPro, session} = c;
  const items: [any, string][] = [
    [User, 'Personal Information'], [MapPin, 'Saved Addresses'], [CreditCard, 'Payment Methods'], [CalendarDays, isPro ? 'Jobs' : 'Bookings'],
    [Star, 'Reviews'], [Bell, 'Notifications'], [ShieldCheck, 'Help & Safety'], [HelpCircle, 'Raise a complaint'], [Languages, 'Language'],
  ];
  const act = (l: string) =>
    l === 'Notifications' ? c.go('notifications') : l === 'Raise a complaint' ? c.setSheet('complaint') : l === 'Bookings' || l === 'Jobs' ? c.navigateTab(l) : c.setSheet(l);
  return (
    <>
      <Header c={c} />
      <Page>
        <View style={{alignItems: 'center'}}>
          <View style={{width: 74, height: 74, borderRadius: 23, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 13}}>
            <Txt size={24} w="bold">{isPro ? 'RS' : 'AK'}</Txt>
          </View>
          <Txt size={24} w="bold">{isPro ? c.setupName : session.name}</Txt>
          <Subtle>{session.phone ? `+91 ${session.phone}` : 'Your H-Staff account'}</Subtle>
          {session.authenticated ? (
            <Verified icon={<ShieldCheck size={12} color={colors.success} />}>Mobile Verified</Verified>
          ) : (
            <Quiet title="Sign in or get started" style={{marginTop: 8}} onPress={() => c.go('welcome')} icon={<ArrowRight size={16} color={colors.foreground} />} />
          )}
          {isPro && session.setup && <View style={{marginTop: 8}}><VerificationBadge /></View>}
        </View>
        {isPro && (
          <Summary>
            <Eyebrow>Your professional profile</Eyebrow>
            <DetailRow label="Service" value={c.setupSkill} />
            <DetailRow label="Your rate" value={`${money(Number(c.setupRate))}/hr`} />
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 11}}><Tag>Identity ✓</Tag><Tag>Mobile ✓</Tag><Tag>Documents ✓</Tag></View>
            <Quiet title="Edit professional profile" onPress={() => c.go('setup')} icon={<ArrowRight size={16} color={colors.foreground} />} />
          </Summary>
        )}
        <View style={{marginTop: 24}}>
          {items.map(([Icon, label]) => <MenuRow key={label} icon={<Icon size={19} color={colors.foreground} />} title={label} onPress={() => act(label)} />)}
          <MenuRow icon={<BriefcaseBusiness size={19} color={colors.foreground} />} title={`Switch to ${isPro ? 'Customer' : 'Professional'}`} onPress={c.switchRole} />
          <MenuRow icon={<LogOut size={19} color={colors.foreground} />} title={session.authenticated ? 'Logout' : 'Welcome & sign in'}
            onPress={() => {if (session.authenticated) c.patch({authenticated: false, phone: ''}); c.go('welcome');}} />
        </View>
        <Subtle center style={{marginTop: 24}}>H-Staff · Made for everyday life</Subtle>
      </Page>
    </>
  );
}
