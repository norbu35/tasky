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

export default function CustomerCancelBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — check cancellation policy, submit cancellation

  const handleCancel = () => {
    // TODO: wire real cancellation API call
    setIsOpen(false);
    router.back();
  };

  return (
    <ScreenContainer testID="SCR-CUST-022">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); router.back(); }}
        title={t('customer.cancelBooking.title', 'Cancel Booking')}
        testID="cancel-booking-sheet"
      >
        <View className="items-center gap-lg">
          <AlertTriangle size={32} color={colors.danger} />
          <Text className="text-body text-mutedForeground text-center leading-6">
            {t('customer.cancelBooking.warning', 'Late cancellations may incur a fee. Free cancellation is available up to 2 hours before the scheduled time.')}
          </Text>
          <Button
            label={t('customer.cancelBooking.confirm', 'Confirm Cancellation')}
            variant="destructive"
            onPress={handleCancel}
            className="self-stretch"
          />
          <Button
            label={t('common.goBack', 'Go Back')}
            variant="ghost"
            onPress={() => { setIsOpen(false); router.back(); }}
            className="self-stretch"
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}
