import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../../components/shells';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';

export default function ReviewHardLockScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId, role } = useLocalSearchParams<{
    bookingId?: string;
    role?: 'customer' | 'tasker';
  }>();

  return (
    <ScreenContainer testID="SCR-SHARED-019">
      <ErrorStateTemplate
        message={t('ReviewHardLockScreen.copy1')}
        onRetry={() => {
          if (bookingId) {
            router.replace({
              pathname: '/(shared)/review/[bookingId]',
              params: { bookingId, role: role ?? 'customer' },
            });
          } else {
            router.back();
          }
        }}
        retryLabel={t('shared.review.submit')}
        testID="review-hard-lock"
      />
    </ScreenContainer>
  );
}
