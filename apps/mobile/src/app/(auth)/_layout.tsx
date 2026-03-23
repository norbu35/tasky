import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="permission-camera" />
      <Stack.Screen name="permission-location" />
      <Stack.Screen name="permission-notifications" />
    </Stack>
  );
}
