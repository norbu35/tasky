import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

interface ReviewHardLockProps {
  bookingId: string;
}

export function ReviewHardLock({ bookingId }: ReviewHardLockProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSubmitReview = () => {
    router.push(`/(shared)/review/${bookingId}`);
  };

  return (
    <View
      className="flex-1 justify-center items-center px-lg bg-background"
      testID="review-hard-lock"
    >
      <View className="w-[72] h-[72] rounded-[18] bg-accent items-center justify-center mb-md">
        <Lock size={24} color={colors.primary} />
      </View>
      <Text className="text-title font-bold text-foreground text-center mb-md">
        {t('shared.review.hardLockTitle')}
      </Text>
      <Text className="text-body text-muted-foreground text-center leading-normal">
        {t('ReviewHardLock.copy1')}
      </Text>
      <Button
        label={t('shared.review.submit')}
        onPress={handleSubmitReview}
        style={{ marginTop: mobileTheme.spacing.xl, alignSelf: 'stretch' }}
        testID="review-hard-lock-cta"
      />
    </View>
  );
}
