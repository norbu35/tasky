import { useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import TaskDetailScreen from '@/features/tasks/screens/TaskDetailScreen';

export default function Route() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t('taskDetails.title') }} />
      <TaskDetailScreen id={id ?? ''} />
    </>
  );
}
