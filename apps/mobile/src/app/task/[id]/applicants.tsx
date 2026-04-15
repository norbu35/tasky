import { Stack } from 'expo-router';

import { ApplicantsList } from '../../../features/tasks/components/ApplicantsList';

export default function ApplicantsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ApplicantsList />
    </>
  );
}
