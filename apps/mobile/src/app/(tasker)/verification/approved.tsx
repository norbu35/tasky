import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

export default function ApprovedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SuccessCelebrationTemplate
      testID="SCR-TASK-008"
      headline={t('tasker.verification.approvedTitle')}
      body={t('tasker.verification.approvedBody')}
      nextSteps={[t('tasker.verification.approvedCta')]}
      ctaLabel={t('tasker.verification.approvedCta')}
      ctaOnPress={() => router.replace('/(tabs)')}
    />
  );
}
