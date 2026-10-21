import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { HStaffLogo } from './HStaffLogo';

interface AppHeaderProps {
  name: string;
  city: string;
  apiConnected?: boolean;
  onNotifications?: () => void;
  onProfile?: () => void;
  onCityPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  name,
  city,
  apiConnected = true,
  onNotifications,
  onProfile,
  onCityPress,
}) => {
  return (
    <View style={styles.header}>
      {/* Brand & City Row */}
      <View style={styles.leftCol}>
        <View style={styles.logoRow}>
          <HStaffLogo size={100} />
          {apiConnected && <View style={styles.onlineDot} />}
        </View>

        <TouchableOpacity activeOpacity={0.75} onPress={onCityPress} style={styles.cityPill}>
          <Ionicons name="location-sharp" size={13} color={Colors.coral} />
          <Text style={styles.cityText}>{city || 'Pune'}</Text>
          <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Action Icons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity activeOpacity={0.75} onPress={onNotifications} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={19} color={Colors.navy} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} onPress={onProfile} style={styles.avatarButton}>
          <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'A'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  leftCol: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.green,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F8F6',
    borderWidth: 1,
    borderColor: '#E8E5E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  cityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8F8F6',
    borderWidth: 1,
    borderColor: '#E8E5E2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.pink,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0EA',
    borderWidth: 1.5,
    borderColor: '#FFD3C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
});

