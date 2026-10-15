import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { GradientButton } from '../components/common/GradientButton';
import { OutlinedButton } from '../components/common/OutlinedButton';

interface WelcomeScreenProps {
  onGetStarted: (role: 'client' | 'worker') => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoH}>H</Text>
          <Text style={styles.logoText}>-Staff</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onLogin} style={styles.loginHeaderBtn}>
          <Text style={styles.loginHeaderText}>Log in</Text>
        </TouchableOpacity>
      </View>

      {/* Verified pill */}
      <View style={styles.pillContainer}>
        <View style={styles.verifiedPill}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.pink} />
          <Text style={styles.verifiedPillText}>Verified help across Maharashtra</Text>
        </View>
      </View>

      {/* Hero Headline */}
      <View style={styles.heroTextContainer}>
        <Text style={styles.heroTextMain}>Good people.</Text>
        <Text style={styles.heroTextGradient}>Great help.</Text>
        <Text style={styles.heroTextSub}>Right next door.</Text>
      </View>

      <Text style={styles.tagline}>
        Book trusted local professionals in minutes — or earn on your own terms.
      </Text>

      {/* Photo Collage & Floating Badges */}
      <View style={styles.collageContainer}>
        <LinearGradient
          colors={Colors.brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.collageGradient}
        >
          <View style={styles.avatarsRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
              }}
              style={[styles.collageImage, styles.imageSunita]}
            />
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              }}
              style={[styles.collageImage, styles.imageRahul]}
            />
          </View>

          {/* Floating Badges */}
          <View style={styles.badgeTopLeft}>
            <Ionicons name="star" size={13} color="#D97706" />
            <Text style={styles.badgeText}>4.9 rated</Text>
          </View>

          <View style={styles.badgeTopRight}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.success} />
            <Text style={styles.badgeText}>ID verified</Text>
          </View>

          <View style={styles.badgeBottomCenter}>
            <Text style={styles.badgeText}>₹250/hr · no hidden fees</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Call to Actions */}
      <View style={styles.actionsContainer}>
        <GradientButton
          text="Sign up to hire help"
          onPress={() => onGetStarted('client')}
          style={styles.ctaButton}
        />

        <OutlinedButton
          text="Sign up to work as a helper"
          onPress={() => onGetStarted('worker')}
          style={styles.workerButton}
        />

        <View style={styles.loginRow}>
          <Text style={styles.alreadyText}>Already have an account? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onLogin}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoH: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.coral,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
  },
  loginHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.mutedBg,
  },
  loginHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.softPink,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.pink,
  },
  heroTextContainer: {
    marginBottom: 12,
  },
  heroTextMain: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.foreground,
    lineHeight: 44,
  },
  heroTextGradient: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.pink,
    lineHeight: 44,
  },
  heroTextSub: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.foreground,
    lineHeight: 44,
  },
  tagline: {
    fontSize: 15,
    color: Colors.mutedFg,
    lineHeight: 22,
    marginBottom: 24,
  },
  collageContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: Colors.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  collageGradient: {
    height: 230,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  collageImage: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: Colors.mutedBg,
  },
  imageSunita: {
    width: 125,
    height: 180,
  },
  imageRahul: {
    width: 125,
    height: 160,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeBottomCenter: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  actionsContainer: {
    gap: 12,
  },
  ctaButton: {
    marginBottom: 2,
  },
  workerButton: {
    marginBottom: 6,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  alreadyText: {
    fontSize: 14,
    color: Colors.mutedFg,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.coral,
  },
});
