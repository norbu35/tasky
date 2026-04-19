import { useLocalSearchParams, useRouter } from 'expo-router';
import { Award, ChevronLeft, Star } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { useApplications } from '../hooks/useApplications';
import { useCustomerTaskDetail } from '../hooks/useCustomerTaskDetail';

const { colors, spacing } = mobileTheme;
const { tint } = mobileSurfaces;
const APPLICANT_SURFACE = {
  recommendedAwardGap: spacing.xs,
  recommendedRowGap: spacing.md,
  titleClusterGap: spacing.xs / 2,
} as const;

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
    <View
      testID="SCR-CUST-011"
      className="rounded-lg bg-card p-lg"
      style={{ gap: APPLICANT_SURFACE.recommendedRowGap, ...elevations.soft }}
    >
      <View className="flex-row items-center" style={{ gap: APPLICANT_SURFACE.recommendedRowGap }}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="md"
          showVerified={applicant.isVerified}
        />
        <View className="flex-1" style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
          <Text className="text-subtitle font-sans-bold text-foreground">{applicant.name}</Text>
          <View className="flex-row items-center" style={{ gap: spacing.xs }}>
            <Star size={16} color={colors.accent} fill={colors.accent} />
            <Text className="text-label font-sans-bold text-foreground">{applicant.rating}</Text>
            <Text className="text-caption text-text-secondary">·</Text>
            <Text className="text-caption text-text-secondary">
              {applicant.reviewCount} {t('applicants.jobs')}
            </Text>
            {applicant.isVerified ? (
              <>
                <Text className="text-caption text-text-secondary">·</Text>
                <Text className="text-caption font-sans-bold text-trust-muted">
                  {t('applicants.verified')}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {applicant.isRecommended ? (
          <View
            className="flex-row items-center rounded-full px-sm py-xs"
            style={{ gap: APPLICANT_SURFACE.recommendedAwardGap, backgroundColor: tint.trustSoft }}
          >
            <Award size={16} color={colors.trustMuted} />
            <Text className="text-caption font-sans-bold text-trust-muted">
              {t('applicants.recommended')}
            </Text>
          </View>
        ) : null}
      </View>

      {applicant.message ? (
        <Text className="text-label text-muted-foreground leading-snug">{applicant.message}</Text>
      ) : null}

      <View
        className="flex-row items-center pt-xs"
        style={{ gap: APPLICANT_SURFACE.recommendedRowGap }}
      >
        <Touchable
          className="flex-1 min-h-[44px] bg-primary rounded-md items-center justify-center"
          onPress={() => onAccept(applicant)}
          testID={`applicant-accept-${applicant.taskerId}`}
          accessibilityRole="button"
        >
          <Text className="text-label font-sans-bold text-primary-foreground">
            {t('customer.applicants.accept')}
          </Text>
        </Touchable>
        <Touchable
          className="py-sm px-xs items-center"
          onPress={() => onViewProfile(applicant.taskerId)}
          testID={`applicant-view-profile-${applicant.taskerId}`}
          accessibilityRole="button"
        >
          <Text className="text-label font-sans-bold text-primary-deep">
            {t('customer.applicants.viewProfile')}
          </Text>
        </Touchable>
      </View>
    </View>
  );
}

