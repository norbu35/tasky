import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ShieldCheck, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { mobileTheme } from '../../../design/tokenAdapter';
import { elevations } from '../../../design/elevations';
import { useTaskerProfile } from '../../../features/profile/hooks/useTaskerProfile';

const { colors, spacing, typography, radius } = mobileTheme;

export default function TaskerProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskerId } = useLocalSearchParams<{ taskerId: string }>();
  const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(taskerId);

  const profile = profileQuery.data;
  const reviews = reviewsQuery.data?.data ?? [];
  const isLoading = profileQuery.isLoading;
  const isError = profileQuery.isError;
  const categories = ((profile as any)?.categories ?? []) as string[];

  return (
    <DetailTemplate testID="SCR-CUST-013"
     
      isLoading={isLoading}
      isError={isError}
      onRetry={profileQuery.refetch}
      errorMessage={t('customer.taskerProfile.errorNetwork', 'Failed to load profile')}
      ctaLabel={t('customer.taskerProfile.ctaMessage', 'Message')}
      ctaOnPress={() => router.push('/inbox')}
    >
      {profile ? (
        <View style={styles.content}>
          <View style={styles.hero}>
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={(profile as any).is_pro}
            />
            <Text style={styles.name}>{profile.full_name}</Text>
            <View style={styles.ratingRow}>
              <Star size={16} color={colors.accent} fill={colors.accent} />
              <Text style={styles.ratingText}>{((profile as any).rating_avg ?? 0).toFixed(1)}</Text>
            </View>
            {(profile as any).is_pro ? (
              <View style={styles.verifiedRow}>
                <ShieldCheck size={16} color={colors.trustMuted} />
                <Text style={styles.verifiedText}>
                  {t('customer.taskerProfile.verified', 'Identity Verified')}
                </Text>
              </View>
            ) : null}
            <View style={styles.memberRow}>
              <CalendarDays size={14} color={colors.textSecondary} />
              <Text style={styles.memberText}>
                {t('customer.taskerProfile.memberSince', 'Member since: {date}').replace(
                  '{date}',
                  new Date((profile as any).created_at ?? Date.now()).toLocaleDateString(),
                )}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(profile as any).completed_tasks ?? 0}</Text>
              <Text style={styles.statLabel}>
                {t('customer.taskerProfile.completedJobs', 'Jobs Completed')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{((profile as any).rating_avg ?? 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t('customer.taskerProfile.rating', 'Rating')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customer.taskerProfile.about', 'About')}</Text>
            <Text style={styles.aboutText}>
              {(profile as any).bio ?? t('customer.taskerProfile.noBio', 'No bio yet')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.taskerProfile.categories', 'Categories')}
            </Text>
            <View style={styles.chipsRow}>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <View key={category} style={styles.chip}>
                    <Text style={styles.chipText}>{category}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionBody}>
                  {t('customer.taskerProfile.noCategories', 'No categories listed')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.taskerProfile.reviews', 'Reviews')}
            </Text>

            {reviews.length === 0 ? (
              <Text style={styles.emptyReviews}>
                {t('customer.taskerProfile.noReviews', 'No reviews yet')}
              </Text>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review: any) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.reviewer?.full_name ?? ''}</Text>
                      <View style={styles.reviewRating}>
                        <Star size={12} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.reviewRatingText}>{review.quality_rating}</Text>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ) : null}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.heroTitle,
    fontWeight: '900',
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md / 2,
  },
  ratingText: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.foreground,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md / 2,
    backgroundColor: colors.trust,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verifiedText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.trustMuted,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md / 2,
  },
  memberText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    ...elevations.soft,
  },
  statValue: {
    fontSize: typography.heroTitle,
    fontWeight: '900',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  aboutText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}12`,
  },
  chipText: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  emptyReviews: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewRatingText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  reviewComment: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    lineHeight: typography.body * 1.5,
  },
});
