import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TaskerTaskDetailRouteAlias() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  if (!taskId) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href={`/task/${taskId}`} />;
}
