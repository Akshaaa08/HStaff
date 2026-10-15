import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';

interface OtpDisplayProps {
  code: string;
  label?: string;
}

export const OtpDisplay: React.FC<OtpDisplayProps> = ({ code, label }) => {
  const digits = code.split('');

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.boxesRow}>
        {digits.map((digit, index) => (
          <View key={index} style={styles.box}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginBottom: 8,
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    width: 46,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.coral,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
  },
});
