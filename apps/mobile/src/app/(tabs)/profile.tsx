import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UserPen, Settings, BarChart2, ChevronRight } from 'lucide-react-native';
import { DetailTemplate } from '../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../components/ui/ProfileAvatar';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { StatCard } from '../../components/ui/StatCard';
import { RatingStars } from '../../components/ui/RatingStars';
import { TrustBanner } from '../../components/ui/TrustBanner';
import { useMyProfile } from '../../features/profile/hooks/useProfile';
import { useRole } from '../../providers/RoleProvider';
import { useAuthStore } from '../../store/authStore';
import { LoginRequiredCTA } from '../../components/ui/LoginRequiredCTA';
import { screenLayout } from '../../design/screenLayout';

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
          style={{ paddingBottom: screenLayout.chrome.contentBottomClearance }}
        >
          {/* Hero Section */}
          <View className="items-center gap-md">
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={isTasker && profile.status === 'VERIFIED'}
            />
            <Text className="text-[20px] font-semibold text-primary-deep text-center">
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
                <Text className="text-body text-foreground font-medium">
                  {profile.phone_masked}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between py-sm">
              <Text className="text-body text-text-secondary">
                {t('shared.profile.memberSince')}
              </Text>
              <Text className="text-body text-foreground font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action Rows */}
          <View className="bg-muted rounded-md overflow-hidden">
            <Pressable
              testID="action-row-edit-profile"
              onPress={() => router.push('/(shared)/profile/edit')}
              className="flex-row items-center p-md border-b border-border/50"
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-md">
                <UserPen size={20} color="#000" />
              </View>
              <Text className="flex-1 text-body font-sans-medium text-foreground">
                {t('shared.profile.editProfile')}
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>

            {isTasker && (
              <Pressable
                testID="action-row-view-stats"
                onPress={() => router.push('/(tasker)/stats')}
                className="flex-row items-center p-md border-b border-border/50"
                style={({ pressed }) => [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
              >
                <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center mr-md">
                  <BarChart2 size={20} color="#000" />
                </View>
                <Text className="flex-1 text-body font-sans-medium text-foreground">
                  {t('shared.profile.viewStats')}
                </Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
            )}

            <Pressable
              testID="action-row-settings"
              onPress={() => router.push('/(shared)/profile/settings')}
              className="flex-row items-center p-md"
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <View className="w-10 h-10 rounded-full bg-muted-foreground/10 items-center justify-center mr-md">
                <Settings size={20} color="#000" />
              </View>
              <Text className="flex-1 text-body font-sans-medium text-foreground">
                {t('shared.profile.settings')}
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Trust Banner for Taskers */}
          {isTasker && (
            <TrustBanner
              title={t('shared.profile.trustTitle')}
              description={t('MyProfileScreen.copy1')}
            />
          )}

          {/* Stats Link for Taskers — now accessible via secondary CTA */}
        </View>
      )}
    </DetailTemplate>
  );
}
