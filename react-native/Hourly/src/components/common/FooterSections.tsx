import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { HStaffLogo } from './HStaffLogo';

interface FooterSectionsProps {
  onServicePress?: (category: string) => void;
  onWorkerPress?: () => void;
  onHelpPress?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export const FooterSections: React.FC<FooterSectionsProps> = ({
  onServicePress,
  onWorkerPress,
  onHelpPress,
  onTermsPress,
  onPrivacyPress,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <HStaffLogo size="medium" />
        <Text style={styles.tagline}>
          Reliable local help for everyday tasks, repairs, and home services.
        </Text>
      </View>

      <View style={styles.sectionsGrid}>
        {/* Explore */}
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <TouchableOpacity onPress={() => onServicePress?.('Cleaning')} style={styles.linkRow}>
            <Text style={styles.linkText}>Services & Rates</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onHelpPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onHelpPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Coverage Areas</Text>
          </TouchableOpacity>
        </View>

        {/* For Professionals */}
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>PROFESSIONALS</Text>
          <TouchableOpacity onPress={() => onWorkerPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Join as Partner</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onWorkerPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Partner Helpdesk</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onWorkerPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Daily Payouts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionsGrid}>
        {/* Support */}
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <TouchableOpacity onPress={() => onHelpPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Help Centre & FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onHelpPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Raise a Query</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onHelpPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Safety & Trust</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <TouchableOpacity onPress={() => onTermsPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPrivacyPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onTermsPress?.()} style={styles.linkRow}>
            <Text style={styles.linkText}>Cancellation Policy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trust pill */}
      <View style={styles.trustBanner}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.green} />
        <Text style={styles.trustText}>Aadhaar Verified Staff · Instant Support in Maharashtra</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomBar}>
        <Text style={styles.copyright}>© {currentYear} HStaff Technologies India. All rights reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F8F6',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5E2',
  },
  brandRow: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  tagline: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginTop: 10,
    maxWidth: 290,
  },
  sectionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionCol: {
    flex: 1,
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.navy,
    marginBottom: 10,
  },
  linkRow: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 13,
    color: '#4A4D5E',
    lineHeight: 18,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5E2',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.navy,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E5E2',
    marginVertical: 12,
  },
  bottomBar: {
    alignItems: 'center',
  },
  copyright: {
    fontSize: 11,
    color: '#8C8E9A',
    textAlign: 'center',
  },
});
