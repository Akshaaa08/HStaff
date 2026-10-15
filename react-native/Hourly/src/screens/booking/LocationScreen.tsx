import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { BookingProgressBar } from '../../components/common/BookingProgressBar';
import { ChoiceCard } from '../../components/common/ChoiceCard';
import { MapMockup } from '../../components/common/MapMockup';
import { GradientButton } from '../../components/common/GradientButton';
import { getAutoGpsLocation } from '../../utils/location';

interface LocationScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({ onBack, onContinue }) => {
  const { session, draft, updateDraft } = useApp();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  const fetchGps = async () => {
    setGpsLoading(true);
    const res = await getAutoGpsLocation();
    if (res) {
      setDetectedAddress(res.displayName);
      updateDraft({ address: res.displayName });
    }
    setGpsLoading(false);
  };

  useEffect(() => {
    // Automatically fetch GPS on mount if not already set to user address
    if (!draft.address || draft.address.includes('Baner, Pune')) {
      fetchGps();
    }
  }, []);

  const addressOptions = [
    ...(detectedAddress
      ? [`📍 Current GPS Location · ${detectedAddress}`]
      : []),
    ...(session.address
      ? [`Registered Profile Address · ${session.address}`]
      : []),
    `Home · 24, Green Park, Baner, ${session.city}`,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Service Location" onBack={onBack} />
      <BookingProgressBar step={3} />

      <Text style={styles.headline}>Where can we help?</Text>
      <Text style={styles.subhead}>Choose where your professional should arrive.</Text>

      {/* Interactive Map Visual */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderLeft}>
            <Ionicons name="location-sharp" size={16} color={Colors.coral} />
            <Text style={styles.mapHeaderTitle}>Your Service Location on Map</Text>
          </View>
          <Text style={styles.mapHeaderCity}>GPS Pin</Text>
        </View>
        <MapMockup
          address={draft.address}
          clientCoords={{
            latitude: session.latitude || 18.5204,
            longitude: session.longitude || 73.8567,
            label: draft.address || 'Service Location',
          }}
        />
      </View>

      {/* Service Availability Tag */}
      <View style={styles.verifiedZoneRow}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        <Text style={styles.verifiedZoneText}>H-Staff instant coverage active in Baner & {session.city}</Text>
      </View>

      {/* Address Selection */}
      <View style={styles.addressHeaderRow}>
        <Text style={styles.sectionLabel}>Service address</Text>
        <TouchableOpacity
          style={styles.gpsDetectBtn}
          onPress={fetchGps}
          activeOpacity={0.7}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color={Colors.coral} />
          ) : (
            <>
              <Ionicons name="navigate" size={14} color={Colors.coral} />
              <Text style={styles.gpsDetectText}>Detect GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.addressesList}>
        {addressOptions.map((addr) => {
          const parts = addr.split(' · ');
          const title = parts[0];
          const detail = parts[1] || addr;
          return (
            <ChoiceCard
              key={addr}
              title={title}
              detail={detail}
              selected={draft.address === detail || draft.address === addr}
              onClick={() => updateDraft({ address: detail })}
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
  mapHeaderCity: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coral,
    backgroundColor: Colors.peach,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  gpsDetectText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coral,
  },
  addressesList: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
