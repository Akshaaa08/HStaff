import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { LeafletMap } from './LeafletMap';

interface MapMockupProps {
  address?: string;
  tracking?: boolean;
  etaMinutes?: number;
  clientCoords?: { latitude: number; longitude: number; label?: string };
  workerCoords?: { latitude: number; longitude: number; name?: string; rate?: number };
  distanceKm?: number;
}

export const MapMockup: React.FC<MapMockupProps> = ({
  address = 'Home · Baner, Pune',
  tracking = false,
  etaMinutes = 14,
  clientCoords = { latitude: 18.5204, longitude: 73.8567 },
  workerCoords,
  distanceKm,
}) => {
  // If tracking, provide estimated worker location nearby
  const activeWorkerCoords = workerCoords || (tracking
    ? {
        latitude: clientCoords.latitude + 0.008,
        longitude: clientCoords.longitude + 0.009,
        name: 'Professional on the way',
      }
    : undefined);

  return (
    <View style={styles.wrapper}>
      <LeafletMap
        clientCoords={{ ...clientCoords, label: address }}
        workerCoords={activeWorkerCoords}
        height={210}
        showRoute={tracking}
        distanceKm={distanceKm}
      />

      {/* Floating Info Pill */}
      <View style={styles.infoPill}>
        <Ionicons
          name={tracking ? 'time-outline' : 'location-sharp'}
          size={14}
          color={tracking ? Colors.pink : Colors.coral}
        />
        <Text numberOfLines={1} style={styles.infoText}>
          {tracking ? `Arriving in ~${etaMinutes} mins · Live Tracking` : address}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 10,
    width: '100%',
  },
  infoPill: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
    flex: 1,
  },
});
