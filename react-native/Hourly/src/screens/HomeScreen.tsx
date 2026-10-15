import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/common/AppHeader';
import { StatusChip } from '../components/common/StatusChip';
import { ProfessionalCard } from '../components/common/ProfessionalCard';
import { ServiceCategory, ServiceTone, formatInr, hstaffCities, priceFor, professionalFor } from '../types';

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
  const { session, draft, selectService, filteredServices, sortedProfessionals, setCity, loadWorkers } = useApp();
  const [search, setSearch] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkers();
    setRefreshing(false);
  };

  const activeBooking = session.activeBooking;
  const activePro = activeBooking ? professionalFor(activeBooking.professionalId) : null;

  const toneToBg = (tone: ServiceTone) => {
    switch (tone) {
      case 'PEACH': return Colors.peach;
      case 'MINT': return Colors.mint;
      case 'PINK': return Colors.softPink;
      case 'LAVENDER': return Colors.lavender;
      case 'YELLOW': return Colors.yellow;
      default: return Colors.mutedBg;
    }
  };

  const toneToIconColor = (tone: ServiceTone) => {
    switch (tone) {
      case 'PEACH': return '#9A4C1A';
      case 'MINT': return '#1C6944';
      case 'PINK': return Colors.pink;
      case 'LAVENDER': return '#5F4BB6';
      case 'YELLOW': return '#8A6D0B';
      default: return Colors.foreground;
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

  const displayedCategories = filteredServices.slice(0, 8);

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

        {/* Active Booking Banner */}
        {activeBooking && (
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
                Tap to track live status & OTP codes →
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSubtitle}>HELP WHEN YOU NEED IT</Text>
          <Text style={styles.heroTitle}>Who do you need today?</Text>
          <Text style={styles.heroDescription}>
            Vetted hourly domestic & local trades help delivered to your doorstep in Pune & Maharashtra.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.mutedFg} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search home cleaners, cooks, electricians..."
            placeholderTextColor={Colors.mutedFg}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.mutedFg} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onDiscoverClicked}>
            <Text style={styles.seeAllText}>See all 15 →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {displayedCategories.map((service) => (
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Guarantee Banner */}
        <View style={styles.guaranteeBanner}>
          <View style={styles.guaranteeIcon}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.coral} />
          </View>
          <View style={styles.guaranteeText}>
            <Text style={styles.guaranteeTitle}>The HStaff Promise</Text>
            <Text style={styles.guaranteeDesc}>
              Aadhaar-verified helpers, transparent hourly rates in INR, and OTP check-in protection.
            </Text>
          </View>
        </View>

        {/* Recommended Professionals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Rated Nearby</Text>
          <Text style={styles.sectionSub}>
            {sortedProfessionals.length > 0 &&
            sortedProfessionals[0].city &&
            sortedProfessionals[0].city.toLowerCase() !== session.city.toLowerCase()
              ? `Verified staff in Maharashtra`
              : `Available in ${session.city}`}
          </Text>
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
            <Ionicons name="people-outline" size={32} color={Colors.mutedFg} />
            <Text style={styles.emptyWorkersTitle}>No professionals registered yet</Text>
            <Text style={styles.emptyWorkersSub}>
              Be the first to join as a verified professional or check back shortly!
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* City Selector Modal */}
      <Modal visible={showCityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Launch City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
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
    backgroundColor: '#FFF5F3',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.coral,
    padding: 16,
    marginBottom: 20,
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  activeBookingSub: {
    fontSize: 12,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  activeBookingBottom: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 156, 122, 0.3)',
  },
  activeBookingEta: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.pink,
  },
  heroSection: {
    marginVertical: 12,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.pink,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.foreground,
    lineHeight: 38,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.mutedFg,
    marginTop: 8,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.coral,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
  },
  guaranteeBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.peach,
    padding: 16,
    gap: 14,
    marginVertical: 20,
    alignItems: 'center',
  },
  guaranteeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeText: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  guaranteeDesc: {
    fontSize: 12,
    color: Colors.mutedFg,
    lineHeight: 17,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginBottom: 16,
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.mutedBg,
    marginBottom: 8,
  },
  cityOptionActive: {
    backgroundColor: Colors.softPink,
    borderWidth: 1.5,
    borderColor: Colors.coral,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
  },
  cityNameActive: {
    fontWeight: '700',
    color: Colors.foreground,
  },
  emptyWorkersCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyWorkersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyWorkersSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
});
