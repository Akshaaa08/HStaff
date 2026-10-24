import React, {useState, type ComponentProps, type ReactNode} from 'react';
import {
  Image, Modal, Pressable, ScrollView, Text, TextInput, View,
  type ImageSourcePropType, type LayoutChangeEvent, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedViewNative from '@react-native-masked-view/masked-view';
// the package's class typing clashes with @types/react 19; runtime is fine
const MaskedView = MaskedViewNative as unknown as React.ComponentType<any>;
import {Check, ChevronDown} from 'lucide-react-native';
import {brandGradient, colors, fonts, shadows, text, type Weight} from '../theme';

/* ---------- Text ---------- */
type TxtProps = Omit<ComponentProps<typeof Text>, 'style'> & {
  size?: number; w?: Weight; color?: string; lh?: number; center?: boolean; style?: StyleProp<TextStyle>;
};
export function Txt({size = 14, w = 'regular', color = colors.foreground, lh, center, style, ...rest}: TxtProps) {
  return <Text {...rest} style={[text(size, w, color, lh), center && {textAlign: 'center'}, style]} />;
}
export const Subtle = ({children, center, style, ...r}: {children?: ReactNode; center?: boolean; style?: StyleProp<TextStyle>} & Partial<ComponentProps<typeof Text>>) => (
  <Txt size={12} color={colors.mutedForeground} lh={1.7} center={center} style={style} {...r}>{children}</Txt>
);
export const Eyebrow = ({children, style, size = 10, color = colors.mutedForeground, center}: {children: ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; center?: boolean}) => (
  <Txt size={size} w="bold" color={color} lh={1.5} center={center} style={[{textTransform: 'uppercase'}, style]}>{children}</Txt>
);
export const ErrorText = ({children}: {children: ReactNode}) => (
  <Txt size={12} color={colors.destructive} lh={1.6} style={{marginTop: 12}} accessibilityRole="alert">{children}</Txt>
);
export const SuccessText = ({children}: {children: ReactNode}) => (
  <Txt size={12} color={colors.success} style={{marginTop: 12}} accessibilityRole="alert">{children}</Txt>
);
export const ScreenTitle = ({heading, description, center}: {heading: string; description?: string; center?: boolean}) => (
  <View>
    <Txt size={27} w="bold" lh={1.25} center={center} style={{marginTop: 13, marginBottom: 9}} accessibilityRole="header">{heading}</Txt>
    {!!description && <Subtle center={center}>{description}</Subtle>}
  </View>
);
export const FieldLabel = ({children, optional}: {children: ReactNode; optional?: boolean}) => (
  <Txt size={13} w="semibold" style={{marginTop: 22, marginBottom: 9}}>
    {children}
    {optional ? <Txt size={12} color={colors.mutedForeground}> Optional</Txt> : null}
  </Txt>
);

/* ---------- Gradient helpers ---------- */
export function BrandGradient({style, children, radius}: {style?: StyleProp<ViewStyle>; children?: ReactNode; radius?: number}) {
  return (
    <LinearGradient {...brandGradient} style={[radius != null && {borderRadius: radius}, style]}>
      {children}
    </LinearGradient>
  );
}
/** Text filled with a horizontal gradient (landing title, Google "G"). */
export function GradientText({children, size, w = 'extrabold', from = colors.primary, to = colors.pink, style}: {children: string; size: number; w?: Weight; from?: string; to?: string; style?: StyleProp<TextStyle>}) {
  const s = [text(size, w), style];
  return (
    <MaskedView style={{alignSelf: 'flex-start'}} maskElement={<Text style={s}>{children}</Text>}>
      <LinearGradient colors={[from, to]} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
        <Text style={[s, {opacity: 0}]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

/* ---------- Buttons ---------- */
type BtnBase = {onPress?: () => void; disabled?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle>; label?: string; full?: boolean; mt?: number};
const gap = {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8} as const;

/** `variant=default` – dark pill, white label, optional trailing/leading icon. */
export function PrimaryButton({onPress, disabled, children, style, label, full, mt}: BtnBase & {size?: 'sm'}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({pressed}) => [
        gap, {minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1, transform: [{scale: pressed ? 0.97 : 1}]},
        full && {width: '100%', marginTop: mt ?? 24}, style,
      ]}>
      {children}
    </Pressable>
  );
}
export const BtnText = ({children, color = colors.primaryForeground, size = 14}: {children: ReactNode; color?: string; size?: number}) => (
  <Txt size={size} w="semibold" color={color}>{children}</Txt>
);
/** Convenience: label + optional icon using the dark primary pill. */
export function Primary({title, icon, leading, onPress, disabled, full = true, mt, style, size = 14}: {title: string; icon?: ReactNode; leading?: ReactNode; onPress?: () => void; disabled?: boolean; full?: boolean; mt?: number; style?: StyleProp<ViewStyle>; size?: number}) {
  return (
    <PrimaryButton onPress={onPress} disabled={disabled} full={full} mt={mt} style={style}>
      {leading}
      <BtnText size={size}>{title}</BtnText>
      {icon}
    </PrimaryButton>
  );
}
/** `variant=outline` + `rounded-full` pill. */
export function Outline({title, icon, leading, onPress, full = true, mt, style, disabled, textColor = colors.foreground}: {title: string; icon?: ReactNode; leading?: ReactNode; onPress?: () => void; full?: boolean; mt?: number; style?: StyleProp<ViewStyle>; disabled?: boolean; textColor?: string}) {
  return (
    <Pressable
      accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({pressed}) => [gap, {minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1, ...shadows.none}, full && {width: '100%', marginTop: mt ?? 24}, style]}>
      {leading}
      <Txt size={14} w="medium" color={textColor}>{title}</Txt>
      {icon}
    </Pressable>
  );
}
export function Destructive({title, onPress, mt}: {title: string; onPress: () => void; mt?: number}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[gap, {minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, backgroundColor: colors.destructive, width: '100%', marginTop: mt ?? 24}]}>
      <Txt size={14} w="medium" color="#fff">{title}</Txt>
    </Pressable>
  );
}
/** `variant=quiet` – text-only action, left aligned unless `center` is set. */
export function Quiet({title, icon, leading, onPress, center, style, size = 14, color = colors.foreground, w = 'medium', inline}: {title: string; icon?: ReactNode; leading?: ReactNode; onPress?: () => void; center?: boolean; style?: StyleProp<ViewStyle>; size?: number; color?: string; w?: Weight; inline?: boolean}) {
  return (
    <Pressable
      accessibilityRole="button" onPress={onPress}
      style={({pressed}) => [{flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: inline ? 0 : 48, opacity: pressed ? 0.6 : 1}, center && {alignSelf: 'center'}, style]}>
      {leading}
      <Txt size={size} w={w} color={color}>{title}</Txt>
      {icon}
    </Pressable>
  );
}
/** Round 48px icon-only hit target (`size=icon`). */
export function IconButton({children, onPress, label, style}: {children: ReactNode; onPress: () => void; label: string; style?: StyleProp<ViewStyle>}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({pressed}) => [{width: 48, height: 48, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.accent : 'transparent'}, style]}>
      {children}
    </Pressable>
  );
}

