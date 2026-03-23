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
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
    useLocalSearchParams: () => ({}),
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
            get: (_, name) => (props: any) => (
                <Text testID={`icon-${String(name)}`} {...props} />
            ),
        },
    );
});

describe('HelpScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders Help & Support title', () => {
        render(<HelpScreen />);

        expect(screen.getByText('Help & Support')).toBeTruthy();
    });

    it('shows FAQ section headers', () => {
        render(<HelpScreen />);

        expect(screen.getByText('General')).toBeTruthy();
        expect(screen.getByText('About Tasks')).toBeTruthy();
        expect(screen.getByText('About Bookings')).toBeTruthy();
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
