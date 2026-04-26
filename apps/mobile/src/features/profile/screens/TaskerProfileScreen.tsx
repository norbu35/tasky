import { useRouter, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ShieldCheck, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { useTaskerProfile } from '@/features/profile/hooks/useTaskerProfile';
import { canShowPublicRating, formatPublicRating } from '@/features/profile/model';
import type { Profile } from '@/lib/api/types';

import { TaskerProfileReviewsSection } from './TaskerProfile.ReviewsSection';

interface TaskerProfileDetail extends Profile {
  bio?: string;
  categories?: string[];
}

const { colors } = mobileTheme;

export default function TaskerProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskerId } = useLocalSearchParams<{ taskerId: string }>();
  const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(taskerId);

  const profile = profileQuery.data;
  const detail = profile as TaskerProfileDetail | undefined;
  const reviews = reviewsQuery.data?.data ?? [];
  const isLoading = profileQuery.isLoading;
  const isError = profileQuery.isError;
  const categories = (detail?.categories ?? []) as string[];
  const publicRatingVisible = canShowPublicRating(detail?.completed_tasks, detail?.rating_avg);

  return (
    <DetailTemplate
      testID="SCR-CUST-013"
      isLoading={isLoading}
      isError={isError}
      onRetry={profileQuery.refetch}
      errorMessage={t('customer.taskerProfile.errorNetwork')}
      ctaLabel={t('customer.taskerProfile.ctaMessage')}
      ctaOnPress={() => router.push('/inbox')}
    >
      {profile ? (
        <View className="gap-xl">
          {/* Hero */}
          <View className="items-center gap-sm">
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={detail?.is_pro}
            />
            <Text className="text-heroTitle font-sans-bold text-foreground mt-sm">
              {profile.full_name}
            </Text>
            {publicRatingVisible ? (
              <View className="flex-row items-center gap-[8px]">
                <Star size={16} color={colors.accent} fill={colors.accent} />
                <Text className="text-subtitle font-sans-bold text-foreground">
                  {formatPublicRating(detail?.rating_avg)}
                </Text>
              </View>
            ) : null}
            {detail?.is_pro ? (
              <View className="flex-row items-center gap-[8px] bg-trust px-md py-xs rounded-full">
                <ShieldCheck size={16} color={colors.trustMuted} />
                <Text className="text-label font-sans-bold text-trust-muted">
                  {t('customer.taskerProfile.verified')}
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-[8px]">
              <CalendarDays size={16} color={colors.textSecondary} />
              <Text className="text-caption text-text-secondary">
                {t('customer.taskerProfile.memberSince').replace(
                  '{date}',
                  new Date(detail?.created_at ?? Date.now()).toLocaleDateString(),
                )}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-md">
            <View
              className="flex-1 bg-muted rounded-lg p-lg items-center gap-xs"
              style={elevations.soft}
            >
              <Text className="text-heroTitle font-sans-bold text-foreground">
                {detail?.completed_tasks ?? 0}
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                {t('customer.taskerProfile.completedJobs')}
              </Text>
            </View>
            {publicRatingVisible ? (
              <View
                className="flex-1 bg-muted rounded-lg p-lg items-center gap-xs"
                style={elevations.soft}
              >
                <Text className="text-heroTitle font-sans-bold text-foreground">
                  {formatPublicRating(detail?.rating_avg)}
                </Text>
                <Text className="text-caption text-text-secondary text-center">
                  {t('customer.taskerProfile.rating')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* About */}
          <View className="gap-md">
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.taskerProfile.about')}
            </Text>
            <Text className="text-body text-text-secondary leading-[24px]">
              {detail?.bio ?? t('customer.taskerProfile.noBio')}
            </Text>
          </View>

          {/* Categories */}
          <View className="gap-md">
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.taskerProfile.categories')}
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <View
                    key={category}
                    className="px-md py-sm rounded-full"
                    style={{ backgroundColor: mobileSurfaces.tint.categoryPill }}
                  >
                    <Text className="text-caption text-primary-deep font-sans-bold">
                      {category}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-body text-text-secondary">
                  {t('customer.taskerProfile.noCategories')}
                </Text>
              )}
            </View>
          </View>

          <TaskerProfileReviewsSection
            publicRatingVisible={publicRatingVisible}
            completedTasks={detail?.completed_tasks}
            reviews={reviews}
          />
        </View>
      ) : null}
    </DetailTemplate>
  );
}
