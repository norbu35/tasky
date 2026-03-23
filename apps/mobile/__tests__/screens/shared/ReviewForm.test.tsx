import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useSubmitReview } from '../../../src/features/review/hooks/useSubmitReview';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ bookingId: 'booking-123', role: 'tasker', name: 'John Tasker' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

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
  mockUseSubmitReview.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as ReturnType<typeof useSubmitReview>);
});

describe('ReviewFormScreen (SCR-SHARED-017)', () => {
  it('renders rating categories with star inputs', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    // role=tasker means tasker rates the customer → RATE_CUSTOMER_CATEGORIES
    expect(screen.getByText('shared.review.taskClarity')).toBeTruthy();
    expect(screen.getByText('shared.review.respectfulness')).toBeTruthy();
    expect(screen.getByText('shared.review.punctuality')).toBeTruthy();
  });

  it('renders the comment text field', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    expect(screen.getByTestId('review-comment-input')).toBeTruthy();
  });

  it('submit calls useSubmitReview with correct field mapping', () => {
    const ReviewFormScreen = require('../../../src/features/review/components/ReviewForm').default;
    render(<ReviewFormScreen />);

    // role=tasker means tasker rates the customer → RATE_CUSTOMER_CATEGORIES
    fireEvent.press(screen.getByTestId('rating-taskDescriptionClarity-star-5'));
    fireEvent.press(screen.getByTestId('rating-respectfulness-star-5'));
    fireEvent.press(screen.getByTestId('rating-punctuality-star-5'));

    // Type a comment
    const commentInput = screen.getByTestId('review-comment-input');
    fireEvent.changeText(commentInput, 'Great work!');

    // Submit
    fireEvent.press(screen.getByTestId('review-form-next'));

    expect(mockMutate).toHaveBeenCalledWith({
      bookingId: 'booking-123',
      ratings: {
        taskDescriptionClarity: 5,
        respectfulness: 5,
        punctuality: 5,
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

    expect(screen.getByTestId('review-form')).toBeTruthy();
  });
});
