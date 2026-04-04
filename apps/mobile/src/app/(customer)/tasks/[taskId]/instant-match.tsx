import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { PriceTag } from '../../../../components/ui/PriceTag';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { Toast } from '../../../../components/ui/Toast';
import { useCreateBookingIntent } from '../../../../features/bookings/hooks/useCreateBookingIntent';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

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
    <DetailTemplate testID="instant-match-customer-screen" onBack={onBack}>
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>

        {(matchState === 'matching_spinner' || matchState === 'tasker_declined_retry') && (
          <View style={styles.rings} testID="instant-match-rings">
            <View style={styles.ring} />
            <View style={[styles.ring, styles.ringMiddle]} />
            <View style={[styles.ring, styles.ringInner]} />
            <View style={styles.pinCore}>
              <View style={styles.pinCoreDot} />
            </View>
          </View>
        )}

        <View style={styles.taskCard} testID="instant-match-task-card">
          <View style={styles.taskerPreview}>
            <ProfileAvatar
              size="md"
              showVerified={matchState === 'matched_awaiting_accept'}
              name={matchState === 'matched_awaiting_accept' ? matchedTaskerName : 'Tasky'}
            />
            <View style={styles.taskerPreviewCopy}>
              <Text style={styles.taskerPreviewName}>
                {matchState === 'matched_awaiting_accept'
                  ? t('matching.instantMatch.sampleTaskerName', matchedTaskerName)
                  : t('matching.instantMatch.previewName', 'Tasky instant match')}
              </Text>
              <Text style={styles.taskerPreviewMeta}>
                {matchState === 'matched_awaiting_accept'
                  ? t('matching.instantMatch.verifiedTasker', 'Verified Tasker')
                  : t('matching.instantMatch.previewMeta', 'Matching in progress')}
              </Text>
            </View>
          </View>

          <View style={styles.taskCardHeader}>
            <Text style={styles.taskCardLabel}>{t('matching.instantMatch.taskLabel', 'Task')}</Text>
            <PriceTag amount={summaryBudget} size="sm" />
          </View>
          <Text style={styles.taskCardTitle}>{summaryTitle}</Text>
          <Text style={styles.taskCardMeta}>{summaryLocation}</Text>
        </View>

        {(matchState === 'matching_spinner' || matchState === 'tasker_declined_retry') && (
          <View style={styles.centerBlock}>
            <Text style={styles.statusText}>
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
              <Text style={styles.metaText}>
                {t('matching.instantMatch.declineCount', '{{count}}/3 declined', {
                  count: declines,
                })}
              </Text>
            )}
          </View>
        )}

        {matchState === 'matched_awaiting_accept' && (
          <View style={styles.centerBlock}>
            <Text style={styles.statusText}>
              {t('matching.instantMatch.matchedStatus', 'Tasker found')}
            </Text>
            <Text style={styles.metaText}>
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
          <View style={styles.centerBlock}>
            <Text style={styles.statusText}>
              {t(
                'matching.instantMatch.fallbackStatus',
                'Instant match could not secure a tasker.',
              )}
            </Text>
            <Text style={styles.metaText}>
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
          <View style={styles.centerBlock}>
            <Toast
              variant="error"
              message={t('matching.instantMatch.noEligibleTitle', 'No eligible taskers nearby')}
            />
            <Text style={styles.statusText}>
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    minHeight: 480,
  },
  heroBlock: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  heroSubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  rings: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ringMiddle: {
    width: 132,
    height: 132,
  },
  ringInner: {
    width: 88,
    height: 88,
  },
  pinCore: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCoreDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primaryForeground,
  },
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevations.soft,
  },
  taskerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskerPreviewCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  taskerPreviewName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  taskerPreviewMeta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskCardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  taskCardMeta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  centerBlock: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.6,
    textAlign: 'center',
    color: colors.primaryDeep,
  },
  metaText: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
