import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface SplashScreenProps {
  isAuthenticated: boolean;
  onFinish: (to: 'home' | 'welcome') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isAuthenticated, onFinish }) => {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 10, stiffness: 80 });

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
    <LinearGradient colors={Colors.brandGradient} style={styles.container}>
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconH}>H</Text>
        </View>
        <Text style={styles.brandTitle}>H-Staff</Text>
        <Text style={styles.tagline}>Good people. Great help.</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconH: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.coral,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
