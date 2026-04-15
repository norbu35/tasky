import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function TaskerTaskDetailRouteAlias() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  if (!taskId) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href={`/task/${taskId}`} />;
}
