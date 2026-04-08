import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenContainer } from '../../../../components/shells';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function TaskerCancelBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — check strike policy, submit cancellation with reason

  const handleCancel = () => {
    // TODO: wire real cancellation API call
    setIsOpen(false);
    router.back();
  };

  return (
    <ScreenContainer testID="SCR-TASK-015">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.back();
        }}
        title={t('tasker.cancelBooking.title')}
        testID="tasker-cancel-booking-sheet"
      >
        <View className="items-center gap-lg">
          <AlertTriangle size={32} color={colors.danger} />
          <Text className="text-body text-mutedForeground text-center leading-6">
            {t('tasker.cancelBooking.warning')}
          </Text>
          <Button
            label={t('tasker.cancelBooking.confirm')}
            variant="destructive"
            onPress={handleCancel}
            className="self-stretch"
          />
          <Button
            label={t('common.goBack')}
            variant="ghost"
            onPress={() => {
              setIsOpen(false);
              router.back();
            }}
            className="self-stretch"
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}
