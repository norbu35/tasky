import React from 'react';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

interface ApplicationSentSuccessProps {
  onBrowseMore: () => void;
  onViewTask?: () => void;
  testID?: string;
}

export function ApplicationSentSuccess({
  onBrowseMore,
  onViewTask,
  testID = 'application-sent',
}: ApplicationSentSuccessProps) {
  const { t } = useTranslation();

  const nextSteps = [
    t('tasker.taskDetail.nextStep1'),
    t('tasker.taskDetail.nextStep2'),
    t('tasker.taskDetail.nextStep3'),
  ];

  return (
    <SuccessCelebrationTemplate
      headline={t('tasker.taskDetail.applicationSentTitle')}
      body={t('ApplicationSentSuccess.copy1')}
      nextSteps={nextSteps}
      ctaLabel={t('tasker.taskDetail.applicationSentCta')}
      ctaOnPress={onBrowseMore}
      secondaryCtaLabel={onViewTask ? t('tasker.taskDetail.viewTask') : undefined}
      secondaryCtaOnPress={onViewTask}
      testID={testID}
    />
  );
}
