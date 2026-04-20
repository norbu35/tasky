import { Stack } from 'expo-router';

import ApplicantsSelectionScreen from '@/features/tasks/screens/ApplicantsSelectionScreen';

export default function ApplicantsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ApplicantsSelectionScreen />
    </>
  );
}
