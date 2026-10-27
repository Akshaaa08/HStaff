import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';

interface ProfileScreenProps {
  onBack?: () => void;
  onLogout: () => void;
  onNotifications: () => void;
  onBookings: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onLogout,
  onNotifications,
  onBookings,
}) => {
  const { session } = useApp();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack && <ScreenTopBar title="Profile & Account" onBack={onBack} />}

      {/* User Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {session.name ? session.name[0].toUpperCase() : 'A'}
          </Text>
        </View>

        <Text style={styles.userName}>{session.name || 'Client'}</Text>
        <Text style={styles.userPhone}>
          {session.phone ? `+91 ${session.phone}` : '+91 98765 43210'}
        </Text>

        <View style={styles.cityPill}>
          <Ionicons name="location" size={13} color={Colors.coral} />
          <Text style={styles.cityPillText}>Baner, {session.city}</Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>
            {session.pastBookings.length + (session.activeBooking ? 1 : 0)}
          </Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>
            {session.pastBookings.reduce((acc, b) => acc + b.hours, 0) || 4}h
          </Text>
          <Text style={styles.statLabel}>Hours Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>5.0</Text>
          <Text style={styles.statLabel}>Client Rating</Text>
        </View>
      </View>

      {/* Options Menu */}
      <Text style={styles.menuHeading}>Preferences & Services</Text>

      <View style={styles.menuContainer}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBookings} style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: Colors.softPink }]}>
            <Ionicons name="calendar-outline" size={18} color={Colors.pink} />
          </View>
          <Text style={styles.menuItemText}>My Bookings History</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedFg} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onNotifications} style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: Colors.peach }]}>
            <Ionicons name="notifications-outline" size={18} color="#9A4C1A" />
          </View>
          <Text style={styles.menuItemText}>Notifications & Alerts</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedFg} />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: Colors.mint }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#1C6944" />
          </View>
          <Text style={styles.menuItemText}>ID Verification & Safety Guarantee</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedFg} />
        </View>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: Colors.lavender }]}>
            <Ionicons name="help-buoy-outline" size={18} color="#5F4BB6" />
          </View>
          <Text style={styles.menuItemText}>24/7 Helpline & Grievance Support</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedFg} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity activeOpacity={0.7} onPress={onLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color={Colors.destructive} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>HStaff Client Native App · React Native Expo SDK 57</Text>
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
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginVertical: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.peach,
    borderWidth: 2,
    borderColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8A4810',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.foreground,
  },
  userPhone: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
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
    height: 28,
    backgroundColor: Colors.border,
  },
  menuHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.destructiveSoft,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.destructive,
  },
  versionText: {
    fontSize: 11,
    color: Colors.mutedFg,
    textAlign: 'center',
  },
});
