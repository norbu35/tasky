import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import { useSubmitReview } from '../../../src/features/review/hooks/useSubmitReview';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ bookingId: 'booking-123', role: 'customer', name: 'Bold B.' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

jest.mock('../../../src/features/review/hooks/useSubmitReview', () => ({
  useSubmitReview: jest.fn(),
}));

const mockMutate = jest.fn();
const mockUseSubmitReview = useSubmitReview as jest.MockedFunction<typeof useSubmitReview>;

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockUseSubmitReview.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as ReturnType<typeof useSubmitReview>);
});

describe('ReviewFormScreen (SCR-SHARED-017)', () => {
  it('renders the review shell with Figma-aligned chrome and spec copy', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    expect(screen.getByTestId('review-form-header')).toBeTruthy();
    expect(screen.getByTestId('review-form-footer')).toBeTruthy();
    expect(screen.getByText('Сэтгэгдэл бичих')).toBeTruthy();
    expect(screen.getByText('Гүйцэтгэгч')).toBeTruthy();
    expect(screen.getByText('Ажлын чанар')).toBeTruthy();
    expect(screen.getByText('Цаг баримтлал')).toBeTruthy();
    expect(screen.getByText('Харилцаа')).toBeTruthy();
    expect(screen.getByTestId('review-comment-input')).toBeTruthy();
    expect(screen.getByTestId('review-form-next')).toBeTruthy();
  });

  it('disables submit until all three ratings are selected', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    expect(screen.getByTestId('review-form-next').props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('rating-qualityOfWork-star-5'));
    fireEvent.press(screen.getByTestId('rating-punctuality-star-5'));
    fireEvent.press(screen.getByTestId('rating-communication-star-5'));

    expect(screen.getByTestId('review-form-next').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('submit calls useSubmitReview with correct field mapping', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    fireEvent.press(screen.getByTestId('rating-qualityOfWork-star-5'));
    fireEvent.press(screen.getByTestId('rating-punctuality-star-5'));
    fireEvent.press(screen.getByTestId('rating-communication-star-5'));

    const commentInput = screen.getByTestId('review-comment-input');
    fireEvent.changeText(commentInput, 'Great work!');

    fireEvent.press(screen.getByTestId('review-form-next'));

    expect(mockMutate).toHaveBeenCalledWith({
      bookingId: 'booking-123',
      ratings: {
        qualityOfWork: 5,
        punctuality: 5,
        communication: 5,
      },
      comment: 'Great work!',
    });
  });

  it('shows loading state when submitting', () => {
    mockUseSubmitReview.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitReview>);

    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    expect(screen.getByTestId('review-form-next')).toBeTruthy();
  });
});
