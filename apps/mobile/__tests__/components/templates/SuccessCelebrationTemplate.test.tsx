import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SuccessCelebrationTemplate } from '../../../src/components/templates/SuccessCelebrationTemplate';

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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock('lucide-react-native', () => {
  const RN = require('react-native');
  return {
    CheckCircle: (_props: any) => <RN.Text>CheckCircle</RN.Text>,
  };
});

const defaultProps = {
  headline: 'Task Posted!',
  body: 'Your task is now visible to taskers.',
  ctaLabel: 'View Task',
  ctaOnPress: jest.fn(),
  testID: 'success',
};

describe('SuccessCelebrationTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders headline and body text', () => {
    render(<SuccessCelebrationTemplate {...defaultProps} />);

    expect(screen.getByText('Task Posted!')).toBeTruthy();
    expect(screen.getByText('Your task is now visible to taskers.')).toBeTruthy();
  });

  it('renders next steps when provided', () => {
    render(
      <SuccessCelebrationTemplate
        {...defaultProps}
        nextSteps={['Taskers will apply', 'Review applications', 'Choose your tasker']}
      />,
    );

    expect(screen.getByText('What happens next')).toBeTruthy();
    expect(screen.getByText('Taskers will apply')).toBeTruthy();
    expect(screen.getByText('Review applications')).toBeTruthy();
    expect(screen.getByText('Choose your tasker')).toBeTruthy();
  });

  it('does not render next steps section when not provided', () => {
    render(<SuccessCelebrationTemplate {...defaultProps} />);

    expect(screen.queryByText('What happens next')).toBeFalsy();
  });

  it('shows CTA button with correct label', () => {
    render(<SuccessCelebrationTemplate {...defaultProps} />);

    expect(screen.getByText('View Task')).toBeTruthy();
  });

  it('calls ctaOnPress when CTA pressed', () => {
    render(<SuccessCelebrationTemplate {...defaultProps} />);

    fireEvent.press(screen.getByTestId('success-cta'));
    expect(defaultProps.ctaOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows secondary CTA when provided', () => {
    const secondaryOnPress = jest.fn();
    render(
      <SuccessCelebrationTemplate
        {...defaultProps}
        secondaryCtaLabel="Post Another"
        secondaryCtaOnPress={secondaryOnPress}
      />,
    );

    expect(screen.getByText('Post Another')).toBeTruthy();

    fireEvent.press(screen.getByTestId('success-secondary-cta'));
    expect(secondaryOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not show secondary CTA when not provided', () => {
    render(<SuccessCelebrationTemplate {...defaultProps} />);

    expect(screen.queryByTestId('success-secondary-cta')).toBeFalsy();
  });
});
