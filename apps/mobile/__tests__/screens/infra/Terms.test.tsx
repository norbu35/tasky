import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TermsScreen from '../../../src/app/(shared)/legal/terms';

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      View: RN.View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withSpring: (v: number) => v,
    Easing: { bezier: () => (t: number) => t },
  };
});

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('lucide-react-native', () => {
  const RN = require('react-native');
  return {
    ChevronLeft: (_props: any) => <RN.Text>ChevronLeft</RN.Text>,
    AlertTriangle: (_props: any) => <RN.Text>AlertTriangle</RN.Text>,
  };
});

describe('TermsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('renders Terms of Service title in header', () => {
    render(<TermsScreen />);

    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
  });

  it('shows back button that navigates back', () => {
    render(<TermsScreen />);

    fireEvent.press(screen.getByTestId('terms-screen-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders scrollable terms content', () => {
    render(<TermsScreen />);

    expect(screen.getByTestId('terms-screen')).toBeTruthy();
    expect(screen.getByText('1. Нөхцөлийг зөвшөөрөх')).toBeTruthy();
    expect(screen.getByText('Эдгээр нөхцөлийг товчоор')).toBeTruthy();
  });

  it('shows loading skeleton state when requested', () => {
    mockParams = { state: 'loading' };

    render(<TermsScreen />);

    expect(screen.getByTestId('terms-screen')).toBeTruthy();
    expect(screen.getByTestId('SCR-INFRA-004')).toBeTruthy();
    expect(screen.queryByText('1. Acceptance of Terms')).toBeNull();
  });

  it('shows error state and retries from the inline CTA', () => {
    mockParams = { state: 'error' };

    render(<TermsScreen />);

    expect(screen.getByText('Ачааллах боломжгүй')).toBeTruthy();
    expect(screen.getByText('Үйлчилгээний нөхцлийг ачааллахад алдаа гарлаа. Дахин оролдоно уу')).toBeTruthy();

    fireEvent.press(screen.getByText('Дахин оролдох'));

    expect(screen.getByText('1. Нөхцөлийг зөвшөөрөх')).toBeTruthy();
    expect(screen.queryByText('Ачааллах боломжгүй')).toBeNull();
  });
});
