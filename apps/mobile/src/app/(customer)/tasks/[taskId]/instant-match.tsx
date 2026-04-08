import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { PriceTag } from '../../../../components/ui/PriceTag';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { Toast } from '../../../../components/ui/Toast';
import { useCreateBookingIntent } from '../../../../features/bookings/hooks/useCreateBookingIntent';
import { elevations } from '../../../../design/elevations';

type InstantMatchState =
  | 'matching_spinner'
  | 'matched_awaiting_accept'
  | 'tasker_declined_retry'
  | 'fallback_to_open'
  | 'error_no_eligible';

function coerceState(value: string | string[] | undefined): InstantMatchState {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === 'matched_awaiting_accept' ||
    raw === 'tasker_declined_retry' ||
    raw === 'fallback_to_open' ||
    raw === 'error_no_eligible'
  ) {
    return raw;
  }
  return 'matching_spinner';
}

function coerceDeclineCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(3, Math.floor(parsed)));
}

function coerceString(value: string | string[] | undefined, fallback: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ? raw : fallback;
}

export default function CustomerInstantMatchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    taskId,
    state,
    declineCount,
    taskerId,
    taskerName,
    taskerAvatar,
    taskerRating,
    taskTitle,
    budget,
    locationText,
  } = useLocalSearchParams<{
    taskId: string;
    state?: InstantMatchState;
    declineCount?: string;
    taskerId?: string;
    taskerName?: string;
    taskerAvatar?: string;
    taskerRating?: string;
    taskTitle?: string;
    budget?: string;
    locationText?: string;
  }>();
  const { mutateAsync: createBookingIntent, isPending: isCreatingBookingIntent } =
    useCreateBookingIntent();

  const matchState = coerceState(state);
  const declines = coerceDeclineCount(declineCount);
  const hasTaskId = Boolean(taskId);
  const summaryTitle = coerceString(taskTitle, 'Deep clean apartment');
  const summaryLocation = coerceString(locationText, '15th khoroo');
  const summaryBudget = Number(coerceString(budget, '45000'));
  const matchedTaskerId = coerceString(taskerId, 'tasker-1');
  const matchedTaskerName = coerceString(taskerName, 'B. Temuulen');
  const matchedTaskerAvatar = coerceString(taskerAvatar, '');
  const matchedTaskerRating = coerceString(taskerRating, '4.7');

  const onBack = () => {
    if (hasTaskId) {
      router.replace(`/(customer)/tasks/${taskId}`);
      return;
    }
    router.back();
  };

  const onConfirmBooking = () => {
    void (async () => {
      const bookingIntent = await createBookingIntent({
        taskId,
        source: 'INSTANT_MATCH',
        taskerId: matchedTaskerId,
      });
      router.replace({
        pathname: '/(customer)/bookings/confirm',
        params: {
          taskId,
          source: 'instant_match',
          bookingIntentId: bookingIntent.id,
          taskerId: matchedTaskerId,
          taskTitle: summaryTitle,
          taskBudget: String(summaryBudget),
          taskSchedule: new Date().toISOString(),
          taskerName: matchedTaskerName,
          taskerAvatar: matchedTaskerAvatar,
          taskerRating: matchedTaskerRating,
          locationText: summaryLocation,
        },
      });
    })();
  };

  const onViewApplicants = () => {
    if (hasTaskId) {
      router.replace(`/(customer)/tasks/${taskId}/applicants`);
      return;
    }
    router.replace('/(tabs)');
  };

  const heroTitle =
    matchState === 'matched_awaiting_accept'
      ? t('matching.instantMatch.heroMatched', 'Tasker found')
      : matchState === 'fallback_to_open'
        ? t('matching.instantMatch.heroFallback', 'Instant match could not secure a tasker.')
        : matchState === 'error_no_eligible'
          ? t('matching.instantMatch.heroError', 'No eligible taskers nearby')
          : t('matching.instantMatch.heroSearching', 'Finding your tasker');

  const heroSubtitle =
    matchState === 'fallback_to_open'
      ? t('matching.instantMatch.heroFallbackBody', 'Your task is now open for applications.')
      : matchState === 'error_no_eligible'
        ? t(
            'matching.instantMatch.heroErrorBody',
            'You can review the task and continue with open applications instead.',
          )
        : t(
            'matching.instantMatch.heroSearchingBody',
            'We are checking nearby verified taskers right now.',
          );

  return (
    <DetailTemplate testID="SCR-CUST-027" onBack={onBack}>
      <View className="gap-lg" style={{ minHeight: 480 }}>
        <View className="gap-sm">
          <Text className="text-heading font-bold text-primaryDeep">{heroTitle}</Text>
          <Text className="text-body text-textSecondary leading-relaxed">{heroSubtitle}</Text>
        </View>

        {(matchState === 'matching_spinner' || matchState === 'tasker_declined_retry') && (
          <View className="items-center justify-center" style={{ height: 220 }} testID="instant-match-rings">
            {/* rings: absolute positioning + precise pixel sizes → imperative */}
            <View
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#C7D0D9',
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 132,
                height: 132,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#C7D0D9',
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 88,
                height: 88,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#C7D0D9',
              }}
            />
            <View className="w-14 h-14 rounded-lg bg-primary items-center justify-center">
              <View className="w-[14px] h-[14px] rounded-full bg-primaryForeground" />
            </View>
          </View>
        )}

        <View className="bg-card rounded-lg p-lg gap-md" style={elevations.soft} testID="instant-match-task-card">
          <View className="flex-row items-center gap-md">
            <ProfileAvatar
              size="md"
              showVerified={matchState === 'matched_awaiting_accept'}
              name={matchState === 'matched_awaiting_accept' ? matchedTaskerName : 'Tasky'}
            />
            <View className="flex-1 gap-xs">
              <Text className="text-body font-bold text-primaryDeep">
                {matchState === 'matched_awaiting_accept'
                  ? t('matching.instantMatch.sampleTaskerName', matchedTaskerName)
                  : t('matching.instantMatch.previewName', 'Tasky instant match')}
              </Text>
              <Text className="text-caption text-textSecondary">
                {matchState === 'matched_awaiting_accept'
                  ? t('matching.instantMatch.verifiedTasker', 'Verified Tasker')
                  : t('matching.instantMatch.previewMeta', 'Matching in progress')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className="text-caption text-textSecondary uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              {t('matching.instantMatch.taskLabel', 'Task')}
            </Text>
            <PriceTag amount={summaryBudget} size="sm" />
          </View>
          <Text className="text-subtitle font-bold text-primaryDeep">{summaryTitle}</Text>
          <Text className="text-caption text-textSecondary">{summaryLocation}</Text>
        </View>

        {(matchState === 'matching_spinner' || matchState === 'tasker_declined_retry') && (
          <View className="bg-muted rounded-lg p-xl gap-md items-center">
            <Text className="text-body text-primaryDeep text-center leading-relaxed">
              {matchState === 'tasker_declined_retry'
                ? t(
                    'matching.instantMatch.declinedStatus',
                    'A tasker declined. We are moving to the next best match...',
                  )
                : t(
                    'matching.instantMatch.matchingStatus',
                    'Searching for the strongest nearby match...',
                  )}
            </Text>
            {matchState === 'tasker_declined_retry' && (
              <Text className="text-label text-textSecondary text-center">
                {t('matching.instantMatch.declineCount', '{{count}}/3 declined', {
                  count: declines,
                })}
              </Text>
            )}
          </View>
        )}

        {matchState === 'matched_awaiting_accept' && (
          <View className="bg-muted rounded-lg p-xl gap-md items-center">
            <Text className="text-body text-primaryDeep text-center leading-relaxed">
              {t('matching.instantMatch.matchedStatus', 'Tasker found')}
            </Text>
            <Text className="text-label text-textSecondary text-center">
              {t('matching.instantMatch.countdownLabel', 'Waiting for acceptance')}: 04:59
            </Text>
            <Button
              testID="instant-match-confirm-booking"
              label={t('matching.instantMatch.confirmBooking', 'Confirm booking')}
              onPress={onConfirmBooking}
              isLoading={isCreatingBookingIntent}
            />
          </View>
        )}

        {matchState === 'fallback_to_open' && (
          <View className="bg-muted rounded-lg p-xl gap-md items-center">
            <Text className="text-body text-primaryDeep text-center leading-relaxed">
              {t(
                'matching.instantMatch.fallbackStatus',
                'Instant match could not secure a tasker.',
              )}
            </Text>
            <Text className="text-label text-textSecondary text-center">
              {t(
                'matching.instantMatch.fallbackDescription',
                'Your task is now open for applications.',
              )}
            </Text>
            <Button
              testID="instant-match-view-applicants"
              label={t('matching.instantMatch.viewApplicants', 'View applicants')}
              onPress={onViewApplicants}
            />
          </View>
        )}

        {matchState === 'error_no_eligible' && (
          <View className="bg-muted rounded-lg p-xl gap-md items-center">
            <Toast
              variant="error"
              message={t('matching.instantMatch.noEligibleTitle', 'No eligible taskers nearby')}
            />
            <Text className="text-body text-primaryDeep text-center leading-relaxed">
              {t(
                'matching.instantMatch.noEligibleDescription',
                'You can review the task and continue with open applications instead.',
              )}
            </Text>
            <Button
              testID="instant-match-back-to-task"
              variant="outline"
              label={t('matching.instantMatch.backToTask', 'Back to task')}
              onPress={onBack}
            />
          </View>
        )}
      </View>
    </DetailTemplate>
  );
}
