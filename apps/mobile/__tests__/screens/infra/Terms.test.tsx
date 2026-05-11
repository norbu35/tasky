import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import TermsScreen from '../../../src/app/(shared)/legal/terms';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

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

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
    resetTestI18n();
    setTestLanguage('mn');
    mockParams = {};
  });

  it('renders screen container', () => {
    render(<TermsScreen />);

    expect(screen.getByTestId('SCR-INFRA-004')).toBeTruthy();
  });

  it('renders Mongolian section heading', () => {
    render(<TermsScreen />);

    expect(screen.getByText('1. Нөхцөлийг зөвшөөрөх')).toBeTruthy();
  });

  it('renders scrollable terms content', () => {
    render(<TermsScreen />);

    expect(screen.getByText('1. Нөхцөлийг зөвшөөрөх')).toBeTruthy();
    expect(screen.getByText('Эдгээр нөхцөлийг товчоор')).toBeTruthy();
  });

  it('shows loading skeleton state when requested', () => {
    mockParams = { state: 'loading' };

    render(<TermsScreen />);

    expect(screen.queryByText('1. Нөхцөлийг зөвшөөрөх')).toBeNull();
  });

  it('shows error state and retries from the inline CTA', () => {
    mockParams = { state: 'error' };

    render(<TermsScreen />);

    expect(screen.getByText('Ачааллах боломжгүй')).toBeTruthy();
    expect(
      screen.getByText('Үйлчилгээний нөхцлийг ачааллахад алдаа гарлаа. Дахин оролдоно уу'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Дахин оролдох'));

    expect(screen.getByText('1. Нөхцөлийг зөвшөөрөх')).toBeTruthy();
    expect(screen.queryByText('Ачааллах боломжгүй')).toBeNull();
  });
});
