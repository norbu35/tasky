import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

export default function ApplicationSubmittedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SuccessCelebrationTemplate
      testID="SCR-TASK-011"
      headline={t('tasker.applied.headline')}
      body={t('tasker.applied.body')}
      nextSteps={[
        t('tasker.applied.step1'),
        t('tasker.applied.step2'),
        t('tasker.applied.step3'),
      ]}
      ctaLabel={t('tasker.applied.cta')}
      ctaOnPress={() => router.replace('/(tabs)')}
      secondaryCtaLabel={t('tasker.applied.secondaryCta')}
      secondaryCtaOnPress={() => router.push('/(tasker)/jobs')}
    />
  );
}
