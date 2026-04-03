import React from 'react';
import { render, screen } from '@testing-library/react-native';

import CreateTaskScreen from '../../../src/app/create';

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Stack: {
      Screen: () => null,
    },
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
  };
});

describe('CreateTaskScreen', () => {
  it('redirects to the route-based customer task creation flow', () => {
    render(<CreateTaskScreen />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('/(customer)/tasks/new');
  });
});
