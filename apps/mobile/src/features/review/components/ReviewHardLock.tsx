import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { mobileSurfaces } from '@/design/surfaces';
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
      <View
        className="rounded-lg bg-accent items-center justify-center mb-md"
        style={{
          width: mobileSurfaces.statusHero.iconBox,
          height: mobileSurfaces.statusHero.iconBox,
        }}
      >
        <Lock size={24} color={colors.primary} />
      </View>
      <Text className="text-title font-sans-bold text-foreground text-center mb-md">
        {t('shared.review.hardLockTitle')}
      </Text>
      <Text className="text-body text-muted-foreground text-center leading-normal">
        {t('ReviewHardLock.copy1')}
      </Text>
      <Button
        label={t('shared.review.submit')}
        onPress={handleSubmitReview}
        className="mt-xl"
        style={{ alignSelf: 'stretch' }}
        testID="review-hard-lock-cta"
      />
    </View>
  );
}
