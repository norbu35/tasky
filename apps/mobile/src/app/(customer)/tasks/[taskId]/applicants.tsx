import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Award, ChevronLeft, ShieldCheck, Star } from 'lucide-react-native';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../../components/ui/Button';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useApplications } from '../../../../features/tasks/hooks/useApplications';
import { useCustomerTaskDetail } from '../../../../features/tasks/hooks/useCustomerTaskDetail';

const { colors, spacing, typography, radius } = mobileTheme;

interface ApplicantItem {
  id: string;
  taskerId: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isRecommended: boolean;
  message: string;
}

function ApplicantCard({
  applicant,
  onAccept,
  onViewProfile,
}: {
  applicant: ApplicantItem;
  onAccept: (application: ApplicantItem) => void;
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
        {applicant.isRecommended ? (
          <View style={styles.recommendedBadge}>
            <Award size={12} color={colors.trustMuted} />
            <Text style={styles.recommendedText}>{t('applicants.recommended', 'Recommended')}</Text>
          </View>
        ) : null}
      </View>

      {applicant.message ? <Text style={styles.messagePreview}>{applicant.message}</Text> : null}

      <View style={styles.cardActions}>
        <Pressable
          style={styles.acceptButton}
          onPress={() => onAccept(applicant)}
          testID={`applicant-accept-${applicant.taskerId}`}
          accessibilityRole="button"
        >
          <Text style={styles.acceptText}>{t('customer.applicants.accept', 'Accept')}</Text>
        </Pressable>
        <Pressable
          style={styles.viewProfileButton}
          onPress={() => onViewProfile(applicant.taskerId)}
          testID={`applicant-view-profile-${applicant.taskerId}`}
          accessibilityRole="button"
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
  const { task } = useCustomerTaskDetail(taskId);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantItem | null>(null);

  const applicants: ApplicantItem[] = useMemo(
    () =>
      (data?.data ?? []).map((a: any, index: number) => ({
        id: a.id,
        taskerId: a.tasker?.id ?? a.tasker_id ?? '',
        name: a.tasker?.full_name ?? '',
        avatarUrl: a.tasker?.avatar_url,
        rating: a.tasker?.rating_avg ?? 0,
        reviewCount: a.tasker?.completed_tasks ?? 0,
        isVerified: a.tasker?.is_pro ?? false,
        isRecommended: Boolean(a.recommended ?? index === 0),
        message: a.message ?? '',
      })),
    [data?.data],
  );

  const handleAccept = (application: ApplicantItem) => {
    setSelectedApplicant(application);
  };

  const handleConfirmAccept = () => {
    if (!selectedApplicant) return;

    router.push({
      pathname: '/(customer)/bookings/confirm',
      params: {
        taskId,
        applicationId: selectedApplicant.id,
        taskerId: selectedApplicant.taskerId,
        taskTitle: task?.description ?? t('customer.applicants.taskTitleFallback', 'Task'),
        taskBudget: String(task?.budget ?? ''),
        taskSchedule: task?.scheduled_at ?? '',
        taskerName: selectedApplicant.name,
        taskerAvatar: selectedApplicant.avatarUrl ?? '',
        taskerRating: String(selectedApplicant.rating),
        source: 'application',
      },
    });
    setSelectedApplicant(null);
  };

  return (
    <>
      <SafeAreaView style={styles.container} testID="applicants-list-screen">
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            testID="applicants-list-back"
            accessibilityRole="button"
          >
            <ChevronLeft size={22} color={colors.primary} />
            <Text style={styles.backLabel}>{t('common.back', 'Back')}</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>{t('customer.applicants.pageTitle', 'Applications')}</Text>
            <Text style={styles.countText}>
              {t('customer.applicants.count', '{{count}} applications').replace(
                '{{count}}',
                String(applicants.length),
              )}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t('common.loading', 'Loading')}</Text>
          </View>
        ) : isError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>
              {t('customer.applicants.errorNetwork', 'Failed to load applications')}
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryButton} testID="applicants-retry">
              <Text style={styles.retryText}>{t('common.tryAgain', 'Try again')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={applicants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ApplicantCard
                applicant={item}
                onAccept={handleAccept}
                onViewProfile={(taskerId) => router.push(`/(customer)/taskers/${taskerId}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {t('customer.applicants.emptyTitle', 'No applicants yet')}
                </Text>
                <Text style={styles.emptyBody}>
                  {t('customer.applicants.emptyDescription', 'Taskers are being notified')}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <ModalSheetTemplate
        isOpen={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        title={t('customer.applicants.confirmTitle', 'Select this Tasker?')}
        testID="applicant-accept-sheet"
        snapPoints={['42%']}
      >
        {selectedApplicant ? (
          <View style={styles.confirmSheetContent}>
            <Text style={styles.confirmBody}>
              {t(
                'customer.applicants.confirmBody',
                'After selecting, you will proceed to booking confirmation',
              )}
            </Text>
            <View style={styles.confirmTaskerRow}>
              <ProfileAvatar
                uri={selectedApplicant.avatarUrl}
                name={selectedApplicant.name}
                size="lg"
                showVerified={selectedApplicant.isVerified}
              />
              <View style={styles.confirmTaskerCopy}>
                <Text style={styles.confirmTaskerName}>{selectedApplicant.name}</Text>
                <Text style={styles.confirmTaskerRating}>{selectedApplicant.rating}</Text>
              </View>
            </View>
            <Button
              label={t('customer.applicants.confirmCta', 'Confirm')}
              onPress={handleConfirmAccept}
              testID="applicant-accept-sheet-confirm"
            />
            <Pressable
              onPress={() => setSelectedApplicant(null)}
              style={styles.confirmCancelButton}
              accessibilityRole="button"
              testID="applicant-accept-sheet-cancel"
            >
              <Text style={styles.confirmCancelText}>
                {t('customer.applicants.confirmCancel', 'Go Back')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ModalSheetTemplate>
    </>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  pageTitle: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.primaryDeep,
  },
  countText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stateCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  stateText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  retryText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  emptyBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontWeight: '800',
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
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: `${colors.trust}22`,
  },
  recommendedText: {
    fontSize: typography.caption,
    color: colors.trustMuted,
    fontWeight: '700',
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
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontSize: typography.label,
    fontWeight: '800',
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
  confirmSheetContent: {
    gap: spacing.lg,
  },
  confirmBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  confirmTaskerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmTaskerCopy: {
    flex: 1,
    gap: 2,
  },
  confirmTaskerName: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  confirmTaskerRating: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  confirmCancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  confirmCancelText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
