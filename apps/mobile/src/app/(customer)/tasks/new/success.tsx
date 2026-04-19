import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { mobileTheme, elevations } from '@/design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function TaskPostedSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const checkScale = useSharedValue(0.8);

  React.useEffect(() => {
    checkScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, [checkScale]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleViewTask = () => {
    if (taskId) {
      router.replace(`/(customer)/tasks/${taskId}`);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer testID="SCR-CUST-008">
      <InsetScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
        extraBottomInset={120}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-lg pt-lg gap-2xl">
          <View className="items-center gap-md pt-lg">
            <Animated.View
              style={[{ backgroundColor: `${colors.verified}1A` }, animatedCheckStyle]}
            >
              <View className="w-24 h-24 rounded-full items-center justify-center">
                <CheckCircle2 size={50} color={colors.verified} />
              </View>
            </Animated.View>
            <View
              className="px-md py-xs rounded-full"
              style={{ backgroundColor: `${colors.verified}1A` }}
            >
              <Text className="text-caption font-sans-bold text-verified tracking-[0.8px]">
                {t('TaskPostedSuccessScreen.successBadge')}
              </Text>
            </View>
            <Text
              className="text-heading font-display-bold text-primary-deep text-center"
              style={{ lineHeight: typography.heading * 1.25 }}
            >
              {t('TaskPostedSuccessScreen.successTitle')}
            </Text>
            <Text
              className="text-body text-text-secondary text-center"
              style={{ lineHeight: typography.body * 1.6 }}
            >
              {t('TaskPostedSuccessScreen.successBody')}
            </Text>
            <View className="flex-row gap-sm mt-sm">
              <View className="w-2 h-2 rounded-xs bg-primary" />
              <View className="w-2 h-2 rounded-xs bg-secondary" />
              <View className="w-2 h-2 rounded-xs bg-verified" />
            </View>
          </View>

          <View className="rounded-md bg-muted p-2xl gap-sm" style={elevations.soft}>
            <Text className="text-caption font-sans-bold uppercase text-primary-deep mb-xs tracking-[0.8px]">
              {t('TaskPostedSuccessScreen.successNextLabel')}
            </Text>
            <Text className="text-body font-sans-bold text-primary-deep">
              {t('TaskPostedSuccessScreen.successNextTitle')}
            </Text>
            <Text
              className="text-caption text-text-secondary"
              style={{ lineHeight: typography.caption * 1.6 }}
            >
              {t('TaskPostedSuccessScreen.successNext1')}
            </Text>
            <Text
              className="text-caption text-text-secondary"
              style={{ lineHeight: typography.caption * 1.6 }}
            >
              {t('TaskPostedSuccessScreen.successNext2')}
            </Text>
          </View>
        </View>
      </InsetScrollView>

      <StickyActionBar>
        <View className="px-lg pt-md pb-lg gap-sm">
          <Button
            label={t('TaskPostedSuccessScreen.successCta')}
            onPress={handleViewTask}
            testID="task-posted-success-screen-cta"
          />
          <Button
            label={t('TaskPostedSuccessScreen.successDone')}
            variant="outline"
            onPress={handleDone}
            testID="task-posted-success-screen-done"
          />
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}
