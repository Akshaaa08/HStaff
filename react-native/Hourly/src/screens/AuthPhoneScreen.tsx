import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
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

  const phoneField = (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Mobile number</Text>
      <View style={[styles.phoneInputRow, isDesktop && styles.desktopPhoneInputRow]}>
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
  );

  const submitButton = (
    <View style={[styles.buttonContainer, isDesktop && styles.desktopButtonContainer]}>
      {isLoading ? (
        <ActivityIndicator color={Colors.coral} size="large" />
      ) : (
        <GradientButton text="Send verification code" onPress={handleSubmit} />
      )}
    </View>
  );

  const disclaimerText = 'Prototype sign-in. Demo code 123456 is active. No SMS will be sent.';

  return (
    <ScrollView
      style={[styles.container, isDesktop && styles.desktopContainer]}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <View style={styles.desktopIntro}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkH}>H</Text>
              <Text style={styles.brandMarkText}>-Staff</Text>
            </View>
            <View style={styles.desktopEyebrow}>
              <Ionicons name="shield-checkmark" size={15} color={Colors.success} />
              <Text style={styles.desktopEyebrowText}>A trusted community, close to home</Text>
            </View>
            <Text style={styles.desktopHeadline}>Good work starts{'\n'}with a connection.</Text>
            <Text style={styles.desktopDescription}>
              Sign in with your mobile number to book trusted local help or find work on your terms.
            </Text>
            <View style={styles.trustList}>
              <View style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Ionicons name="location-outline" size={18} color={Colors.pink} />
                </View>
                <View>
                  <Text style={styles.trustTitle}>Local professionals</Text>
                  <Text style={styles.trustDescription}>Reliable help in your neighbourhood</Text>
                </View>
              </View>
              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, styles.trustIconMint]}>
                  <Ionicons name="time-outline" size={18} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.trustTitle}>Work on your terms</Text>
                  <Text style={styles.trustDescription}>Flexible hours that work for you</Text>
                </View>
              </View>
            </View>
            <View style={styles.desktopFootnote}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.mutedFg} />
              <Text style={styles.desktopFootnoteText}>Your number stays private and secure</Text>
            </View>
          </View>

          <View style={styles.desktopFormCard}>
            <ScreenTopBar title="Your mobile number" onBack={onBack} />
            <StateSymbol>
              <Ionicons name="call" size={30} color="#FFFFFF" />
            </StateSymbol>
            <Text style={styles.headline}>Let's stay connected.</Text>
            <Text style={styles.subhead}>We'll send a code to verify your mobile number.</Text>
            {phoneField}
            {submitButton}
            <View style={styles.desktopDisclaimerRow}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.mutedFg} />
              <Text style={styles.disclaimer}>{disclaimerText}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <ScreenTopBar title="Your mobile number" onBack={onBack} />
          <StateSymbol>
            <Ionicons name="call" size={32} color="#FFFFFF" />
          </StateSymbol>
          <Text style={styles.headline}>Let's stay connected.</Text>
          <Text style={styles.subhead}>
            We'll send a code to verify your mobile number.
          </Text>
          {phoneField}
          {submitButton}
          <Text style={styles.disclaimer}>{disclaimerText}</Text>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopContainer: {
    backgroundColor: '#F8F6F4',
  },
  content: {
    padding: 24,
    paddingTop: 12,
    flexGrow: 1,
  },
  desktopContent: {
    width: '100%',
    maxWidth: 1320,
    minHeight: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 80,
  },
  desktopIntro: {
    flex: 1,
    maxWidth: 560,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 52,
  },
  brandMarkH: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.coral,
  },
  brandMarkText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
  },
  desktopEyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: Colors.successSoft,
    marginBottom: 24,
  },
  desktopEyebrowText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  desktopHeadline: {
    color: Colors.foreground,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  desktopDescription: {
    color: Colors.mutedFg,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 18,
    maxWidth: 460,
  },
  trustList: {
    gap: 20,
    marginTop: 38,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trustIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softPink,
  },
  trustIconMint: {
    backgroundColor: Colors.successSoft,
  },
  trustTitle: {
    color: Colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  trustDescription: {
    color: Colors.mutedFg,
    fontSize: 13,
    marginTop: 3,
  },
  desktopFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 48,
  },
  desktopFootnoteText: {
    color: Colors.mutedFg,
    fontSize: 12,
  },
  desktopFormCard: {
    flex: 1,
    maxWidth: 500,
    paddingHorizontal: 36,
    paddingVertical: 30,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 20px 60px rgba(31, 31, 46, 0.08)',
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
  desktopPhoneInputRow: {
    height: 60,
    borderRadius: 14,
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
  desktopButtonContainer: {
    marginBottom: 18,
  },
  desktopDisclaimerRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.mutedFg,
    textAlign: 'center',
    lineHeight: 18,
  },
});
