import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ProfessionalCard } from '../../components/common/ProfessionalCard';
import { LeafletMap } from '../../components/common/LeafletMap';
import { clientRateFor } from '../../types';

interface ProfessionalsScreenProps {
  onBack: () => void;
  onSelectProfessional: (proId: string) => void;
}

export const ProfessionalsScreen: React.FC<ProfessionalsScreenProps> = ({
  onBack,
  onSelectProfessional,
}) => {
  const { session, draft, sortMode, setSortMode, sortedProfessionals } = useApp();

  const sortOptions = ['Recommended', 'Nearest', 'Most Experienced', 'Price'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Choose Your Professional" onBack={onBack} />
      <BookingProgressBar step={4} />

      <Text style={styles.headline}>Good people. Great help.</Text>
      <Text style={styles.subhead}>
        {sortedProfessionals.length} verified professionals ready in your area for {draft.service.toLowerCase()}.
      </Text>

      {/* Interactive Leaflet Map with Client and Worker Pins */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderLeft}>
            <Ionicons name="map-outline" size={16} color={Colors.coral} />
            <Text style={styles.mapHeaderTitle}>Live Worker Locations & Distance</Text>
          </View>
          <Text style={styles.mapHeaderCount}>{sortedProfessionals.length} nearby</Text>
        </View>
        <LeafletMap
          clientCoords={{
            latitude: session.latitude || 18.5204,
            longitude: session.longitude || 73.8567,
            label: session.address || 'Your Current Location',
          }}
          workers={sortedProfessionals.map((pro) => ({
            id: pro.id,
            name: pro.name,
            latitude: pro.latitude || 18.5204,
            longitude: pro.longitude || 73.8567,
            rate: clientRateFor(pro.ratePerHour),
            service: pro.skills?.[0] || draft.service,
          }))}
          height={210}
        />
      </View>

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
        {sortedProfessionals.length > 0 ? (
          sortedProfessionals.map((pro) => (
            <ProfessionalCard
              key={pro.id}
              professional={pro}
              selected={draft.selectedProId === pro.id}
              onPress={() => onSelectProfessional(pro.id)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={36} color={Colors.mutedFg} />
            <Text style={styles.emptyTitle}>No professionals registered yet</Text>
            <Text style={styles.emptySub}>
              There are no verified staff registered for {draft.service} in your area yet.
            </Text>
          </View>
        )}
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
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  mapHeaderCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coral,
    backgroundColor: Colors.peach,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
});
