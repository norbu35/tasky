import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../../components/templates/SuccessCelebrationTemplate';

export default function TaskPostedSuccessScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleViewTasks = () => {
        router.replace('/(customer)/tasks');
    };

    return (
        <SuccessCelebrationTemplate
            headline={t('customer.postTask.successTitle', 'Task Posted!')}
            body={t('customer.postTask.successBody', 'Taskers in your area will be notified')}
            nextSteps={[
                t('customer.postTask.successNext1', "You'll get applications soon"),
                t('customer.postTask.successNext2', 'Review Tasker profiles and ratings'),
            ]}
            ctaLabel={t('customer.postTask.successCta', 'View My Tasks')}
            ctaOnPress={handleViewTasks}
            testID="task-posted-success-screen"
        />
    );
}
