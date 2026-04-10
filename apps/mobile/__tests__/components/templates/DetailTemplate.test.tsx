import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import { DetailTemplate } from '../../../src/components/templates/DetailTemplate';

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

describe('DetailTemplate', () => {
  beforeEach(() => {
    resetTestI18n();
    setTestLanguage('mn');
  });

  it('renders children content', () => {
    render(
      <DetailTemplate testID="detail">
        <Text>Detail body content</Text>
      </DetailTemplate>,
    );

    expect(screen.getByText('Detail body content')).toBeTruthy();
  });

  it('shows CTA button with correct label', () => {
    const ctaOnPress = jest.fn();
    render(
      <DetailTemplate ctaLabel="Apply Now" ctaOnPress={ctaOnPress} testID="detail">
        <Text>Content</Text>
      </DetailTemplate>,
    );

    expect(screen.getByText('Apply Now')).toBeTruthy();
    expect(screen.getByTestId('detail-bottom-bar')).toBeTruthy();
  });

  it('calls ctaOnPress when CTA pressed', () => {
    const ctaOnPress = jest.fn();
    render(
      <DetailTemplate ctaLabel="Apply Now" ctaOnPress={ctaOnPress} testID="detail">
        <Text>Content</Text>
      </DetailTemplate>,
    );

    fireEvent.press(screen.getByTestId('detail-cta'));
    expect(ctaOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading skeleton when isLoading=true', () => {
    render(
      <DetailTemplate isLoading testID="detail">
        <Text>Should not appear</Text>
      </DetailTemplate>,
    );

    // Children should not render when loading
    expect(screen.queryByText('Should not appear')).toBeFalsy();
    expect(screen.getByTestId('detail')).toBeTruthy();
  });

  it('shows error state when isError=true', () => {
    const onRetry = jest.fn();
    render(
      <DetailTemplate isError onRetry={onRetry} errorMessage="Load failed" testID="detail">
        <Text>Should not appear</Text>
      </DetailTemplate>,
    );

    expect(screen.queryByText('Should not appear')).toBeFalsy();
    expect(screen.getByText('Load failed')).toBeTruthy();
    expect(screen.getByText('Дахин оролдох')).toBeTruthy();
  });

  it('shows translated error fallback when errorMessage is omitted', () => {
    render(
      <DetailTemplate isError onRetry={jest.fn()} testID="detail">
        <Text>Should not appear</Text>
      </DetailTemplate>,
    );

    expect(screen.getByText('Дэлгэрэнгүйг ачаалж чадсангүй')).toBeTruthy();
    expect(screen.getByText('Дахин оролдох')).toBeTruthy();
  });

  it('does not show CTA bar when loading', () => {
    const ctaOnPress = jest.fn();
    render(
      <DetailTemplate ctaLabel="Apply" ctaOnPress={ctaOnPress} isLoading testID="detail">
        <Text>Content</Text>
      </DetailTemplate>,
    );

    expect(screen.queryByText('Apply')).toBeFalsy();
  });

  it('does not show CTA bar when in error state', () => {
    const ctaOnPress = jest.fn();
    render(
      <DetailTemplate ctaLabel="Apply" ctaOnPress={ctaOnPress} isError testID="detail">
        <Text>Content</Text>
      </DetailTemplate>,
    );

    expect(screen.queryByTestId('detail-cta')).toBeFalsy();
  });
});
