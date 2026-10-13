import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { StateSymbol } from '../components/common/StateSymbol';
import { GradientButton } from '../components/common/GradientButton';

interface AuthPhoneScreenProps {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

export const AuthPhoneScreen: React.FC<AuthPhoneScreenProps> = ({ onBack, onOtpSent }) => {
  const { requestOtp, isLoading, errorMessage, clearError } = useApp();
  const [phone, setPhone] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const handleSubmit = () => {
    const clean = phone.trim();
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setLocalError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLocalError('');
    clearError();
    requestOtp(clean, () => onOtpSent(clean));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Your mobile number" onBack={onBack} />

      <StateSymbol>
        <Ionicons name="call" size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.headline}>Let's stay connected.</Text>
      <Text style={styles.subhead}>
        We'll send a code to verify your mobile number.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Mobile number</Text>
        <View style={styles.phoneInputRow}>
          <Text style={styles.countryCode}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            value={phone}
            onChangeText={(val) => {
              const digits = val.replace(/\D/g, '').slice(0, 10);
              setPhone(digits);
              if (localError) setLocalError('');
            }}
            placeholder="98765 43210"
            placeholderTextColor={Colors.mutedFg}
            keyboardType="phone-pad"
            style={styles.textInput}
            maxLength={10}
            autoFocus
          />
        </View>

        {(localError || errorMessage) && (
          <Text style={styles.errorText}>{localError || errorMessage}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.coral} size="large" />
        ) : (
          <GradientButton text="Send verification code" onPress={handleSubmit} />
        )}
      </View>

      <Text style={styles.disclaimer}>
        Prototype sign-in. Demo code 123456 is active. No SMS will be sent.
      </Text>
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
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
  disclaimer: {
    fontSize: 12,
    color: Colors.mutedFg,
    textAlign: 'center',
    lineHeight: 18,
  },
});
