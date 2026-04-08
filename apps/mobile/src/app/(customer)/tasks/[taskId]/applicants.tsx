import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Award, ChevronLeft, Star } from 'lucide-react-native';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { ScreenContainer } from '../../../../components/shells';
import { Button } from '../../../../components/ui/Button';
import { Touchable } from '../../../../components/ui/Touchable';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';
import { useApplications } from '../../../../features/tasks/hooks/useApplications';
import { useCustomerTaskDetail } from '../../../../features/tasks/hooks/useCustomerTaskDetail';

const { colors, spacing } = mobileTheme;

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
      style={{ gap: spacing.md, ...elevations.soft }}
    >
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="md"
          showVerified={applicant.isVerified}
        />
        <View className="flex-1" style={{ gap: spacing.xs / 2 }}>
          <Text className="text-subtitle font-sans-bold text-foreground">{applicant.name}</Text>
          <View className="flex-row items-center" style={{ gap: spacing.xs }}>
            <Star size={12} color={colors.accent} fill={colors.accent} />
            <Text className="text-label font-sans-bold text-foreground">{applicant.rating}</Text>
            <Text className="text-caption text-text-secondary">({applicant.reviewCount} reviews)</Text>
          </View>
        </View>
        {applicant.isRecommended ? (
          <View
            className="flex-row items-center rounded-full px-sm py-xs"
            style={{ gap: spacing.xs, backgroundColor: `${colors.trust}22` }}
          >
            <Award size={12} color={colors.trustMuted} />
            <Text className="text-caption font-sans-bold text-trust-muted">
              {t('applicants.recommended')}
            </Text>
          </View>
        ) : null}
      </View>

      {applicant.message ? (
        <Text className="text-label text-muted-foreground leading-snug">{applicant.message}</Text>
      ) : null}

      <View className="flex-row items-center pt-xs" style={{ gap: spacing.md }}>
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

export default function ApplicantsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { data, isLoading, isError, refetch } = useApplications(taskId);
  const { task } = useCustomerTaskDetail(taskId);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantItem | null>(null);
  const [declineNotification, setDeclineNotification] = useState<string | null>(null);

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
        <View
          className="flex-row items-center px-lg pt-lg pb-md"
          style={{ gap: spacing.md }}
        >
          <Touchable
            onPress={() => router.back()}
            className="flex-row items-center"
            testID="applicants-list-back"
            accessibilityRole="button"
            style={{ gap: spacing.xs }}
          >
            <ChevronLeft size={22} color={colors.primary} />
            <Text className="text-body font-sans-semibold text-primary">
              {t('common.back')}
            </Text>
          </Touchable>
          <View className="flex-1" style={{ gap: spacing.xs / 2 }}>
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.applicants.pageTitle')}
            </Text>
            <Text className="text-caption text-text-secondary">
              {t('customer.applicants.count').replace(
                '{{count}}',
                String(applicants.length),
              )}
            </Text>
          </View>
        </View>

        {declineNotification ? (
          <View
            testID="SCR-CUST-012"
            className="flex-row items-center justify-between mx-lg mb-sm p-md rounded-md"
            style={{ backgroundColor: `${colors.danger}14` }}
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
            style={{ gap: spacing.sm, ...elevations.soft }}
          >
            <Text className="text-body font-sans-bold text-primary-deep">
              {t('customer.applicants.errorNetwork')}
            </Text>
            <Touchable
              onPress={() => refetch()}
              className="self-start min-h-[44px] px-md rounded-md items-center justify-center bg-secondary"
              testID="applicants-retry"
            >
              <Text className="text-caption font-sans-bold text-secondary-foreground">
                {t('common.tryAgain')}
              </Text>
            </Touchable>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={applicants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
            renderItem={({ item }) => (
              <ApplicantCard
                applicant={item}
                onAccept={handleAccept}
                onViewProfile={(taskerId) => router.push(`/(customer)/taskers/${taskerId}`)}
              />
            )}
            ListEmptyComponent={
              <View className="items-center py-xl" style={{ gap: spacing.sm }}>
                <Text className="text-subtitle font-sans-bold text-primary-deep">
                  {t('customer.applicants.emptyTitle')}
                </Text>
                <Text className="text-body text-text-secondary">
                  {t('customer.applicants.emptyDescription')}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScreenContainer>

      <ModalSheetTemplate
        isOpen={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        title={t('customer.applicants.confirmTitle')}
        testID="applicant-accept-sheet"
        snapPoints={['42%']}
      >
        {selectedApplicant ? (
          <View style={{ gap: spacing.lg }}>
            <Text className="text-body text-text-secondary leading-snug">
              {t('ApplicantsListScreen.copy1')}
            </Text>
            <View className="flex-row items-center" style={{ gap: spacing.md }}>
              <ProfileAvatar
                uri={selectedApplicant.avatarUrl}
                name={selectedApplicant.name}
                size="lg"
                showVerified={selectedApplicant.isVerified}
              />
              <View className="flex-1" style={{ gap: spacing.xs / 2 }}>
                <Text className="text-subtitle font-sans-bold text-primary-deep">
                  {selectedApplicant.name}
                </Text>
                <Text className="text-body text-text-secondary">{selectedApplicant.rating}</Text>
              </View>
            </View>
            <Button
              label={t('customer.applicants.confirmCta')}
              onPress={handleConfirmAccept}
              testID="applicant-accept-sheet-confirm"
            />
            <Touchable
              onPress={() => setSelectedApplicant(null)}
              className="items-center py-sm"
              accessibilityRole="button"
              testID="applicant-accept-sheet-cancel"
            >
              <Text className="text-body font-sans-bold text-text-secondary">
                {t('customer.applicants.confirmCancel')}
              </Text>
            </Touchable>
          </View>
        ) : null}
      </ModalSheetTemplate>
    </>
  );
}
