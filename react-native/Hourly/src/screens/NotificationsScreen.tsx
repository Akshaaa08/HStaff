import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { notifications, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, isLoading } = useApp();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} colors={[Colors.coral]} />}
    >
      <ScreenTopBar title="Notifications" onBack={onBack} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headline}>Alerts & Updates</Text>
          <Text style={styles.subhead}>Stay in the loop with your bookings and service security.</Text>
        </View>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={markAllNotificationsAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-outline" size={36} color={Colors.mutedFg} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            Service alerts, login OTPs, and booking progress updates will appear right here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => markNotificationAsRead(item.id)}
              style={[styles.itemCard, !item.isRead && styles.unreadCard]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: (item.color || Colors.coral) + '20' },
                ]}
              >
                <Ionicons
                  name={(item.icon as any) || 'notifications'}
                  size={20}
                  color={item.color || Colors.coral}
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
                </View>
                <Text style={styles.itemDetail}>{item.detail}</Text>
              </View>

              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
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
  headerRow: {
    marginBottom: 20,
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
  },
  markAllBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coral,
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
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderColor: Colors.coral + '60',
    backgroundColor: '#FFF9F6',
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
  unreadTitle: {
    color: Colors.foreground,
    fontWeight: '800',
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.coral,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedFg,
    textAlign: 'center',
    lineHeight: 20,
  },
});
