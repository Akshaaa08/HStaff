import React, {type ReactNode} from 'react';
import {Pressable, TextInput, View, useWindowDimensions} from 'react-native';
import {ArrowRight, Bell, Check, Languages, Search} from 'lucide-react-native';
import {money, priceFor, professionalFor, services, statusLabel, type Booking} from '../lib/domain';
import {photos, serviceIcons} from '../lib/assets';
import {colors, toneColor} from '../theme';
import {Card, HStaffLogo, StatusChip} from '../components/primitives';
import {IconButton, PillField, Quiet, ScreenTitle, Subtle, Txt, bareInput, Eyebrow} from '../components/ui';
import {Photo} from '../components/ui';
import type {C} from '../state/useHStaff';

export const Page = ({children}: {children: ReactNode}) => <View style={{paddingHorizontal: 24, paddingBottom: 24}}>{children}</View>;
export const Title = ScreenTitle;

export function Header({c}: {c: C}) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, paddingHorizontal: 24, paddingBottom: 10}}>
      <HStaffLogo />
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
        <IconButton label="Language selection" onPress={() => c.setSheet('Language')}>
          <Languages size={17} color={colors.foreground} />
        </IconButton>
        <IconButton label="Notifications" onPress={() => c.go('notifications')}>
          <Bell size={16} color={colors.foreground} />
          <View style={{position: 'absolute', top: 11, right: 14, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.pink}} />
        </IconButton>
        <IconButton label="Your profile" onPress={() => c.navigateTab('Profile')}>
          <View style={{height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.peach}}>
            <Txt size={12} w="bold">{c.isPro ? 'RS' : 'AK'}</Txt>
          </View>
        </IconButton>
      </View>
    </View>
  );
}

export function SearchBox({c, placeholder = 'Search for a service', onFocus}: {c: C; placeholder?: string; onFocus?: () => void}) {
  return (
    <PillField left={<Search size={19} color={colors.mutedForeground} />}>
      <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} value={c.query} onChangeText={c.setQuery} onFocus={onFocus} style={bareInput} />
    </PillField>
  );
}

export function ServiceGrid({c, all = false}: {c: C; all?: boolean}) {
  const {width} = useWindowDimensions();
  const tile = (width - 48 - 18) / 3;
  const list = all ? c.filteredServices : services.slice(0, 6);
  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', columnGap: 9, rowGap: 14}}>
      {list.map(s => {
        const Icon = serviceIcons[s.name];
        return (
          <Pressable key={s.name} accessibilityRole="button" accessibilityLabel={s.name} onPress={() => c.selectService(s.name)} style={({pressed}) => ({width: tile, minHeight: 96, alignItems: 'center', gap: 9, opacity: pressed ? 0.7 : 1})}>
            <View style={{width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: toneColor[s.tone] ?? colors.muted}}>
              <Icon size={26} strokeWidth={1.5} color={colors.foreground} />
            </View>
            <Txt size={11} w="semibold" center>{s.name}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BookingCard({booking, onPress}: {booking: Booking; onPress: () => void}) {
  const p = professionalFor(booking.professionalId);
  return (
    <Card>
      <View style={{flexDirection: 'row', gap: 13, alignItems: 'center'}}>
        <Photo source={photos[p.id]} width={75} height={91} radius={16} posY={0.22} alt={p.name} />
        <View style={{flex: 1, minWidth: 0}}>
          <Eyebrow>{booking.service}</Eyebrow>
          <Txt size={15} w="bold" style={{marginBottom: 4}}>{p.name}</Txt>
          <Subtle>{booking.mode === 'Instant' ? 'Today' : booking.date} · {booking.mode === 'Instant' ? 'Instant' : booking.time}</Subtle>
          <StatusChip icon={<Check size={12} color={colors.success} />} style={{marginTop: 4}}>{statusLabel(booking.status)}</StatusChip>
        </View>
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, marginTop: 12, paddingTop: 11}}>
        <Txt size={15} w="bold">{money(priceFor(p.rate, booking.hours).total)}</Txt>
        <Quiet title="View booking" size={11} onPress={onPress} icon={<ArrowRight size={16} color={colors.foreground} />} />
      </View>
    </Card>
  );
}
