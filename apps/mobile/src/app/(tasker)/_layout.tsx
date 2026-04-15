import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { defaultStackScreenOptions } from '../../design/navigationOptions';

export default function TaskerLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* Task browsing */}
      <Stack.Screen name="tasks/[taskId]" options={{ title: t('taskDetails.title') }} />
      {/* Jobs */}
      <Stack.Screen name="jobs/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="jobs/[bookingId]/index"
        options={{ title: t('tasker.jobs.bookingDetail') }}
      />
      {/* Stats */}
      <Stack.Screen name="stats" options={{ title: t('tasker.stats.title') }} />
      {/* Verification */}
      <Stack.Screen
        name="verification/upload"
        options={{ title: t('tasker.verification.uploadTitle') }}
      />
    </Stack>
  );
}
