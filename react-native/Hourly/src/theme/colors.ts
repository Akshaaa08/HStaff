// Brand palette translated from Design doc.md tokens
export const Colors = {
  // Brand tokens from Design doc.md Section 4.2
  navy: '#101426',
  coral: '#FF9A78',
  pink: '#E95D9B',
  green: '#168765',

  // Surfaces & Base
  background: '#FFFFFF',
  surfaceBase: '#FFFFFF',
  surfaceSubtle: '#F8F8F6',
  surfaceWarm: '#FFF8F3',
  canvas: '#F1EDEA',

  // Typography & Semantics
  foreground: '#101426',
  textPrimary: '#171923',
  textSecondary: '#737583',
  mutedBg: '#F8F8F6',
  mutedFg: '#737583',

  // Status tokens
  success: '#168765',
  successSoft: '#E6F4F0',
  destructive: '#C43D4D',
  destructiveSoft: '#FDF0F1',
  warning: '#C97922',
  warningSoft: '#FEF6EC',
  border: '#E8E5E2',
  cardBg: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.92)',

  // Category Pastel Tones
  peach: '#FFDDC1',
  softPink: '#FDE8EE',
  mint: '#D2F5E6',
  lavender: '#E8E3F8',
  yellow: '#FDF3CB',

  // Gradients
  brandGradient: ['#FF9A78', '#E95D9B'] as const,
  peachGradient: ['#FFDDC1', '#FF9A78'] as const,
  mintGradient: ['#D2F5E6', '#A7E8CD'] as const,
  softGradient: ['#FFF8F3', '#FFFFFF'] as const,
  warmHeroGradient: ['#FFF4EE', '#FDEBF2'] as const,

  // Dark variant support
  dark: {
    background: '#101426',
    canvas: '#171923',
    foreground: '#F8F8F6',
    mutedBg: '#212538',
    mutedFg: '#989AA8',
    border: '#2A2E44',
    card: '#181C30',
    glass: 'rgba(24, 28, 48, 0.92)',
  },
} as const;

export type ColorName = keyof typeof Colors;

