import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/common/AppHeader';
import { StatusChip } from '../components/common/StatusChip';
import { ProfessionalCard } from '../components/common/ProfessionalCard';
import { FooterSections } from '../components/common/FooterSections';
import { ServiceTone, hstaffCities, professionalFor, isPastStatus } from '../types';

interface HomeScreenProps {
  onServiceSelected: (service: string) => void;
  onBookingClicked: () => void;
  onNotificationsClicked: () => void;
  onProfileClicked: () => void;
  onDiscoverClicked: () => void;
  onProfessionalClicked: (proId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onServiceSelected,
  onBookingClicked,
  onNotificationsClicked,
  onProfileClicked,
  onDiscoverClicked,
  onProfessionalClicked,
}) => {
  const { session, selectService, filteredServices, sortedProfessionals, setCity, loadWorkers } = useApp();
  const [search, setSearch] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkers();
    setRefreshing(false);
  };

  const activeBooking = session.activeBooking;
  const activePro = activeBooking ? professionalFor(activeBooking.professionalId) : null;

  const toneToBg = (tone: ServiceTone) => {
    switch (tone) {
      case 'PEACH': return '#FFF3EC';
      case 'MINT': return '#EBF9F3';
      case 'PINK': return '#FDF0F5';
      case 'LAVENDER': return '#F3F0FA';
      case 'YELLOW': return '#FFF9E6';
      default: return '#F8F8F6';
    }
  };

  const toneToIconColor = (tone: ServiceTone) => {
    switch (tone) {
      case 'PEACH': return Colors.coral;
      case 'MINT': return Colors.green;
      case 'PINK': return Colors.pink;
      case 'LAVENDER': return '#6A5ACD';
      case 'YELLOW': return '#D9822B';
      default: return Colors.navy;
    }
  };

  const getServiceIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    switch (name) {
      case 'Cleaning': return 'sparkles';
      case 'Cooking': return 'restaurant';
      case 'Plumbing': return 'water';
      case 'Electrical': return 'flash';
      case 'Carpentry': return 'hammer';
      case 'General Help': return 'hand-left';
      case 'Security': return 'shield-checkmark';
      case 'Driver': return 'car';
      case 'AC Service': return 'snow';
      default: return 'build';
    }
  };

  // Filter services by search text
  const searchResults = search.trim()
    ? filteredServices.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : filteredServices.slice(0, 8);

  const faqs = [
    {
      q: 'How does hourly pricing work?',
      a: 'You pay strictly for the actual hours worked based on transparent base rates starting from ₹180/hr. No surprise surcharges.',
    },
    {
      q: 'Are the professionals verified?',
      a: 'Yes, every helper passes identity verification and background vetting before taking any jobs in Maharashtra.',
    },
    {
      q: 'What is the start OTP for?',
      a: 'The 6-digit start code protects you. Share it only when your professional arrives at your doorstep to start the timer.',
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.coral]}
            tintColor={Colors.coral}
          />
        }
      >
        {/* App Header */}
        <AppHeader
          name={session.name}
          city={session.city}
          apiConnected={session.apiConnected}
          onNotifications={onNotificationsClicked}
          onProfile={onProfileClicked}
          onCityPress={() => setShowCityModal(true)}
        />

        {/* Active Booking Live Banner */}
        {activeBooking && !isPastStatus(activeBooking.status) && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onBookingClicked}
            style={styles.activeBookingCard}
          >
            <View style={styles.activeBookingTop}>
              <View style={styles.activeBookingIcon}>
                <Ionicons name="time" size={20} color={Colors.pink} />
              </View>
              <View style={styles.activeBookingInfo}>
                <Text style={styles.activeBookingTitle}>Active Service: {activeBooking.service}</Text>
                <Text style={styles.activeBookingSub}>
                  {activePro ? activePro.name : 'Your professional'} · {activeBooking.id}
                </Text>
              </View>
              <StatusChip label={activeBooking.status} />
            </View>

            <View style={styles.activeBookingBottom}>
              <Text style={styles.activeBookingEta}>
                Tap to view live OTP code & tracker →
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Hero Section with Beautiful Coral-Pink Soft Gradient */}
        <LinearGradient
          colors={Colors.warmHeroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadgeRow}>
            <View style={styles.eyebrowBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.pink} />
              <Text style={styles.heroSubtitle}>HELP WHEN YOU NEED IT</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Who do you need today?</Text>
          <Text style={styles.heroDescription}>
            Vetted hourly domestic and local-trade help, delivered to your doorstep.
          </Text>

          {/* Search Bar inside Hero */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search cleaners, cooks, electricians..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </LinearGradient>

        {/* Popular Services Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular services</Text>
            <Text style={styles.sectionMeta}>Transparent hourly rates</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onDiscoverClicked}>
            <Text style={styles.seeAllText}>See all 15 →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {searchResults.map((service) => (
            <TouchableOpacity
              key={service.name}
              activeOpacity={0.8}
              onPress={() => {
                selectService(service.name);
                onServiceSelected(service.name);
              }}
              style={styles.categoryCard}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: toneToBg(service.tone) }]}>
                <Ionicons
                  name={getServiceIcon(service.name)}
                  size={24}
                  color={toneToIconColor(service.tone)}
                />
              </View>
              <Text numberOfLines={1} style={styles.categoryName}>
                {service.name}
              </Text>
              <Text style={styles.categoryRate}>From ₹{service.pricePerHour}/hr</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* The HStaff Promise / Trust Panel */}
        <View style={styles.promiseCard}>
          <View style={styles.promiseHeader}>
            <View style={styles.promiseIconBox}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.green} />
            </View>
            <View style={styles.promiseHeaderText}>
              <Text style={styles.promiseTitle}>The HStaff Promise</Text>
              <Text style={styles.promiseSubtitle}>Safe, vetted, transparent home services</Text>
            </View>
          </View>

          <View style={styles.promiseGrid}>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.coral} />
              <Text style={styles.promiseItemText}>Transparent hourly rates in INR</Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.coral} />
              <Text style={styles.promiseItemText}>Verified professional staff</Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.coral} />
              <Text style={styles.promiseItemText}>Safe Start OTP attendance verification</Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.coral} />
              <Text style={styles.promiseItemText}>Platform booking assistance & care</Text>
            </View>
          </View>
        </View>

        {/* Book in 3 Easy Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>Book in 3 simple steps</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Choose a service</Text>
              <Text style={styles.stepDesc}>Select from 15 domestic and trade categories.</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Set time & materials</Text>
              <Text style={styles.stepDesc}>Book instantly or schedule later. Clear supply pricing.</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>OTP check-in & relax</Text>
              <Text style={styles.stepDesc}>Share your start code when the helper arrives.</Text>
            </View>
          </View>
        </View>

        {/* Recommended Top Rated Nearby */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular near you</Text>
            <Text style={styles.sectionMeta}>
              {sortedProfessionals.length > 0 &&
              sortedProfessionals[0].city &&
              sortedProfessionals[0].city.toLowerCase() !== session.city.toLowerCase()
                ? `Verified professionals in Maharashtra`
                : `Available right now in ${session.city}`}
            </Text>
          </View>
        </View>

        {sortedProfessionals.length > 0 ? (
          sortedProfessionals.map((pro) => (
            <ProfessionalCard
              key={pro.id}
              professional={pro}
              onPress={() => onProfessionalClicked(pro.id)}
            />
          ))
        ) : (
          <View style={styles.emptyWorkersCard}>
            <Ionicons name="people-outline" size={32} color={Colors.textSecondary} />
            <Text style={styles.emptyWorkersTitle}>No professionals registered yet</Text>
            <Text style={styles.emptyWorkersSub}>
              Be the first to join as a verified professional or check back shortly!
            </Text>
          </View>
        )}

        {/* Compact FAQs Section */}
        <View style={styles.faqCard}>
          <Text style={styles.faqHeader}>Frequently asked questions</Text>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                style={styles.faqItem}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.navy}
                  />
                </View>
                {isExpanded && <Text style={styles.faqAnswerText}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Structured Footer */}
        <FooterSections
          onServicePress={(cat) => {
            selectService(cat);
            onServiceSelected(cat);
          }}
          onWorkerPress={onProfileClicked}
          onHelpPress={onNotificationsClicked}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* City Selector Modal */}
      <Modal visible={showCityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Service City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color={Colors.navy} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              HStaff is currently operating across Maharashtra:
            </Text>

            {hstaffCities.map((c) => {
              const isSelected = session.city === c;
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCity(c);
                    setShowCityModal(false);
                  }}
                  style={[styles.cityOption, isSelected && styles.cityOptionActive]}
                >
                  <Text style={[styles.cityName, isSelected && styles.cityNameActive]}>{c}</Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={Colors.coral} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  activeBookingCard: {
    backgroundColor: '#FFF8F3',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.coral,
    padding: 16,
    marginBottom: 16,
  },
  activeBookingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeBookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBookingInfo: {
    flex: 1,
  },
  activeBookingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  activeBookingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeBookingBottom: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 154, 120, 0.25)',
  },
  activeBookingEta: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.pink,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE1DA',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.pink,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.navy,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  sectionMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.pink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    width: '22.5%',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EFEAE6',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
    textAlign: 'center',
  },
  categoryRate: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  promiseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    marginVertical: 12,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  promiseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseHeaderText: {
    flex: 1,
  },
  promiseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
  },
  promiseSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  promiseGrid: {
    gap: 8,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promiseItemText: {
    fontSize: 12,
    color: '#4A4D5E',
    fontWeight: '500',
  },
  stepsCard: {
    backgroundColor: '#F8F8F6',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    marginVertical: 10,
  },
  stepsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#E8E5E2',
    marginVertical: 10,
    marginLeft: 40,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5E2',
    marginTop: 16,
  },
  faqHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 12,
  },
  faqItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE8',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
    flex: 1,
    paddingRight: 8,
  },
  faqAnswerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  emptyWorkersCard: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F6',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E5E2',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyWorkersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyWorkersSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 38, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.navy,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8F8F6',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E5E2',
  },
  cityOptionActive: {
    backgroundColor: '#FFF0EA',
    borderColor: Colors.coral,
    borderWidth: 1.5,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  cityNameActive: {
    fontWeight: '700',
    color: Colors.navy,
  },
});
