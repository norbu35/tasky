import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, typography } = mobileTheme;

interface ReviewCardProps {
  reviewerInitials: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timeAgo: string;
  featured?: boolean;
}

export function ReviewCard({
  reviewerInitials,
  reviewerName,
  rating,
  comment,
  timeAgo,
  featured = false,
}: ReviewCardProps) {
  return (
    <View style={[styles.container, featured && styles.featured]}>
      <View style={styles.header}>
        <View style={styles.reviewer}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{reviewerInitials}</Text>
          </View>
          <Text style={styles.name}>{reviewerName}</Text>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < rating ? colors.accent : colors.chipInactive}
              fill={i < rating ? colors.accent : 'none'}
            />
          ))}
        </View>
      </View>
      <Text style={styles.comment}>{comment}</Text>
      <Text style={styles.time}>{timeAgo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 20,
    gap: 11,
  },
  featured: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryDeep,
    paddingLeft: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.subtleViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  comment: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  time: {
    fontSize: typography.micro,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
