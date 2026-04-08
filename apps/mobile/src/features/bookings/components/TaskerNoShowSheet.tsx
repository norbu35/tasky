import React, { useCallback, useState } from 'react';
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
  const [hasFlagged, setHasFlagged] = useState(false);

  const isReminderPhase = minutesPastSchedule >= 10 && minutesPastSchedule < 15;
  const isFlagAvailable = minutesPastSchedule >= 15;

  const handleFlag = useCallback(() => {
    void flagNoShow.mutateAsync({ bookingId });
    setHasFlagged(true);
  }, [bookingId, flagNoShow]);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasker.jobs.noShow.title')}
      testID="tasker-no-show-sheet"
    >
      {flagNoShow.isPending ? (
        <View style={styles.loadingContainer} testID="no-show-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : hasFlagged ? (
        <View style={styles.contentContainer} testID="no-show-sheet-success">
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.flaggedHeading')}
          </Text>
          <Text style={styles.description}>
            {t('TaskerNoShowSheet.copy1')}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.doneButton')}
            onPress={onClose}
            testID="no-show-done"
          />
        </View>
      ) : isReminderPhase ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.reminderHeading')}
          </Text>
          <Text style={styles.description}>
            {t('TaskerNoShowSheet.copy2')}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.arrivedButton')}
            variant="outline"
            onPress={onClose}
            testID="no-show-arrived"
          />
          <Button
            label={t('tasker.jobs.noShow.dismissButton')}
            variant="outline"
            onPress={onClose}
            testID="no-show-dismiss"
          />
        </View>
      ) : isFlagAvailable ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.flagHeading')}
          </Text>
          <Text style={styles.description}>
            {t('TaskerNoShowSheet.copy3')}
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {t(
                'tasker.jobs.noShow.warning',
                t('TaskerNoShowSheet.copy4'),
              )}
            </Text>
          </View>
          <Button
            label={t('tasker.jobs.noShow.flagButton')}
            variant="destructive"
            onPress={handleFlag}
            testID="no-show-flag"
          />
          <Button
            label={t('tasker.jobs.noShow.waitButton')}
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
