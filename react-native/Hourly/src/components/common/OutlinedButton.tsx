import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface OutlinedButtonProps {
  text: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const OutlinedButton: React.FC<OutlinedButtonProps> = ({
  text,
  onClick,
  onPress,
  disabled = false,
  style,
  textStyle,
}) => {
  const handlePress = onClick || onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, disabled && styles.disabledText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  text: {
    color: Colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.mutedFg,
  },
});
