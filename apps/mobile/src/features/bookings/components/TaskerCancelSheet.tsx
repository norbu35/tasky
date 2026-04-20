import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';
import { useCancelBooking } from '../hooks/useCancelBooking';

const { colors } = mobileTheme;

interface TaskerCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  strikeCount: number;
  onCancelled?: () => void;
}

export function TaskerCancelSheet({
  isOpen,
  onClose,
  bookingId,
  strikeCount,
  onCancelled,
}: TaskerCancelSheetProps) {
  const { t } = useTranslation();
  const cancelBooking = useCancelBooking();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const hasSuspensionRisk = strikeCount >= 2;
  const confirmLabel = hasSuspensionRisk
    ? t('tasker.jobs.cancel.confirmDanger')
    : t('tasker.jobs.cancel.confirmButton');

  const reasons = useMemo(
    () => [
      t('tasker.jobs.cancel.reasonScheduleConflict'),
      t('tasker.jobs.cancel.reasonPersonal'),
      t('tasker.jobs.cancel.reasonEmergency'),
      t('tasker.jobs.cancel.reasonOther'),
    ],
    [t],
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedReason) {
      return;
    }

    await cancelBooking.mutateAsync({
      bookingId,
      idempotencyKey: `cancel-${bookingId}-${Date.now()}`,
    });
    onCancelled?.();
  }, [bookingId, cancelBooking, onCancelled, selectedReason]);

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasker.jobs.cancel.title')}
      testID="tasker-cancel-sheet"
    >
      {cancelBooking.isPending ? (
        <View className="py-2xl items-center" testID="cancel-sheet-loading">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View className="gap-md">
          <Text className="text-subtitle font-semibold text-foreground">
            {t('tasker.jobs.cancel.heading')}
          </Text>

          <Text className="text-body text-muted-foreground leading-[22px]">
            {t('tasker.jobs.cancel.description', t('TaskerCancelSheet.copy1'))}
          </Text>

          {strikeCount > 0 && !hasSuspensionRisk && (
            <View className="bg-muted rounded-md p-md gap-xs">
              <Text className="text-body text-foreground font-medium">
                {t(
                  'tasker.jobs.cancel.strikeWarning',
                  `Анхааруулга: Та сүүлийн 30 хоногт ${strikeCount} удаа цуцалсан байна.`,
                )}
              </Text>
              <Text className="text-micro text-muted-foreground font-bold">
                {`${strikeCount}/3`} {t('tasker.jobs.cancel.strikeCountLabel')}
              </Text>
            </View>
          )}

          {hasSuspensionRisk && (
            <View className="bg-muted rounded-md border border-danger p-md gap-xs">
              <Text className="text-body text-danger font-semibold">
                {t('TaskerCancelSheet.copy2')}
              </Text>
              <Text className="text-micro text-muted-foreground font-bold">
                {`${strikeCount}/3`} {t('tasker.jobs.cancel.strikeCountLabel')}
              </Text>
            </View>
          )}

          <View className="gap-sm">
            <Text className="text-micro font-bold text-muted-foreground uppercase tracking-[0.75]">
              {t('tasker.jobs.cancel.reasonLabel')}
            </Text>
            <View className="gap-sm">
              {reasons.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    className={`border rounded-md px-md py-sm bg-background${
                      isSelected ? ' border-primary' : ' border-border'
                    }`}
                    style={
                      isSelected ? { backgroundColor: withAlpha(colors.primary, 0.07) } : undefined
                    }
                    testID={`cancel-reason-${reason}`}
                  >
                    <Text
                      className={`text-body${
                        isSelected ? ' text-primary-deep font-bold' : ' text-foreground'
                      }`}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {!hasSuspensionRisk && strikeCount === 0 && (
            <View className="bg-muted rounded-md p-md">
              <Text className="text-micro text-muted-foreground leading-[18px]">
                {t('TaskerCancelSheet.copy3')}
              </Text>
            </View>
          )}

          <Button
            label={confirmLabel}
            variant="destructive"
            onPress={handleConfirm}
            disabled={!selectedReason}
            testID="cancel-confirm"
          />
          <Button
            label={t('tasker.jobs.cancel.backButton')}
            variant="outline"
            onPress={onClose}
            testID="cancel-back"
          />
        </View>
      )}
    </ModalSheetTemplate>
  );
}
