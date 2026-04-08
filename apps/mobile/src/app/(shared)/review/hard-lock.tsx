import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../../components/shells';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';

export default function ReviewHardLockScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ScreenContainer testID="SCR-SHARED-019">
      <ErrorStateTemplate
        message={t('ReviewHardLockScreen.copy1')}
        onRetry={() => {
          // TODO: wire real data — navigate to the pending review
          router.back();
        }}
        retryLabel={t('review.hardLock.reviewNow')}
        testID="review-hard-lock"
      />
    </ScreenContainer>
  );
}
