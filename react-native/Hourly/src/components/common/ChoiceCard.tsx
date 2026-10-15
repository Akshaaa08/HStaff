import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface ChoiceCardProps {
  title: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
  onPress?: () => void;
  leadingContent?: React.ReactNode;
  badge?: string;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  title,
  detail,
  selected,
  onClick,
  onPress,
  leadingContent,
  badge,
}) => {
  const handlePress = onClick || onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}
    >
      <View style={styles.contentRow}>
        {leadingContent && <View style={styles.leadingContainer}>{leadingContent}</View>}

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          {detail ? (
            <Text style={[styles.detail, selected && styles.detailSelected]}>{detail}</Text>
          ) : null}
        </View>

        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: Colors.coral,
    backgroundColor: '#FFF9F7',
  },
  cardUnselected: {
    borderColor: Colors.border,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leadingContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  titleSelected: {
    color: Colors.foreground,
  },
  detail: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 3,
    lineHeight: 18,
  },
  detailSelected: {
    color: Colors.mutedFg,
  },
  badge: {
    backgroundColor: Colors.peach,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.foreground,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.coral,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.coral,
  },
});