/** Selected state = 2px gradient border, as in `.hstaff-choice[data-selected=true]`. */
export function ChoiceShell({selected, radius, onPress, children, minHeight = 58, style, pill}: {selected?: boolean; radius: number; onPress?: () => void; children: ReactNode; minHeight?: number; style?: StyleProp<ViewStyle>; pill?: boolean}) {
  const inner = (
    <View style={[{minHeight: selected ? minHeight - 4 : minHeight - 2, borderRadius: radius - 2, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: 8}, pill ? {paddingHorizontal: 15} : {paddingHorizontal: 18}]}>{children}</View>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected: !!selected}} onPress={onPress} style={style}>
      {selected ? (
        <LinearGradient {...brandGradient} style={[{borderRadius: radius, padding: 2}, shadows.card]}>{inner}</LinearGradient>
      ) : (
        <View style={{borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background}}>{inner}</View>
      )}
    </Pressable>
  );
}
/** Small pill chip (`chip-row .hstaff-choice`). */
export function Chip({title, selected, onPress, style}: {title: string; selected?: boolean; onPress: () => void; style?: StyleProp<ViewStyle>}) {
  return (
    <ChoiceShell selected={selected} radius={100} minHeight={48} onPress={onPress} pill style={style}>
      <Txt size={11} w="medium">{title}</Txt>
    </ChoiceShell>
  );
}
export function WrapChip({title, selected, onPress}: {title: string; selected?: boolean; onPress: () => void}) {
  return (
    <ChoiceShell selected={selected} radius={100} minHeight={44} onPress={onPress} pill>
      <Txt size={12} w="medium">{title}</Txt>
    </ChoiceShell>
  );
}

