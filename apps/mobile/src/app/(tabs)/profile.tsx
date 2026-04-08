import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pencil, Settings } from 'lucide-react-native';
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
import { mobileTheme } from '../../design/tokenAdapter';
import { screenLayout } from '../../design/screenLayout';

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
  return (
    <DetailTemplate
      testID="SCR-SHARED-012"
      headerTitle={t('shared.profile.title', 'Профайл')}
      rightActions={[
        {
          icon: <Pencil size={22} color={colors.primary} />,
          onPress: () => router.push('/(shared)/profile/edit'),
          testID: 'profile-edit-action',
        },
        {
          icon: <Settings size={22} color={colors.primary} />,
          onPress: () => router.push('/(shared)/profile/settings'),
          testID: 'profile-settings-action',
        },
      ]}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      errorMessage={t('shared.profile.errorNetwork', 'Сүлжээний алдаа гарлаа')}
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
            <Text className="text-[20px] font-semibold text-primaryDeep text-center">
              {profile.full_name}
            </Text>
            <View className="px-md py-xs rounded-full bg-secondary">
              <Text className="text-caption font-semibold text-secondaryForeground">
                {isTasker
                  ? t('shared.profile.roleTasker', 'Гүйцэтгэгч')
                  : t('shared.profile.roleCustomer', 'Захиалагч')}
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
              label={t('shared.profile.completedJobs', 'Дууссан ажил')}
            />
            {isTasker && (
              <StatCard
                value={String(profile.rating_avg)}
                label={t('shared.profile.avgRating', 'Дундаж үнэлгээ')}
              />
            )}
          </View>

          {/* Info Section */}
          <View className="bg-muted rounded-md p-lg gap-md">
            <Text className="text-subtitle font-sans-bold text-primaryDeep">
              {t('shared.profile.aboutMe', 'Миний тухай')}
            </Text>
            {profile.phone_masked && (
              <View className="flex-row justify-between py-sm">
                <Text className="text-body text-textSecondary">
                  {t('shared.profile.phone', 'Утас')}
                </Text>
                <Text className="text-body text-foreground font-medium">{profile.phone_masked}</Text>
              </View>
            )}
            <View className="flex-row justify-between py-sm">
              <Text className="text-body text-textSecondary">
                {t('shared.profile.memberSince', 'Нэгдсэн огноо')}
              </Text>
              <Text className="text-body text-foreground font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Trust Banner for Taskers */}
          {isTasker && (
            <TrustBanner
              title={t('shared.profile.trustTitle', 'Баталгаажсан гүйцэтгэгч')}
              description={t(
                'shared.profile.trustDescription',
                'Таны мэдээлэл баталгаажсан бөгөөд итгэлцэл нэмэгдүүлэхэд ашиглагдана.',
              )}
            />
          )}

          {/* Stats Link for Taskers */}
          {isTasker && (
            <Pressable
              onPress={() => router.push('/(tasker)/stats')}
              className="bg-muted rounded-md py-md px-lg items-center"
              testID="profile-stats-link"
            >
              <Text className="text-body font-semibold text-primary">
                {t('shared.profile.viewStats', 'Статистик харах')}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </DetailTemplate>
  );
}
