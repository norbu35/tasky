import { render, screen } from '@testing-library/react-native';
import React from 'react';

let mockParams: Record<string, string | undefined> = { taskId: 'task-123' };

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    useLocalSearchParams: () => mockParams,
  };
});

describe('TaskerTaskDetailRouteAlias (SCR-TASK-002)', () => {
  beforeEach(() => {
    mockParams = { taskId: 'task-123' };
  });

  it('redirects the alias route to the canonical task detail route', () => {
    const TaskerTaskDetailRouteAlias = require('../../../src/app/(tasker)/tasks/[taskId]').default;

    render(<TaskerTaskDetailRouteAlias />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('/task/task-123');
  });

  it('falls back to the task feed when the route is missing taskId', () => {
    mockParams = {};
    const TaskerTaskDetailRouteAlias = require('../../../src/app/(tasker)/tasks/[taskId]').default;

    render(<TaskerTaskDetailRouteAlias />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('/(tabs)');
  });
});