/* ---------- Inputs ---------- */
export function Field({style, ...p}: TextInputProps & {style?: StyleProp<TextStyle>}) {
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      {...p}
      style={[{borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 50, padding: 14, backgroundColor: colors.background, color: colors.foreground, fontFamily: fonts.regular, fontSize: 14}, p.multiline && {textAlignVertical: 'top'}, style]}
    />
  );
}
export function TextArea({rows = 3, style, ...p}: TextInputProps & {rows?: number; style?: StyleProp<TextStyle>}) {
  return <Field multiline numberOfLines={rows} style={[{minHeight: 30 + rows * 21}, style]} {...p} />;
}
/** Pill-shaped input row with leading adornment (`.search-field`). */
export function PillField({left, right, children, style, shadow = true}: {left?: ReactNode; right?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle>; shadow?: boolean}) {
  return (
    <View style={[{flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 100, backgroundColor: colors.background, minHeight: 52, paddingHorizontal: 18}, shadow && shadows.card, style]}>
      {left}
      {children}
      {right}
    </View>
  );
}
export const bareInput = {flex: 1, minWidth: 0, padding: 0, fontFamily: fonts.regular, fontSize: 14, color: colors.foreground} as const;

/** Replacement for the web <select>: tap to open a list in a modal. */
export function SelectField({value, options, onChange, label}: {value: string; options: string[]; onChange: (v: string) => void; label: string}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={{borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background}}>
        <Txt size={14}>{value}</Txt>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent navigationBarTranslucent>
        <Pressable style={{flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 24}} onPress={() => setOpen(false)}>
          <View style={{maxHeight: '70%', backgroundColor: colors.background, borderRadius: 22, paddingVertical: 8}}>
            <ScrollView>
              {options.map(o => (
                <Pressable key={o} onPress={() => {onChange(o); setOpen(false);}} style={{paddingHorizontal: 20, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Txt size={14} w={o === value ? 'semibold' : 'regular'}>{o}</Txt>
                  {o === value && <Check size={16} color={colors.success} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Checkbox row (`.check-row`). */
export function CheckRow({checked, onChange, children}: {checked: boolean; onChange: (v: boolean) => void; children: ReactNode}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked}} onPress={() => onChange(!checked)} style={{flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16}}>
      <View style={{width: 18, height: 18, marginTop: 2, borderRadius: 5, borderWidth: 1.5, borderColor: checked ? colors.primary : colors.mutedForeground, backgroundColor: checked ? colors.primary : colors.background, alignItems: 'center', justifyContent: 'center'}}>
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </View>
      <View style={{flex: 1}}>{children}</View>
    </Pressable>
  );
}

/* ---------- Photo with CSS object-position emulation ---------- */
export function Photo({source, width, height, radius = 0, radiusStyle, posY = 0.5, style, alt}: {source: ImageSourcePropType; width?: number; height: number; radius?: number; radiusStyle?: ViewStyle; posY?: number; style?: StyleProp<ViewStyle>; alt?: string}) {
  const [measured, setMeasured] = useState(width ?? 0);
  const w = width ?? measured;
  const onLayout = (e: LayoutChangeEvent) => width == null && setMeasured(e.nativeEvent.layout.width);
  const scale = w ? Math.max(w / 768, height / 1024) : 1;
  const iw = 768 * scale;
  const ih = 1024 * scale;
  return (
    <View onLayout={onLayout} accessibilityLabel={alt} accessibilityRole="image" style={[{width: width ?? '100%', height, overflow: 'hidden', borderRadius: radius}, radiusStyle, style]}>
      {w > 0 && <Image source={source} style={{position: 'absolute', width: iw, height: ih, left: -(iw - w) / 2, top: -(ih - height) * posY}} />}
    </View>
  );
}
