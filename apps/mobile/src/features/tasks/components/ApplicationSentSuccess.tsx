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
    t(
      'tasker.taskDetail.nextStep1',
      'The customer will review your intro and profile next.',
    ),
    t('tasker.taskDetail.nextStep2', "You'll get a notification if you're shortlisted."),
    t('tasker.taskDetail.nextStep3', 'Keep applying while you wait.'),
  ];

  return (
    <SuccessCelebrationTemplate
      headline={t('tasker.taskDetail.applicationSentTitle', 'Application sent')}
      body={t(
        'tasker.taskDetail.applicationSentBody',
        'Your application is in. Stay ready in case the customer reaches out quickly.',
      )}
      nextSteps={nextSteps}
      ctaLabel={t('tasker.taskDetail.applicationSentCta', 'Browse more tasks')}
      ctaOnPress={onBrowseMore}
      secondaryCtaLabel={onViewTask ? t('tasker.taskDetail.viewTask', 'View Task') : undefined}
      secondaryCtaOnPress={onViewTask}
      testID={testID}
    />
  );
}
