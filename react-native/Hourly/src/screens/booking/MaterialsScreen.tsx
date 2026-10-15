import React from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { GradientButton } from '../../components/common/GradientButton';

interface MaterialsScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const MaterialsScreen: React.FC<MaterialsScreenProps> = ({ onBack, onContinue }) => {
  const { draft, updateDraft } = useApp();

  const materialOptions = ["I'll provide them", 'Professional should bring tools'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Job Requirements" onBack={onBack} />
      <BookingProgressBar step={2} />

      <Text style={styles.headline}>Ready for a great start.</Text>
      <Text style={styles.subhead}>A few details help your professional prepare.</Text>

      {/* Materials Options */}
      <Text style={styles.sectionLabel}>Who provides the materials?</Text>
      <View style={styles.choicesList}>
        {materialOptions.map((opt) => (
          <ChoiceCard
            key={opt}
            title={opt}
            selected={draft.materials === opt}
            onClick={() => updateDraft({ materials: opt })}
          />
        ))}
      </View>

      {/* Notes Input */}
      <Text style={styles.sectionLabel}>Anything they should know?</Text>
      <Text style={styles.optionalHint}>Optional notes, directions, or special care instructions</Text>

      <View style={styles.notesContainer}>
        <TextInput
          value={draft.notes}
          onChangeText={(val) => updateDraft({ notes: val })}
          placeholder="Tell us about your space, pets, specific tasks, or landmarks…"
          placeholderTextColor={Colors.mutedFg}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton text="Choose location →" onPress={onContinue} />
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
    marginBottom: 8,
    marginTop: 6,
  },
  optionalHint: {
    fontSize: 12,
    color: Colors.mutedFg,
    marginBottom: 10,
  },
  choicesList: {
    marginBottom: 16,
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 24,
  },
  notesInput: {
    fontSize: 14,
    color: Colors.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
