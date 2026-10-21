import React from 'react';
import { StyleSheet, View, Image, ImageStyle, StyleProp } from 'react-native';

interface HStaffLogoProps {
  size?: 'small' | 'medium' | 'large' | number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ImageStyle>;
}

export const HStaffLogo: React.FC<HStaffLogoProps> = ({
  size = 'medium',
  style,
}) => {
  let width = 130;
  let height = 44;

  if (typeof size === 'number') {
    width = size;
    height = Math.round(size * (44 / 130));
  } else if (size === 'small') {
    width = 96;
    height = 32;
  } else if (size === 'large') {
    width = 175;
    height = 58;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/HStaff_Logo.jpg')}
        style={[{ width, height, resizeMode: 'contain' }, style]}
        accessibilityLabel="HStaff Logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
