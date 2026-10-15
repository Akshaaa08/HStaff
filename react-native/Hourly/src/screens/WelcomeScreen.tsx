import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
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

      {/* Platform Features Showcase */}
      <View style={styles.showcaseCard}>
        <LinearGradient
          colors={Colors.softGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.showcaseGradient}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="navigate-circle" size={24} color={Colors.coral} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Live GPS Matching</Text>
              <Text style={styles.featureDesc}>Verified professionals on map with real distance & live route</Text>
            </View>
          </View>

          <View style={styles.showcaseDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="shield-checkmark" size={24} color="#00875A" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>100% ID Verified Staff</Text>
              <Text style={styles.featureDesc}>Background-checked helpers ready at your doorstep</Text>
            </View>
          </View>

          <View style={styles.showcaseDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="pricetag" size={24} color={Colors.pink} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Hourly Upfront Pricing</Text>
              <Text style={styles.featureDesc}>Pay strictly for the hours you need · Zero hidden fees</Text>
            </View>
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
  showcaseCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  showcaseGradient: {
    padding: 20,
    borderRadius: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.foreground,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontWeight: '500',
    marginTop: 2,
  },
  showcaseDivider: {
    height: 1,
    backgroundColor: '#EFEAE6',
    marginVertical: 14,
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
