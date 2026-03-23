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
    t('tasker.taskDetail.nextStep1', 'The customer will review applications and choose'),
    t('tasker.taskDetail.nextStep2', "You'll get a notification if selected"),
    t('tasker.taskDetail.nextStep3', 'You can keep applying to other tasks'),
  ];

  return (
    <SuccessCelebrationTemplate
      headline={t('tasker.taskDetail.applicationSentTitle')}
      body={t('tasker.taskDetail.applicationSentBody')}
      nextSteps={nextSteps}
      ctaLabel={t('tasker.taskDetail.applicationSentCta')}
      ctaOnPress={onBrowseMore}
      secondaryCtaLabel={onViewTask ? t('tasker.taskDetail.viewTask', 'View Task') : undefined}
      secondaryCtaOnPress={onViewTask}
      testID={testID}
    />
  );
}
