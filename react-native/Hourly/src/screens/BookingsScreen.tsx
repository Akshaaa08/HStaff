import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { StatusChip } from '../components/common/StatusChip';
import { EmptyState } from '../components/common/EmptyState';
import { formatInr, priceFor, professionalFor, isPastStatus } from '../types';

interface BookingsScreenProps {
  onBack?: () => void;
  onBookingClicked: () => void;
  onDiscoverClicked: () => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({
  onBack,
  onBookingClicked,
  onDiscoverClicked,
}) => {
  const { session, fetchUserBookings } = useApp();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBookings();
    setRefreshing(false);
  };

  const allList =
    session.allBookings && session.allBookings.length > 0
      ? session.allBookings
      : [
          ...(session.activeBooking ? [session.activeBooking] : []),
          ...(session.pastBookings || []),
        ];

  const upcomingBookings = allList.filter((b) => !isPastStatus(b.status));
  const pastBookings = allList.filter((b) => isPastStatus(b.status));

  return (
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
      {onBack && <ScreenTopBar title="My Bookings" onBack={onBack} />}

      <Text style={styles.headline}>Your helping hands.</Text>
      <Text style={styles.subhead}>Every service, from first hello to a job well done.</Text>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setTab('upcoming')}
          style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>
            Upcoming ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setTab('past')}
          style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, tab === 'past' && styles.tabBtnTextActive]}>
            Past ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'upcoming' && (
        <View style={styles.tabContent}>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((b) => {
              const pro = professionalFor(b.professionalId);
              const price = priceFor(pro.ratePerHour, b.hours);
              return (
                <TouchableOpacity
                  key={b.bookingId || b.id}
                  activeOpacity={0.85}
                  onPress={onBookingClicked}
                  style={styles.bookingCard}
                >
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: pro.imageUrl }} style={styles.proThumb} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{b.service}</Text>
                      <Text style={styles.cardPro}>{pro.name}</Text>
                      <Text style={styles.cardId}>Booking #{b.bookingId || b.id}</Text>
                    </View>
                    <StatusChip label={b.status} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.mutedFg} />
                      <Text style={styles.metaText}>
                        {b.hours} {b.hours === 1 ? 'hr' : 'hrs'}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={14} color={Colors.mutedFg} />
                      <Text style={styles.metaText}>{formatInr(b.totalAmount || price.total)}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardAction}>Tap to view active tracker & OTP →</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <EmptyState
              icon={<Ionicons name="calendar-outline" size={32} color={Colors.mutedFg} />}
              title="No Upcoming Bookings"
              description="You have no scheduled or ongoing jobs right now."
              actionLabel="Find a Service"
              onAction={onDiscoverClicked}
            />
          )}
        </View>
      )}

      {tab === 'past' && (
        <View style={styles.tabContent}>
          {pastBookings.length > 0 ? (
            pastBookings.map((b) => {
              const pro = professionalFor(b.professionalId);
              const price = priceFor(pro.ratePerHour, b.hours);
              return (
                <View key={b.bookingId || b.id} style={styles.bookingCard}>
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: pro.imageUrl }} style={styles.proThumb} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{b.service}</Text>
                      <Text style={styles.cardPro}>{pro.name}</Text>
                      <Text style={styles.cardId}>Booking #{b.bookingId || b.id}</Text>
                    </View>
                    <StatusChip label={b.status} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardMetaRow}>
                    <Text style={styles.metaText}>Paid {formatInr(b.totalAmount || price.total)}</Text>
                    <Text style={styles.metaText}>
                      Completed {b.paymentMethod ? `· ${b.paymentMethod}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={32} color={Colors.mutedFg} />}
              title="No Past Bookings"
              description="Your completed service jobs will appear here."
              actionLabel="Book First Service"
              onAction={onDiscoverClicked}
            />
          )}
        </View>
      )}
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
    marginBottom: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.mutedBg,
  },
  tabBtnActive: {
    backgroundColor: Colors.peach,
    borderWidth: 1.5,
    borderColor: Colors.coral,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  tabBtnTextActive: {
    color: Colors.foreground,
    fontWeight: '700',
  },
  tabContent: {
    width: '100%',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proThumb: {
    width: 50,
    height: 60,
    borderRadius: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  cardPro: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  cardId: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  cardAction: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.pink,
    marginTop: 10,
  },
});
