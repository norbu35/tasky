import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import {
  PostingGuidanceCard,
  PostingProofChecklist,
} from '@/features/tasks/components/PostingGuidance';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
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

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('PostingGuidance proof-local components', () => {
  it('renders a guided proof card from locale keys', () => {
    render(
      <PostingGuidanceCard
        titleKey="PostingGuidance.structuredTitle"
        bodyKey="PostingGuidance.structuredBody"
        testID="posting-guidance-structured"
      />,
    );

    expect(screen.getByTestId('posting-guidance-structured')).toBeTruthy();
    expect(screen.getByText('Structured tasks get clearer applications')).toBeTruthy();
    expect(screen.queryByText(/payment protection/i)).toBeNull();
    expect(screen.queryByText(/escrow/i)).toBeNull();
  });

  it('renders the posting proof checklist in the planned order', () => {
    render(<PostingProofChecklist testID="posting-proof-checklist" />);

    expect(screen.getByText('Structured scope')).toBeTruthy();
    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(screen.getByText('Budget or quote is clear')).toBeTruthy();
    expect(screen.getByText('Taskers apply with structured responses')).toBeTruthy();
  });
});
