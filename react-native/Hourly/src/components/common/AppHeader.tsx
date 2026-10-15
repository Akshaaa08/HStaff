import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

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
          <Text style={styles.logoH}>H</Text>
          <Text style={styles.logoText}>-Staff</Text>
          {apiConnected && <View style={styles.onlineDot} />}
        </View>

        <TouchableOpacity activeOpacity={0.75} onPress={onCityPress} style={styles.cityPill}>
          <Ionicons name="location-sharp" size={13} color={Colors.coral} />
          <Text style={styles.cityText}>{city || 'Pune'}</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.mutedFg} />
        </TouchableOpacity>
      </View>

      {/* Action Icons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity activeOpacity={0.75} onPress={onNotifications} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={20} color={Colors.foreground} />
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
    paddingVertical: 12,
    marginBottom: 6,
  },
  leftCol: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoH: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.coral,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.foreground,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginLeft: 6,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  cityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
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
    backgroundColor: Colors.mutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.pink,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8A4810',
  },
});
