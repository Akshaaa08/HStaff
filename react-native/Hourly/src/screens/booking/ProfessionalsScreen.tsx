import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ProfessionalCard } from '../../components/common/ProfessionalCard';

interface ProfessionalsScreenProps {
  onBack: () => void;
  onSelectProfessional: (proId: string) => void;
}

export const ProfessionalsScreen: React.FC<ProfessionalsScreenProps> = ({
  onBack,
  onSelectProfessional,
}) => {
  const { draft, sortMode, setSortMode, sortedProfessionals } = useApp();

  const sortOptions = ['Recommended', 'Nearest', 'Top Rated', 'Price'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Choose Your Professional" onBack={onBack} />
      <BookingProgressBar step={4} />

      <Text style={styles.headline}>Good people. Great help.</Text>
      <Text style={styles.subhead}>
        {sortedProfessionals.length} verified professionals ready in your area for {draft.service.toLowerCase()}.
      </Text>

      {/* Sort Chips */}
      <View style={styles.sortRow}>
        {sortOptions.map((mode) => {
          const isSelected = sortMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              activeOpacity={0.7}
              onPress={() => setSortMode(mode)}
              style={[styles.sortChip, isSelected && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, isSelected && styles.sortTextActive]}>{mode}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Professionals List */}
      <View style={styles.list}>
        {sortedProfessionals.map((pro) => (
          <ProfessionalCard
            key={pro.id}
            professional={pro}
            selected={draft.selectedProId === pro.id}
            onPress={() => onSelectProfessional(pro.id)}
          />
        ))}
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
    marginBottom: 16,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.mutedBg,
  },
  sortChipActive: {
    backgroundColor: Colors.peach,
    borderWidth: 1,
    borderColor: Colors.coral,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  sortTextActive: {
    color: Colors.foreground,
    fontWeight: '700',
  },
  list: {
    gap: 4,
  },
});
