import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { MapMockup } from '../../components/common/MapMockup';
import { GradientButton } from '../../components/common/GradientButton';

interface LocationScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({ onBack, onContinue }) => {
  const { session, draft, updateDraft } = useApp();

  const savedAddresses = [
    `Home · 24, Green Park, Baner, ${session.city}`,
    `Office · 12, Business Square, ${session.city}`,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Service Location" onBack={onBack} />
      <BookingProgressBar step={3} />

      <Text style={styles.headline}>Where can we help?</Text>
      <Text style={styles.subhead}>Choose where your professional should arrive.</Text>

      {/* Interactive Map Visual */}
      <MapMockup address={draft.address} />

      {/* Service Availability Tag */}
      <View style={styles.verifiedZoneRow}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        <Text style={styles.verifiedZoneText}>H-Staff instant coverage active in Baner & {session.city}</Text>
      </View>

      {/* Address Selection */}
      <Text style={styles.sectionLabel}>Saved addresses</Text>
      <View style={styles.addressesList}>
        {savedAddresses.map((addr) => {
          const parts = addr.split(' · ');
          const title = parts[0];
          const detail = parts[1] || addr;
          return (
            <ChoiceCard
              key={addr}
              title={title}
              detail={detail}
              selected={draft.address === addr}
              onClick={() => updateDraft({ address: addr })}
              leadingContent={<Ionicons name="location" size={18} color={Colors.coral} />}
            />
          );
        })}
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton text="Find professionals →" onPress={onContinue} />
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
    marginBottom: 8,
  },
  verifiedZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  verifiedZoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 10,
  },
  addressesList: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
