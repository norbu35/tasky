import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { InfoRow } from '../../../components/ui/InfoRow';
import { cn } from '../../../lib/cn';

type RouteState = 'loaded' | 'error';

const amountOptions = ['10,000 ₮', '20,000 ₮', '50,000 ₮'];

function resolveState(value: string | string[] | undefined): RouteState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'error' ? 'error' : 'loaded';
}

export default function TaskerCreditsPayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const state = resolveState(params.state);

  if (state === 'error') {
    return (
      <DetailTemplate
        testID="SCR-P2-002"
        isError
        onRetry={() => router.replace('/(tasker)/credits/pay')}
        errorMessage={t('TaskerCreditsPayScreen.copy1')}
      >
        <View />
      </DetailTemplate>
    );
  }

  return (
    <DetailTemplate
      ctaLabel={t('TaskerCreditsPayScreen.copy2')}
      ctaOnPress={() => router.replace('/(tasker)/credits/history')}
      testID="SCR-P2-002"
    >
      <View className="gap-lg">
        <View className="gap-md">
          <Text className="text-subtitle font-bold text-foreground">
            {t('tasker.credits.chooseAmount')}
          </Text>
          <View className="gap-sm">
            {amountOptions.map((amount) => (
              <Pressable
                key={amount}
                className={cn(
                  'py-md px-lg rounded-lg bg-muted',
                  amount === '20,000 ₮' && 'border border-primary',
                )}
                style={
                  amount === '20,000 ₮' ? { backgroundColor: 'rgba(16, 38, 56, 0.08)' } : undefined
                }
                testID={`tasker-credits-amount-${amount.replace(/[^0-9]/g, '')}`}
              >
                <Text
                  className={cn(
                    'text-body font-semibold text-foreground',
                    amount === '20,000 ₮' && 'text-primary',
                  )}
                >
                  {amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-md">
          <Text className="text-subtitle font-bold text-foreground">
            {t('tasker.credits.topUpPreview')}
          </Text>
          <View className="p-lg rounded-lg bg-muted">
            <InfoRow label={t('tasker.credits.method')} value={t('tasker.credits.mobileWallet')} />
            <InfoRow label={t('tasker.credits.processing')} value={t('tasker.credits.instant')} />
            <InfoRow label={t('tasker.credits.balanceAfterTopUp')} value="32,400 ₮" />
          </View>
        </View>

        <View className="gap-md">
          <Text className="text-subtitle font-bold text-foreground">
            {t('tasker.credits.notes')}
          </Text>
          <Text className="text-body text-textSecondary leading-relaxed">
            {t('TaskerCreditsPayScreen.copy3')}
          </Text>
        </View>
      </View>
    </DetailTemplate>
  );
}
