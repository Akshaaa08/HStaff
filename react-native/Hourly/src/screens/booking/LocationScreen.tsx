import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
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
  const { session, draft, updateDraft, setUserLocation } = useApp();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  const fetchGps = async () => {
    setGpsLoading(true);
    const res = await getAutoGpsLocation();
    if (res) {
      setDetectedAddress(res.displayName);
      setUserLocation({
        latitude: res.latitude,
        longitude: res.longitude,
        address: res.displayName,
        city: res.city,
      });
      // Automatically save detected GPS address directly into the active booking draft
      updateDraft({
        address: res.displayName,
        latitude: res.latitude,
        longitude: res.longitude,
      });
    }
    setGpsLoading(false);
  };

  useEffect(() => {
    // Automatically fetch GPS on mount if not already set to user address
    if (!draft.address) {
      if (session.address) {
        updateDraft({
          address: session.address,
          latitude: session.latitude,
          longitude: session.longitude,
        });
      }
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
    ...(draft.address && draft.address !== detectedAddress && draft.address !== session.address
      ? [`Selected Address · ${draft.address}`]
      : []),
  ];

  const handleContinue = () => {
    const finalAddress =
      (draft.address && draft.address.trim()) ||
      (detectedAddress && detectedAddress.trim()) ||
      (session.address && session.address.trim());

    if (!finalAddress) {
      Alert.alert(
        'Address Required',
        'Please wait for GPS location detection or type your address above to continue.'
      );
      return;
    }

    if (draft.address !== finalAddress) {
      updateDraft({
        address: finalAddress,
        latitude: draft.latitude || session.latitude,
        longitude: draft.longitude || session.longitude,
      });
    }
    onContinue();
  };

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
          address={draft.address || session.address || 'Service Location'}
          clientCoords={{
            latitude: draft.latitude || session.latitude || 18.5204,
            longitude: draft.longitude || session.longitude || 73.8567,
            label: draft.address || 'Service Location',
          }}
        />
      </View>

      {/* Service Availability Tag */}
      <View style={styles.verifiedZoneRow}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        <Text style={styles.verifiedZoneText}>H-Staff instant coverage active in {session.city || 'Maharashtra'}</Text>
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

      {/* Custom Doorstep Address Input */}
      <View style={styles.customInputContainer}>
        <Text style={styles.customInputLabel}>Custom Doorstep / Flat Address</Text>
        <View style={styles.customInputBox}>
          <Ionicons name="home-outline" size={18} color={Colors.coral} />
          <TextInput
            value={draft.address}
            onChangeText={(val) => updateDraft({ address: val })}
            placeholder="e.g. Flat 304, Green Heights, Main Road..."
            placeholderTextColor={Colors.mutedFg}
            style={styles.customTextInput}
          />
          {draft.address ? (
            <TouchableOpacity onPress={() => updateDraft({ address: '' })}>
              <Ionicons name="close-circle" size={16} color={Colors.mutedFg} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton text="Find professionals →" onPress={handleContinue} />
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
    marginBottom: 16,
  },
  customInputContainer: {
    marginBottom: 20,
  },
  customInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
  },
  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customTextInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
