import { Redirect, Stack } from 'expo-router';

import { useReviewGate } from '@/features/review/components/ReviewGateProvider';

export default function NewTaskLayout() {
  const { isLocked, oldestPending } = useReviewGate();

  if (isLocked && oldestPending?.booking_id) {
    return <Redirect href={`/(shared)/review/${oldestPending.booking_id}`} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="category" />
      <Stack.Screen name="intake" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="location" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="review" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
