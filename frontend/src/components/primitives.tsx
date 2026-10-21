import React, {type ReactNode} from 'react';
import {Pressable, ScrollView, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText} from 'react-native-svg';
import {ArrowLeft, ArrowRight, Check, ChevronRight, MapPin, ShieldCheck, Star, X} from 'lucide-react-native';
import {money, priceFor, type Professional} from '../lib/domain';
import {photos} from '../lib/assets';
import {colors, fonts, shadows} from '../theme';
import {
  BrandGradient, ChoiceShell, Eyebrow, IconButton, Photo, Primary, Quiet, Subtle, Txt,
} from './ui';

/** Vector rebuild of the H-Staff wordmark (the original logo.png was not included in the zip). */
export function HStaffLogo({scale = 1}: {scale?: number}) {
  const w = 109 * scale;
  const h = 45 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 109 45" accessibilityLabel="H-Staff">
      <Defs>
        <SvgGradient id="roof" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFB48F" />
          <Stop offset="1" stopColor={colors.pink} />
        </SvgGradient>
      </Defs>
      <Path d="M5 17.5 L17.5 6 L30 17.5" stroke="url(#roof)" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={6} y={20} width={6.5} height={21} rx={1.6} fill={colors.foreground} />
      <Rect x={22.5} y={20} width={6.5} height={21} rx={1.6} fill={colors.foreground} />
      <Rect x={6} y={27.8} width={23} height={6} fill={colors.foreground} />
      <SvgText x={35} y={36} fontFamily={fonts.script} fontSize={29} fill={colors.foreground}>Staff</SvgText>
    </Svg>
  );
}

export function ScreenTop({title, onBack}: {title: string; onBack: () => void}) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 9, marginBottom: 17, marginHorizontal: -9}}>
      <IconButton label="Go back" onPress={onBack}><ArrowLeft size={16} color={colors.foreground} /></IconButton>
      <Txt size={16} w="semibold" center style={{flex: 1}} accessibilityRole="header">{title}</Txt>
      <View style={{width: 48}} />
    </View>
  );
}

export function SectionHeading({title, action, onAction}: {title: string; action?: string; onAction?: () => void}) {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 23, marginBottom: 13}}>
      <Txt size={18} w="bold" accessibilityRole="header">{title}</Txt>
      {!!action && <Quiet title={action} size={11} color={colors.mutedForeground} onPress={onAction} icon={<ArrowRight size={13} color={colors.mutedForeground} />} />}
    </View>
  );
}

export function Verified({children, icon, style}: {children: ReactNode; icon?: ReactNode; style?: StyleProp<ViewStyle>}) {
  return (
    <View style={[{flexDirection: 'row', alignItems: 'center', gap: 4}, style]}>
      {icon}
      <Txt size={10} w="semibold" color={colors.success}>{children}</Txt>
    </View>
  );
}
export const VerificationBadge = () => <Verified icon={<ShieldCheck size={12} color={colors.success} />}>Identity Verified</Verified>;

export function StatusChip({children, icon, style}: {children: ReactNode; icon?: ReactNode; style?: StyleProp<ViewStyle>}) {
  return (
    <View style={[{flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, backgroundColor: colors.successSoft, paddingVertical: 7, paddingHorizontal: 10, alignSelf: 'flex-start'}, style]}>
      {icon}
      <Txt size={10} color={colors.success}>{children}</Txt>
    </View>
  );
}

export function Tag({children}: {children: ReactNode}) {
  return (
    <View style={{paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.muted, borderRadius: 100}}>
      <Txt size={11}>{children}</Txt>
    </View>
  );
}

export function Choice({title, detail, icon, selected, onPress, style}: {title: string; detail?: string; icon?: ReactNode; selected?: boolean; onPress: () => void; style?: StyleProp<ViewStyle>}) {
  return (
    <ChoiceShell selected={selected} radius={18} onPress={onPress} style={style}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingVertical: 12}}>
        {!!icon && <View style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.muted}}>{icon}</View>}
        <View style={{flex: 1, minWidth: 0}}>
          <Txt size={15} w="bold">{title}</Txt>
          {!!detail && <Txt size={12} color={colors.mutedForeground} style={{marginTop: 5}}>{detail}</Txt>}
        </View>
        {selected && <Check size={19} color={colors.success} />}
      </View>
    </ChoiceShell>
  );
}

