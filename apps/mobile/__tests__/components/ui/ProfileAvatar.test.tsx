import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProfileAvatar } from '../../../src/components/ui/ProfileAvatar';

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    CheckCircle: (props: any) => <Text testID="icon-CheckCircle" {...props} />,
  };
});

describe('ProfileAvatar', () => {
  it('TID-MOBILE-AVATAR-001: keeps initials visible while a remote avatar loads or fails', () => {
    render(
      <ProfileAvatar
        uri="https://img.tasky.mn/missing-avatar.jpg"
        name="Munkh-Erdene Plumbing"
        showVerified
      />,
    );

    expect(screen.getByText('MP')).toBeTruthy();

    fireEvent(screen.getByTestId('profile-avatar-image'), 'error');

    expect(screen.getByText('MP')).toBeTruthy();
    expect(screen.getByTestId('icon-CheckCircle')).toBeTruthy();
  });
});
