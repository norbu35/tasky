import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { defaultStackScreenOptions, modalStackScreenOptions } from '../../design/navigationOptions';

export default function TaskerLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* Task browsing */}
      <Stack.Screen
        name="tasks/[taskId]"
        options={{ title: t('taskDetails.title', 'Task Details') }}
      />
      {/* Jobs */}
      <Stack.Screen name="jobs/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="jobs/[bookingId]/index"
        options={{ title: t('tasker.jobs.bookingDetail', 'Захиалгын дэлгэрэнгүй') }}
      />
      {/* Stats */}
      <Stack.Screen
        name="stats"
        options={{ title: t('tasker.stats.title', 'Миний статистик') }}
      />
      {/* Referrals */}
      <Stack.Screen
        name="referrals"
        options={{ title: t('tasker.referrals.title', 'Referrals') }}
      />
      {/* Credits */}
      <Stack.Screen
        name="credits/index"
        options={{ title: t('tasker.credits.title', 'Credits') }}
      />
      <Stack.Screen
        name="credits/history"
        options={{ title: t('tasker.credits.history', 'Credit History') }}
      />
      <Stack.Screen
        name="credits/pay"
        options={{
          ...modalStackScreenOptions,
          title: t('tasker.credits.topUp', 'Top Up Credits'),
        }}
      />
      {/* Profile polish */}
      <Stack.Screen
        name="profile/polish"
        options={{ title: t('tasker.profilePolish.title', 'AI тайлбар сайжруулах') }}
      />
      {/* Verification */}
      <Stack.Screen
        name="verification/upload"
        options={{ title: t('tasker.verification.uploadTitle', 'Upload Documents') }}
      />
      {/* Subscription */}
      <Stack.Screen
        name="subscription"
        options={{ title: t('tasker.subscription.title', 'Subscription') }}
      />
    </Stack>
  );
}