export function Card({children, style}: {children: ReactNode; style?: StyleProp<ViewStyle>}) {
  return <View style={[{borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 14, backgroundColor: colors.background, marginBottom: 12}, shadows.card, style]}>{children}</View>;
}
export function Summary({children, style}: {children: ReactNode; style?: StyleProp<ViewStyle>}) {
  return <View style={[{borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 20, marginTop: 19}, style]}>{children}</View>;
}
export function DetailRow({label, value, total, style}: {label: string; value: string; total?: boolean; style?: StyleProp<ViewStyle>}) {
  return (
    <View style={[{flexDirection: 'row', justifyContent: 'space-between', gap: 20, paddingVertical: 10}, total && {borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border, marginTop: 10, paddingTop: 18}, style]}>
      <Txt size={total ? 18 : 13} color={total ? colors.foreground : colors.mutedForeground} style={{flexShrink: 1}}>{label}</Txt>
      <Txt size={total ? 18 : 13} w="semibold" style={{textAlign: 'right', flexShrink: 1}}>{value}</Txt>
    </View>
  );
}

export function ProfessionalCard({person, onPress, service}: {person: Professional; onPress: () => void; service?: string}) {
  return (
    <Card>
      <View style={{flexDirection: 'row', gap: 13, alignItems: 'center'}}>
        <Photo source={photos[person.id]} width={75} height={91} radius={16} posY={0.22} alt={person.name} />
        <View style={{flex: 1, minWidth: 0}}>
          <Txt size={15} w="bold" style={{marginBottom: 4}}>{person.name}</Txt>
          <VerificationBadge />
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8}}>
            <Star size={12} color={colors.foreground} fill={colors.foreground} />
            <Txt size={11} w="bold" color={colors.mutedForeground}>{person.rating}</Txt>
            <Txt size={11} color={colors.mutedForeground}>•</Txt>
            <Txt size={11} color={colors.mutedForeground}>{person.jobs} jobs</Txt>
          </View>
          <Subtle>{person.years} yrs experience · {person.distance} km away</Subtle>
        </View>
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, marginTop: 12, paddingTop: 11}}>
        <View>
          <Txt size={15} w="bold">{money(person.rate)}<Txt size={12} color={colors.mutedForeground} w="regular"> /hr</Txt></Txt>
          {!!service && <Subtle>{service}</Subtle>}
        </View>
        <Quiet title="View profile" size={11} onPress={onPress} icon={<ArrowRight size={16} color={colors.foreground} />} />
      </View>
    </Card>
  );
}

export function PriceBreakdown({rate, hours}: {rate: number; hours: number}) {
  const p = priceFor(rate, hours);
  return (
    <Summary>
      <DetailRow label="Worker fare (disbursed to worker)" value={money(p.charge)} />
      <Subtle>{hours} {hours === 1 ? 'hour' : 'hours'} × {money(rate)}/hr</Subtle>
      <DetailRow label="Platform service fee" value={money(p.fee)} />
      <DetailRow label="Total payable" value={money(p.total)} total />
    </Summary>
  );
}

export function OTPDisplay({code}: {code: string}) {
  return (
    <View accessibilityLabel={`Your code is ${code.split('').join(' ')}`} style={{flexDirection: 'row', justifyContent: 'center', gap: 7, marginVertical: 25}}>
      {code.split('').map((n, i) => (
        <View key={i} style={{width: 41, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.muted}}>
          <Txt size={23} w="bold">{n}</Txt>
        </View>
      ))}
    </View>
  );
}

export function EmptyState({icon, title, description, action, onAction}: {icon: ReactNode; title: string; description: string; action?: string; onAction?: () => void}) {
  return (
    <View style={{paddingVertical: 45, paddingHorizontal: 15, alignItems: 'center'}}>
      <View style={{marginBottom: 18}}>{icon}</View>
      <Txt size={22} w="bold" center style={{marginBottom: 8}}>{title}</Txt>
      <Subtle center>{description}</Subtle>
      {!!action && <Primary title={action} onPress={onAction} icon={<ArrowRight size={16} color="#fff" />} />}
    </View>
  );
}

