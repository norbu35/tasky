import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../../../components/ui/Button';
import { elevations } from '../../../../design/elevations';
import { useTranslation } from 'react-i18next';

type EscrowState = 'shell' | 'confirm' | 'success' | 'error';

export default function EscrowScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: string; demoState?: string }>();
  const [state, setState] = React.useState<EscrowState>(() => {
    if (params.demoState === 'error') return 'error';
    if (params.state === 'escrowed') return 'success';
    return 'shell';
  });

  React.useEffect(() => {
    if (params.demoState === 'error') {
      setState('error');
      return;
    }

    if (params.state === 'escrowed') {
      setState('success');
      return;
    }

    setState('shell');
  }, [params.demoState, params.state]);

  if (state === 'error') {
    return (
      <ScrollView testID="SCR-P3-003"
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 24, gap: 16 }}
      >
        <View className="bg-muted rounded-lg p-xl gap-md" testID="booking-escrow-screen-error">
          <Text className="text-title font-sans-bold text-primaryDeep">
            {t('customer.bookings.escrowFlow.paymentFailed', 'Payment failed')}
          </Text>
          <Text className="text-body text-textSecondary leading-[24px]">
            {t('customer.bookings.escrowFlow.errorDescription', 'Escrow payment cannot proceed currently.')}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (state === 'success') {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        testID="booking-escrow-screen"
      >
        <View className="bg-muted rounded-lg p-xl gap-md">
          <Text className="text-title font-sans-bold text-primaryDeep">
            {t('customer.bookings.escrowFlow.paymentConfirmed', 'Payment confirmed')}
          </Text>
          <Text className="text-body font-sans-bold text-primaryDeep">
            {t('customer.bookings.escrowFlow.escrowSuccess', 'Escrow successful!')}
          </Text>
          <Text className="text-body text-textSecondary leading-[24px]">
            {t('customer.bookings.escrowFlow.escrowHeldDescription', 'Payment is securely held in escrow.')}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, gap: 16 }}
      testID="booking-escrow-screen"
    >
      <View testID="escrow-screen">
        <Text className="text-heading font-sans-bold text-primaryDeep mb-lg">
          {t('customer.bookings.escrowFlow.title', 'Escrow Payment')}
        </Text>
        <View className="bg-muted rounded-lg p-xl gap-md" style={elevations.soft}>
          <Text className="text-title font-sans-bold text-primaryDeep">
            {t('customer.bookings.escrowFlow.optInTitle', 'Add protection with escrow payment')}
          </Text>
          <Text className="text-body text-textSecondary leading-[24px]">
            {t('customer.bookings.escrowFlow.optInDescription', 'Payment will be securely deposited. Tasker receives money only after completion.')}
          </Text>
        </View>

        <View className="bg-muted rounded-lg p-lg gap-sm mt-lg">
          <Text className="text-body text-primaryDeep font-medium">
            {t('customer.bookings.escrowFlow.featureProtection', 'Money protection')}
          </Text>
          <Text className="text-body text-primaryDeep font-medium">
            {t('customer.bookings.escrowFlow.featureDispute', 'Dispute resolution')}
          </Text>
          <Text className="text-body text-primaryDeep font-medium">
            {t('customer.bookings.escrowFlow.featureAutoTransfer', 'Automatic transfer')}
          </Text>
        </View>

        <View className="mt-lg">
          <Button
            label={t('customer.bookings.escrowFlow.useEscrow', 'Use Escrow')}
            onPress={() => setState('confirm')}
            testID="booking-escrow-screen-cta"
          />
        </View>

        {state === 'confirm' && (
          <View className="bg-muted rounded-lg p-xl gap-md mt-lg" testID="booking-escrow-confirm-sheet">
            <Text className="text-title font-sans-bold text-primaryDeep">
              {t('customer.bookings.escrowFlow.confirmTitle', 'Confirm')}
            </Text>
            <Text className="text-body text-textSecondary leading-[24px]">
              {t('customer.bookings.escrowFlow.sheetDescription', 'By confirming to use Escrow, your payment will be securely held.')}
            </Text>
            <Button
              label={t('customer.bookings.escrowFlow.continueBtn', 'Continue')}
              onPress={() => setState('success')}
              testID="booking-escrow-confirm"
            />
            <Pressable onPress={() => setState('shell')}>
              <Text className="text-body text-textSecondary text-center">
                {t('customer.bookings.escrowFlow.cancelText', 'Go back')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
