import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export type TabScreen = 'home' | 'discover' | 'bookings' | 'profile';

interface BottomNavBarProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onSelectTab }) => {
  const { session } = useApp();
  const hasActiveBooking = !!session.activeBooking;
  const isWorker = session.role === 'worker';

  const clientTabs: { id: TabScreen; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; badge?: boolean }[] = [
    { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { id: 'discover', label: 'Discover', icon: 'compass-outline', iconActive: 'compass' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar', badge: hasActiveBooking },
    { id: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
  ];

  const workerTabs: { id: TabScreen; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; badge?: boolean }[] = [
    { id: 'home', label: 'Requests & Jobs', icon: 'flash-outline', iconActive: 'flash', badge: hasActiveBooking },
    { id: 'profile', label: 'My Profile', icon: 'person-outline', iconActive: 'person' },
  ];

  const tabs = isWorker ? workerTabs : clientTabs;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={23}
                  color={isActive ? Colors.coral : Colors.mutedFg}
                />
                {tab.badge && <View style={styles.badgeDot} />}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E8E5E2',
    paddingBottom: 14,
    paddingTop: 8,
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 64,
  },
  iconWrapper: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.pink,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737583',
    marginTop: 3,
  },
  tabLabelActive: {
    color: Colors.pink,
    fontWeight: '800',
  },
});

