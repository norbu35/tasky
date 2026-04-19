import { useRouter } from 'expo-router';
import { UserPen, Settings, BarChart2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { ActionRow } from '../../components/ui/ActionRow';
import { LoginRequiredCTA } from '../../components/ui/LoginRequiredCTA';
import { ProfileAvatar } from '../../components/ui/ProfileAvatar';
import { RatingStars } from '../../components/ui/RatingStars';
import { StatCard } from '../../components/ui/StatCard';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { useMyProfile } from '../../features/profile/hooks/useProfile';
import { useRole } from '../../providers/RoleProvider';
import { useAuthStore } from '../../store/authStore';

const { colors } = mobileTheme;

export default function MyProfileScreen() {
  const session = useAuthStore((state) => state.session);
  const { t } = useTranslation();

  if (!session) {
    return <LoginRequiredCTA message={t('auth.loginToViewProfile')} />;
  }

  return <AuthenticatedProfile />;
}

function AuthenticatedProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const { isTasker } = useRole();
  const insets = useSafeAreaInsets();
  return (
    <DetailTemplate
      testID="SCR-SHARED-012"
      insideTabNavigator
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      errorMessage={t('shared.profile.errorNetwork')}
    >
      {profile && (
        <View
          className="gap-xl"
          style={{ paddingBottom: screenLayout.chrome.contentBottomClearance + insets.bottom }}
        >
          {/* Hero Section */}
          <View className="items-center gap-md">
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={isTasker && profile.status === 'VERIFIED'}
            />
            <Text className="text-title font-sans-semibold text-primary-deep text-center">
              {profile.full_name}
            </Text>
            <View className="px-md py-xs rounded-full bg-secondary">
              <Text className="text-caption font-semibold text-secondary-foreground">
                {isTasker ? t('shared.profile.roleTasker') : t('shared.profile.roleCustomer')}
              </Text>
            </View>
            {isTasker && profile.status === 'VERIFIED' && (
              <VerifiedBadge status="verified" size="md" testID="verified-badge" />
            )}
            {isTasker && <RatingStars value={Math.round(profile.rating_avg)} readonly size={20} />}
          </View>

          {/* Stats Section */}
          <View className="flex-row gap-md">
            <StatCard
              value={String(profile.completed_tasks)}
              label={t('shared.profile.completedJobs')}
            />
            {isTasker && (
              <StatCard value={String(profile.rating_avg)} label={t('shared.profile.avgRating')} />
            )}
          </View>

          {/* Info Section */}
          <View className="bg-muted rounded-md p-lg gap-md">
            <Text className="text-subtitle font-sans-bold text-primary-deep">
              {t('shared.profile.aboutMe')}
            </Text>
            {profile.phone_masked && (
              <View className="flex-row justify-between py-sm">
                <Text className="text-body text-text-secondary">{t('shared.profile.phone')}</Text>
                <Text className="text-body text-foreground font-sans-medium">
                  {profile.phone_masked}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between py-sm">
              <Text className="text-body text-text-secondary">
                {t('shared.profile.memberSince')}
              </Text>
              <Text className="text-body text-foreground font-sans-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View className="pt-sm border-t border-border">
              <Text className="text-body text-text-secondary leading-relaxed">
                {profile.bio?.trim() ? profile.bio : t('shared.profile.noBio')}
              </Text>
            </View>
          </View>

          {/* Action Rows */}
          <View className="bg-muted rounded-md overflow-hidden">
            <ActionRow
              testID="action-row-edit-profile"
              icon={<UserPen size={20} color={colors.primary} />}
              label={t('shared.profile.editProfile')}
              onPress={() => router.push('/(shared)/profile/edit')}
            />
            {isTasker && (
              <ActionRow
                testID="action-row-view-stats"
                icon={<BarChart2 size={20} color={colors.secondary} />}
                label={t('shared.profile.viewStats')}
                onPress={() => router.push('/(tasker)/stats')}
              />
            )}
            <ActionRow
              testID="action-row-settings"
              icon={<Settings size={20} color={colors.textSecondary} />}
              label={t('shared.profile.settings')}
              onPress={() => router.push('/(shared)/profile/settings')}
              showDivider={false}
            />
          </View>

          {/* Stats Link for Taskers — now accessible via secondary CTA */}
        </View>
      )}
    </DetailTemplate>
  );
}
