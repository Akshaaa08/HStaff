import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { HStaffLogo } from '../components/common/HStaffLogo';

interface SplashScreenProps {
  isAuthenticated: boolean;
  onFinish: (to: 'home' | 'welcome') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isAuthenticated, onFinish }) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });

    const timer = setTimeout(() => {
      onFinish(isAuthenticated ? 'home' : 'welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, onFinish]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Soft coral-pink background glow per C01 spec */}
      <View style={styles.glowCircle} />
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <View style={styles.logoCard}>
          <HStaffLogo size={180} />
        </View>
        <Text style={styles.tagline}>Good people. Great help. Right next door.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFF0EA',
    opacity: 0.8,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
});

