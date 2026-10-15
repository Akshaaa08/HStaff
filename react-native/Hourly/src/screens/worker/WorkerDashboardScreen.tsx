import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus, formatInr, calculateDistanceKm } from '../../types';
import { LeafletMap } from '../../components/common/LeafletMap';

interface WorkerDashboardScreenProps {
  onLogout: () => void;
  onNotifications: () => void;
  onEditProfile: () => void;
}

export const WorkerDashboardScreen: React.FC<WorkerDashboardScreenProps> = ({
  onLogout,
  onNotifications,
  onEditProfile,
}) => {
  const {
    session,
    notifications,
    fetchUserBookings,
    fetchNotifications,
    updateBookingStatus,
    verifyTaskStartOtp,
    elapsedSeconds,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [startOtpInput, setStartOtpInput] = useState('');
  const [startOtpError, setStartOtpError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserBookings(), fetchNotifications()]);
    setRefreshing(false);
  };

  // Poll for new requests every 6 seconds while worker is active
  useEffect(() => {
    const timer = setInterval(() => {
      fetchUserBookings();
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchUserBookings]);

  // All bookings for this worker
  const allBookings: Booking[] =
    session.allBookings && session.allBookings.length > 0
      ? session.allBookings
      : [
          ...(session.activeBooking ? [session.activeBooking] : []),
          ...(session.pastBookings || []),
        ];

  // Incoming pending requests (status === 'REQUESTED')
  const incomingRequests = allBookings.filter((b) => b.status === 'REQUESTED');

  // Ongoing / active jobs
  const activeJob = allBookings.find(
    (b) =>
      b.status === 'ACCEPTED' ||
      b.status === 'CONFIRMED' ||
      b.status === 'EN_ROUTE' ||
      b.status === 'ARRIVED' ||
      b.status === 'IN_PROGRESS' ||
      b.status === 'COMPLETED_PENDING_PAYMENT'
  );

  // Completed jobs
  const completedJobs = allBookings.filter(
    (b) => b.status === 'CLOSED' || b.status === 'PAYMENT_COMPLETED'
  );

  const totalEarnings = completedJobs.reduce((acc, b) => {
    const rate = b.workerRate || session.ratePerHour || 250;
    return acc + (b.workerPayout || rate * (b.hours || 1));
  }, 0);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleAcceptRequest = async (bookingId: string) => {
    setActionLoading(bookingId);
    await updateBookingStatus(bookingId, 'ACCEPTED');
    setActionLoading(null);
    Alert.alert('Request Accepted! 🎉', 'The client has been notified that you are ready for this job.');
  };

  const handleDeclineRequest = async (bookingId: string) => {
    setActionLoading(bookingId);
    await updateBookingStatus(bookingId, 'DECLINED');
    setActionLoading(null);
  };

  const handleStartWork = async (bookingId: string) => {
    if (!startOtpInput.trim() || startOtpInput.trim().length < 6) {
      Alert.alert('Start OTP Required', 'Ask the client for their 6-digit Task Start OTP shown on their screen.');
      return;
    }
    setActionLoading(bookingId);
    setStartOtpError('');
    const res = await verifyTaskStartOtp(bookingId, startOtpInput.trim());
    setActionLoading(null);
    if (!res.success) {
      setStartOtpError(res.error || 'Incorrect Start OTP.');
      Alert.alert('Invalid Start OTP ❌', res.error || 'Incorrect Start OTP. Please ask the client.');
    } else {
      setStartOtpInput('');
      setStartOtpError('');
      Alert.alert('Task Started! 🚀', 'Start OTP strictly verified. You can now begin work.');
    }
  };

  const handleFinishWork = async (bookingId: string) => {
    setActionLoading(bookingId);
    await updateBookingStatus(bookingId, 'COMPLETED_PENDING_PAYMENT');
    setActionLoading(null);
    Alert.alert('Task Finished! 🎉', 'Work completed. Awaiting client payment settlement. No OTP needed.');
  };

  const workerImage =
    session.imageUrl ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400';

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
      {/* Worker Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: workerImage }} style={styles.avatar} />
            <View style={[styles.statusDot, isAvailable ? styles.dotGreen : styles.dotGray]} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>VERIFIED PRO</Text>
              </View>
              <Text style={styles.cityTag}>📍 {session.city}</Text>
            </View>
            <Text style={styles.workerName}>{session.name || 'Verified Professional'}</Text>
            <Text style={styles.workerCategory}>
              {session.serviceCategory || 'Domestic Staff'} · {formatInr(session.ratePerHour || 250)}/hr
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={onNotifications}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.foreground} />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availRow}>
          <View style={styles.availInfo}>
            <Ionicons
              name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={isAvailable ? Colors.success : Colors.mutedFg}
            />
            <Text style={styles.availText}>
              {isAvailable ? 'Available & Accepting Requests' : 'Currently Offline / Busy'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, isAvailable ? styles.toggleOn : styles.toggleOff]}
            activeOpacity={0.8}
            onPress={() => setIsAvailable((prev) => !prev)}
          >
            <Text style={styles.toggleBtnText}>{isAvailable ? 'Go Offline' : 'Go Online'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Earnings & Stats Bar */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{formatInr(totalEarnings)}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedJobs.length}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <View style={styles.ratingVal}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.statNumber}>100%</Text>
          </View>
          <Text style={styles.statLabel}>Verified Pro</Text>
        </View>
      </View>

      {/* ── Active Ongoing Job Card (if any) ── */}
      {activeJob && (
        <View style={styles.activeJobContainer}>
          <View style={styles.activeJobHeader}>
            <View style={styles.activePulseCircle}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeJobTitle}>Active Job: {activeJob.service}</Text>
              <Text style={styles.activeJobSub}>
                Status: {activeJob.status.replace(/_/g, ' ')} · ID: {activeJob.id}
              </Text>
            </View>
          </View>

          <View style={styles.activeJobDetails}>
            <Text style={styles.activeJobDetailText}>👤 Client: {activeJob.clientName || 'Client'}</Text>
            <Text style={styles.activeJobDetailText}>📍 Address: {activeJob.address}</Text>
            <Text style={styles.activeJobDetailText}>
              ⏱️ Duration: {activeJob.hours} hr · Payout:{' '}
              {formatInr(activeJob.workerPayout || (activeJob.hours * (session.ratePerHour || 250)))}
            </Text>
          </View>

          {/* Active Job Leaflet Map */}
          <View style={styles.workerMapCard}>
            <View style={styles.workerMapHeader}>
              <View style={styles.workerMapHeaderLeft}>
                <Ionicons name="navigate-circle" size={16} color={Colors.coral} />
                <Text style={styles.workerMapTitle}>Live Route to Client Location</Text>
              </View>
              <Text style={styles.workerMapDistBadge}>
                {calculateDistanceKm(
                  session.latitude || 18.5204,
                  session.longitude || 73.8567,
                  activeJob.latitude || 18.5204,
                  activeJob.longitude || 73.8567
                ).toFixed(1)} km away
              </Text>
            </View>
            <LeafletMap
              clientCoords={{
                latitude: activeJob.latitude || 18.5204,
                longitude: activeJob.longitude || 73.8567,
                label: `${activeJob.clientName || 'Client'} (${activeJob.address})`,
              }}
              workerCoords={{
                latitude: session.latitude || 18.5204,
                longitude: session.longitude || 73.8567,
                name: 'Your Location',
                rate: session.ratePerHour || 250,
              }}
              distanceKm={calculateDistanceKm(
                session.latitude || 18.5204,
                session.longitude || 73.8567,
                activeJob.latitude || 18.5204,
                activeJob.longitude || 73.8567
              )}
              height={185}
              showRoute={true}
            />
          </View>

          {/* Status-specific actions */}
          {activeJob.status === 'ACCEPTED' && (
            <View style={styles.jobActionCol}>
              <Text style={styles.jobActionPrompt}>
                You accepted this job. Head to client location and tap below when you arrive.
              </Text>
              <TouchableOpacity
                style={styles.arriveBtn}
                onPress={() => updateBookingStatus(activeJob.id, 'ARRIVED')}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={18} color="#FFFFFF" />
                <Text style={styles.arriveBtnText}>I Have Arrived at Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeJob.status === 'ARRIVED' && (
            <View style={styles.jobActionCol}>
              <View style={styles.otpNoticeRow}>
                <Ionicons name="key" size={18} color={Colors.coral} />
                <Text style={styles.jobActionPrompt}>
                  You arrived at the location! Ask the client for the 6-digit Task Start OTP shown on their screen:
                </Text>
              </View>
              <View style={styles.otpInputRow}>
                <TextInput
                  value={startOtpInput}
                  onChangeText={(val) => {
                    setStartOtpInput(val.replace(/\D/g, '').slice(0, 6));
                    setStartOtpError('');
                  }}
                  placeholder="Enter 6-digit Start OTP"
                  placeholderTextColor={Colors.mutedFg}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                />
                <TouchableOpacity
                  style={styles.verifyOtpBtn}
                  onPress={() => handleStartWork(activeJob.id)}
                  activeOpacity={0.8}
                  disabled={actionLoading === activeJob.id}
                >
                  <Text style={styles.verifyOtpBtnText}>
                    {actionLoading === activeJob.id ? 'Verifying...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
              {startOtpError ? (
                <Text style={styles.otpErrorNotice}>❌ {startOtpError}</Text>
              ) : null}
            </View>
          )}

          {activeJob.status === 'IN_PROGRESS' && (
            <View style={styles.jobActionCol}>
              <View style={styles.timerDisplay}>
                <Ionicons name="time" size={20} color={Colors.coral} />
                <Text style={styles.timerDigits}>
                  {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s elapsed
                </Text>
              </View>
              <TouchableOpacity
                style={styles.finishBtn}
                onPress={() => handleFinishWork(activeJob.id)}
                activeOpacity={0.8}
                disabled={actionLoading === activeJob.id}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={styles.finishBtnText}>Finish Task & Request Payment (No OTP Needed)</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeJob.status === 'COMPLETED_PENDING_PAYMENT' && (
            <View style={styles.paymentPendingBox}>
              <Ionicons name="hourglass" size={20} color="#D97706" />
              <Text style={styles.paymentPendingText}>
                Work marked complete! Awaiting client payment confirmation.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Requests Received Section ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="mail" size={20} color={Colors.coral} />
          <Text style={styles.sectionTitle}>Job Requests Received</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{incomingRequests.length}</Text>
        </View>
      </View>

      {incomingRequests.length > 0 ? (
        incomingRequests.map((req) => {
          const payout =
            req.workerPayout || req.hours * (session.ratePerHour || 250);
          const isCurrentAction = actionLoading === req.id;
          const workerLat = session.latitude || 18.5204;
          const workerLon = session.longitude || 73.8567;
          const clientLat = req.latitude || 18.5204;
          const clientLon = req.longitude || 73.8567;
          const distanceKm = calculateDistanceKm(workerLat, workerLon, clientLat, clientLon);

          return (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <View style={styles.requestIconCircle}>
                  <Ionicons name="briefcase" size={20} color={Colors.coral} />
                </View>
                <View style={styles.requestMainInfo}>
                  <Text style={styles.requestService}>{req.service}</Text>
                  <Text style={styles.requestClient}>Client: {req.clientName || 'Client'}</Text>
                  <Text style={styles.requestPayout}>
                    Your Payout: <Text style={styles.payoutBold}>{formatInr(payout)}</Text> ({req.hours} hr)
                  </Text>
                </View>
                <View style={styles.timeTag}>
                  <Text style={styles.timeTagText}>{req.time || 'Immediate'}</Text>
                </View>
              </View>

              <View style={styles.requestAddressRow}>
                <Ionicons name="location-sharp" size={16} color={Colors.coral} />
                <Text numberOfLines={2} style={styles.requestAddressText}>
                  {req.address}
                </Text>
              </View>

              <View style={styles.requestDistanceBadge}>
                <Ionicons name="navigate-circle" size={14} color={Colors.coral} />
                <Text style={styles.requestDistanceText}>
                  {distanceKm.toFixed(1)} km from your current location
                </Text>
              </View>

              {/* Leaflet Map with Client and Worker Pins */}
              <View style={styles.requestMapContainer}>
                <LeafletMap
                  clientCoords={{
                    latitude: clientLat,
                    longitude: clientLon,
                    label: `${req.clientName || 'Client'} (${req.address})`,
                  }}
                  workerCoords={{
                    latitude: workerLat,
                    longitude: workerLon,
                    name: 'You (Current Location)',
                    rate: session.ratePerHour || 250,
                  }}
                  distanceKm={distanceKm}
                  height={170}
                  showRoute={true}
                />
              </View>

              {req.notes ? (
                <View style={styles.requestNotesBox}>
                  <Text style={styles.requestNotesText}>“{req.notes}”</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.requestActionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => handleDeclineRequest(req.id)}
                  activeOpacity={0.8}
                  disabled={isCurrentAction}
                >
                  <Ionicons name="close" size={18} color="#DE350B" />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => handleAcceptRequest(req.id)}
                  activeOpacity={0.8}
                  disabled={isCurrentAction}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accept Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyRequestsCard}>
          <Ionicons name="checkmark-circle-outline" size={38} color={Colors.success} />
          <Text style={styles.emptyRequestsTitle}>All Caught Up!</Text>
          <Text style={styles.emptyRequestsSub}>
            You have answered all incoming requests. When clients in {session.city} book {session.serviceCategory || 'your service'}, their requests will appear here instantly.
          </Text>
        </View>
      )}

      {/* ── Worker Skills & Info Card ── */}
      <View style={styles.skillsCard}>
        <View style={styles.skillsCardHeader}>
          <Text style={styles.skillsCardTitle}>My Registered Skills</Text>
          <TouchableOpacity onPress={onEditProfile} activeOpacity={0.7}>
            <Text style={styles.editSkillsText}>Edit Details →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.skillsList}>
          {(session.skills || [session.serviceCategory || 'General Help']).map(
            (skill, index) => (
              <View key={index} style={styles.skillPill}>
                <Ionicons name="checkmark" size={12} color={Colors.coral} />
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            )
          )}
        </View>

        {session.experienceDetails ? (
          <Text style={styles.workerBio}>“{session.experienceDetails}”</Text>
        ) : null}
      </View>

      {/* Account actions */}
      <View style={styles.accountRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEditProfile} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={16} color={Colors.foreground} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={16} color="#DE350B" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: Colors.mutedBg,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotGreen: {
    backgroundColor: Colors.success,
  },
  dotGray: {
    backgroundColor: Colors.mutedFg,
  },
  headerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: Colors.peach,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A4C1A',
  },
  cityTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.foreground,
  },
  workerCategory: {
    fontSize: 13,
    color: Colors.mutedFg,
    fontWeight: '500',
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.coral,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
  },
  availInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toggleOn: {
    backgroundColor: '#E8F5E9',
  },
  toggleOff: {
    backgroundColor: '#F5F5F5',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  ratingVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeJobContainer: {
    backgroundColor: '#FFF8F5',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.coral,
    padding: 16,
    marginBottom: 16,
  },
  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  activePulseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeJobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.foreground,
  },
  activeJobSub: {
    fontSize: 12,
    color: Colors.coral,
    fontWeight: '700',
  },
  activeJobDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 12,
  },
  activeJobDetailText: {
    fontSize: 13,
    color: Colors.foreground,
    fontWeight: '500',
  },
  jobActionCol: {
    gap: 8,
  },
  jobActionPrompt: {
    fontSize: 13,
    color: Colors.mutedFg,
    fontWeight: '500',
  },
  arriveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.coral,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  arriveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  otpNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  verifyOtpBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  otpErrorNotice: {
    color: '#DE350B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  timerDigits: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.coral,
  },
  finishBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  paymentPendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
  },
  paymentPendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.foreground,
  },
  badgeCount: {
    backgroundColor: Colors.coral,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  requestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestMainInfo: {
    flex: 1,
  },
  requestService: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.foreground,
  },
  requestClient: {
    fontSize: 13,
    color: Colors.mutedFg,
    fontWeight: '600',
    marginTop: 2,
  },
  requestPayout: {
    fontSize: 13,
    color: Colors.foreground,
    marginTop: 3,
  },
  payoutBold: {
    fontWeight: '800',
    color: Colors.success,
  },
  timeTag: {
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
  requestAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.mutedBg,
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  requestAddressText: {
    fontSize: 12,
    color: Colors.foreground,
    fontWeight: '500',
    flex: 1,
  },
  requestDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  requestDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coral,
  },
  requestMapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  workerMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  workerMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  workerMapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerMapTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  workerMapDistBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.coral,
    backgroundColor: Colors.peach,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requestNotesBox: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requestNotesText: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontStyle: 'italic',
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  declineBtn: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  declineBtnText: {
    color: '#DE350B',
    fontWeight: '700',
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyRequestsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyRequestsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 10,
  },
  emptyRequestsSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  skillsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.foreground,
  },
  editSkillsText: {
    fontSize: 13,
    color: Colors.coral,
    fontWeight: '700',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.peach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  skillPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A4C1A',
  },
  workerBio: {
    fontSize: 12,
    color: Colors.mutedFg,
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 16,
  },
  accountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DE350B',
  },
});
