import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { sampleProfessionals } from '../types';
import { GradientButton } from '../components/common/GradientButton';
import { OutlinedButton } from '../components/common/OutlinedButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const actions = (
    <View style={[styles.actionsContainer, isDesktop && styles.desktopActionsContainer]}>
      <GradientButton
        text="Sign up to hire help"
        onPress={onGetStarted}
        style={styles.ctaButton}
      />

      <OutlinedButton
        text="Sign up to work as a helper"
        onPress={onGetStarted}
        style={styles.workerButton}
      />

      <View style={styles.loginRow}>
        <Text style={styles.alreadyText}>Already have an account? </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onLogin}>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.desktopHeader]}>
        <View style={styles.logoRow}>
          <Text style={styles.logoH}>H</Text>
          <Text style={styles.logoText}>-Staff</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onLogin} style={styles.loginHeaderBtn}>
          <Text style={styles.loginHeaderText}>Log in</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.heroLayout, isDesktop && styles.desktopHeroLayout]}>
        <View style={isDesktop && styles.desktopHeroCopy}>
          {/* Verified pill */}
          <View style={styles.pillContainer}>
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.pink} />
              <Text style={styles.verifiedPillText}>Verified help across Maharashtra</Text>
            </View>
          </View>

          {/* Hero Headline */}
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTextMain, isDesktop && styles.desktopHeroText]}>
              Good people.
            </Text>
            <Text style={[styles.heroTextGradient, isDesktop && styles.desktopHeroText]}>
              Great help.
            </Text>
            <Text style={[styles.heroTextSub, isDesktop && styles.desktopHeroText]}>
              Right next door.
            </Text>
          </View>

          <Text style={[styles.tagline, isDesktop && styles.desktopTagline]}>
            Book trusted local professionals in minutes — or earn on your own terms.
          </Text>
          {isDesktop && actions}
        </View>

        {/* Photo Collage & Floating Badges */}
        <View style={[styles.collageContainer, isDesktop && styles.desktopCollageContainer]}>
          <LinearGradient
            colors={Colors.brandGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.collageGradient, isDesktop && styles.desktopCollageGradient]}
          >
            <View style={styles.avatarsRow}>
              <Image
                source={{ uri: sampleProfessionals[0].imageUrl }}
                style={[styles.collageImage, styles.imageSunita, isDesktop && styles.desktopImage]}
              />
              <Image
                source={{ uri: sampleProfessionals[1].imageUrl }}
                style={[styles.collageImage, styles.imageRahul, isDesktop && styles.desktopImage]}
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
      </View>

      {/* Call to Actions */}
      {!isDesktop && actions}
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
  desktopContent: {
    width: '100%',
    maxWidth: 1320,
    minHeight: '100%',
    alignSelf: 'center',
    paddingHorizontal: 56,
    paddingTop: 28,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  desktopHeader: {
    marginBottom: 52,
  },
  heroLayout: {
    flexDirection: 'column',
  },
  desktopHeroLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
  },
  desktopHeroCopy: {
    flex: 1,
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
  desktopHeroText: {
    fontSize: 54,
    lineHeight: 62,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.mutedFg,
    lineHeight: 22,
    marginBottom: 24,
  },
  desktopTagline: {
    maxWidth: 460,
    fontSize: 17,
    lineHeight: 27,
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
  desktopCollageContainer: {
    flex: 1,
    marginBottom: 0,
    borderRadius: 32,
  },
  collageGradient: {
    height: 230,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  desktopCollageGradient: {
    height: 440,
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
  desktopImage: {
    width: 172,
    height: 260,
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
  desktopActionsContainer: {
    maxWidth: 460,
    gap: 14,
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
