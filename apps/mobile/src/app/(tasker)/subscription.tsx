import { useTranslation } from 'react-i18next';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
        <Text className="text-heading font-bold text-primaryDeep">
          {t('tasker.subscription.title', 'Tasker Pro')}
        </Text>
        <Text className="text-title font-semibold text-primaryDeep">
          {t('tasker.subscription.heroTitle', 'Become a Tasker Pro')}
        </Text>

        {isLockedDemo ? (
          <View className="bg-muted rounded-lg p-xl gap-sm" testID="subscription-screen-locked">
            <Text className="text-title font-bold text-primaryDeep">
              {t('tasker.subscription.ineligibleTitle', 'Not eligible')}
            </Text>
            <Text className="text-body text-textSecondary leading-relaxed">
              {t('tasker.subscription.ineligibleDesc', 'Tasker Pro requires 4.5+ rating to be eligible')}
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-muted rounded-lg p-xl gap-sm">
              <Text className="text-title font-bold text-primaryDeep">
                {t('tasker.subscription.planStandard', 'Standard')}
              </Text>
              <Text className="text-body text-textSecondary leading-relaxed">
                {t('tasker.subscription.planStandardDesc', 'More visibility and more trust.')}
              </Text>
            </View>
            <View className="bg-muted rounded-lg p-xl gap-sm">
              <Text className="text-title font-bold text-primaryDeep">
                {t('tasker.subscription.planPremium', 'Premium')}
              </Text>
              <Text className="text-body text-textSecondary leading-relaxed">
                {t('tasker.subscription.heroDescription', 'Priority boost and additional benefits.')}
              </Text>
            </View>
            {status === 'active' ? (
              <View className="self-start bg-trustMuted rounded-lg px-lg py-sm">
                <Text className="text-body font-bold text-trustForeground">
                  {t('tasker.subscription.activeLabel', 'Active')}
                </Text>
              </View>
            ) : (
              <Button
                testID="subscription-screen-cta"
                label={t('tasker.subscription.subscribeAction', 'Subscribe')}
                onPress={() => setStatus('confirming')}
              />
            )}
          </>
        )}
      </ScrollView>

      {status === 'confirming' ? (
        <View className="p-xl gap-md bg-background" testID="subscription-confirm-sheet">
          <Text className="text-title font-bold text-primaryDeep">
            {t('tasker.subscription.confirmTitle', 'Confirm your choice')}
          </Text>
          <Text className="text-body text-textSecondary leading-relaxed">
            {t('tasker.subscription.confirmBody', 'Activate Tasker Pro subscription?')}
          </Text>
          <Button
            testID="subscription-confirm"
            label={t('tasker.subscription.confirmTitle', 'Confirm')}
            onPress={() => setStatus('active')}
          />
          <Button
            label={t('tasker.subscription.cancelText', 'Cancel')}
            variant="ghost"
            onPress={() => setStatus('idle')}
          />
        </View>
      ) : null}
    </View>
  );
}