export function BottomSheet({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
  return (
    <Pressable accessibilityLabel={`Close ${title}`} onPress={onClose} style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, justifyContent: 'flex-end', zIndex: 40}}>
      <Pressable onPress={() => {}} accessibilityViewIsModal style={{maxHeight: '85%', backgroundColor: colors.glass, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingHorizontal: 24, paddingBottom: 28}}>
        <View style={{width: 35, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: 'center', marginBottom: 16}} />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
          <Txt size={20} w="bold" accessibilityRole="header" style={{flex: 1}}>{title}</Txt>
          <IconButton label="Close" onPress={onClose}><X size={16} color={colors.foreground} /></IconButton>
        </View>
        <ScrollView style={{flexGrow: 0}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Pressable>
    </Pressable>
  );
}

export function MenuRow({icon, title, onPress}: {icon: ReactNode; title: string; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => ({flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 11, borderBottomWidth: 1, borderColor: colors.border, opacity: pressed ? 0.6 : 1})}>
      <View style={{width: 24}}>{icon}</View>
      <Txt size={13} w="medium" style={{flex: 1}}>{title}</Txt>
      <ChevronRight size={15} color={colors.foreground} />
    </Pressable>
  );
}

export function MapMockup({tracking = false, address = 'Baner, Pune'}: {tracking?: boolean; address?: string}) {
  const blocks: [number, number][] = [[130, 20], [235, 20], [20, 140], [140, 160], [250, 105], [25, 220]];
  const roads = 'M0 110H350M115 0V280M205 0L190 280M0 205L350 75';
  const label = {fontFamily: fonts.regular, fontSize: 10, fill: colors.mutedForeground} as const;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={tracking ? `Professional en route to ${address}, 1.2 km away, estimated arrival 14 minutes` : `Service address: ${address}`}
      style={{height: 280, borderRadius: 22, backgroundColor: colors.muted, overflow: 'hidden', marginVertical: 18, borderWidth: 1, borderColor: colors.border}}>
      <Svg width="100%" height="100%" viewBox="0 0 350 280">
        <Rect x={15} y={20} width={90} height={65} rx={15} fill={colors.mint} />
        <Rect x={225} y={195} width={100} height={60} rx={20} fill={colors.mint} />
        {blocks.map(([x, y], i) => <Rect key={i} x={x} y={y} width={55} height={35} rx={5} fill={colors.border} />)}
        <Path d={roads} stroke={colors.background} strokeWidth={18} fill="none" />
        <Path d={roads} stroke={colors.border} strokeWidth={1} fill="none" />
        <SvgText x={27} y={50} {...label}>Baner Park</SvgText>
        <SvgText x={240} y={238} {...label}>Green spaces</SvgText>
        <SvgText x={130} y={99} {...label}>Baner Road</SvgText>
        {tracking && (
          <>
            <Path d="M70 157L115 140V110H200V73" stroke={colors.pink} strokeWidth={5} strokeLinecap="round" strokeDasharray="8 5" fill="none" />
            <Circle cx={70} cy={157} r={12} fill={colors.primary} stroke={colors.background} strokeWidth={3} />
            <SvgText x={66} y={161} fill={colors.background} fontSize={12} fontFamily={fonts.regular}>S</SvgText>
          </>
        )}
        <Circle cx={200} cy={73} r={11} fill={colors.pink} stroke={colors.background} strokeWidth={3} />
        <Circle cx={200} cy={73} r={3} fill={colors.background} />
      </Svg>
      <View style={{position: 'absolute', left: 14, bottom: 14, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.glass, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '85%'}}>
        <MapPin size={11} color={colors.foreground} />
        <Txt size={10} w="semibold" numberOfLines={1} style={{flexShrink: 1}}>{tracking ? 'Arriving in 14 min' : address}</Txt>
      </View>
    </View>
  );
}

export {BrandGradient, Eyebrow};
