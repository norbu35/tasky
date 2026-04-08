import React from 'react';
import { render, screen } from '@testing-library/react-native';

import TasksTabScreen from '../../../src/app/(customer)/tasks/index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const mockUseMyTasks = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useMyTasks', () => ({
  useMyTasks: () => mockUseMyTasks(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMyTasks.mockReturnValue({
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('TasksTabScreen', () => {
  it('renders the customer task list instead of a placeholder', () => {
    render(<TasksTabScreen />);
    expect(screen.getByTestId('my-tasks-screen')).toBeTruthy();
    expect(screen.getByText(/My Tasks|Миний даалгаврууд/)).toBeTruthy();
  });
});
