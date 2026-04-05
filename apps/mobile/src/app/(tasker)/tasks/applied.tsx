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
      headline={t('tasker.applied.headline', 'Application Sent!')}
      body={t('tasker.applied.body', 'The customer will review your application and respond soon.')}
      nextSteps={[
        t('tasker.applied.step1', 'Customer reviews applicants'),
        t('tasker.applied.step2', 'You get notified if selected'),
        t('tasker.applied.step3', 'Booking is confirmed automatically'),
      ]}
      ctaLabel={t('tasker.applied.cta', 'Browse More Tasks')}
      ctaOnPress={() => router.replace('/(tabs)')}
      secondaryCtaLabel={t('tasker.applied.secondaryCta', 'View My Applications')}
      secondaryCtaOnPress={() => router.push('/(tasker)/jobs')}
    />
  );
}
