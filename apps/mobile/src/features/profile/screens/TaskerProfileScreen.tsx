import { useLocalSearchParams } from 'expo-router';
import { CalendarDays, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { useTaskerProfile } from '@/features/profile/hooks/useTaskerProfile';
import { canShowPublicRating } from '@/features/profile/model';
import {
  numberFromRouteParam,
  type TaskerProfileRouteParams,
} from '@/features/profile/profileRouteParams';
import type { Profile } from '@/lib/api/types';

import { TaskerProfileReviewsSection } from './TaskerProfile.ReviewsSection';

interface TaskerProfileDetail extends Profile {
  bio?: string;
  categories?: string[];
}

const { colors } = mobileTheme;

export default function TaskerProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams() as TaskerProfileRouteParams;
  const taskerId = params.taskerId ?? params.id;
  const routeProfile = params.taskerName
    ? ({
        id: taskerId ?? '',
        phone_masked: '',
        role: 'TASKER',
        status: params.taskerVerified === 'true' ? 'VERIFIED' : 'ACTIVE',
        full_name: params.taskerName,
        avatar_url: params.taskerAvatar || null,
        bio: params.taskerBio || null,
        rating_avg: numberFromRouteParam(params.taskerRating),
        completed_tasks: numberFromRouteParam(params.taskerCompletedTasks) ?? 0,
        is_pro: params.taskerVerified === 'true',
        created_at: params.taskerCreatedAt || '',
      } as TaskerProfileDetail)
    : undefined;
  const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(taskerId);

  const profile = profileQuery.data ?? routeProfile;
  const detail = profile as TaskerProfileDetail | undefined;
  const reviews = reviewsQuery.data?.data ?? [];
  const reviewCount = reviews.length;
  const isLoading = profileQuery.isLoading && !routeProfile;
  const isError = (profileQuery.isError || !profile) && !routeProfile;
  const categories = (detail?.categories ?? []) as string[];
  const publicRatingVisible = canShowPublicRating(reviewCount, detail?.rating_avg);
  const memberSince = detail?.created_at ? new Date(detail.created_at).toLocaleDateString() : null;

  return (
    <DetailTemplate
      testID="SCR-CUST-013"
      isLoading={isLoading}
      isError={isError}
      onRetry={profileQuery.refetch}
      errorMessage={t('customer.taskerProfile.errorNetwork')}
    >
      {profile ? (
        <View className="gap-xl">
          <View
            testID="tasker-profile-hero-card"
            className="rounded-md border border-border bg-card p-lg gap-lg"
          >
            <View className="flex-row items-center gap-lg">
              <ProfileAvatar
                uri={profile.avatar_url}
                name={profile.full_name}
                size="xl"
                showVerified={detail?.is_pro}
              />
              <View className="flex-1 gap-xs">
                <Text className="text-title font-sans-bold text-foreground">
                  {profile.full_name}
                </Text>
                {detail?.is_pro ? (
                  <View className="flex-row items-center gap-xs">
                    <ShieldCheck size={16} color={colors.trustMuted} />
                    <Text className="text-label font-sans-bold text-trust-muted">
                      {t('customer.taskerProfile.verified')}
                    </Text>
                  </View>
                ) : null}
                {memberSince ? (
                  <View className="flex-row items-center gap-xs">
                    <CalendarDays size={16} color={colors.textSecondary} />
                    <Text className="text-caption text-text-secondary">
                      {t('customer.taskerProfile.memberSince').replace('{date}', memberSince)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="border-t border-border pt-md gap-sm">
              <Text className="text-caption text-text-secondary leading-[20px]">
                {t('customer.taskerProfile.noDirectContactNote')}
              </Text>
              {!publicRatingVisible ? (
                <View className="flex-row">
                  <View className="flex-1">
                    <Text className="text-title font-sans-bold text-foreground">
                      {detail?.completed_tasks ?? 0}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      {t('customer.taskerProfile.completedJobs')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View className="gap-md border-t border-border pt-xl">
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.taskerProfile.about')}
            </Text>
            <Text className="text-body text-text-secondary leading-[24px]">
              {detail?.bio ?? t('customer.taskerProfile.noBio')}
            </Text>
          </View>

          <View className="gap-md border-t border-border pt-xl">
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
            rating={detail?.rating_avg}
            reviews={reviews}
          />
        </View>
      ) : null}
    </DetailTemplate>
  );
}
