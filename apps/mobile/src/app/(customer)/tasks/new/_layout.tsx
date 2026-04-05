import { Stack } from 'expo-router';

export default function NewTaskLayout() {
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
