import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface ScreenTopBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenTopBar: React.FC<ScreenTopBarProps> = ({ title, onBack, rightAction }) => {
  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.rightContainer}>{rightAction || <View style={styles.placeholder} />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mutedBg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
});
