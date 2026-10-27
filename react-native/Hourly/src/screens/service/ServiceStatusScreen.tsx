import React, { useState } from 'react';
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
import { DemoOtp, formatInr, priceFor, professionalFor } from '../../types';

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
  const { session, elapsedSeconds, transitionBooking, cancelBooking, completeWithOtp } = useApp();
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
          <Text style={styles.statusTitle}>Booking Confirmed</Text>
          <Text style={styles.statusDesc}>
            {firstName} accepted your request and is scheduled to help.
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

      {booking.status === 'EN_ROUTE' && (
        <View style={styles.stateBlock}>
          <Text style={styles.statusTitle}>Help is on the way</Text>
          <Text style={styles.statusDesc}>
            {firstName} is en route · Arriving in ~14 mins
          </Text>

          <MapMockup address={booking.address} tracking etaMinutes={14} />

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
            <Ionicons name="pin" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>{firstName} has arrived!</Text>
          <Text style={styles.statusDesc}>
            Check in your professional before work begins. Share this Start Code:
          </Text>

          <OtpDisplay code={DemoOtp.START} label="START CODE" />

          <View style={styles.otpVerifyCard}>
            <Text style={styles.otpCardTitle}>Confirm Start Code</Text>
            <Text style={styles.otpCardSub}>
              Enter or auto-verify 482713 to start the service timer:
            </Text>

            <View style={styles.otpInputRow}>
              <TextInput
                value={otpInput}
                onChangeText={(val) => {
                  setOtpInput(val);
                  setOtpError('');
                }}
                placeholder="482713"
                keyboardType="number-pad"
                style={styles.otpTextInput}
              />
              <TouchableOpacity
                onPress={() => {
                  if (otpInput === DemoOtp.START || !otpInput) {
                    transitionBooking('IN_PROGRESS');
                  } else {
                    setOtpError('Invalid code. Use 482713.');
                  }
                }}
                style={styles.verifyBtn}
              >
                <Text style={styles.verifyBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>

            {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}

            <GradientButton
              text="Quick Start Service (482713) →"
              onPress={() => transitionBooking('IN_PROGRESS')}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      )}

      {booking.status === 'IN_PROGRESS' && (
        <View style={styles.stateBlock}>
          <StateSymbol animated>
            <Ionicons name="time" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusBadge}>SERVICE IN PROGRESS</Text>
          <Text style={styles.statusTitle}>{booking.service} with {firstName}</Text>

          {/* Live Timer Display */}
          <View style={styles.timerCard}>
            <Text style={styles.timerDigits}>{formattedTimer}</Text>
            <Text style={styles.timerCaption}>Active duration</Text>
          </View>

          <View style={styles.actionRow}>
            <GradientButton
              text="Finish service & get end code →"
              onPress={() => transitionBooking('COMPLETED_PENDING_PAYMENT')}
            />
          </View>
        </View>
      )}

      {booking.status === 'COMPLETED_PENDING_PAYMENT' && (
        <View style={styles.stateBlock}>
          <StateSymbol>
            <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.statusTitle}>Complete Service</Text>
          <Text style={styles.statusDesc}>
            Please inspect the work. Share this Completion Code with {firstName} once satisfied:
          </Text>

          <OtpDisplay code={DemoOtp.END} label="COMPLETION CODE" />

          <View style={styles.actionRow}>
            <GradientButton
              text="Verify Completion & Pay →"
              onPress={() => {
                transitionBooking('PAYMENT_PENDING');
                onNavigateToPayment();
              }}
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
            Your service is complete and rated. Thank you for using HStaff!
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
});
