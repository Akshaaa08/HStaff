// Brand palette translated from Kotlin & CSS OKLCH tokens
export const Colors = {
  // Brand colors
  peach: '#FFDDC1',
  coral: '#FF9C7A',
  pink: '#E96B9A',
  softPink: '#FDE8EE',
  mint: '#D2F5E6',
  lavender: '#E8E3F8',
  yellow: '#FDF3CB',

  // Semantics
  background: '#FFFFFF',
  canvas: '#F1EDEA',
  foreground: '#1F1F2E',
  mutedBg: '#F7F5F2',
  mutedFg: '#6E6E8A',

  success: '#2D7D5A',
  successSoft: '#E8F5ED',
  destructive: '#B93030',
  destructiveSoft: '#FDF0F0',

  border: '#E8E2DB',
  cardBg: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.88)',

  // Gradients
  brandGradient: ['#FF9C7A', '#E96B9A'] as const,
  peachGradient: ['#FFDDC1', '#FF9C7A'] as const,
  mintGradient: ['#D2F5E6', '#A7E8CD'] as const,
  softGradient: ['#FFF8F5', '#FFFFFF'] as const,

  // Dark variant support
  dark: {
    background: '#121218',
    canvas: '#1A1A22',
    foreground: '#F0EEF5',
    mutedBg: '#252530',
    mutedFg: '#8E8EA8',
    border: '#2E2E3E',
    card: '#1E1E2A',
    glass: 'rgba(30, 30, 42, 0.88)',
  },
} as const;

export type ColorName = keyof typeof Colors;
