import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { GradientButton } from '../../components/common/GradientButton';

interface RequirementsScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const RequirementsScreen: React.FC<RequirementsScreenProps> = ({ onBack, onContinue }) => {
  const { draft, updateDraft } = useApp();

  const taskOptions =
    draft.service === 'Cleaning'
      ? ['Regular Cleaning', 'Deep Cleaning', 'Kitchen', 'Bathroom']
      : [`${draft.service} service`, 'Repair & maintenance', 'Inspection & advice'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title={draft.service} onBack={onBack} />
      <BookingProgressBar step={2} />

      <Text style={styles.headline}>A little more about the job.</Text>
      <Text style={styles.subhead}>
        Tell us what you need. We'll find the right people.
      </Text>

      {/* Task Type */}
      <Text style={styles.sectionLabel}>What do you need help with?</Text>
      <View style={styles.choicesList}>
        {taskOptions.map((task) => (
          <ChoiceCard
            key={task}
            title={task}
            selected={draft.task === task}
            onClick={() => updateDraft({ task })}
          />
        ))}
      </View>

      {/* Duration Stepper */}
      <Text style={styles.sectionLabel}>How long do you need help?</Text>
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={draft.hours <= 1}
          onPress={() => updateDraft({ hours: Math.max(1, draft.hours - 1) })}
          style={[styles.stepperBtn, draft.hours <= 1 && styles.stepperBtnDisabled]}
        >
          <Ionicons name="remove" size={22} color={draft.hours <= 1 ? Colors.border : Colors.foreground} />
        </TouchableOpacity>

        <View style={styles.stepperValueContainer}>
          <Text style={styles.stepperValue}>{draft.hours}</Text>
          <Text style={styles.stepperLabel}>{draft.hours === 1 ? 'hour' : 'hours'}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={draft.hours >= 8}
          onPress={() => updateDraft({ hours: Math.min(8, draft.hours + 1) })}
          style={[styles.stepperBtn, draft.hours >= 8 && styles.stepperBtnDisabled]}
        >
          <Ionicons name="add" size={22} color={draft.hours >= 8 ? Colors.border : Colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text style={styles.stepperHint}>
        Rate applies per hour. You can adjust duration later if more work is needed.
      </Text>

      <View style={styles.buttonContainer}>
        <GradientButton text="Continue →" onPress={onContinue} />
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 10,
    marginTop: 6,
  },
  choicesList: {
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    marginBottom: 8,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mutedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#FAF8F5',
  },
  stepperValueContainer: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  stepperHint: {
    fontSize: 12,
    color: Colors.mutedFg,
    marginBottom: 24,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
