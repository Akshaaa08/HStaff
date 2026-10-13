import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatusChipProps {
  label: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label }) => {
  let bg: string = Colors.mutedBg;
  let text: string = Colors.mutedFg;

  if (['Accepted', 'Confirmed', 'Paid', 'Completed'].includes(label)) {
    bg = Colors.successSoft;
    text = Colors.success;
  } else if (['On the way', 'Arrived', 'In progress', 'Completion requested'].includes(label)) {
    bg = Colors.softPink;
    text = Colors.pink;
  } else if (['Awaiting response', 'Payment pending', 'Ready to request'].includes(label)) {
    bg = Colors.peach;
    text = '#8A4810';
  } else if (['Cancelled', 'Declined', 'Issue reported', 'Payment failed'].includes(label)) {
    bg = Colors.destructiveSoft;
    text = Colors.destructive;
  }

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
