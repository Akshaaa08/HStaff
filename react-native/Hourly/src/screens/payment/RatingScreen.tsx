import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { StateSymbol } from '../../components/common/StateSymbol';
import { GradientButton } from '../../components/common/GradientButton';
import { professionalFor } from '../../types';

interface RatingScreenProps {
  onBack: () => void;
  onSubmitted: () => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({ onBack, onSubmitted }) => {
  const { session, submitReview } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual', 'Professional']);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');

  const booking = session.activeBooking;
  if (!booking) return null;
  const professional = professionalFor(booking.professionalId);

  const availableTags = ['Punctual', 'Professional', 'Polite', 'Skilled', 'Good Quality', 'Tidy Work'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please choose a rating.');
      return;
    }
    setError('');
    submitReview(rating, selectedTags, comment, onSubmitted);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Your Experience" onBack={onBack} />

      <StateSymbol>
        <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
      </StateSymbol>

      <Text style={styles.kicker}>PAYMENT COMPLETED</Text>
      <Text style={styles.headline}>How was {professional.name.split(' ')[0]}'s service?</Text>
      <Text style={styles.subhead}>
        Your feedback directly supports local workers and builds marketplace trust.
      </Text>

      {/* Star Row */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            activeOpacity={0.7}
            onPress={() => setRating(star)}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={36}
              color={star <= rating ? '#D97706' : Colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingNumberText}>{rating} of 5 stars</Text>

      {/* Compliment Tags */}
      <Text style={styles.sectionLabel}>What went well?</Text>
      <View style={styles.tagsContainer}>
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              activeOpacity={0.7}
              onPress={() => toggleTag(tag)}
              style={[styles.tagChip, isSelected && styles.tagChipActive]}
            >
              <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Additional Comments */}
      <Text style={styles.sectionLabel}>Anything else? (Optional)</Text>
      <View style={styles.commentBox}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share details about the quality, courtesy, or speed…"
          placeholderTextColor={Colors.mutedFg}
          multiline
          numberOfLines={3}
          style={styles.commentInput}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <GradientButton text="Submit review →" onPress={handleSubmit} />
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
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 4,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    marginTop: 6,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.mutedBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tagChipActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.coral,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  tagTextActive: {
    fontWeight: '700',
  },
  commentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 20,
  },
  commentInput: {
    fontSize: 14,
    color: Colors.foreground,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
