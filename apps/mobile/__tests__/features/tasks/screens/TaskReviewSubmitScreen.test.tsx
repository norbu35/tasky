import { render, screen } from '@testing-library/react-native';
import React from 'react';

import TaskLocationScreen from '@/features/tasks/screens/TaskLocation';
import TaskReviewSubmitScreen from '@/features/tasks/screens/TaskReviewSubmitScreen';
import TaskScheduleScreen from '@/features/tasks/screens/TaskScheduleScreen';
import TaskSuccessScreen from '@/features/tasks/screens/TaskSuccessScreen';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ draftId: 'draft-1', taskId: 'task-1' }),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

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
    PROVIDER_DEFAULT: 'default',
    PROVIDER_GOOGLE: 'google',
    UrlTile: ({ testID = 'location-map-tile', ...props }: any) => (
      <View testID={testID} {...props} />
    ),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');

  return ({ mode, testID, ...props }: any) => (
    <View testID={testID ?? `schedule-${mode}-picker`} {...props} />
  );
});

jest.mock('@/features/tasks/screens/TaskLocation/useTaskLocationScreen', () => ({
  useTaskLocationScreen: () => ({
    pin: { latitude: 47.92, longitude: 106.92 },
    locating: false,
    reverseGeocoding: false,
    locationText: 'Bayangol district',
    recentLocations: [],
    loadingRecent: false,
    mapRef: { current: null },
    handleLocationTextChange: jest.fn(),
    handleLocate: jest.fn(),
    handleZoomIn: jest.fn(),
    handleZoomOut: jest.fn(),
    handleSelectRecent: jest.fn(),
    handleMapPress: jest.fn(),
    handleRegionChange: jest.fn(),
    handleNext: jest.fn(),
    goBack: mockBack,
  }),
}));

jest.mock('@/features/tasks/screens/useTaskScheduleScreen', () => ({
  useTaskScheduleScreen: () => ({
    selectedDate: null,
    selectedTime: null,
    activePicker: null,
    pricingMode: 'BUDGET',
    budget: '',
    budgetError: '',
    scheduleError: '',
    canContinue: false,
    openPicker: jest.fn(),
    handlePickerChange: jest.fn(),
    handlePickerCancel: jest.fn(),
    handlePickerConfirm: jest.fn(),
    setPricingMode: jest.fn(),
    handleBudgetChange: jest.fn(),
    handleBudgetBlur: jest.fn(),
    handleNext: jest.fn(),
    goBack: mockBack,
  }),
}));

jest.mock('@/features/tasks/screens/useTaskReviewSubmitScreen', () => ({
  useTaskReviewSubmitScreen: () => ({
    draft: {
      photos: [],
      intakeAnswers: {},
      intakeSchemaVersion: 1,
      description: 'Deep clean a two-bedroom apartment',
      shortDescription: 'Deep clean a two-bedroom apartment',
      categoryId: 'cat-cleaning',
      categoryName: 'Cleaning',
      locationText: 'Bayangol district',
      scheduledAt: '2026-05-01T10:00:00Z',
      pricingMode: 'QUOTE',
      budget: '',
    },
    intakeSchema: null,
    isValid: true,
    isSubmitting: false,
    error: null,
    showFullDescription: false,
    toggleDescription: jest.fn(),
    submit: jest.fn(),
    goBack: mockBack,
    navigateToCategory: jest.fn(),
    navigateToIntake: jest.fn(),
    navigateToPhotos: jest.fn(),
    navigateToLocation: jest.fn(),
    navigateToSchedule: jest.fn(),
  }),
}));

jest.mock('@/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({
      clearDraft: jest.fn(),
      drafts: {
        'draft-1': {
          draftId: 'draft-1',
        },
      },
    }),
}));

describe('customer posting redesign proof contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestI18n();
    setTestLanguage('en');
  });

  it('shows address privacy on the location step', () => {
    render(<TaskLocationScreen />);

    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(
      screen.getByText('The exact address is shared only after booking is confirmed.'),
    ).toBeTruthy();
  });

  it('keeps budget and quote modes explicit on the schedule step', () => {
    render(<TaskScheduleScreen />);

    expect(screen.getByText('I have a budget')).toBeTruthy();
    expect(screen.getByText('I want quotes')).toBeTruthy();
    expect(screen.getByText('Budget or quote is clear')).toBeTruthy();
  });

  it('summarizes structured scope, location privacy, pricing, and next steps on review', () => {
    render(<TaskReviewSubmitScreen />);

    expect(screen.getByText('Review before posting')).toBeTruthy();
    expect(screen.getByText('Structured scope')).toBeTruthy();
    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(screen.getByText('Budget or quote is clear')).toBeTruthy();
  });

  it('explains next steps after posting without payment-protection claims', () => {
    render(<TaskSuccessScreen />);

    expect(screen.getByTestId('posting-guidance-next-steps')).toBeTruthy();
    expect(
      screen.getByText(
        'Verified taskers can apply. You choose from structured applications when they arrive.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/payment protection/i)).toBeNull();
    expect(screen.queryByText(/escrow/i)).toBeNull();
  });
});
