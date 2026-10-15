import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';

interface BookingProgressBarProps {
  step: number; // 1 to 5
  totalSteps?: number;
}

export const BookingProgressBar: React.FC<BookingProgressBarProps> = ({ step, totalSteps = 5 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i + 1 <= step;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                isCompleted ? styles.activeBar : styles.inactiveBar,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.stepText}>
        Step {step} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    width: '100%',
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  activeBar: {
    backgroundColor: Colors.pink,
  },
  inactiveBar: {
    backgroundColor: Colors.border,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginTop: 6,
    textAlign: 'right',
  },
});
