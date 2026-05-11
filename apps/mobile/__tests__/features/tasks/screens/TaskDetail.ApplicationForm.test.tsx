import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ApplicationForm } from '@/features/tasks/screens/TaskDetail.ApplicationForm';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('ApplicationForm', () => {
  it('renders fixed-budget application guidance without a quote input', () => {
    const onApplicationNoteChange = jest.fn();

    render(
      <ApplicationForm
        isQuoteMode={false}
        isQuoteValid
        applicationNote=""
        quotePrice=""
        onApplicationNoteChange={onApplicationNoteChange}
        onQuotePriceChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Accept the posted budget')).toBeTruthy();
    expect(
      screen.getByText('This task uses a fixed budget. Your application accepts that amount.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('application-quote-input')).toBeNull();

    fireEvent.changeText(screen.getByTestId('application-note-input'), 'I can handle this today.');

    expect(onApplicationNoteChange).toHaveBeenCalledWith('I can handle this today.');
  });

  it('renders quote input, validation, and numeric quote normalization for quote tasks', () => {
    const onQuotePriceChange = jest.fn();

    render(
      <ApplicationForm
        isQuoteMode
        isQuoteValid={false}
        applicationNote=""
        quotePrice="10000"
        onApplicationNoteChange={jest.fn()}
        onQuotePriceChange={onQuotePriceChange}
      />,
    );

    expect(screen.getByText('This customer wants quotes')).toBeTruthy();
    expect(screen.getByText('Quote must be at least ₮20,000')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('application-quote-input'), '₮90,000');

    expect(onQuotePriceChange).toHaveBeenCalledWith('90000');
  });
});
