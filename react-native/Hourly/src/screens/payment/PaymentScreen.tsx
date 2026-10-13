import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { PriceBreakdownCard } from '../../components/common/PriceBreakdownCard';
import { GradientButton } from '../../components/common/GradientButton';
import { formatInr, priceFor, professionalFor } from '../../types';

interface PaymentScreenProps {
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onPaymentSuccess }) => {
  const { session, isLoading, simulatePayment } = useApp();
  const [method, setMethod] = useState<'UPI' | 'Cards' | 'Net Banking'>('UPI');
  const [error, setError] = useState<string>('');

  const booking = session.activeBooking;
  if (!booking) return null;

  const professional = professionalFor(booking.professionalId);
  const breakdown = priceFor(professional.ratePerHour, booking.hours);

  const handlePay = (fail: boolean = false) => {
    setError('');
    simulatePayment(method, fail, () => {
      if (fail) {
        setError("Payment couldn't be completed. Your booking is safe.");
      } else {
        onPaymentSuccess();
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Secure Payment" onBack={onBack} />

      <Text style={styles.kicker}>A JOB WELL DONE</Text>
      <Text style={styles.headline}>The finishing touch.</Text>
      <Text style={styles.subhead}>
        Pay securely after your service is complete. Prices in INR.
      </Text>

      {/* Pro Snapshot */}
      <View style={styles.proSnapshot}>
        <Text style={styles.serviceName}>{booking.service}</Text>
        <Text style={styles.proName}>Completed by {professional.name}</Text>
        <Text style={styles.bookingId}>Reference: {booking.id}</Text>
      </View>

      {/* Price breakdown */}
      <PriceBreakdownCard rate={professional.ratePerHour} hours={booking.hours} />

      {/* Payment Methods */}
      <Text style={styles.sectionHeading}>Choose payment method</Text>
      <View style={styles.methodsList}>
        <ChoiceCard
          title="UPI (GPay / PhonePe / Paytm)"
          detail="Instant zero-fee payment with UPI PIN"
          selected={method === 'UPI'}
          onClick={() => setMethod('UPI')}
          leadingContent={<Ionicons name="flash" size={18} color={Colors.coral} />}
        />
        <ChoiceCard
          title="Debit / Credit Cards"
          detail="Visa, Mastercard, RuPay cards supported"
          selected={method === 'Cards'}
          onClick={() => setMethod('Cards')}
          leadingContent={<Ionicons name="card" size={18} color={Colors.pink} />}
        />
        <ChoiceCard
          title="Net Banking"
          detail="All major Indian banks (SBI, HDFC, ICICI, etc.)"
          selected={method === 'Net Banking'}
          onClick={() => setMethod('Net Banking')}
          leadingContent={<Ionicons name="business" size={18} color="#5F4BB6" />}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.coral} size="large" />
        ) : (
          <GradientButton
            text={`Pay ${formatInr(breakdown.total)} 🔒`}
            onPress={() => handlePay(false)}
          />
        )}
      </View>

      <Text style={styles.protoDisclaimer}>
        Prototype payment · Test simulated transaction · No money will be deducted.
      </Text>

      {/* Failure test simulator */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handlePay(true)}
        style={styles.simulateFailBtn}
      >
        <Text style={styles.simulateFailText}>Simulate payment failure test</Text>
      </TouchableOpacity>
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
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.pink,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 4,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    marginTop: 4,
    marginBottom: 16,
  },
  proSnapshot: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  proName: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  bookingId: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 10,
    marginTop: 4,
  },
  methodsList: {
    marginBottom: 16,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  protoDisclaimer: {
    fontSize: 12,
    color: Colors.mutedFg,
    textAlign: 'center',
    lineHeight: 18,
  },
  simulateFailBtn: {
    marginTop: 14,
    alignItems: 'center',
    padding: 6,
  },
  simulateFailText: {
    fontSize: 12,
    color: Colors.mutedFg,
    textDecorationLine: 'underline',
  },
});
