import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { SkeletonLoader } from '../../../../components/ui/SkeletonLoader';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Toast } from '../../../../components/ui/Toast';
import { mobileTheme } from '../../../../design/tokenAdapter';

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

export default function CustomerInstantMatchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { taskId, state, declineCount } = useLocalSearchParams<{
    taskId: string;
    state?: InstantMatchState;
    declineCount?: string;
  }>();

  const matchState = coerceState(state);
  const declines = coerceDeclineCount(declineCount);
  const hasTaskId = Boolean(taskId);

  const onBack = () => {
    if (hasTaskId) {
      router.replace(`/(customer)/tasks/${taskId}`);
      return;
    }
    router.back();
  };

  const onConfirmBooking = () => {
    router.replace('/(customer)/bookings/confirm');
  };

  const onViewApplicants = () => {
    if (hasTaskId) {
      router.replace(`/(customer)/tasks/${taskId}/applicants`);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <DetailTemplate
      testID="instant-match-customer-screen"
      headerTitle={t('matching.instantMatch.pageTitle', 'Шууд тохируулга')}
      onBack={onBack}
    >
      <View style={styles.container}>
        {(matchState === 'matched_awaiting_accept' ||
          matchState === 'tasker_declined_retry' ||
          matchState === 'fallback_to_open' ||
          matchState === 'error_no_eligible') && (
          <StatusBadge status="assigned" />
        )}

        {(matchState === 'matching_spinner' || matchState === 'tasker_declined_retry') && (
          <View style={styles.centerBlock}>
            <SkeletonLoader
              testID="instant-match-loading"
              width={96}
              height={96}
              borderRadius={radius.full}
            />
            <Text style={styles.statusText}>
              {matchState === 'tasker_declined_retry'
                ? t(
                    'matching.instantMatch.declinedStatus',
                    'Гүйцэтгэгч татгалзлаа. Дараагийн хүнийг хайж байна...',
                  )
                : t(
                    'matching.instantMatch.matchingStatus',
                    'Хамгийн тохиромжтой гүйцэтгэгчийг хайж байна...',
                  )}
            </Text>
            {matchState === 'tasker_declined_retry' && (
              <Text style={styles.metaText}>
                {t('matching.instantMatch.declineCount', '{{count}}/3 татгалзсан', {
                  count: declines,
                })}
              </Text>
            )}
          </View>
        )}

        {matchState === 'matched_awaiting_accept' && (
          <View style={styles.centerBlock}>
            <ProfileAvatar
              size="xl"
              showVerified
              name={t('matching.instantMatch.sampleTaskerName', 'Б. Тэмүүлэн')}
            />
            <Text style={styles.statusText}>
              {t('matching.instantMatch.matchedStatus', 'Гүйцэтгэгч олдлоо! Хариу хүлээж байна...')}
            </Text>
            <Text style={styles.metaText}>
              {t('matching.instantMatch.countdownLabel', 'Хариу хүлээх хугацаа')}: 04:59
            </Text>
            <Button
              testID="instant-match-confirm-booking"
              label={t('matching.instantMatch.confirmBooking', 'Захиалга баталгаажуулах')}
              onPress={onConfirmBooking}
            />
          </View>
        )}

        {matchState === 'fallback_to_open' && (
          <View style={styles.centerBlock}>
            <Text style={styles.statusText}>
              {t(
                'matching.instantMatch.fallbackStatus',
                '3 гүйцэтгэгч татгалзлаа. Даалгавар нээлттэй хүсэлтэд шилжлээ.',
              )}
            </Text>
            <Button
              testID="instant-match-view-applicants"
              label={t('matching.instantMatch.viewApplicants', 'Өргөдөл гаргагчдыг харах')}
              onPress={onViewApplicants}
            />
          </View>
        )}

        {matchState === 'error_no_eligible' && (
          <View style={styles.centerBlock}>
            <Toast
              variant="error"
              message={t('matching.instantMatch.noEligibleTitle', 'Боломжит гүйцэтгэгч олдсонгүй')}
            />
            <Text style={styles.statusText}>
              {t(
                'matching.instantMatch.noEligibleDescription',
                'Энэ бүс нутагт хангалттай гүйцэтгэгч байхгүй байна. Нээлттэй хүсэлтээр үргэлжлүүлнэ үү.',
              )}
            </Text>
            <Button
              testID="instant-match-back-to-task"
              variant="outline"
              label={t('matching.instantMatch.backToTask', 'Даалгавар руу буцах')}
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
  centerBlock: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.card,
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
