import { notifyManager } from '@tanstack/react-query';
import type { ReactNode, Ref } from 'react';

// TanStack Query's default scheduler uses setTimeout(cb, 0) for batch notifications,
// which fires after act() closes and triggers "not wrapped in act" warnings.
// Running notifications synchronously prevents this.
notifyManager.setScheduler((cb) => cb());

jest.mock('react-native-reanimated', () => require('./__tests__/test-utils/reanimated-mock.js'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  const BottomSheet = React.forwardRef(
    (
      {
        children,
        index = 0,
        testID = 'mock-bottom-sheet',
        footerComponent,
      }: {
        children?: ReactNode;
        index?: number;
        testID?: string;
        footerComponent?: (props: Record<string, unknown>) => ReactNode;
      },
      ref: Ref<{ close: () => void; snapToIndex: (index: number) => void }>,
    ) => {
      React.useImperativeHandle(ref, () => ({
        close: jest.fn(),
        snapToIndex: jest.fn(),
      }));

      if (index === -1) {
        return null;
      }

      const footerNode = footerComponent
        ? footerComponent({ animatedFooterPosition: 0, animatedPosition: 0 })
        : null;

      return React.createElement(View, { testID }, children, footerNode);
    },
  );
  BottomSheet.displayName = 'MockBottomSheet';

  const BottomSheetView = ({ children, ...props }: { children?: ReactNode }) =>
    React.createElement(View, props, children);

  const BottomSheetScrollView = ({ children, ...props }: { children?: ReactNode }) =>
    React.createElement(View, props, children);

  const BottomSheetFooter = ({ children }: { children?: ReactNode }) =>
    React.createElement(View, { testID: 'mock-bottom-sheet-footer' }, children);

  const BottomSheetBackdrop = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: 'mock-bottom-sheet-backdrop' });

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetFooter,
  };
});

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
