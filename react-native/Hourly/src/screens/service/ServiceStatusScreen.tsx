import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { StateSymbol } from '../../components/common/StateSymbol';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { StatusChip } from '../../components/common/StatusChip';
import { PriceBreakdownCard } from '../../components/common/PriceBreakdownCard';
import { OtpDisplay } from '../../components/common/OtpDisplay';
import { MapMockup } from '../../components/common/MapMockup';
import { GradientButton } from '../../components/common/GradientButton';
import { OutlinedButton } from '../../components/common/OutlinedButton';
import { EmptyState } from '../../components/common/EmptyState';
import { DemoOtp, formatInr, priceFor, professionalFor, clientRateFor } from '../../types';

interface ServiceStatusScreenProps {
  onBack: () => void;
  onNavigateToPayment: () => void;
  onNavigateToDiscover: () => void;
}

export const ServiceStatusScreen: React.FC<ServiceStatusScreenProps> = ({
  onBack,
  onNavigateToPayment,
  onNavigateToDiscover,
}) => {
  const {
    session,
    elapsedSeconds,
    transitionBooking,
    cancelBooking,
    completeWithOtp,
    fetchUserBookings,
    fetchNotifications,
  } = useApp();
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');

  const booking = session.activeBooking;

  if (!booking) {
    return (
      <View style={styles.container}>
        <ScreenTopBar title="Your Booking" onBack={onBack} />
        <EmptyState
          icon={<Ionicons name="calendar-outline" size={36} color={Colors.mutedFg} />}
          title="No Active Booking"
          description="Find certified hourly help for your home and schedule in minutes."
          actionLabel="Find a Service"
          onAction={onNavigateToDiscover}
        />
      </View>
    );
  }

  const professional = professionalFor(booking.professionalId);
  const firstName = professional.name.split(' ')[0];

  // Auto-poll booking status every 3.5 seconds to instantly pick up worker acceptance
  useEffect(() => {
    if (
      booking?.status === 'REQUESTED' ||
      booking?.status === 'ACCEPTED' ||
      booking?.status === 'EN_ROUTE'
    ) {
      const interval = setInterval(() => {
        fetchUserBookings();
        fetchNotifications();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [booking?.status, fetchUserBookings, fetchNotifications]);

  // Elapsed timer formatting
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formattedTimer = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Live Booking State" onBack={onBack} />

      {/* ── Status-specific views ── */}

      {booking.status === 'REQUESTED' && (
        <View style={styles.stateBlock}>
          <StateSymbol animated>
            <Ionicons name="paper-plane" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Request Sent</Text>
          <Text style={styles.statusDesc}>
            Waiting for {firstName} to accept your request…
          </Text>
          <Text style={styles.statusSub}>
            {booking.service} · {booking.hours} {booking.hours === 1 ? 'hour' : 'hours'}
          </Text>

          <View style={styles.actionRow}>
            <OutlinedButton text="Cancel request" onPress={cancelBooking} />
          </View>
        </View>
      )}

      {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="checkmark-done" size={34} color="#FFFFFF" />
          </StateSymbol>
          <View style={styles.confirmedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.confirmedBadgeText}>REQUEST ACCEPTED BY WORKER</Text>
          </View>
          <Text style={styles.statusTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.statusDesc}>
            {firstName} accepted your request and is getting ready to help.
          </Text>
          <Text style={styles.statusSub}>
            {booking.service} · {booking.hours} {booking.hours === 1 ? 'hour' : 'hours'} · Total: {formatInr(priceFor(professional.ratePerHour, booking.hours).total)}
          </Text>

          <View style={styles.actionRow}>
            <GradientButton
              text="Track professional →"
              onPress={() => transitionBooking('EN_ROUTE')}
            />
            <View style={{ height: 10 }} />
            <OutlinedButton text="Cancel booking" onPress={cancelBooking} />
          </View>
        </View>
      )}

      {booking.status === 'DECLINED' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Request Unavailable</Text>
          <Text style={styles.statusDesc}>
            {firstName} is unable to take new jobs right now. You can choose another verified worker nearby.
          </Text>

          <View style={styles.actionRow}>
            <GradientButton
              text="Find Another Professional →"
              onPress={onNavigateToDiscover}
            />
          </View>
        </View>
      )}

      {booking.status === 'EN_ROUTE' && (
        <View style={styles.stateBlock}>
          <Text style={styles.statusTitle}>Help is on the way</Text>
          <Text style={styles.statusDesc}>
            {firstName} is en route · Arriving in ~14 mins
          </Text>

          <MapMockup
            address={booking.address}
            tracking
            etaMinutes={14}
            clientCoords={{
              latitude: booking.latitude || session.latitude || 18.5204,
              longitude: booking.longitude || session.longitude || 73.8567,
              label: booking.address,
            }}
            workerCoords={{
              latitude: professional.latitude || 18.5204,
              longitude: professional.longitude || 73.8567,
              name: professional.name,
              rate: clientRateFor(professional.ratePerHour),
            }}
            distanceKm={professional.distanceKm}
          />

          <View style={styles.actionRow}>
            <GradientButton
              text="Confirm arrival ✓"
              onPress={() => transitionBooking('ARRIVED')}
            />
            <View style={{ height: 10 }} />
            <OutlinedButton text="Cancel booking" onPress={cancelBooking} />
          </View>
        </View>
      )}

      {booking.status === 'ARRIVED' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="location" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>{firstName} has arrived!</Text>
          <Text style={styles.statusDesc}>
            Your professional is at your doorstep. Share this Task Start OTP with {firstName} so they can enter it on their device to begin:
          </Text>

          <OtpDisplay code={booking.startOtp || DemoOtp.START} label="TASK START OTP" />

          <View style={styles.otpWaitingCard}>
            <Ionicons name="key" size={20} color={Colors.coral} />
            <Text style={styles.otpWaitingText}>
              Worker will enter this 6-digit code on their device. Work timer will start automatically once verified.
            </Text>
          </View>
        </View>
      )}

      {booking.status === 'IN_PROGRESS' && (
        <View style={styles.stateBlock}>
          <StateSymbol animated>
            <Ionicons name="time" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusBadge}>TASK IN PROGRESS</Text>
          <Text style={styles.statusTitle}>{booking.service} with {firstName}</Text>

          {/* Live Timer Display */}
          <View style={styles.timerCard}>
            <Text style={styles.timerDigits}>{formattedTimer}</Text>
            <Text style={styles.timerCaption}>Active duration</Text>
          </View>

          <View style={styles.actionRow}>
            <GradientButton
              text="Finish Task & Pay (No OTP Needed) →"
              onPress={() => transitionBooking('COMPLETED_PENDING_PAYMENT')}
            />
          </View>
        </View>
      )}

      {booking.status === 'COMPLETED_PENDING_PAYMENT' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="checkmark-done-circle" size={36} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Task Completed!</Text>
          <Text style={styles.statusDesc}>
            {firstName} has finished the work. No completion OTP needed. You can now proceed to pay via Razorpay or Cash.
          </Text>

          <PriceBreakdownCard rate={professional.ratePerHour} hours={booking.hours} />

          <View style={styles.actionRow}>
            <GradientButton
              text="Proceed to Payment (Razorpay / Cash) →"
              onPress={onNavigateToPayment}
            />
          </View>
        </View>
      )}

      {(booking.status === 'PAYMENT_PENDING' || booking.status === 'FAILED') && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="card" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Ready for Payment</Text>
          <Text style={styles.statusDesc}>
            Your service is safely finished. Total due in INR:
          </Text>

          <PriceBreakdownCard rate={professional.ratePerHour} hours={booking.hours} />

          <View style={styles.actionRow}>
            <GradientButton
              text="Continue to Payment →"
              onPress={onNavigateToPayment}
            />
          </View>
        </View>
      )}

      {booking.status === 'CLOSED' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>All Taken Care Of</Text>
          <Text style={styles.statusDesc}>
            Your service is complete and paid. Thank you for using HStaff!
          </Text>

          <View style={styles.actionRow}>
            <GradientButton text="Book Another Service" onPress={onNavigateToDiscover} />
          </View>
        </View>
      )}

      {booking.status === 'CANCELLED' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="close-circle" size={34} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Booking Cancelled</Text>
          <Text style={styles.statusDesc}>
            No payment was charged. You can book another professional anytime.
          </Text>

          <View style={styles.actionRow}>
            <GradientButton text="Find Someone Else" onPress={onNavigateToDiscover} />
          </View>
        </View>
      )}

      {/* ── Persistent Worker Details Card ── */}
      {booking.status !== 'CANCELLED' && booking.status !== 'CLOSED' && (
        <View style={styles.workerPersistentCard}>
          <View style={styles.workerRow}>
            <Image source={{ uri: professional.imageUrl }} style={styles.workerThumb} />
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{professional.name}</Text>
              <VerificationBadge />
              <Text style={styles.workerMeta}>
                {booking.service} · {formatInr(priceFor(professional.ratePerHour, booking.hours).total)}
              </Text>
            </View>
            <StatusChip label={booking.status} />
          </View>

          <View style={styles.workerAddressRow}>
            <Ionicons name="location-outline" size={14} color={Colors.mutedFg} />
            <Text numberOfLines={1} style={styles.workerAddressText}>
              {booking.address}
            </Text>
          </View>
        </View>
      )}
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
  stateBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.pink,
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: 6,
  },
  statusDesc: {
    fontSize: 14,
    color: Colors.mutedFg,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 8,
  },
  statusSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 16,
  },
  actionRow: {
    width: '100%',
    marginTop: 16,
  },
  otpVerifyCard: {
    width: '100%',
    backgroundColor: Colors.mutedBg,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  otpCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  otpCardSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 4,
    marginBottom: 12,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpTextInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 4,
  },
  verifyBtn: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.coral,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  otpErrorText: {
    color: Colors.destructive,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  timerCard: {
    backgroundColor: '#FFF7F4',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.coral,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginVertical: 16,
  },
  timerDigits: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.coral,
    letterSpacing: 2,
  },
  timerCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginTop: 4,
  },
  workerPersistentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 12,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerThumb: {
    width: 54,
    height: 64,
    borderRadius: 14,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  workerMeta: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontWeight: '500',
    marginTop: 2,
  },
  workerAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  workerAddressText: {
    fontSize: 12,
    color: Colors.mutedFg,
    flex: 1,
  },
  otpWaitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF2EE',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD4C8',
  },
  otpWaitingText: {
    flex: 1,
    fontSize: 12,
    color: Colors.foreground,
    fontWeight: '600',
    lineHeight: 18,
  },
});
