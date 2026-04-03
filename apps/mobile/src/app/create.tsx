import React from 'react';
import { Redirect, Stack as ExpoStack } from 'expo-router';

export default function CreateTaskScreen() {
  return (
    <>
      <ExpoStack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <Redirect href="/(customer)/tasks/new" />
    </>
  );
}
