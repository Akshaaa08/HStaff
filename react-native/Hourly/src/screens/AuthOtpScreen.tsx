import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
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
  const [resendTimer, setResendTimer] = useState<number>(30);
  const inputRef = useRef<TextInput>(null);

  // Auto-fill code when notification payload arrives from backend
  useEffect(() => {
    if (latestOtpNotification?.otp) {
      setOtp(latestOtpNotification.otp);
    }
  }, [latestOtpNotification?.otp]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit verification code.');
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
    if (resendTimer > 0) return;
    setResendNotice('Sending new OTP code...');
    setResendTimer(30);
    requestOtp(phone, () => {
      setResendNotice('New verification code sent via notification!');
      setTimeout(() => setResendNotice(''), 4000);
    });
  };

  // Render 6 OTP boxes
  const otpDigits = otp.split('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTopBar title="" onBack={onBack} />

        {/* Real-time In-App OTP Notification Delivery Banner */}
        {latestOtpNotification ? (
          <TouchableOpacity
            activeOpacity={0.88}
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
                <Text style={styles.bannerTime}>Just now</Text>
              </View>
              <Text style={styles.bannerDetail}>{latestOtpNotification.detail}</Text>
              <Text style={styles.bannerAction}>Tap to auto-fill code ({latestOtpNotification.otp}) →</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerBlock}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.coral} />
          </View>
          <Text style={styles.headline}>Verify mobile number</Text>
          <Text style={styles.subhead}>
            We've sent a 6-digit code to{' '}
            <Text style={styles.phoneHighlight}>+91 {phone}</Text>
          </Text>
          <TouchableOpacity onPress={onBack} style={styles.editPhoneBtn}>
            <Text style={styles.editPhoneText}>Change phone number</Text>
          </TouchableOpacity>
        </View>

        {/* 6 Digit Input Display Card */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.boxesRow}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = otpDigits[index] || '';
              const isCurrent = otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.digitBox,
                    digit ? styles.digitBoxFilled : null,
                    isCurrent ? styles.digitBoxActive : null,
                    error ? styles.digitBoxError : null,
                  ]}
                >
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Hidden actual text input for keyboard */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(val) => {
              const digits = val.replace(/\D/g, '').slice(0, 6);
              setOtp(digits);
              if (error) setError('');
            }}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            maxLength={6}
            autoFocus
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {resendNotice ? (
            <Text style={styles.resendNoticeText}>{resendNotice}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator color={Colors.coral} size="large" />
            ) : (
              <GradientButton text="Verify & continue" onPress={handleVerify} />
            )}
          </View>

          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerBold}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResend}
                disabled={isLoading}
              >
                <Text style={styles.resendLink}>Resend verification code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
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
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    color: Colors.navy,
  },
  bannerTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bannerDetail: {
    fontSize: 12,
    color: Colors.navy,
    marginBottom: 4,
  },
  bannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.pink,
  },
  headerBlock: {
    alignItems: 'center',
    marginVertical: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subhead: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: Colors.navy,
  },
  editPhoneBtn: {
    marginTop: 6,
    paddingVertical: 4,
  },
  editPhoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.pink,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 8,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E5E2',
    backgroundColor: '#F8F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFilled: {
    borderColor: Colors.navy,
    backgroundColor: '#FFFFFF',
  },
  digitBoxActive: {
    borderColor: Colors.pink,
    borderWidth: 2,
  },
  digitBoxError: {
    borderColor: Colors.destructive,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.navy,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    height: 1,
    width: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendNoticeText: {
    color: Colors.green,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: Colors.navy,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.coral,
  },
});
