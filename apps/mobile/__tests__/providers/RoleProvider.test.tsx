import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RoleProvider, useRole } from '../../src/providers/RoleProvider';
import { useAppStore } from '../../src/store/appStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    mergeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
  },
}));

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({ currentRole: 'customer' });
});

function RoleConsumer() {
  const { currentRole, isCustomer, isTasker, switchRole, setRole } = useRole();
  return (
    <>
      <Text testID="current-role">{currentRole}</Text>
      <Text testID="is-customer">{String(isCustomer)}</Text>
      <Text testID="is-tasker">{String(isTasker)}</Text>
      <Text testID="switch" onPress={switchRole}>
        Switch
      </Text>
      <Text testID="set-tasker" onPress={() => setRole('tasker')}>
        Set Tasker
      </Text>
      <Text testID="set-customer" onPress={() => setRole('customer')}>
        Set Customer
      </Text>
    </>
  );
}

describe('RoleProvider', () => {
  it('renders children correctly', () => {
    render(
      <RoleProvider>
        <Text>Child content</Text>
      </RoleProvider>,
    );
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('provides default role as customer', () => {
    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );
    expect(screen.getByTestId('current-role')).toHaveTextContent('customer');
  });

  it('reports isCustomer=true and isTasker=false for customer role', () => {
    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );
    expect(screen.getByTestId('is-customer')).toHaveTextContent('true');
    expect(screen.getByTestId('is-tasker')).toHaveTextContent('false');
  });

  it('switchRole toggles from customer to tasker', () => {
    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );
    expect(screen.getByTestId('current-role')).toHaveTextContent('customer');

    fireEvent.press(screen.getByTestId('switch'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('tasker');
  });

  it('switchRole toggles from tasker back to customer', () => {
    useAppStore.setState({ currentRole: 'tasker' });

    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );
    expect(screen.getByTestId('current-role')).toHaveTextContent('tasker');

    fireEvent.press(screen.getByTestId('switch'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('customer');
  });

  it('reports isCustomer=false and isTasker=true for tasker role', () => {
    useAppStore.setState({ currentRole: 'tasker' });

    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );
    expect(screen.getByTestId('is-customer')).toHaveTextContent('false');
    expect(screen.getByTestId('is-tasker')).toHaveTextContent('true');
  });

  it('setRole sets a specific role', () => {
    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );

    fireEvent.press(screen.getByTestId('set-tasker'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('tasker');

    fireEvent.press(screen.getByTestId('set-customer'));
    expect(screen.getByTestId('current-role')).toHaveTextContent('customer');
  });

  it('throws error when useRole is called outside RoleProvider', () => {
    // Suppress React's console.error for the expected error boundary
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<RoleConsumer />)).toThrow('useRole must be used within RoleProvider');

    spy.mockRestore();
  });
});
