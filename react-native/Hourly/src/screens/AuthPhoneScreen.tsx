import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const { session, requestOtp, isLoading, errorMessage, clearError } = useApp();
  const [role, setRole] = useState<'client' | 'worker'>(session.role || 'client');
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
    requestOtp(clean, role, () => onOtpSent(clean));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Sign In / Register" onBack={onBack} />

      {/* Role Selection Tabs */}
      <View style={styles.roleTabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setRole('client');
            if (localError) setLocalError('');
          }}
          style={[styles.roleTab, role === 'client' && styles.roleTabActive]}
        >
          <Ionicons
            name="person"
            size={16}
            color={role === 'client' ? '#FFFFFF' : Colors.mutedFg}
          />
          <Text style={[styles.roleTabText, role === 'client' && styles.roleTabTextActive]}>
            Client (Hire Help)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setRole('worker');
            if (localError) setLocalError('');
          }}
          style={[styles.roleTab, role === 'worker' && styles.roleTabActive]}
        >
          <Ionicons
            name="briefcase"
            size={16}
            color={role === 'worker' ? '#FFFFFF' : Colors.mutedFg}
          />
          <Text style={[styles.roleTabText, role === 'worker' && styles.roleTabTextActive]}>
            Worker (Get Jobs)
          </Text>
        </TouchableOpacity>
      </View>

      <StateSymbol>
        <Ionicons name={role === 'worker' ? 'briefcase' : 'call'} size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.headline}>
        {role === 'worker' ? 'Worker Sign In / Register' : 'Client Sign In / Register'}
      </Text>
      <Text style={styles.subhead}>
        {role === 'worker'
          ? 'Enter your mobile to access your received requests and manage your earnings.'
          : "We'll send a code to verify your mobile number."}
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
        An authentic 6-digit verification code will be delivered instantly to your device notifications.
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
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleTabActive: {
    backgroundColor: Colors.coral,
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
