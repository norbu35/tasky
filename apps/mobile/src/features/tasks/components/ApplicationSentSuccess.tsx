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
    t('tasker.taskDetail.nextStep1', 'Захиалагч анкетуудыг хянаж, сонголт хийнэ'),
    t('tasker.taskDetail.nextStep2', 'Таныг сонговол мэдэгдэл авна'),
    t('tasker.taskDetail.nextStep3', 'Бусад даалгавруудад ч анкет илгээх боломжтой'),
  ];

  return (
    <SuccessCelebrationTemplate
      headline={t('tasker.taskDetail.applicationSentTitle', 'Анкет амжилттай илгээгдлээ!')}
      body={t(
        'tasker.taskDetail.applicationSentBody',
        'Таны анкет захиалагчид хүргэгдлээ. Захиалагч таныг сонговол мэдэгдэл авна.',
      )}
      nextSteps={nextSteps}
      ctaLabel={t('tasker.taskDetail.applicationSentCta', 'Бусад даалгавар үзэх')}
      ctaOnPress={onBrowseMore}
      secondaryCtaLabel={onViewTask ? t('tasker.taskDetail.viewTask', 'Даалгавар харах') : undefined}
      secondaryCtaOnPress={onViewTask}
      testID={testID}
    />
  );
}
