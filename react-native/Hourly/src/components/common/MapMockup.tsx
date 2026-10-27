import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface MapMockupProps {
  address?: string;
  tracking?: boolean;
  etaMinutes?: number;
}

export const MapMockup: React.FC<MapMockupProps> = ({
  address = 'Home · 24, Green Park, Baner, Pune',
  tracking = false,
  etaMinutes = 14,
}) => {
  return (
    <View style={styles.container}>
      {/* Map Background Grid & Parks */}
      <View style={styles.parkBlock1} />
      <View style={styles.parkBlock2} />

      {/* Main Avenues */}
      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />
      <View style={styles.roadDiagonal} />

      {/* Destination Pin (Home) */}
      <View style={styles.homePin}>
        <View style={styles.pinCircle}>
          <Ionicons name="home" size={14} color="#FFFFFF" />
        </View>
      </View>

      {/* Worker Pin (if tracking) */}
      {tracking && (
        <View style={styles.workerPin}>
          <View style={styles.workerPulse} />
          <View style={styles.workerCircle}>
            <Ionicons name="bicycle" size={15} color="#FFFFFF" />
          </View>
        </View>
      )}

      {/* Top OSM Badge */}
      <View style={styles.osmBadge}>
        <Ionicons name="map-outline" size={12} color={Colors.mutedFg} />
        <Text style={styles.osmText}>OpenStreetMap</Text>
      </View>

      {/* Bottom Floating Info Pill */}
      <View style={styles.infoPill}>
        <Ionicons
          name={tracking ? 'time-outline' : 'location-sharp'}
          size={14}
          color={tracking ? Colors.pink : Colors.coral}
        />
        <Text numberOfLines={1} style={styles.infoText}>
          {tracking ? `Arriving in ${etaMinutes} mins` : address}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F3EFEA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 12,
  },
  parkBlock1: {
    position: 'absolute',
    top: 16,
    left: 18,
    width: '32%',
    height: '38%',
    borderRadius: 20,
    backgroundColor: Colors.mint,
  },
  parkBlock2: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: '36%',
    height: '34%',
    borderRadius: 24,
    backgroundColor: Colors.mint,
  },
  roadHorizontal: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: Colors.border,
  },
  roadVertical: {
    position: 'absolute',
    left: '42%',
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.border,
  },
  roadDiagonal: {
    position: 'absolute',
    top: 0,
    right: 40,
    width: 14,
    height: '100%',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  homePin: {
    position: 'absolute',
    top: '38%',
    left: '39%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  workerPin: {
    position: 'absolute',
    top: '58%',
    left: '68%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(233, 107, 154, 0.25)',
  },
  workerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  osmBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  osmText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  infoPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    flex: 1,
  },
});
