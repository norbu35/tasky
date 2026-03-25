import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, SlidersHorizontal, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileAvatar, StatCard, ReviewCard } from '../../../components/ui';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { useTaskerProfile } from '../hooks/useTaskerProfile';

const { colors, radius, typography } = mobileTheme;

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

export function TaskerPublicProfile() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(userId);
  const profile = profileQuery.data;
  const reviews = reviewsQuery.data?.data ?? [];

  if (profileQuery.isLoading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryDeep} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryDeep} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <ChevronLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.title', 'Profile')}</Text>
        <Pressable style={styles.headerButton}>
          <SlidersHorizontal size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCenter}>
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={profile.is_pro}
            />
          </View>
          <Text style={styles.profileName}>{profile.full_name}</Text>
          <Text style={styles.profileTitle}>{profile.role ?? ''}</Text>

          {/* Trust Badge Pill */}
          <View style={styles.trustPill}>
            <Star size={16} color={colors.trustMuted} fill={colors.trustMuted} />
            <Text style={styles.trustRating}>{(profile.rating_avg ?? 0).toFixed(1)}</Text>
            <Text style={styles.trustReviews}>
              ({profile.completed_tasks ?? 0} {t('profile.reviews', 'reviews')})
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <StatCard
            value={`${profile.completed_tasks ?? 0}+`}
            label={t('profile.tasks', 'Tasks')}
          />
          <StatCard
            value={`${profile.is_pro ? 'Pro' : '-'}`}
            label={t('profile.response', 'Status')}
          />
          <StatCard
            value={`${profile.created_at?.slice(0, 4) ?? ''}`}
            label={t('profile.joined', 'Joined')}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.bio', 'Bio')}</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{profile.full_name}</Text>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('profile.recentReviews', 'Recent Reviews')}</Text>
            <Pressable>
              <Text style={styles.viewAllLink}>{t('profile.viewAll', 'View All')}</Text>
            </Pressable>
          </View>
          <View style={styles.reviewsList}>
            {reviews.map((review: any, index: number) => {
              const reviewerName = review.reviewer?.full_name ?? '';
              const initials = reviewerName
                .split(' ')
                .map((w: string) => w[0] ?? '')
                .join('')
                .toUpperCase()
                .slice(0, 2);
              return (
                <ReviewCard
                  key={review.id}
                  reviewerInitials={initials}
                  reviewerName={reviewerName}
                  rating={review.quality_rating}
                  comment={review.comment ?? ''}
                  timeAgo={formatTimeAgo(review.created_at)}
                  featured={index === 0}
                />
              );
            })}
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push('/(customer)/tasks/new/category')}
        >
          <LinearGradient
            colors={[colors.primaryDeep, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{t('profile.bookSession', 'BOOK A SESSION')}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.6,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 96,
    gap: 32,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 16,
  },
  avatarCenter: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: typography.heroTitle,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.75,
  },
  profileTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginTop: 4,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.trust,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    ...elevations.card,
  },
  trustRating: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.trustForeground,
  },
  trustReviews: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.trustMuted,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllLink: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },

  // Bio
  bioCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 25,
    ...elevations.card,
  },
  bioText: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    lineHeight: 26,
  },

  // Reviews
  reviewsList: {
    gap: 16,
  },

  // CTA
  ctaButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...elevations.elevated,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  ctaText: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryForeground,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
