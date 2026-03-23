import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
    useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string | Record<string, unknown>) => {
            return typeof fallback === 'string' ? fallback : key;
        },
        i18n: { language: 'en' },
    }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return new Proxy({}, {
        get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    });
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ApplicationSentSuccess (SCR-TASK-011)', () => {
    it('renders success headline', () => {
        const { ApplicationSentSuccess } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
        render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={jest.fn()} />);

        expect(screen.getByText('tasker.taskDetail.applicationSentTitle')).toBeTruthy();
    });

    it('renders next steps text', () => {
        const { ApplicationSentSuccess } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
        render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={jest.fn()} />);

        expect(screen.getByTestId('application-sent')).toBeTruthy();
    });

    it('CTA "Browse More Tasks" calls onBrowseMore', () => {
        const onBrowse = jest.fn();
        const { ApplicationSentSuccess } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
        render(<ApplicationSentSuccess onBrowseMore={onBrowse} onViewTask={jest.fn()} />);

        fireEvent.press(screen.getByTestId('application-sent-cta'));
        expect(onBrowse).toHaveBeenCalledTimes(1);
    });

    it('secondary CTA calls onViewTask', () => {
        const onView = jest.fn();
        const { ApplicationSentSuccess } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
        render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={onView} />);

        fireEvent.press(screen.getByTestId('application-sent-secondary-cta'));
        expect(onView).toHaveBeenCalledTimes(1);
    });
});
