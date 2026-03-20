import React from 'react';
import { Stack as ExpoStack } from 'expo-router';
import { TaskPostWizard } from '../features/tasks/components/TaskPostWizard';

export default function CreateTaskScreen() {
  return (
    <>
      <ExpoStack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <TaskPostWizard />
    </>
  );
}
