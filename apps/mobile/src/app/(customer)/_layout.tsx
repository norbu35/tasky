import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { defaultStackScreenOptions, modalStackScreenOptions } from '../../design/navigationOptions';

export default function CustomerLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* Task flows */}
      <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="tasks/[taskId]/index"
        options={{ title: t('customer.taskDetail.title', 'Task Detail') }}
      />
      <Stack.Screen
        name="tasks/[taskId]/applicants"
        options={{ title: t('customer.taskDetail.applicants', 'Applicants') }}
      />
      <Stack.Screen
        name="tasks/[taskId]/instant-match"
        options={{ title: t('matching.instantMatch.pageTitle', 'Instant Match') }}
      />
      {/* Booking flows */}
      <Stack.Screen
        name="bookings/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="bookings/confirm"
        options={{ title: t('customer.bookings.confirmTitle', 'Confirm Booking') }}
      />
      <Stack.Screen
        name="bookings/confirmed"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/index"
        options={{ title: t('customer.bookings.detailTitle', 'Booking Detail') }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/timeline"
        options={{ title: t('customer.bookings.timeline', 'Timeline') }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/dispute"
        options={{
          ...modalStackScreenOptions,
          title: t('customer.bookings.dispute', 'Raise Dispute'),
        }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/reschedule"
        options={{
          ...modalStackScreenOptions,
          title: t('customer.bookings.reschedule', 'Reschedule'),
        }}
      />
      <Stack.Screen
        name="bookings/[bookingId]/escrow"
        options={{ title: t('customer.bookings.escrow', 'Escrow') }}
      />
      {/* Tasker public profile */}
      <Stack.Screen
        name="taskers/[taskerId]"
        options={{ title: t('customer.taskerProfile.title', 'Tasker Profile') }}
      />
      {/* Rebook */}
      <Stack.Screen
        name="rebook"
        options={{ title: t('customer.rebook.title', 'Rebook') }}
      />
      {/* Disputes hub */}
      <Stack.Screen
        name="disputes/[disputeId]/index"
        options={{ title: t('customer.dispute.statusTitle', 'Dispute') }}
      />
    </Stack>
  );
}
