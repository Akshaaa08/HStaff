import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { GradientButton } from '../components/common/GradientButton';
import { HStaffLogo } from '../components/common/HStaffLogo';

interface AuthPhoneScreenProps {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

export const AuthPhoneScreen: React.FC<AuthPhoneScreenProps> = ({ onBack, onOtpSent }) => {
  const { session, requestOtp, isLoading, errorMessage, clearError, setSessionRole } = useApp();
  const [role, setRole] = useState<'client' | 'worker'>(session.role || 'client');
  const [phone, setPhone] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const handleRoleToggle = (newRole: 'client' | 'worker') => {
    setRole(newRole);
    setSessionRole(newRole);
    if (localError) setLocalError('');
    clearError();
  };

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

        {/* Minimal Ecommerce-Inspired Header */}
        <View style={styles.brandHeader}>
          <HStaffLogo size="large" />
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.subhead}>
            Sign in to continue with HStaff. Fast, reliable services at your doorstep.
          </Text>
        </View>

        {/* Segmented Role Selector */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleToggle('client')}
            style={[styles.roleTab, role === 'client' && styles.roleTabActive]}
          >
            <Ionicons
              name="person"
              size={16}
              color={role === 'client' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text style={[styles.roleTabText, role === 'client' && styles.roleTabTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleToggle('worker')}
            style={[styles.roleTab, role === 'worker' && styles.roleTabActive]}
          >
            <Ionicons
              name="briefcase"
              size={16}
              color={role === 'worker' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text style={[styles.roleTabText, role === 'worker' && styles.roleTabTextActive]}>
              Professional Partner
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Mobile number</Text>
          <View style={[styles.phoneInputRow, (localError || errorMessage) ? styles.inputErrorBorder : null]}>
            <View style={styles.prefixContainer}>
              <Text style={styles.countryCode}>🇮🇳 +91</Text>
            </View>
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

          {(localError || errorMessage) ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.destructive} />
              <Text style={styles.errorText}>{localError || errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator color={Colors.coral} size="large" />
            ) : (
              <GradientButton text="Continue" onPress={handleSubmit} />
            )}
          </View>

          <Text style={styles.disclaimer}>
            We'll send a 6-digit one-time password (OTP) to verify your account securely.
          </Text>
        </View>

        {/* Footer Role Switch & Terms per C03 */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            onPress={() => handleRoleToggle(role === 'client' ? 'worker' : 'client')}
            style={styles.roleSwitchBtn}
          >
            <Text style={styles.roleSwitchText}>
              {role === 'client'
                ? 'Looking to work as a professional? '
                : 'Looking to hire help instead? '}
              <Text style={styles.roleSwitchLink}>Switch role</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to HStaff's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
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
  brandHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: -0.4,
  },
  subhead: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 300,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    gap: 4,
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
    backgroundColor: Colors.navy,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E5E2',
    backgroundColor: '#F8F8F6',
    paddingHorizontal: 14,
  },
  inputErrorBorder: {
    borderColor: Colors.destructive,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#DCD8D3',
    marginHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  roleSwitchBtn: {
    paddingVertical: 10,
  },
  roleSwitchText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  roleSwitchLink: {
    fontWeight: '700',
    color: Colors.pink,
  },
  termsText: {
    fontSize: 11,
    color: '#8C8E9A',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    maxWidth: 290,
  },
  termsLink: {
    fontWeight: '600',
    color: Colors.navy,
    textDecorationLine: 'underline',
  },
});

