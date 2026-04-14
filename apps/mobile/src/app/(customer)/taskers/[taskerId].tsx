import React from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ShieldCheck, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { mobileTheme } from '../../../design/tokenAdapter';
import { elevations } from '../../../design/elevations';
import { useTaskerProfile } from '../../../features/profile/hooks/useTaskerProfile';

const { colors } = mobileTheme;

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
              showVerified={(profile as any).is_pro}
            />
            <Text className="text-heroTitle font-sans-bold text-foreground mt-sm">
              {profile.full_name}
            </Text>
            <View className="flex-row items-center gap-[8px]">
              <Star size={16} color={colors.accent} fill={colors.accent} />
              <Text className="text-subtitle font-sans-bold text-foreground">
                {((profile as any).rating_avg ?? 0).toFixed(1)}
              </Text>
            </View>
            {(profile as any).is_pro ? (
              <View className="flex-row items-center gap-[8px] bg-trust px-md py-xs rounded-full">
                <ShieldCheck size={16} color={colors.trustMuted} />
                <Text className="text-label font-sans-bold text-trust-muted">
                  {t('customer.taskerProfile.verified')}
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-[8px]">
              <CalendarDays size={14} color={colors.textSecondary} />
              <Text className="text-caption text-text-secondary">
                {t('customer.taskerProfile.memberSince').replace(
                  '{date}',
                  new Date((profile as any).created_at ?? Date.now()).toLocaleDateString(),
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
                {(profile as any).completed_tasks ?? 0}
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                {t('customer.taskerProfile.completedJobs')}
              </Text>
            </View>
            <View
              className="flex-1 bg-muted rounded-lg p-lg items-center gap-xs"
              style={elevations.soft}
            >
              <Text className="text-heroTitle font-sans-bold text-foreground">
                {((profile as any).rating_avg ?? 0).toFixed(1)}
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                {t('customer.taskerProfile.rating')}
              </Text>
            </View>
          </View>

          {/* About */}
          <View className="gap-md">
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.taskerProfile.about')}
            </Text>
            <Text className="text-body text-text-secondary leading-[24px]">
              {(profile as any).bio ?? t('customer.taskerProfile.noBio')}
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
                    style={{ backgroundColor: `${colors.primary}12` }}
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

          {/* Reviews */}
          <View className="gap-md">
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.taskerProfile.reviews')}
            </Text>

            {reviews.length === 0 ? (
              <Text className="text-body text-text-secondary text-center py-xl">
                {t('customer.taskerProfile.noReviews')}
              </Text>
            ) : (
              <View className="gap-md">
                {reviews.map((review: any) => (
                  <View key={review.id} className="bg-muted rounded-lg p-lg gap-sm">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-label font-sans-bold text-foreground">
                        {review.reviewer?.full_name ?? ''}
                      </Text>
                      <View className="flex-row items-center gap-xs">
                        <Star size={12} color={colors.accent} fill={colors.accent} />
                        <Text className="text-label font-sans-bold text-foreground">
                          {review.quality_rating}
                        </Text>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text className="text-body text-muted-foreground leading-[24px]">
                        {review.comment}
                      </Text>
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