export default function ApplicantsSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId, id } = useLocalSearchParams<{ taskId?: string; id?: string }>();
  const resolvedTaskId = taskId ?? id ?? '';
  const { data, isLoading, isError, refetch } = useApplications(resolvedTaskId);
  const { task } = useCustomerTaskDetail(resolvedTaskId);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantItem | null>(null);
  const [declineNotification, setDeclineNotification] = useState<string | null>(null);

  const applicants: ApplicantItem[] = useMemo(
    () =>
      (data?.data ?? []).map((a, index: number) => ({
        id: a.id,
        taskerId: a.tasker?.id ?? a.task_id ?? '',
        name: a.tasker?.full_name ?? '',
        avatarUrl: a.tasker?.avatar_url ?? undefined,
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
        taskId: resolvedTaskId,
        applicationId: selectedApplicant.id,
        taskerId: selectedApplicant.taskerId,
        taskTitle: task?.description ?? t('customer.applicants.taskTitleFallback'),
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
      <ScreenContainer testID="applicants-list-screen">
        <View className="flex-row items-center px-lg pt-lg pb-md" style={{ gap: spacing.md }}>
          <Touchable
            onPress={() => router.back()}
            className="flex-row items-center"
            testID="applicants-list-back"
            accessibilityRole="button"
            style={{ gap: spacing.xs }}
          >
            <ChevronLeft size={20} color={colors.primary} />
            <Text className="text-body font-sans-semibold text-primary">{t('common.back')}</Text>
          </Touchable>
          <View className="flex-1" style={{ gap: spacing.xs / 2 }}>
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.applicants.pageTitle')}
            </Text>
            <Text className="text-caption text-text-secondary">
              {t('customer.applicants.count').replace('{{count}}', String(applicants.length))}
            </Text>
          </View>
        </View>

        {declineNotification ? (
          <View
            testID="SCR-CUST-012"
            className="flex-row items-center justify-between mx-lg mb-sm p-md rounded-md"
            style={{ backgroundColor: tint.dangerSoft }}
          >
            <Text className="flex-1 text-caption font-sans-semibold text-danger leading-snug">
              {declineNotification}
            </Text>
            <Button
              label={t('common.dismiss')}
              variant="ghost"
              onPress={() => setDeclineNotification(null)}
            />
          </View>
        ) : null}

        {isLoading ? (
          <View
            className="mx-lg rounded-lg bg-card p-lg"
            style={{ gap: spacing.sm, ...elevations.soft }}
          >
            <Text className="text-body text-text-secondary">{t('common.loading')}</Text>
          </View>
        ) : isError ? (
          <View
            className="mx-lg rounded-lg bg-card p-lg"
            style={{ gap: spacing.md, ...elevations.soft }}
          >
            <Text className="text-body font-sans-semibold text-danger">
              {t('customer.applicants.errorTitle')}
            </Text>
            <Text className="text-label text-text-secondary">
              {t('customer.applicants.errorBody')}
            </Text>
            <Button label={t('common.retry')} onPress={() => refetch()} />
          </View>
        ) : applicants.length === 0 ? (
          <View className="flex-1 items-center justify-center px-2xl" style={{ gap: spacing.md }}>
            <Text className="text-title font-sans-bold text-primary-deep">
              {t('customer.applicants.emptyTitle')}
            </Text>
            <Text className="text-body text-text-secondary text-center">
              {t('customer.applicants.emptyDescription')}
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'] }}
            data={applicants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginBottom: spacing.md }}>
                <ApplicantCard
                  applicant={item}
                  onAccept={handleAccept}
                  onViewProfile={(taskerId) => router.push(`/(customer)/taskers/${taskerId}`)}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScreenContainer>

      <ModalSheetTemplate
        isOpen={!!selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        title={t('customer.applicants.confirmTitle')}
        testID="applicant-accept-sheet"
      >
        <Text className="text-body text-text-secondary">
          {t('customer.applicants.confirmBody')}
        </Text>
        {selectedApplicant ? (
          <View className="rounded-lg bg-muted p-lg gap-xs">
            <Text className="text-title font-sans-bold text-primary-deep">
              {selectedApplicant.name}
            </Text>
            <Text className="text-caption text-text-secondary">
              {t('customer.applicants.confirmBody')}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-md">
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => setSelectedApplicant(null)}
            style={{ flex: 1 }}
          />
          <Button
            label={t('customer.applicants.confirmCta')}
            onPress={handleConfirmAccept}
            style={{ flex: 1 }}
            testID="applicant-accept-sheet-confirm"
          />
        </View>
      </ModalSheetTemplate>
    </>
  );
}
