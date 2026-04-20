import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, SlidersHorizontal, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar, StatCard, ReviewCard } from '@/components/ui';
import { mobileTheme, elevations } from '@/design/tokenAdapter';
import type { Review } from '@/lib/mobileApiClient';
import { useTaskerProfile } from '../hooks/useTaskerProfile';

const { colors } = mobileTheme;

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
        className="flex-1 bg-background items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={colors.primaryDeep} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={colors.primaryDeep} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between h-16 px-6 bg-background">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ChevronLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-primary-deep" style={{ letterSpacing: -0.6 }}>
          {t('profile.title')}
        </Text>
        <Pressable className="w-10 h-10 items-center justify-center">
          <SlidersHorizontal size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-24 gap-8" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center pt-4">
          <View className="mb-4">
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={profile.is_pro}
            />
          </View>
          <Text
            className="text-hero-title font-extrabold text-foreground"
            style={{ letterSpacing: -0.75 }}
          >
            {profile.full_name}
          </Text>
          <Text className="text-subtitle font-semibold text-primary-deep mt-1">
            {profile.role ?? ''}
          </Text>

          {/* Trust Badge Pill */}
          <View
            className="flex-row items-center gap-2 bg-trust rounded-full px-lg py-2 mt-4"
            style={elevations.card}
          >
            <Star size={16} color={colors.trustMuted} fill={colors.trustMuted} />
            <Text className="text-body font-bold text-trust-foreground">
              {(profile.rating_avg ?? 0).toFixed(1)}
            </Text>
            <Text className="text-label font-medium text-trust-muted">
              ({profile.completed_tasks ?? 0} {t('profile.reviews')})
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          <StatCard value={`${profile.completed_tasks ?? 0}+`} label={t('profile.tasks')} />
          <StatCard value={`${profile.is_pro ? 'Pro' : '-'}`} label={t('profile.response')} />
          <StatCard
            value={`${profile.created_at?.slice(0, 4) ?? ''}`}
            label={t('profile.joined')}
          />
        </View>

        {/* Bio */}
        <View className="gap-3">
          <Text className="text-2xl font-bold text-primary-deep">{t('profile.bio')}</Text>
          <View className="bg-muted rounded-md p-[25px]" style={elevations.soft}>
            <Text className="text-body text-muted-foreground" style={{ lineHeight: 26 }}>
              {profile.full_name}
            </Text>
          </View>
        </View>

        {/* Reviews */}
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-primary-deep">
              {t('profile.recentReviews')}
            </Text>
            <Pressable>
              <Text className="text-label font-bold text-primary-deep">{t('profile.viewAll')}</Text>
            </Pressable>
          </View>
          <View className="gap-lg">
            {reviews.map((review: Review, index: number) => {
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
                  rating={review.quality_rating ?? 0}
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
          className="rounded-md overflow-hidden"
          style={elevations.elevated}
          onPress={() => router.push('/(customer)/tasks/new')}
        >
          <LinearGradient
            colors={[colors.primaryDeep, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center justify-center rounded-md"
          >
            <Text
              className="text-subtitle font-bold text-primary-foreground uppercase"
              style={{ letterSpacing: 1.35 }}
            >
              {t('profile.bookSession')}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}
