import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Professional, formatInr, clientRateFor } from '../../types';
import { VerificationBadge } from './VerificationBadge';

interface ProfessionalCardProps {
  professional: Professional;
  onPress: () => void;
  selected?: boolean;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onPress,
  selected = false,
}) => {
  const clientHourlyRate = clientRateFor(professional.ratePerHour);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}
    >
      <View style={styles.topRow}>
        <Image source={{ uri: professional.imageUrl }} style={styles.avatar} />

        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.name}>{professional.name}</Text>
              <VerificationBadge />
            </View>
            <View style={styles.rateDistanceCol}>
              <Text style={styles.rate}>{formatInr(clientHourlyRate)}/hr</Text>
              <View style={styles.distanceBadge}>
                <Ionicons name="navigate-circle" size={12} color={Colors.coral} />
                <Text style={styles.distanceText}>
                  {typeof professional.distanceKm === 'number'
                    ? `${professional.distanceKm.toFixed(1)} km away`
                    : 'Nearby'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.verifiedTag}>
              <Ionicons name="shield-checkmark" size={12} color="#00875A" />
              <Text style={styles.verifiedTagText}>Verified</Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{professional.jobs} jobs completed</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{professional.city || 'Pune'}</Text>
          </View>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.bio}>
        {professional.bio}
      </Text>

      <View style={styles.skillsRow}>
        {professional.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  cardSelected: {
    borderColor: Colors.coral,
    backgroundColor: '#FFF9F7',
  },
  cardUnselected: {
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 78,
    borderRadius: 16,
    backgroundColor: Colors.mutedBg,
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  rateDistanceCol: {
    alignItems: 'flex-end',
  },
  rate: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.coral,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coral,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00875A',
  },
  metaDot: {
    color: Colors.mutedFg,
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    color: Colors.foreground,
    lineHeight: 18,
    marginTop: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  skillChip: {
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.foreground,
  },
});
