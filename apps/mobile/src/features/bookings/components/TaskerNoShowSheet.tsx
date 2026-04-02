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
      title={t('tasker.jobs.noShow.title', 'Захиалагч ирээгүй')}
      testID="tasker-no-show-sheet"
    >
      {flagNoShow.isPending ? (
        <View style={styles.loadingContainer} testID="no-show-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : hasFlagged ? (
        <View style={styles.contentContainer} testID="no-show-sheet-success">
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.flaggedHeading', 'Ирээгүй тэмдэглэгдлээ')}
          </Text>
          <Text style={styles.description}>
            {t(
              'tasker.jobs.noShow.flaggedDescription',
              'Захиалга хянагдахаар илгээгдлээ. Дараагийн алхмын талаар мэдэгдэл авна.',
            )}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.doneButton', 'Ойлголоо')}
            onPress={onClose}
            testID="no-show-done"
          />
        </View>
      ) : isReminderPhase ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.reminderHeading', 'Захиалагчтайгаа уулзсан уу?')}
          </Text>
          <Text style={styles.description}>
            {t(
              'tasker.jobs.noShow.reminderDescription',
              'Хуваарьт цагаас 10 минут өнгөрлөө. Ирсэн эсэхээ мэдэгдэнэ үү.',
            )}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.arrivedButton', 'Би ирсэн')}
            variant="outline"
            onPress={onClose}
            testID="no-show-arrived"
          />
          <Button
            label={t('tasker.jobs.noShow.dismissButton', 'Хаах')}
            variant="outline"
            onPress={onClose}
            testID="no-show-dismiss"
          />
        </View>
      ) : isFlagAvailable ? (
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            {t('tasker.jobs.noShow.flagHeading', 'Захиалагч ирээгүй')}
          </Text>
          <Text style={styles.description}>
            {t(
              'tasker.jobs.noShow.flagDescription',
              'Хуваарьт цагаас 15 минут өнгөрсөн бөгөөд захиалагч холбогдоогүй байна.',
            )}
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {t(
                'tasker.jobs.noShow.warning',
                t(
                  'customer.bookings.noShowWarning',
                  'Ирээгүй тэмдэглэсний дараа захиалгыг хянуулна. Худал мэдээлэл өгвөл хариуцлага хүлээнэ.',
                ),
              )}
            </Text>
          </View>
          <Button
            label={t('tasker.jobs.noShow.flagButton', 'Ирээгүй гэж тэмдэглэх')}
            variant="destructive"
            onPress={handleFlag}
            testID="no-show-flag"
          />
          <Button
            label={t('tasker.jobs.noShow.waitButton', 'Хүлээх')}
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
