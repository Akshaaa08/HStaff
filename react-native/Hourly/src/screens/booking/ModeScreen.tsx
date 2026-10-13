import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { GradientButton } from '../../components/common/GradientButton';

interface ModeScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const ModeScreen: React.FC<ModeScreenProps> = ({ onBack, onContinue }) => {
  const { draft, updateDraft } = useApp();
  const [error, setError] = useState<string>('');

  const handleContinue = () => {
    if (draft.mode === 'SCHEDULED' && (!draft.date.trim() || !draft.time.trim())) {
      setError('Choose your preferred date and time.');
      return;
    }
    setError('');
    onContinue();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title={draft.service} onBack={onBack} />
      <BookingProgressBar step={1} />

      <Text style={styles.headline}>Your day. Your timing.</Text>
      <Text style={styles.subhead}>How do you want to book?</Text>

      <View style={styles.choicesSection}>
        <ChoiceCard
          title="Instant Booking"
          detail="Need someone soon? Usually arrives within ~30 minutes."
          selected={draft.mode === 'INSTANT'}
          onClick={() => updateDraft({ mode: 'INSTANT' })}
          leadingContent={<Ionicons name="flash" size={18} color={Colors.coral} />}
        />

        <ChoiceCard
          title="Scheduled Booking"
          detail="Plan ahead. Choose an exact date and arrival time."
          selected={draft.mode === 'SCHEDULED'}
          onClick={() => updateDraft({ mode: 'SCHEDULED' })}
          leadingContent={<Ionicons name="calendar" size={18} color={Colors.pink} />}
        />
      </View>

      {draft.mode === 'SCHEDULED' && (
        <View style={styles.scheduleInputs}>
          <Text style={styles.inputHeading}>Choose date and time</Text>
          <View style={styles.inputsRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                value={draft.date}
                onChangeText={(val) => updateDraft({ date: val })}
                placeholder="2026-10-15"
                placeholderTextColor={Colors.mutedFg}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Time (HH:MM)</Text>
              <TextInput
                value={draft.time}
                onChangeText={(val) => updateDraft({ time: val })}
                placeholder="10:00 AM"
                placeholderTextColor={Colors.mutedFg}
                style={styles.textInput}
              />
            </View>
          </View>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <GradientButton text="Continue →" onPress={handleContinue} />
      </View>
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
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 8,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    marginTop: 4,
    marginBottom: 20,
  },
  choicesSection: {
    marginBottom: 16,
  },
  scheduleInputs: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  inputHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
});
