import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { StateSymbol } from '../components/common/StateSymbol';
import { GradientButton } from '../components/common/GradientButton';

interface AuthOtpScreenProps {
  phone: string;
  onBack: () => void;
  onAuthenticated: (isProfileComplete?: boolean) => void;
}

export const AuthOtpScreen: React.FC<AuthOtpScreenProps> = ({ phone, onBack, onAuthenticated }) => {
  const { verifyOtp, requestOtp, isLoading, latestOtpNotification } = useApp();
  const [otp, setOtp] = useState<string>(latestOtpNotification?.otp || '');
  const [error, setError] = useState<string>('');
  const [resendNotice, setResendNotice] = useState<string>('');

  // Auto-fill code when notification payload arrives from backend
  React.useEffect(() => {
    if (latestOtpNotification?.otp) {
      setOtp(latestOtpNotification.otp);
    }
  }, [latestOtpNotification?.otp]);

  const handleVerify = () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    verifyOtp(
      phone,
      otp,
      (isProfileComplete) => onAuthenticated(isProfileComplete),
      (errMsg) => setError(errMsg)
    );
  };

  const handleResend = () => {
    setResendNotice('Sending new OTP via notification...');
    requestOtp(phone, () => {
      setResendNotice('New verification code sent to your notification!');
      setTimeout(() => setResendNotice(''), 4000);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Verify your mobile" onBack={onBack} />

      {/* Real-time In-App OTP Notification Delivery Banner */}
      {latestOtpNotification ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.notificationBanner}
          onPress={() => {
            setOtp(latestOtpNotification.otp);
            setError('');
          }}
        >
          <View style={styles.bannerIconCircle}>
            <Ionicons name="notifications" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTextCol}>
            <View style={styles.bannerHeaderRow}>
              <Text style={styles.bannerTitle}>{latestOtpNotification.title}</Text>
              <Text style={styles.bannerTime}>Now</Text>
            </View>
            <Text style={styles.bannerDetail}>{latestOtpNotification.detail}</Text>
            <Text style={styles.bannerAction}>Tap here to auto-fill code ({latestOtpNotification.otp})</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <StateSymbol>
        <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.headline}>A quick check.</Text>
      <Text style={styles.subhead}>
        Enter the six-digit code sent via notification to +91 {phone} to continue.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Verification code</Text>
        <View style={styles.otpInputContainer}>
          <TextInput
            value={otp}
            onChangeText={(val) => {
              const digits = val.replace(/\D/g, '').slice(0, 6);
              setOtp(digits);
              if (error) setError('');
            }}
            placeholder="• • • • • •"
            placeholderTextColor={Colors.mutedFg}
            keyboardType="number-pad"
            style={styles.textInput}
            maxLength={6}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {resendNotice ? <Text style={styles.resendNoticeText}>{resendNotice}</Text> : null}
      </View>

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.coral} size="large" />
        ) : (
          <GradientButton text="Verify & continue" onPress={handleVerify} />
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleResend}
        style={styles.resendBtn}
        disabled={isLoading}
      >
        <Text style={styles.resendText}>Didn't receive it? Resend Notification</Text>
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  notificationBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF4EE',
    borderColor: '#FFD3C2',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
  },
  bannerTime: {
    fontSize: 11,
    color: Colors.mutedFg,
  },
  bannerDetail: {
    fontSize: 12,
    color: Colors.mutedFg,
    lineHeight: 16,
    marginTop: 2,
  },
  bannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coral,
    marginTop: 6,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.5,
    marginTop: 12,
  },
  subhead: {
    fontSize: 16,
    color: Colors.mutedFg,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 28,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
  },
  otpInputContainer: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: 10,
    textAlign: 'center',
    padding: 0,
  },
  errorText: {
    fontSize: 13,
    color: Colors.destructive,
    marginTop: 8,
    fontWeight: '500',
  },
  resendNoticeText: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 12,
  },
  resendBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coral,
  },
});
