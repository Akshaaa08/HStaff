import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { StateSymbol } from '../../components/common/StateSymbol';
import { GradientButton } from '../../components/common/GradientButton';
import { formatInr, priceFor, professionalFor } from '../../types';

interface CompleteScreenProps {
  onViewBookings: () => void;
  onHome: () => void;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({ onViewBookings, onHome }) => {
  const { session } = useApp();
  const lastBooking = session.pastBookings[0] || session.activeBooking;
  const professional = lastBooking ? professionalFor(lastBooking.professionalId) : null;
  const price = lastBooking && professional ? priceFor(professional.ratePerHour, lastBooking.hours) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ height: 24 }} />

      <StateSymbol>
        <Ionicons name="sparkles" size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.kicker}>ONE LESS THING ON YOUR LIST</Text>
      <Text style={styles.headline}>Home feels better.</Text>
      <Text style={styles.subhead}>
        Your service is complete. Thank you for supporting certified local professionals with H-Staff.
      </Text>

      {/* Booking Receipt Card */}
      {lastBooking && professional && price && (
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View>
              <Text style={styles.serviceName}>{lastBooking.service}</Text>
              <Text style={styles.proName}>{professional.name}</Text>
            </View>
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>PAID</Text>
            </View>
          </View>

          <Text style={styles.bookingId}>Booking reference: {lastBooking.id}</Text>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Amount paid</Text>
            <Text style={styles.rowVal}>{formatInr(price.total)}</Text>
          </View>


          {lastBooking.paymentMethod && (
            <View style={styles.receiptRow}>
              <Text style={styles.rowLabel}>Payment via</Text>
              <Text style={styles.rowVal}>{lastBooking.paymentMethod}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <GradientButton text="View my bookings" onPress={onViewBookings} />

        <TouchableOpacity activeOpacity={0.7} onPress={onHome} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Back to home screen</Text>
        </TouchableOpacity>
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
    paddingTop: 20,
    alignItems: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.pink,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginTop: 6,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 21,
    maxWidth: 300,
    marginBottom: 24,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 28,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.foreground,
  },
  proName: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
  },
  bookingId: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 13,
    color: Colors.mutedFg,
  },
  rowVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  homeLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  homeLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
});
