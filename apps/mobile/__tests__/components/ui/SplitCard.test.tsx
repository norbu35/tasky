import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SplitCard } from '../../../src/components/ui/SplitCard';

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

describe('SplitCard', () => {
    it('renders header and body content', () => {
        render(
            <SplitCard
                headerContent={<Text>Header Title</Text>}
                bodyContent={<Text>Body Description</Text>}
                testID="split-card"
            />,
        );

        expect(screen.getByText('Header Title')).toBeTruthy();
        expect(screen.getByText('Body Description')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPress = jest.fn();
        render(
            <SplitCard
                headerContent={<Text>Header</Text>}
                bodyContent={<Text>Body</Text>}
                onPress={onPress}
                testID="split-card"
            />,
        );

        fireEvent.press(screen.getByTestId('split-card'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('has correct testID', () => {
        render(
            <SplitCard
                headerContent={<Text>Header</Text>}
                bodyContent={<Text>Body</Text>}
                testID="my-card"
            />,
        );

        expect(screen.getByTestId('my-card')).toBeTruthy();
    });

    it('renders as non-pressable View when onPress is not provided', () => {
        render(
            <SplitCard
                headerContent={<Text>Header</Text>}
                bodyContent={<Text>Body</Text>}
                testID="static-card"
            />,
        );

        // Should render without crashing when no onPress
        expect(screen.getByTestId('static-card')).toBeTruthy();
        expect(screen.getByText('Header')).toBeTruthy();
    });
});
