import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { ServiceTone } from '../types';

interface DiscoverScreenProps {
  onBack?: () => void;
  onServiceSelected: (service: string) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ onBack, onServiceSelected }) => {
  const { searchQuery, setSearchQuery, filteredServices, selectService } = useApp();

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
      case 'Service Staff': return 'people';
      case 'Security': return 'shield-checkmark';
      case 'Driver': return 'car';
      case 'Delivery': return 'bicycle';
      case 'Warehouse': return 'cube';
      case 'Painting': return 'color-palette';
      case 'AC Service': return 'snow';
      case 'Appliance Repair': return 'construct';
      case 'Welding': return 'flame';
      default: return 'build';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {onBack && <ScreenTopBar title="Discover Services" onBack={onBack} />}

        <View style={styles.header}>
          <Text style={styles.headline}>A person for every task.</Text>
          <Text style={styles.subhead}>
            Find the right help for your home and your day across all 15 certified trades.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.mutedFg} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all 15 services…"
            placeholderTextColor={Colors.mutedFg}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.mutedFg} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countLabel}>Catalogue</Text>
          <Text style={styles.countValue}>{filteredServices.length} categories</Text>
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services found matching your query.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredServices.map((service) => (
              <TouchableOpacity
                key={service.name}
                activeOpacity={0.8}
                onPress={() => {
                  selectService(service.name);
                  onServiceSelected(service.name);
                }}
                style={styles.serviceItem}
              >
                <View style={[styles.iconCircle, { backgroundColor: toneToBg(service.tone) }]}>
                  <Ionicons
                    name={getServiceIcon(service.name)}
                    size={24}
                    color={toneToIconColor(service.tone)}
                  />
                </View>

                <View style={styles.info}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceFullName}>{service.fullName}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={Colors.mutedFg} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    marginTop: 6,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.mutedBg,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  countValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  list: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  serviceFullName: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedFg,
  },
});
