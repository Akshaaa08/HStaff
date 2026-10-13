import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { PriceBreakdownCard } from '../../components/common/PriceBreakdownCard';
import { GradientButton } from '../../components/common/GradientButton';
import { professionalFor } from '../../types';

interface SummaryScreenProps {
  onBack: () => void;
  onConfirmed: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ onBack, onConfirmed }) => {
  const { draft, sendRequest } = useApp();
  const professional = professionalFor(draft.selectedProId);

  const whenLabel =
    draft.mode === 'INSTANT'
      ? 'Today · Instant dispatch (~30 mins)'
      : `${draft.date || 'Scheduled'} at ${draft.time || '10:00 AM'}`;

  const handleSubmit = () => {
    sendRequest(onConfirmed);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Booking Summary" onBack={onBack} />
      <BookingProgressBar step={5} />

      <Text style={styles.headline}>Let's make it happen.</Text>
      <Text style={styles.subhead}>Everything upfront. Just the way it should be.</Text>

      {/* Pro Details & Request Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.proRow}>
          <Image source={{ uri: professional.imageUrl }} style={styles.avatar} />
          <View style={styles.proInfo}>
            <Text style={styles.proName}>{professional.name}</Text>
            <VerificationBadge />
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={styles.ratingText}>
                {professional.rating} · {professional.jobs} jobs completed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailVal}>{draft.service}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>When</Text>
          <Text style={styles.detailVal}>{whenLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailVal}>
            {draft.hours} {draft.hours === 1 ? 'hour' : 'hours'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Specific task</Text>
          <Text style={styles.detailVal}>{draft.task}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Materials</Text>
          <Text style={styles.detailVal}>{draft.materials}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={16} color={Colors.coral} />
          <Text numberOfLines={2} style={styles.locationText}>
            {draft.address}
          </Text>
        </View>
      </View>

      {/* Price Breakdown */}
      <PriceBreakdownCard rate={professional.ratePerHour} hours={draft.hours} />

      {/* Trust Notice */}
      <View style={styles.trustBox}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
        <Text style={styles.trustText}>
          Your professional will confirm the request within 3 minutes. You only pay after work is done.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton text="Send service request →" onPress={handleSubmit} />
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 8,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 8,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 74,
    borderRadius: 16,
  },
  proInfo: {
    flex: 1,
  },
  proName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.mutedFg,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    maxWidth: '65%',
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.mutedBg,
    padding: 10,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.foreground,
    flex: 1,
    lineHeight: 16,
  },
  trustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successSoft,
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  trustText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 4,
  },
});
