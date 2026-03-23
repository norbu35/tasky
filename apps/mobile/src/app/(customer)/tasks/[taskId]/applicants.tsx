import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, ShieldCheck } from 'lucide-react-native';
import { FeedListTemplate } from '../../../../components/templates/FeedListTemplate';
import { ProfileAvatar } from '../../../../components/ui';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useApplications } from '../../../../features/tasks/hooks/useApplications';

const { colors, spacing, typography, radius } = mobileTheme;

interface ApplicantItem {
  id: string;
  taskerId: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  message: string;
}

function ApplicantCard({
  applicant,
  taskId: _taskId,
  onAccept,
  onViewProfile,
}: {
  applicant: ApplicantItem;
  taskId: string;
  onAccept: (applicationId: string, taskerId: string) => void;
  onViewProfile: (taskerId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="md"
          showVerified={applicant.isVerified}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{applicant.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={12} color={colors.accent} fill={colors.accent} />
            <Text style={styles.ratingValue}>{applicant.rating}</Text>
            <Text style={styles.ratingCount}>({applicant.reviewCount} reviews)</Text>
          </View>
        </View>
        {applicant.isVerified && (
          <View style={styles.verifiedBadge} testID={`verified-badge-${applicant.taskerId}`}>
            <ShieldCheck size={12} color={colors.trustMuted} />
          </View>
        )}
      </View>

      {applicant.message ? (
        <Text style={styles.messagePreview} numberOfLines={2}>
          {applicant.message}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <Pressable
          style={styles.acceptButton}
          onPress={() => onAccept(applicant.id, applicant.taskerId)}
        >
          <Text style={styles.acceptText}>{t('customer.applicants.accept', 'Accept')}</Text>
        </Pressable>
        <Pressable
          style={styles.viewProfileButton}
          onPress={() => onViewProfile(applicant.taskerId)}
        >
          <Text style={styles.viewProfileText}>
            {t('customer.applicants.viewProfile', 'View Profile')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ApplicantsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { data, isLoading, isError, refetch } = useApplications(taskId);

  const applicants: ApplicantItem[] = (data?.data ?? []).map((a: any) => ({
    id: a.id,
    taskerId: a.tasker?.id ?? a.tasker_id ?? '',
    name: a.tasker?.full_name ?? '',
    avatarUrl: a.tasker?.avatar_url,
    rating: a.tasker?.rating_avg ?? 0,
    reviewCount: a.tasker?.completed_tasks ?? 0,
    isVerified: a.tasker?.is_pro ?? false,
    message: a.message ?? '',
  }));

  const handleAccept = (applicationId: string, taskerId: string) => {
    router.push({
      pathname: '/(customer)/bookings/confirm',
      params: {
        taskId,
        applicationId,
        taskerId,
      },
    });
  };

  const handleViewProfile = (taskerId: string) => {
    router.push(`/(customer)/taskers/${taskerId}`);
  };

  return (
    <FeedListTemplate
      testID="applicants-list-screen"
      data={applicants}
      renderItem={(item) => (
        <ApplicantCard
          applicant={item}
          taskId={taskId}
          onAccept={handleAccept}
          onViewProfile={handleViewProfile}
        />
      )}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      isEmpty={applicants.length === 0 && !isLoading}
      onRetry={refetch}
      emptyTitle={t('customer.applicants.emptyTitle', 'No applicants yet')}
      emptyDescription={t('customer.applicants.emptyDescription', 'Taskers are being notified')}
      errorMessage={t('customer.applicants.errorNetwork', 'Failed to load applications')}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingCount: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.trust,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagePreview: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    lineHeight: typography.label * 1.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  viewProfileButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
});
