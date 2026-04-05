import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react-native';
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

const { colors, spacing, typography, radius } = mobileTheme;

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
  // Tab bar height (from (tabs)/_layout.tsx) — needed to clear the sticky CTA above the tab bar
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

  return (
    <DetailTemplate
      testID="SCR-SHARED-012"
      ctaBarExtraBottomPadding={TAB_BAR_HEIGHT}
      headerTitle={t('shared.profile.title', 'Профайл')}
      rightAction={{
        icon: <Settings size={24} color={colors.primary} />,
        onPress: () => router.push('/(shared)/profile/settings'),
      }}
      ctaLabel={t('shared.profile.editProfile', 'Профайл засах')}
      ctaOnPress={() => router.push('/(shared)/profile/edit')}
      secondaryCtaLabel={isTasker ? t('shared.profile.viewStats', 'Статистик харах') : undefined}
      secondaryCtaOnPress={isTasker ? () => router.push('/(tasker)/stats') : undefined}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      errorMessage={t('shared.profile.errorNetwork', 'Сүлжээний алдаа гарлаа')}
    >
      {profile && (
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <ProfileAvatar
              uri={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              showVerified={isTasker && profile.status === 'VERIFIED'}
            />
            <Text style={styles.name}>{profile.full_name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
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
          <View style={styles.statsRow}>
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
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>{t('shared.profile.aboutMe', 'Миний тухай')}</Text>
            {profile.phone_masked && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('shared.profile.phone', 'Утас')}</Text>
                <Text style={styles.infoValue}>{profile.phone_masked}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {t('shared.profile.memberSince', 'Нэгдсэн огноо')}
              </Text>
              <Text style={styles.infoValue}>
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
        </View>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  roleBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.secondaryForeground,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoSection: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.body,
    color: colors.foreground,
    fontWeight: '500',
  },
});
