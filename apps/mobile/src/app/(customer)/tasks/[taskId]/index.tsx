import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useCustomerTaskDetail } from '../../../../features/tasks/hooks/useCustomerTaskDetail';
import { TaskCancelSheet } from '../../../../features/tasks/components/TaskCancelSheet';

const { colors } = mobileTheme;

function formatBudget(value?: number | null) {
  if (typeof value !== 'number') {
    return '₮0';
  }
  return `₮${value.toLocaleString('en-US')}`;
}

function formatSchedule(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-md">
      <Text
        className="flex-1 text-label font-bold text-text-secondary uppercase"
        style={{ letterSpacing: 0.4 }}
      >
        {label}
      </Text>
      <Text className="flex-1 text-label font-bold text-foreground text-right">{value}</Text>
    </View>
  );
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAnswerValue(value: unknown, t: (k: string) => string): string {
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return prettifyKey(value);
  if (Array.isArray(value)) return value.map((v) => prettifyKey(String(v))).join(', ');
  return String(value ?? '');
}

function IntakeAnswersSection({ answers, t }: { answers: Record<string, unknown>; t: (k: string) => string }) {
  const entries = Object.entries(answers).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  return (
    <View className="bg-muted rounded-sm p-lg gap-md">
      <Text
        className="text-caption font-bold text-text-secondary uppercase"
        style={{ letterSpacing: 0.8 }}
      >
        {t('TaskDetailCustomerScreen.intakeTitle')}
      </Text>
      {entries.map(([key, value]) => (
        <View key={key} className="gap-xs">
          <Text className="text-caption text-text-secondary">{prettifyKey(key)}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {Array.isArray(value) ? (
              value.map((item, idx) => (
                <View
                  key={`${key}-${idx}`}
                  className="px-md py-sm rounded-sm bg-card"
                >
                  <Text className="text-label font-bold text-foreground">
                    {prettifyKey(String(item))}
                  </Text>
                </View>
              ))
            ) : (
              <View className="px-md py-sm rounded-sm bg-card">
                <Text className="text-label font-bold text-foreground">
                  {formatAnswerValue(value, t)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TaskDetailCustomerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { task, isLoading, isError, refetch } = useCustomerTaskDetail(taskId);
  const [showCancelSheet, setShowCancelSheet] = useState(false);

  const status = (task?.status ?? '') as string;
  const isOpen = status === 'OPEN';
  const isAssigned = status === 'ASSIGNED';
  const isTaskerMarkedDone = status === 'TASKER_MARKED_DONE';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  const tasker = (task as any)?.tasker;
  const hasApplicants = Number((task as any)?.applicant_count ?? 0) > 0;
  const photos = useMemo(() => ((task as any)?.photo_keys ?? []) as string[], [task]);

  const ctaLabel = useMemo(() => {
    if (isOpen && hasApplicants) {
      return t('TaskDetailCustomerScreen.viewApplicants');
    }
    if (isTaskerMarkedDone) {
      return t('TaskDetailCustomerScreen.markComplete');
    }
    if (isAssigned && tasker) {
      return t('TaskDetailCustomerScreen.messageTasker');
    }
    if (isOpen) {
      return t('TaskDetailCustomerScreen.cancel');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, tasker, t]);

  const ctaOnPress = useMemo(() => {
    if (isOpen && hasApplicants) {
      return () => router.push(`/(customer)/tasks/${taskId}/applicants`);
    }
    if (isTaskerMarkedDone) {
      const bookingId = (task as any)?.booking?.id;
      return bookingId
        ? () => router.push(`/(customer)/bookings/${bookingId}`)
        : undefined;
    }
    if (isAssigned && tasker) {
      const bookingId = (task as any)?.booking?.id;
      return () => router.push(bookingId ? `/inbox/${bookingId}` : '/inbox');
    }
    if (isOpen) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, isTaskerMarkedDone, router, task, taskId, tasker]);

  const secondaryCtaLabel = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return t('TaskDetailCustomerScreen.cancel');
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen, t]);

  const secondaryCtaOnPress = useMemo(() => {
    if ((isOpen && hasApplicants) || isAssigned) {
      return () => setShowCancelSheet(true);
    }
    return undefined;
  }, [hasApplicants, isAssigned, isOpen]);

  return (
    <>
      <DetailTemplate
        testID="SCR-CUST-009"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        errorMessage={t('TaskDetailCustomerScreen.errorNetwork')}
        ctaLabel={ctaLabel}
        ctaOnPress={ctaOnPress}
        secondaryCtaLabel={secondaryCtaLabel}
        secondaryCtaOnPress={secondaryCtaOnPress}
      >
        {task ? (
          <View className="gap-lg">
            <View className="gap-sm">
              <StatusBadge
                status={
                  (status === 'TASKER_MARKED_DONE' ? 'assigned' : status.toLowerCase()) as
                    | 'open'
                    | 'assigned'
                    | 'completed'
                    | 'cancelled'
                    | 'no_show'
                }
              />
              <Text className="text-heading font-bold text-primary-deep leading-tight">
                {task.description}
              </Text>
              <Text
                className="text-caption font-bold text-text-secondary uppercase"
                style={{ letterSpacing: 0.8 }}
              >
                {t('TaskDetailCustomerScreen.sectionDetails')}
              </Text>
            </View>

            <View className="bg-muted rounded-sm p-lg gap-md">
              <DetailRow
                label={t('TaskDetailCustomerScreen.categoryLabel')}
                value={(task as any)?.category?.name ?? t('TaskDetailCustomerScreen.notSet')}
              />
              <DetailRow
                label={t('TaskDetailCustomerScreen.scheduleDate')}
                value={formatSchedule(task.scheduled_at)}
              />
            </View>

            {task.intake_answers != null &&
              typeof task.intake_answers === 'object' &&
              Object.keys(task.intake_answers).length > 0 && (
              <IntakeAnswersSection
                answers={task.intake_answers as Record<string, unknown>}
                t={t}
              />
            )}

            {/* budgetCard: shadow → imperative */}
            <View className="bg-primary-deep rounded-lg p-lg gap-sm" style={elevations.soft}>
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-caption font-bold uppercase"
                  style={{ letterSpacing: 0.8, color: `${colors.primaryForeground}99` }}
                >
                  {t('TaskDetailCustomerScreen.budgetLabel')}
                </Text>
                <View
                  className="px-sm py-xs rounded-full"
                  style={{ backgroundColor: `${colors.primaryForeground}1A` }}
                >
                  <Text className="text-micro font-bold text-primary-foreground">
                    {Number((task as any)?.applicant_count ?? 0)}{' '}
                    {t('TaskDetailCustomerScreen.applicants')}
                  </Text>
                </View>
              </View>
              <Text
                className="text-secondary font-extrabold"
                style={{ fontSize: 36, lineHeight: 40 }}
              >
                {formatBudget(task.budget)}
              </Text>
            </View>

            <View className="bg-muted rounded-sm p-lg gap-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-subtitle font-extrabold text-foreground">
                  {t('TaskDetailCustomerScreen.applicants')}
                </Text>
                <Text
                  className="text-caption font-extrabold text-center text-primary-deep"
                  style={{
                    minWidth: 28,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    backgroundColor: `${colors.primary}12`,
                  }}
                >
                  {Number((task as any)?.applicant_count ?? 0)}
                </Text>
              </View>
              {hasApplicants ? (
                <Text className="text-body text-text-secondary leading-relaxed">
                  {t('TaskDetailCustomerScreen.applicationsReceived')}
                </Text>
              ) : (
                <Text className="text-body text-text-secondary leading-relaxed">
                  {t('TaskDetailCustomerScreen.noApplicants')}
                </Text>
              )}
            </View>

            <View className="bg-muted rounded-sm p-lg gap-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-subtitle font-extrabold text-foreground">
                  {t('TaskDetailCustomerScreen.photos')}
                </Text>
                <Text
                  className="text-caption font-extrabold text-center text-primary-deep"
                  style={{
                    minWidth: 28,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    backgroundColor: `${colors.primary}12`,
                  }}
                >
                  {photos.length}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-sm">
                {photos.length > 0 ? (
                  photos.slice(0, 4).map((photoKey, index) => (
                    <View
                      key={`${photoKey}-${index}`}
                      className="rounded-md items-center justify-center"
                      style={{
                        width: '48%',
                        height: 163,
                        backgroundColor: `${colors.primary}12`,
                      }}
                    >
                      <Text className="text-body font-extrabold text-primary-deep">{index + 1}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-body text-text-secondary leading-relaxed">
                    {t('TaskDetailCustomerScreen.noPhotos')}
                  </Text>
                )}
              </View>
            </View>

            {/* locationCard: rgba background → imperative */}
            <View
              className="rounded-lg p-lg gap-sm"
              style={{ backgroundColor: `${colors.primary}0F` }}
            >
              <View className="flex-row items-center gap-sm">
                <MapPin size={16} color={colors.primaryDeep} />
                <Text className="flex-1 text-body font-bold text-primary-deep">
                  {(task as any).location_text ?? ''}
                </Text>
              </View>
              <Text className="text-caption text-text-secondary leading-relaxed">
                {t('TaskDetailCustomerScreen.locationNote')}
              </Text>
            </View>

            {(isAssigned || isTaskerMarkedDone) && tasker ? (
              <Pressable
                className="bg-card rounded-lg p-lg"
                style={elevations.soft}
                onPress={() => router.push(`/(customer)/taskers/${tasker.id}`)}
                testID="task-detail-customer-screen-tasker-card"
                accessibilityRole="button"
              >
                <View className="flex-row items-center gap-md">
                  <ProfileAvatar
                    uri={tasker.avatar_url}
                    name={tasker.full_name}
                    size="lg"
                    showVerified={tasker.is_pro}
                  />
                  <View className="flex-1 gap-xs">
                    <Text className="text-subtitle font-extrabold text-foreground">
                      {tasker.full_name}
                    </Text>
                    <View className="flex-row items-center gap-xs">
                      <Star size={14} color={colors.accent} fill={colors.accent} />
                      <Text className="text-label font-bold text-foreground">
                        {tasker.rating_avg ?? 0}
                      </Text>
                    </View>
                    <Text className="text-caption text-text-secondary">
                      {t('TaskDetailCustomerScreen.assignedTasker')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : null}

            {isCompleted ? (
              <View
                className="p-lg rounded-lg gap-xs"
                style={{ backgroundColor: `${colors.muted}80` }}
              >
                <Text className="text-body font-extrabold text-primary-deep">
                  {t('TaskDetailCustomerScreen.completedTitle')}
                </Text>
                <Text className="text-caption text-text-secondary">
                  {t('TaskDetailCustomerScreen.completedBody')}
                </Text>
              </View>
            ) : null}

            {isCancelled ? (
              <View
                className="p-lg rounded-lg gap-xs"
                style={{ backgroundColor: `${colors.muted}80` }}
              >
                <Text className="text-body font-extrabold text-primary-deep">
                  {t('TaskDetailCustomerScreen.cancelledTitle')}
                </Text>
                <Text className="text-caption text-text-secondary">
                  {t('TaskDetailCustomerScreen.cancelledBody')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </DetailTemplate>

      <TaskCancelSheet
        isOpen={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        taskId={taskId}
        taskStatus={status}
        bookingId={(task as any)?.booking?.id}
      />
    </>
  );
}
