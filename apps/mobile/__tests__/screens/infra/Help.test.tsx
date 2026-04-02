import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HelpScreen from '../../../src/app/(shared)/help';

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
    mockParams = {};
  });

  it('renders Help & Support title', () => {
    render(<HelpScreen />);

    expect(screen.getByText('Тусламж')).toBeTruthy();
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
    expect(screen.getByTestId('help-screen-loading')).toBeTruthy();
    expect(screen.queryByText('What is Tasky?')).toBeNull();
  });

  it('shows error state and retries back to loaded FAQ content', () => {
    mockParams = { state: 'error' };

    render(<HelpScreen />);

    expect(screen.getByText('Ачааллах боломжгүй')).toBeTruthy();
    expect(screen.getByText('Тусламжийн мэдээллийг ачааллахад алдаа гарлаа. Дахин оролдоно уу')).toBeTruthy();

    fireEvent.press(screen.getByText('Дахин оролдох'));

    expect(screen.getByText('Tasky гэж юу вэ?')).toBeTruthy();
    expect(screen.queryByText('Ачааллах боломжгүй')).toBeNull();
  });

  it('back button navigates back', () => {
    render(<HelpScreen />);

    fireEvent.press(screen.getByTestId('help-screen-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('has correct testID on root container', () => {
    render(<HelpScreen />);

    expect(screen.getByTestId('help-screen')).toBeTruthy();
  });
});
