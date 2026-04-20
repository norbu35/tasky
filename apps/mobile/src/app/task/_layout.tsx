import { Stack } from 'expo-router';

import { defaultStackScreenOptions } from '@/design/navigationOptions';

export default function TaskLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="[id]" options={{ headerShown: true, title: ' ' }} />
    </Stack>
  );
}
