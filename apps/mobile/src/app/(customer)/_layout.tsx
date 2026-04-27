import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { defaultStackScreenOptions, modalStackScreenOptions } from '@/design/navigationOptions';

export default function CustomerLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* Task flows */}
      <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/new" options={{ headerShown: false }} />
      <Stack.Screen
        name="tasks/[taskId]/index"
        options={{ title: t('TaskDetailCustomerScreen.title') }}
      />
      <Stack.Screen
        name="tasks/[taskId]/applicants"
        options={{ headerShown: false, title: t('TaskDetailCustomerScreen.applicants') }}
      />
      {/* Booking flows */}
      <Stack.Screen name="bookings/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="bookings/confirm"
        options={{ title: t('customer.bookings.confirmTitle') }}
      />
      <Stack.Screen name="bookings/confirmed" options={{ headerShown: false }} />
      <Stack.Screen
        name="bookings/[bookingId]/index"
        options={{ title: t('customer.bookings.detailTitle') }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/timeline"
        options={{ title: t('customer.bookings.timeline') }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/dispute"
        options={{
          ...modalStackScreenOptions,
          title: t('customer.bookings.dispute'),
        }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/reschedule"
        options={{
          ...modalStackScreenOptions,
          title: t('customer.bookings.reschedule'),
        }}
      />
      {/* Tasker public profile */}
      <Stack.Screen
        name="taskers/[taskerId]"
        options={{ title: t('customer.taskerProfile.title') }}
      />
      {/* Rebook */}
      <Stack.Screen name="rebook" options={{ title: t('customer.rebook.title') }} />
      {/* Disputes hub */}
      <Stack.Screen
        name="disputes/[disputeId]/index"
        options={{ title: t('customer.dispute.statusTitle') }}
      />
    </Stack>
  );
}
