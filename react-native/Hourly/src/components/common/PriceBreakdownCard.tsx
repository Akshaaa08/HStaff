import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { formatInr, priceFor } from '../../types';

interface PriceBreakdownCardProps {
  rate: number;
  hours: number;
}

export const PriceBreakdownCard: React.FC<PriceBreakdownCardProps> = ({ rate, hours }) => {
  const breakdown = priceFor(rate, hours);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Estimated price</Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          {formatInr(rate)} × {hours} {hours === 1 ? 'hour' : 'hours'}
        </Text>
        <Text style={styles.value}>{formatInr(breakdown.charge)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Safety & support fee</Text>
        <Text style={styles.value}>{formatInr(breakdown.fee)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total estimate</Text>
        <Text style={styles.totalValue}>{formatInr(breakdown.total)}</Text>
      </View>

      <Text style={styles.note}>Pay securely after the service is completed to your satisfaction.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    marginVertical: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    color: Colors.mutedFg,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.coral,
  },
  note: {
    fontSize: 12,
    color: Colors.mutedFg,
    marginTop: 10,
    lineHeight: 16,
  },
});
