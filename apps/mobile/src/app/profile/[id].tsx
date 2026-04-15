import { Stack } from 'expo-router';

import { TaskerPublicProfile } from '../../features/profile/components/TaskerPublicProfile';

export default function TaskerProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TaskerPublicProfile />
    </>
  );
}
