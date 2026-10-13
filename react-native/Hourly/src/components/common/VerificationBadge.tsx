import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export const VerificationBadge: React.FC = () => {
  return (
    <View style={styles.badge}>
      <Ionicons name="shield-checkmark" size={13} color={Colors.success} />
      <Text style={styles.text}>ID Verified</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
});
