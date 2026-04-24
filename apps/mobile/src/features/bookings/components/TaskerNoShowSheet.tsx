import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';
import { useFlagNoShow } from '../hooks/useFlagNoShow';

const { colors } = mobileTheme;

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
        <View className="py-2xl items-center" testID="no-show-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : hasFlagged ? (
        <View className="gap-md" testID="no-show-sheet-success">
          <Text className="text-subtitle font-semibold text-foreground">
            {t('tasker.jobs.noShow.flaggedHeading')}
          </Text>
          <Text className="text-body text-muted-foreground leading-[22px]">
            {t('TaskerNoShowSheet.copy1')}
          </Text>
          <Button
            label={t('tasker.jobs.noShow.doneButton')}
            onPress={onClose}
            testID="no-show-done"
          />
        </View>
      ) : isReminderPhase ? (
        <View className="gap-md">
          <Text className="text-subtitle font-semibold text-foreground">
            {t('tasker.jobs.noShow.reminderHeading')}
          </Text>
          <Text className="text-body text-muted-foreground leading-[22px]">
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
        <View className="gap-md">
          <Text className="text-subtitle font-semibold text-foreground">
            {t('tasker.jobs.noShow.flagHeading')}
          </Text>
          <Text className="text-body text-muted-foreground leading-[22px]">
            {t('TaskerNoShowSheet.copy3')}
          </Text>
          <View className="bg-muted rounded-md p-md">
            <Text className="text-micro text-muted-foreground leading-[18px]">
              {t('tasker.jobs.noShow.warning')}
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
