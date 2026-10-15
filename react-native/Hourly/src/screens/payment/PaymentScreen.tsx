import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
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

type PaymentGatewayMode = 'RAZORPAY' | 'CASH';
type RazorpayMethod = 'UPI' | 'Cards' | 'Net Banking';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onPaymentSuccess }) => {
  const { session, isLoading, simulatePayment } = useApp();

  // Primary Gateway Mode: Razorpay Online vs Cash on Task Completion
  const [gatewayMode, setGatewayMode] = useState<PaymentGatewayMode>('RAZORPAY');

  // Razorpay sub-methods
  const [razorpayMethod, setRazorpayMethod] = useState<RazorpayMethod>('UPI');
  const [upiIdInput, setUpiIdInput] = useState<string>(
    session.phone ? `${session.phone}@upi` : 'customer@okhdfcbank'
  );
  const [cardNumberInput, setCardNumberInput] = useState<string>('4312 8920 3410 9821');
  const [cardExpiryInput, setCardExpiryInput] = useState<string>('12/28');
  const [cardCvvInput, setCardCvvInput] = useState<string>('742');

  // Razorpay Checkout Modal State
  const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState<boolean>(false);
  const [razorpayStep, setRazorpayStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [generatedPaymentId, setGeneratedPaymentId] = useState<string>('');

  const [error, setError] = useState<string>('');

  const booking = session.activeBooking;
  if (!booking) return null;

  const professional = professionalFor(booking.professionalId);
  const breakdown = priceFor(professional.ratePerHour, booking.hours);
  const orderId = `order_${(booking.bookingId || booking.id || 'BK').replace(/-/g, '_')}`;

  // Handle Razorpay Online Payment Flow
  const handleInitiateRazorpay = () => {
    setError('');
    setRazorpayStep('checkout');
    setShowRazorpayModal(true);
  };

  const handleConfirmRazorpayCheckout = () => {
    setIsProcessingRazorpay(true);
    setRazorpayStep('processing');

    const simulatedPayId = `pay_${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
    setGeneratedPaymentId(simulatedPayId);

    // Simulate authentic 2-second bank authorization handshake
    setTimeout(() => {
      setRazorpayStep('success');
      setTimeout(() => {
        setShowRazorpayModal(false);
        setIsProcessingRazorpay(false);
        simulatePayment(
          `Razorpay (${razorpayMethod})`,
          false,
          () => {
            onPaymentSuccess();
          },
          {
            razorpayPaymentId: simulatedPayId,
            razorpayOrderId: orderId,
          }
        );
      }, 1200);
    }, 1800);
  };

  // Handle Cash on Task Completion Flow
  const handleConfirmCashPayment = () => {
    setError('');
    simulatePayment('CASH', false, () => {
      onPaymentSuccess();
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Task Completion Payment" onBack={onBack} />

      <Text style={styles.kicker}>TASK COMPLETED</Text>
      <Text style={styles.headline}>Choose Payment Option</Text>
      <Text style={styles.subhead}>
        Pay securely via Razorpay Payment Gateway or settle in Cash at your doorstep.
      </Text>

      {/* Pro Snapshot */}
      <View style={styles.proSnapshot}>
        <View style={styles.snapshotTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{booking.service}</Text>
            <Text style={styles.proName}>Completed by {professional.name}</Text>
            <Text style={styles.bookingId}>Reference: {booking.id}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-done-circle" size={16} color={Colors.success} />
            <Text style={styles.completedBadgeText}>WORK DONE</Text>
          </View>
        </View>
      </View>

      {/* Price breakdown */}
      <PriceBreakdownCard rate={professional.ratePerHour} hours={booking.hours} />

      {/* Main Payment Type Tabs */}
      <Text style={styles.sectionHeading}>Select Payment Gateway / Method</Text>

      <View style={styles.gatewayTabsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setGatewayMode('RAZORPAY')}
          style={[
            styles.gatewayTab,
            gatewayMode === 'RAZORPAY' ? styles.gatewayTabActive : styles.gatewayTabInactive,
          ]}
        >
          <View style={styles.tabBadgeRow}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={gatewayMode === 'RAZORPAY' ? '#0C2340' : Colors.mutedFg}
            />
            <Text
              style={[
                styles.gatewayTabTitle,
                gatewayMode === 'RAZORPAY' && styles.gatewayTabTitleActive,
              ]}
            >
              Razorpay Gateway
            </Text>
          </View>
          <Text style={styles.gatewayTabSub}>UPI, Cards, NetBanking</Text>
          <View style={styles.trustedTag}>
            <Text style={styles.trustedTagText}>INSTANT & SECURE</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setGatewayMode('CASH')}
          style={[
            styles.gatewayTab,
            gatewayMode === 'CASH' ? styles.gatewayTabActiveCash : styles.gatewayTabInactive,
          ]}
        >
          <View style={styles.tabBadgeRow}>
            <Ionicons
              name="cash-outline"
              size={18}
              color={gatewayMode === 'CASH' ? '#00875A' : Colors.mutedFg}
            />
            <Text
              style={[
                styles.gatewayTabTitle,
                gatewayMode === 'CASH' && styles.gatewayTabTitleActiveCash,
              ]}
            >
              Cash on Completion
            </Text>
          </View>
          <Text style={styles.gatewayTabSub}>Pay directly to worker</Text>
          <View style={styles.cashTag}>
            <Text style={styles.cashTagText}>DOORSTEP CASH</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Conditional Options: Razorpay */}
      {gatewayMode === 'RAZORPAY' && (
        <View style={styles.modeSection}>
          <View style={styles.razorpayBrandCard}>
            <View style={styles.razorpayHeaderRow}>
              <View style={styles.razorpayLogoBox}>
                <Ionicons name="card" size={20} color="#0B69FF" />
                <Text style={styles.razorpayLogoText}>Razorpay</Text>
              </View>
              <View style={styles.sslBadge}>
                <Ionicons name="lock-closed" size={12} color="#00875A" />
                <Text style={styles.sslBadgeText}>256-BIT SSL</Text>
              </View>
            </View>
            <Text style={styles.razorpayTagline}>
              Official Indian Payment Gateway · Zero convenience fee · Instant receipt
            </Text>
          </View>

          <Text style={styles.subMethodHeading}>Select Payment Channel</Text>
          <View style={styles.methodsList}>
            <ChoiceCard
              title="Razorpay UPI (GPay / PhonePe / Paytm)"
              detail="Instant zero-fee transfer via any UPI application"
              selected={razorpayMethod === 'UPI'}
              onClick={() => setRazorpayMethod('UPI')}
              leadingContent={<Ionicons name="flash" size={18} color={Colors.coral} />}
            />
            <ChoiceCard
              title="Razorpay Debit & Credit Cards"
              detail="Visa, Mastercard, RuPay & Corporate cards supported"
              selected={razorpayMethod === 'Cards'}
              onClick={() => setRazorpayMethod('Cards')}
              leadingContent={<Ionicons name="card" size={18} color="#0B69FF" />}
            />
            <ChoiceCard
              title="Razorpay Net Banking"
              detail="Direct net banking from SBI, HDFC, ICICI, Axis and 50+ banks"
              selected={razorpayMethod === 'Net Banking'}
              onClick={() => setRazorpayMethod('Net Banking')}
              leadingContent={<Ionicons name="business" size={18} color="#5F4BB6" />}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator color={Colors.coral} size="large" />
            ) : (
              <GradientButton
                text={`Pay ${formatInr(breakdown.total)} via Razorpay 🔒`}
                onPress={handleInitiateRazorpay}
              />
            )}
          </View>
        </View>
      )}

      {/* Conditional Options: Cash on Task Completion */}
      {gatewayMode === 'CASH' && (
        <View style={styles.modeSection}>
          <View style={styles.cashNoticeCard}>
            <View style={styles.cashIconBig}>
              <Ionicons name="cash" size={32} color="#00875A" />
            </View>
            <Text style={styles.cashNoticeTitle}>Doorstep Cash Settlement</Text>
            <Text style={styles.cashNoticeDesc}>
              Pay the exact amount of <Text style={styles.boldText}>{formatInr(breakdown.total)}</Text> in cash directly to <Text style={styles.boldText}>{professional.name}</Text> upon satisfactory completion of your task.
            </Text>

            <View style={styles.cashPointsList}>
              <View style={styles.pointRow}>
                <Ionicons name="checkmark-circle" size={16} color="#00875A" />
                <Text style={styles.pointText}>No digital transaction or card details required</Text>
              </View>
              <View style={styles.pointRow}>
                <Ionicons name="checkmark-circle" size={16} color="#00875A" />
                <Text style={styles.pointText}>Worker will acknowledge cash receipt in their app</Text>
              </View>
              <View style={styles.pointRow}>
                <Ionicons name="checkmark-circle" size={16} color="#00875A" />
                <Text style={styles.pointText}>Tax invoice & booking receipt will be saved to your account</Text>
              </View>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator color={Colors.coral} size="large" />
            ) : (
              <TouchableOpacity
                style={styles.cashConfirmBtn}
                onPress={handleConfirmCashPayment}
                activeOpacity={0.85}
              >
                <Ionicons name="hand-right" size={20} color="#FFFFFF" />
                <Text style={styles.cashConfirmBtnText}>
                  Confirm Cash Payment ({formatInr(breakdown.total)}) 💵
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <Text style={styles.protoDisclaimer}>
        Hourly Payment Protection · 100% Satisfaction Guarantee · Transparent Pricing
      </Text>

      {/* ── Realistic Razorpay Checkout Gateway Modal ── */}
      <Modal
        visible={showRazorpayModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isProcessingRazorpay) setShowRazorpayModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Razorpay Gateway Header */}
            <View style={styles.razorpayModalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.razorpayBrandBox}>
                  <Text style={styles.razorpayBrandText}>RAZORPAY</Text>
                  <Text style={styles.razorpayTrustedBadge}>TRUSTED BUSINESS</Text>
                </View>
                {!isProcessingRazorpay && (
                  <TouchableOpacity
                    onPress={() => setShowRazorpayModal(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.orderSummaryBox}>
                <Text style={styles.orderMerchant}>Hourly Services (Pvt) Ltd</Text>
                <Text style={styles.orderAmountDisplay}>{formatInr(breakdown.total)}</Text>
                <Text style={styles.orderIdDisplay}>Order #{orderId}</Text>
              </View>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {razorpayStep === 'checkout' && (
                <View>
                  <Text style={styles.modalSectionTitle}>
                    {razorpayMethod === 'UPI' && 'Enter UPI Virtual Payment Address (VPA)'}
                    {razorpayMethod === 'Cards' && 'Enter Card Details'}
                    {razorpayMethod === 'Net Banking' && 'Choose Your Bank'}
                  </Text>

                  {razorpayMethod === 'UPI' && (
                    <View style={styles.inputCard}>
                      <View style={styles.upiInputRow}>
                        <Ionicons name="at-outline" size={20} color={Colors.coral} />
                        <TextInput
                          value={upiIdInput}
                          onChangeText={setUpiIdInput}
                          placeholder="yourname@bank"
                          style={styles.modalInput}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.upiAppsRow}>
                        <View style={styles.appBadge}>
                          <Text style={styles.appBadgeText}>GPay</Text>
                        </View>
                        <View style={styles.appBadge}>
                          <Text style={styles.appBadgeText}>PhonePe</Text>
                        </View>
                        <View style={styles.appBadge}>
                          <Text style={styles.appBadgeText}>Paytm</Text>
                        </View>
                        <View style={styles.appBadge}>
                          <Text style={styles.appBadgeText}>BHIM</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {razorpayMethod === 'Cards' && (
                    <View style={styles.inputCard}>
                      <Text style={styles.fieldLabel}>Card Number</Text>
                      <TextInput
                        value={cardNumberInput}
                        onChangeText={setCardNumberInput}
                        style={styles.modalInputBox}
                        keyboardType="number-pad"
                      />
                      <View style={styles.cardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Expiry</Text>
                          <TextInput
                            value={cardExpiryInput}
                            onChangeText={setCardExpiryInput}
                            style={styles.modalInputBox}
                          />
                        </View>
                        <View style={{ width: 14 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>CVV</Text>
                          <TextInput
                            value={cardCvvInput}
                            onChangeText={setCardCvvInput}
                            style={styles.modalInputBox}
                            keyboardType="number-pad"
                            secureTextEntry
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {razorpayMethod === 'Net Banking' && (
                    <View style={styles.bankGrid}>
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank'].map(
                        (bank, i) => (
                          <View key={i} style={styles.bankPill}>
                            <Ionicons name="business" size={14} color="#0B69FF" />
                            <Text style={styles.bankName}>{bank}</Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                  {/* Security seal */}
                  <View style={styles.securitySealRow}>
                    <Ionicons name="shield-checkmark" size={15} color="#00875A" />
                    <Text style={styles.securitySealText}>
                      Secured by Razorpay · End-to-end 256-bit AES encryption
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.razorpayPayBtn}
                    onPress={handleConfirmRazorpayCheckout}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                    <Text style={styles.razorpayPayBtnText}>
                      Authorize & Pay {formatInr(breakdown.total)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {razorpayStep === 'processing' && (
                <View style={styles.processingBox}>
                  <ActivityIndicator size="large" color="#0B69FF" />
                  <Text style={styles.processingTitle}>Authorizing with Bank...</Text>
                  <Text style={styles.processingSub}>
                    Connecting to NPCI / Banking gateway securely. Please do not close this window.
                  </Text>
                </View>
              )}

              {razorpayStep === 'success' && (
                <View style={styles.successBox}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark-done" size={36} color="#FFFFFF" />
                  </View>
                  <Text style={styles.successTitle}>Payment Verified!</Text>
                  <Text style={styles.successSub}>
                    Razorpay Payment ID: <Text style={styles.boldText}>{generatedPaymentId}</Text>
                  </Text>
                  <Text style={styles.successDetail}>
                    Transfer of {formatInr(breakdown.total)} acknowledged. Completing booking...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 10,
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
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 4,
  },
  subhead: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  proSnapshot: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  snapshotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00875A',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 10,
    marginTop: 6,
  },
  gatewayTabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gatewayTab: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
  },
  gatewayTabActive: {
    backgroundColor: '#F0F6FF',
    borderColor: '#0B69FF',
  },
  gatewayTabActiveCash: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00875A',
  },
  gatewayTabInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#EAEAEA',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gatewayTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
  gatewayTabTitleActive: {
    color: '#0C2340',
    fontWeight: '800',
  },
  gatewayTabTitleActiveCash: {
    color: '#00875A',
    fontWeight: '800',
  },
  gatewayTabSub: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 4,
  },
  trustedTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0EEFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  trustedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B69FF',
  },
  cashTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  cashTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00875A',
  },
  modeSection: {
    marginBottom: 12,
  },
  razorpayBrandCard: {
    backgroundColor: '#0C2340',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  razorpayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  razorpayLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  razorpayLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#07182C',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sslBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#48D597',
  },
  razorpayTagline: {
    fontSize: 11,
    color: '#C3D4E6',
    marginTop: 6,
    lineHeight: 16,
  },
  subMethodHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
  },
  methodsList: {
    marginBottom: 16,
  },
  cashNoticeCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  cashIconBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cashNoticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 6,
  },
  cashNoticeDesc: {
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.foreground,
  },
  cashPointsList: {
    alignSelf: 'stretch',
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#BBF7D0',
    paddingTop: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  cashConfirmBtn: {
    backgroundColor: '#00875A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cashConfirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
    marginTop: 6,
  },

  /* Razorpay Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  razorpayModalHeader: {
    backgroundColor: '#0C2340',
    padding: 18,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  razorpayBrandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  razorpayBrandText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  razorpayTrustedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#48D597',
    backgroundColor: 'rgba(72, 213, 151, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSummaryBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderMerchant: {
    fontSize: 12,
    color: '#9BB2C9',
  },
  orderAmountDisplay: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  orderIdDisplay: {
    fontSize: 11,
    color: '#6F8BA7',
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 36,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  inputCard: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  upiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  appBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.foreground,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginBottom: 4,
  },
  modalInputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.foreground,
  },
  securitySealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  securitySealText: {
    fontSize: 11,
    color: Colors.mutedFg,
  },
  razorpayPayBtn: {
    backgroundColor: '#0B69FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0B69FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  razorpayPayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  processingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 16,
  },
  processingSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  successBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00875A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.foreground,
  },
  successSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 6,
  },
  successDetail: {
    fontSize: 13,
    color: '#00875A',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
