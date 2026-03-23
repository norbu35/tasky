import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
        i18n: { language: 'en' },
    }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return new Proxy(
        {},
        {
            get: (_, name) => (props: any) => (
                <Text testID={`icon-${String(name)}`} {...props} />
            ),
        }
    );
});

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

const mockRequestCameraPermission = jest.fn().mockResolvedValue({ status: 'granted' });
const mockRequestLocationPermission = jest.fn().mockResolvedValue({ status: 'granted' });
const mockRequestNotificationPermission = jest.fn().mockResolvedValue({ status: 'granted' });

jest.mock('../../../src/utils/permissions', () => ({
    requestCameraPermission: () => mockRequestCameraPermission(),
    requestLocationPermission: () => mockRequestLocationPermission(),
    requestNotificationPermission: () => mockRequestNotificationPermission(),
}));

import PermissionCameraScreen from '../../../src/app/(auth)/permission-camera';
import PermissionLocationScreen from '../../../src/app/(auth)/permission-location';
import PermissionNotificationsScreen from '../../../src/app/(auth)/permission-notifications';

beforeEach(() => {
    jest.clearAllMocks();
    mockRequestCameraPermission.mockResolvedValue({ status: 'granted' });
    mockRequestLocationPermission.mockResolvedValue({ status: 'granted' });
    mockRequestNotificationPermission.mockResolvedValue({ status: 'granted' });
});

describe('Permission Camera Screen (SCR-SHARED-007)', () => {
    it('renders camera permission title and description', () => {
        render(<PermissionCameraScreen />);
        expect(screen.getByText('Camera Access')).toBeTruthy();
        expect(screen.getByText('Take photos for task posts and verification')).toBeTruthy();
    });

    it('renders Allow and Skip buttons', () => {
        render(<PermissionCameraScreen />);
        expect(screen.getByTestId('permission-allow-button')).toBeTruthy();
        expect(screen.getByTestId('permission-skip-button')).toBeTruthy();
    });

    it('Allow button triggers camera permission request', async () => {
        render(<PermissionCameraScreen />);
        fireEvent.press(screen.getByTestId('permission-allow-button'));
        expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
    });

    it('Skip navigates to location permission', () => {
        render(<PermissionCameraScreen />);
        fireEvent.press(screen.getByTestId('permission-skip-button'));
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-location');
    });

    it('has a testID on the screen container', () => {
        render(<PermissionCameraScreen />);
        expect(screen.getByTestId('permission-camera-screen')).toBeTruthy();
    });
});

describe('Permission Location Screen (SCR-SHARED-008)', () => {
    it('renders location permission title and description', () => {
        render(<PermissionLocationScreen />);
        expect(screen.getByText('Location Access')).toBeTruthy();
        expect(screen.getByText('Find tasks and Taskers near you')).toBeTruthy();
    });

    it('renders Allow and Skip buttons', () => {
        render(<PermissionLocationScreen />);
        expect(screen.getByTestId('permission-allow-button')).toBeTruthy();
        expect(screen.getByTestId('permission-skip-button')).toBeTruthy();
    });

    it('Allow button triggers location permission request', async () => {
        render(<PermissionLocationScreen />);
        fireEvent.press(screen.getByTestId('permission-allow-button'));
        expect(mockRequestLocationPermission).toHaveBeenCalledTimes(1);
    });

    it('Skip navigates to notifications permission', () => {
        render(<PermissionLocationScreen />);
        fireEvent.press(screen.getByTestId('permission-skip-button'));
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-notifications');
    });

    it('has a testID on the screen container', () => {
        render(<PermissionLocationScreen />);
        expect(screen.getByTestId('permission-location-screen')).toBeTruthy();
    });
});

describe('Permission Notifications Screen (SCR-SHARED-009)', () => {
    it('renders notification permission title and description', () => {
        render(<PermissionNotificationsScreen />);
        expect(screen.getByText('Notifications')).toBeTruthy();
        expect(screen.getByText('Get updates on bookings and messages')).toBeTruthy();
    });

    it('renders Allow and Skip buttons', () => {
        render(<PermissionNotificationsScreen />);
        expect(screen.getByTestId('permission-allow-button')).toBeTruthy();
        expect(screen.getByTestId('permission-skip-button')).toBeTruthy();
    });

    it('Allow button triggers notification permission request', async () => {
        render(<PermissionNotificationsScreen />);
        fireEvent.press(screen.getByTestId('permission-allow-button'));
        expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1);
    });

    it('Skip navigates to home (tabs)', () => {
        render(<PermissionNotificationsScreen />);
        fireEvent.press(screen.getByTestId('permission-skip-button'));
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('has a testID on the screen container', () => {
        render(<PermissionNotificationsScreen />);
        expect(screen.getByTestId('permission-notifications-screen')).toBeTruthy();
    });
});
