import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { ScreenTopBar } from '../../components/common/ScreenTopBar';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { GradientButton } from '../../components/common/GradientButton';
import { formatInr, professionalFor } from '../../types';

interface ProfessionalProfileScreenProps {
  proId: string;
  onBack: () => void;
  onRequest: () => void;
}

export const ProfessionalProfileScreen: React.FC<ProfessionalProfileScreenProps> = ({
  proId,
  onBack,
  onRequest,
}) => {
  const { updateDraft } = useApp();
  const professional = professionalFor(proId);

  const handleRequest = () => {
    updateDraft({ selectedProId: proId });
    onRequest();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Professional Profile" onBack={onBack} />

      {/* Hero Header */}
      <View style={styles.heroCard}>
        <Image source={{ uri: professional.imageUrl }} style={styles.avatar} />
        <View style={styles.heroInfo}>
          <Text style={styles.name}>{professional.name}</Text>
          <VerificationBadge />
          <Text style={styles.distance}>{professional.distanceKm} km from your address</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <View style={styles.ratingValRow}>
            <Ionicons name="star" size={16} color="#D97706" />
            <Text style={styles.statVal}>{professional.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statVal}>{professional.jobs}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statVal}>{professional.years} yrs</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A little about me</Text>
        <Text style={styles.sectionBody}>{professional.bio}</Text>
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        <View style={styles.chipsRow}>
          {professional.skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Details list */}
      <View style={styles.detailsList}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>On-time Arrival</Text>
          <Text style={styles.detailValue}>{professional.onTimePercent}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Languages</Text>
          <Text style={styles.detailValue}>{professional.languages}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Equipment</Text>
          <Text style={styles.detailValue}>{professional.equipment}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hourly Rate</Text>
          <Text style={[styles.detailValue, styles.rateValue]}>
            {formatInr(professional.ratePerHour)}/hr
          </Text>
        </View>
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kind words from customers</Text>
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewAuthor}>Meera K. · Pune</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={13} color="#D97706" />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>
            "Punctual, thoughtful and very thorough. Our home felt wonderful afterwards. Would happily book again."
          </Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewAuthor}>Amit D. · Baner</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={13} color="#D97706" />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>
            "Really professional and easy to communicate with. Arrived with full tools on time."
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton
          text={`Request ${professional.name.split(' ')[0]} →`}
          onPress={handleRequest}
        />
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.mutedBg,
    borderRadius: 22,
    padding: 18,
    marginVertical: 12,
  },
  avatar: {
    width: 74,
    height: 86,
    borderRadius: 18,
  },
  heroInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.foreground,
  },
  distance: {
    fontSize: 12,
    color: Colors.mutedFg,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 20,
  },
  statCol: {
    alignItems: 'center',
  },
  ratingValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedFg,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.foreground,
    lineHeight: 21,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  detailsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.mutedFg,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    maxWidth: '60%',
    textAlign: 'right',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.coral,
  },
  reviewCard: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    color: Colors.foreground,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
