import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

export default function SubmittedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SuccessCelebrationTemplate
      headline={t('tasker.verification.submittedTitle')}
      body={t('tasker.verification.submittedBody')}
      nextSteps={[t('tasker.verification.pendingSla')]}
      ctaLabel={t('tasker.verification.submittedCta')}
      ctaOnPress={() => router.replace('/(tasker)/verification/pending')}
      testID="submitted-screen"
    />
  );
}
