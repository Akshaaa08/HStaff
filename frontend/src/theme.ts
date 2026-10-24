import {Platform, type TextStyle, type ViewStyle} from 'react-native';

/**
 * Design tokens, converted 1:1 from the web prototype's styles.css (OKLCH -> sRGB hex).
 * Change a value here and the whole app follows.
 */
export const colors = {
  background: '#FFFFFF',
  foreground: '#0B1020',
  primary: '#0B1020',
  primaryForeground: '#FFFFFF',
  secondary: '#F8F5F0',
  muted: '#F6F5F3',
  mutedForeground: '#5C6069',
  accent: '#FFDCE1',
  border: '#EBE7E4',
  ring: '#D68D98',
  destructive: '#BE2E31',
  success: '#095C3D',
  successSoft: '#E3F3E9',
  peach: '#FFD8C8',
  coral: '#FCB5B6',
  pink: '#F08DB7',
  softPink: '#FFD8E1',
  mint: '#D2ECDC',
  lavender: '#E8E5F8',
  yellow: '#FFEDC5',
  canvas: '#F1ECE7',
  glass: 'rgba(255,255,255,0.94)', // web used .88 + backdrop blur; RN has no cheap blur, so slightly more opaque
  scrim: 'rgba(11,16,32,0.25)',
} as const;

/** peach -> coral -> pink, 135deg (the brand gradient) */
export const brandGradient = {
  colors: [colors.peach, colors.coral, colors.pink],
  locations: [0, 0.5, 1],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
};

export const toneColor: Record<string, string> = {
  peach: colors.peach,
  yellow: colors.yellow,
  mint: colors.mint,
  lavender: colors.lavender,
  pink: colors.softPink,
};

export const space = {page: 24};

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
  script: 'KaushanScript-Regular',
} as const;
export type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export const shadows: Record<'card' | 'dock' | 'none', ViewStyle> = {
  card: {shadowColor: colors.foreground, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: {width: 0, height: 6}, elevation: 3},
  dock: {shadowColor: colors.foreground, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: {width: 0, height: 8}, elevation: 14},
  none: {},
};

export const text = (size: number, weight: Weight = 'regular', color: string = colors.foreground, lh?: number): TextStyle => ({
  fontFamily: fonts[weight],
  fontSize: size,
  color,
  ...(lh ? {lineHeight: Math.round(size * lh)} : null),
  ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
});
