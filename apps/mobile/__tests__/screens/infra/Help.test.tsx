import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import HelpScreen from '../../../src/app/(shared)/help';
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
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

describe('HelpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestI18n();
    setTestLanguage('mn');
    mockParams = {};
  });

  it('renders help content', () => {
    render(<HelpScreen />);

    expect(screen.getByPlaceholderText('Асуулт хайх...')).toBeTruthy();
  });

  it('shows FAQ section headers', () => {
    render(<HelpScreen />);

    expect(screen.getByText('Ерөнхий')).toBeTruthy();
    expect(screen.getByText('Даалгаврын тухай')).toBeTruthy();
    expect(screen.getByText('Захиалгын тухай')).toBeTruthy();
    expect(screen.getByText('Төлбөрийн тухай')).toBeTruthy();
    expect(screen.getByText('Бүртгэлийн тухай')).toBeTruthy();
  });

  it('FAQ items are expandable on press', () => {
    render(<HelpScreen />);

    // Find the first FAQ question and press it to expand
    const faqItems = screen.getAllByTestId(/^faq-item-/);
    expect(faqItems.length).toBeGreaterThan(0);

    fireEvent.press(faqItems[0]);

    // After pressing, answer should be visible
    const faqAnswers = screen.getAllByTestId(/^faq-answer-/);
    expect(faqAnswers.length).toBeGreaterThan(0);
  });

  it('filters FAQ items from the search bar in real time', () => {
    render(<HelpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Асуулт хайх...'), 'цуцал');

    expect(screen.getByText('Захиалгаа цуцалж болох уу?')).toBeTruthy();
    expect(screen.queryByText('Tasky гэж юу вэ?')).toBeNull();
  });

  it('shows loading skeleton state when requested', () => {
    mockParams = { state: 'loading' };

    render(<HelpScreen />);

    expect(screen.getByTestId('help-screen')).toBeTruthy();
    expect(screen.getByTestId('SCR-INFRA-005')).toBeTruthy();
    expect(screen.queryByText('What is Tasky?')).toBeNull();
  });

  it('shows error state and retries back to loaded FAQ content', () => {
    mockParams = { state: 'error' };

    render(<HelpScreen />);

    expect(screen.getByText('Ачааллах боломжгүй')).toBeTruthy();
    expect(
      screen.getByText('Тусламжийн мэдээллийг ачааллахад алдаа гарлаа. Дахин оролдоно уу'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Дахин оролдох'));

    expect(screen.getByText('Tasky гэж юу вэ?')).toBeTruthy();
    expect(screen.queryByText('Ачааллах боломжгүй')).toBeNull();
  });

  it('has correct testID on root container', () => {
    render(<HelpScreen />);

    expect(screen.getByTestId('help-screen')).toBeTruthy();
  });
});
