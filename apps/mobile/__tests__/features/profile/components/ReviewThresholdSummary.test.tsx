import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ReviewThresholdSummary } from '@/features/profile/components/ReviewThresholdSummary';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('ReviewThresholdSummary', () => {
  it('renders the localized review threshold copy with the remaining count', () => {
    render(<ReviewThresholdSummary reviewCount={1} testID="review-threshold-summary" />);

    expect(screen.getByTestId('review-threshold-summary')).toBeTruthy();
    expect(screen.getByText('Not enough reviews yet')).toBeTruthy();
    expect(
      screen.getByText('Public ratings appear after 3 completed reviews. 2 more needed.'),
    ).toBeTruthy();
  });

  it('caps the remaining count at zero once the threshold is met', () => {
    render(<ReviewThresholdSummary reviewCount={5} />);

    expect(
      screen.getByText('Public ratings appear after 3 completed reviews. 0 more needed.'),
    ).toBeTruthy();
  });
});
