import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import {
  PricingModeSelector,
  QuoteModeNotice,
} from '@/features/tasks/screens/TaskSchedule.PricingMode';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('TaskSchedule pricing mode components', () => {
  it('renders both pricing modes and emits quote mode selection', () => {
    const onChange = jest.fn();

    render(<PricingModeSelector pricingMode="BUDGET" onChange={onChange} />);

    expect(screen.getByText('Pricing mode')).toBeTruthy();
    expect(screen.getByText('I have a budget')).toBeTruthy();
    expect(screen.getByText('I want quotes')).toBeTruthy();

    fireEvent.press(screen.getByTestId('pricing-mode-quote'));

    expect(onChange).toHaveBeenCalledWith('QUOTE');
  });

  it('renders quote-mode notice copy from i18n', () => {
    render(<QuoteModeNotice />);

    expect(screen.getByTestId('schedule-quote-mode-note')).toBeTruthy();
    expect(screen.getByText('Taskers quote this task')).toBeTruthy();
    expect(
      screen.getByText('Taskers will send a structured price quote with their application.'),
    ).toBeTruthy();
  });
});
