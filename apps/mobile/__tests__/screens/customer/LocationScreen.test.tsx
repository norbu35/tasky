import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRequestJson = jest.fn().mockResolvedValue({
  formatted_address: 'Ulaanbaatar, Bayangol district',
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: 'cat-123', description: 'Fix my sink', photos: '[]' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef(({ children, testID, ...props }: any, ref: any) => (
      <View ref={ref} testID={testID} {...props}>
        {children}
      </View>
    )),
    Marker: ({ testID = 'location-map-marker', ...props }: any) => (
      <View testID={testID} {...props} />
    ),
    UrlTile: ({ testID = 'location-map-tile', ...props }: any) => (
      <View testID={testID} {...props} />
    ),
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

jest.mock('../../../src/lib/mobileApiClient', () => ({
  createMobileApiClient: () => ({
    requestJson: mockRequestJson,
  }),
}));

jest.mock('../../../src/features/tasks/hooks/useRecentLocations', () => ({
  useRecentLocations: () => ({
    data: [],
    isLoading: false,
  }),
}));

const LocationScreen = require('../../../src/app/(customer)/tasks/new/location').default;

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('LocationScreen (SCR-CUST-005)', () => {
  it('has a testID on the screen container', () => {
    render(<LocationScreen />);
    expect(screen.getByTestId('SCR-CUST-005')).toBeTruthy();
  });

  it('renders location text input', () => {
    render(<LocationScreen />);
    expect(screen.getByText('Set Location')).toBeTruthy();
    expect(screen.getByText('Pin the task location on the map')).toBeTruthy();
    expect(screen.getByTestId('location-current-card')).toBeTruthy();
    expect(screen.getByTestId('location-text-input')).toBeTruthy();
  });

  it('renders the location label', () => {
    render(<LocationScreen />);
    expect(screen.getByText('Location description')).toBeTruthy();
  });

  it('navigates to schedule when next pressed with location', () => {
    render(<LocationScreen />);
    fireEvent.changeText(screen.getByTestId('location-text-input'), 'Behind State Dept Store');
    fireEvent(screen.getByTestId('location-map'), 'onPress', {
      nativeEvent: {
        coordinate: { latitude: 47.92123, longitude: 106.91876 },
      },
    });
    fireEvent.press(screen.getByTestId('SCR-CUST-005-next'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/schedule',
        params: expect.objectContaining({
          lat: '47.92123',
          lng: '106.91876',
        }),
      }),
    );
  });

  it('renders as step 4 of 7 wizard', () => {
    render(<LocationScreen />);
    expect(screen.getByLabelText('Step 4 of 7')).toBeTruthy();
  });

  it('back button returns to photo upload', () => {
    render(<LocationScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-005-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('keeps next disabled until a pin is placed', () => {
    render(<LocationScreen />);
    const nextButton = screen.getByTestId('SCR-CUST-005-next');

    expect(nextButton).toBeDisabled();
    fireEvent.press(nextButton);
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent(screen.getByTestId('location-map'), 'onPress', {
      nativeEvent: {
        coordinate: { latitude: 47.92123, longitude: 106.91876 },
      },
    });

    expect(nextButton).not.toBeDisabled();
  });

  it('renders map controls and quick location chips', () => {
    render(<LocationScreen />);
    expect(screen.getByTestId('location-locate-button')).toBeTruthy();
    expect(screen.getByTestId('location-zoom-in-button')).toBeTruthy();
    expect(screen.getByTestId('location-zoom-out-button')).toBeTruthy();
    expect(screen.getByText('Recent locations')).toBeTruthy();
    expect(
      screen.getByText('Your recent locations will appear here after your first task.'),
    ).toBeTruthy();
  });
});
