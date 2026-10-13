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
  onAuthenticated: () => void;
}

export const AuthOtpScreen: React.FC<AuthOtpScreenProps> = ({ phone, onBack, onAuthenticated }) => {
  const { verifyOtp, isLoading } = useApp();
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleVerify = () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    verifyOtp(
      phone,
      otp,
      () => onAuthenticated(),
      (errMsg) => setError(errMsg)
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Verify your mobile" onBack={onBack} />

      <StateSymbol>
        <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.headline}>A quick check.</Text>
      <Text style={styles.subhead}>
        Enter the six-digit code sent to +91 {phone} to continue.
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

        <View style={styles.demoHintRow}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.coral} />
          <Text style={styles.demoHintText}>Demo code: 123456</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
        onPress={() => {
          setOtp('123456');
          setError('');
        }}
        style={styles.resendBtn}
      >
        <Text style={styles.resendText}>Auto-fill Demo Code</Text>
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
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginTop: 8,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
    lineHeight: 20,
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
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: Colors.foreground,
  },
  demoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  demoHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.coral,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  resendBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
});
