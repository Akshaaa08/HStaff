import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { ScreenTopBar } from '../components/common/ScreenTopBar';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const notifications = [
    {
      id: '1',
      title: 'Welcome to HStaff',
      detail: 'Your mobile number is verified. You can now request verified domestic professionals anytime.',
      time: 'Just now',
      icon: 'sparkles',
      color: Colors.coral,
    },
    {
      id: '2',
      title: 'Security Notice · OTP Protection',
      detail: 'Never share your Start OTP (482713) before your helper arrives physically at your address.',
      time: '1h ago',
      icon: 'shield-checkmark',
      color: Colors.success,
    },
    {
      id: '3',
      title: 'Coverage update in Pune',
      detail: 'Baner, Aundh, Kothrud, and Hinjawadi now support instant dispatch under ~30 mins.',
      time: '1d ago',
      icon: 'location',
      color: Colors.pink,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title="Notifications" onBack={onBack} />

      <Text style={styles.headline}>Alerts & Updates</Text>
      <Text style={styles.subhead}>Stay in the loop with your bookings and service security.</Text>

      <View style={styles.list}>
        {notifications.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>

            <View style={styles.textContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
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
  list: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    flex: 1,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginLeft: 8,
  },
  itemDetail: {
    fontSize: 13,
    color: Colors.mutedFg,
    lineHeight: 18,
  },
});
