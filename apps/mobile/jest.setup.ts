import { notifyManager } from '@tanstack/react-query';

// TanStack Query's default scheduler uses setTimeout(cb, 0) for batch notifications,
// which fires after act() closes and triggers "not wrapped in act" warnings.
// Running notifications synchronously prevents this.
notifyManager.setScheduler((cb) => cb());

jest.mock('react-native-reanimated', () => require('./__tests__/test-utils/reanimated-mock.js'));

jest.mock('react-native-worklets', () => {
  const noopFn = jest.fn((val: unknown) => val);
  return {
    makeShareableCloneRecursive: noopFn,
    makeShareable: noopFn,
    createSerializable: noopFn,
    createWorklet: jest.fn((fn: unknown) => fn),
    isWorklet: jest.fn(() => false),
    workletFactory: jest.fn(),
    getValueUnpackerCode: jest.fn(() => ''),
    WorkletsError: class WorkletsError extends Error {},
    WorkletsHostObject: jest.fn(),
    NativeWorklets: {
      makeShareableClone: jest.fn(),
      scheduleOnUI: jest.fn(),
      scheduleOnJS: jest.fn(),
      registerSensor: jest.fn(),
      unregisterSensor: jest.fn(),
      registerEventHandler: jest.fn(),
      unregisterEventHandler: jest.fn(),
      getViewProp: jest.fn(),
      enableLayoutAnimations: jest.fn(),
      configureProps: jest.fn(),
      subscribeForKeyboardEvents: jest.fn(),
      unsubscribeFromKeyboardEvents: jest.fn(),
      jsiConfigureProps: jest.fn(),
      install: jest.fn(() => true),
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo/virtual/env', () => ({}), { virtual: true });

beforeEach(async () => {
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  const AsyncStorage = asyncStorageModule.default ?? asyncStorageModule;
  if (typeof AsyncStorage?.clear === 'function') {
    await AsyncStorage.clear();
  }
});
