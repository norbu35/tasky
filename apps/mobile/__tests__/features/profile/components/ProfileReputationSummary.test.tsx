import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProfileReputationSummary } from '@/features/profile/components/ProfileReputationSummary';

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

describe('ProfileReputationSummary', () => {
  it('renders the public rating summary and supplied metrics', () => {
    render(
      <ProfileReputationSummary
        testID="profile-reputation-summary"
        title="Public reputation"
        body="Structured reviews from completed Tasky work."
        rating="4.8"
        metrics={[
          { value: '18', label: 'Jobs completed' },
          { value: '6', label: 'Reviews' },
          { value: '4.8', label: 'Rating' },
        ]}
      />,
    );

    expect(screen.getByTestId('profile-reputation-summary')).toBeTruthy();
    expect(screen.getByTestId('icon-Star')).toBeTruthy();
    expect(screen.getAllByText('4.8')).toHaveLength(2);
    expect(screen.getByText('Public reputation')).toBeTruthy();
    expect(screen.getByText('Structured reviews from completed Tasky work.')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
    expect(screen.getByText('Jobs completed')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('Reviews')).toBeTruthy();
    expect(screen.getByText('Rating')).toBeTruthy();
  });
});
