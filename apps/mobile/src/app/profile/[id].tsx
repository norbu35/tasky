import { Stack } from 'expo-router';

import TaskerProfileScreen from '@/features/profile/screens/TaskerProfileScreen';

export default function TaskerProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TaskerProfileScreen />
    </>
  );
}
