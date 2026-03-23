import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { useFlagNoShow } from '../hooks/useFlagNoShow';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

interface TaskerNoShowSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  minutesPastSchedule: number;
}

export function TaskerNoShowSheet({
  isOpen,
  onClose,
  bookingId,
  minutesPastSchedule,
}: TaskerNoShowSheetProps) {
  const { t } = useTranslation();
  const flagNoShow = useFlagNoShow();

  const isReminderPhase = minutesPastSchedule >= 10 && minutesPastSchedule < 15;
  const isFlagAvailable = minutesPastSchedule >= 15;

  const handleFlag = () => {
    flagNoShow.mutate({ bookingId });
  };

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasker.jobs.noShow.title', 'Customer No-Show')}
      testID="tasker-no-show-sheet"
    >
      {flagNoShow.isPending ? (
        <View style={styles.loadingContainer} testID="no-show-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isReminderPhase ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.reminderHeading', 'Have you met the customer?')}
          </Text>
          <Text style={styles.description}>
            {t(
              'tasker.jobs.noShow.reminderDescription',
              '10 minutes past scheduled time. Please update your arrival status.',
            )}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.dismissButton', 'Dismiss')}
            variant="outline"
            onPress={onClose}
            testID="no-show-dismiss"
          />
        </View>
      ) : isFlagAvailable ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.flagHeading', 'Customer did not show up')}
          </Text>
          <Text style={styles.description}>
            {t(
              'tasker.jobs.noShow.flagDescription',
              '15 minutes past scheduled time and the customer has not checked in.',
            )}
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {t(
                'tasker.jobs.noShow.warning',
                'After flagging, the booking enters review. False reports carry consequences.',
              )}
            </Text>
          </View>
          <Button
            label={t('tasker.jobs.noShow.flagButton', 'Flag No-Show')}
            variant="destructive"
            onPress={handleFlag}
            testID="no-show-flag"
          />
          <Button
            label={t('tasker.jobs.noShow.waitButton', 'Wait')}
            variant="outline"
            onPress={onClose}
            testID="no-show-wait"
          />
        </View>
      ) : null}
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  heading: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.foreground,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
});
