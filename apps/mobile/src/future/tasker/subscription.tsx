import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';

type SubscriptionState = 'eligible' | 'ineligible';
type SubscriptionStatus = 'idle' | 'confirming' | 'active';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: SubscriptionState; demoState?: string }>();
  const isLockedDemo = params.demoState === 'locked' || params.state === 'ineligible';
  const [status, setStatus] = React.useState<SubscriptionStatus>('idle');

  return (
    <View testID="SCR-P3-004" className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-xl gap-lg"
        testID="subscription-screen"
      >
        <Text className="text-heading font-bold text-primary-deep">
          {t('tasker.subscription.title')}
        </Text>
        <Text className="text-title font-semibold text-primary-deep">
          {t('tasker.subscription.heroTitle')}
        </Text>

        {isLockedDemo ? (
          <View className="bg-muted rounded-lg p-xl gap-sm" testID="subscription-screen-locked">
            <Text className="text-title font-bold text-primary-deep">
              {t('tasker.subscription.ineligibleTitle')}
            </Text>
            <Text className="text-body text-text-secondary leading-relaxed">
              {t('tasker.subscription.ineligibleDesc')}
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-muted rounded-lg p-xl gap-sm">
              <Text className="text-title font-bold text-primary-deep">
                {t('tasker.subscription.planStandard')}
              </Text>
              <Text className="text-body text-text-secondary leading-relaxed">
                {t('tasker.subscription.planStandardDesc')}
              </Text>
            </View>
            <View className="bg-muted rounded-lg p-xl gap-sm">
              <Text className="text-title font-bold text-primary-deep">
                {t('tasker.subscription.planPremium')}
              </Text>
              <Text className="text-body text-text-secondary leading-relaxed">
                {t('tasker.subscription.heroDescription')}
              </Text>
            </View>
            {status === 'active' ? (
              <View className="self-start bg-trust-muted rounded-lg px-lg py-sm">
                <Text className="text-body font-bold text-trust-foreground">
                  {t('tasker.subscription.activeLabel')}
                </Text>
              </View>
            ) : (
              <Button
                testID="subscription-screen-cta"
                label={t('tasker.subscription.subscribeAction')}
                onPress={() => setStatus('confirming')}
              />
            )}
          </>
        )}
      </ScrollView>

      {status === 'confirming' ? (
        <View className="p-xl gap-md bg-background" testID="subscription-confirm-sheet">
          <Text className="text-title font-bold text-primary-deep">
            {t('tasker.subscription.confirmTitle')}
          </Text>
          <Text className="text-body text-text-secondary leading-relaxed">
            {t('tasker.subscription.confirmBody')}
          </Text>
          <Button
            testID="subscription-confirm"
            label={t('tasker.subscription.confirmTitle')}
            onPress={() => setStatus('active')}
          />
          <Button
            label={t('tasker.subscription.cancelText')}
            variant="ghost"
            onPress={() => setStatus('idle')}
          />
        </View>
      ) : null}
    </View>
  );
}
