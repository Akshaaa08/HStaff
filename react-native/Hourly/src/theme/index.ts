import { Colors } from './colors';
import { StyleSheet, Platform } from 'react-native';

export { Colors };

export const Typography = StyleSheet.create({
  display: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.5,
  },
  headlineLarge: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  headlineMedium: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.foreground,
  },
  titleLarge: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.foreground,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.foreground,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.foreground,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.mutedFg,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.foreground,
  },
  labelMedium: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: Colors.foreground,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export const Shadows = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#1F1F2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(31, 31, 46, 0.06)',
      },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#E96B9A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(233, 107, 154, 0.2)',
      },
    }),
  },
};
