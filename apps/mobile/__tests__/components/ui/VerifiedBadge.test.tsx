import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { VerifiedBadge } from '../../../src/components/ui/VerifiedBadge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock('lucide-react-native', () => {
  const RN = require('react-native');
  return {
    ShieldCheck: (_props: any) => <RN.Text testID="icon-shield-check">ShieldCheck</RN.Text>,
    Shield: (_props: any) => <RN.Text testID="icon-shield">Shield</RN.Text>,
  };
});

describe('VerifiedBadge', () => {
  it('renders badge for verified status', () => {
    render(<VerifiedBadge status="verified" testID="badge" />);

    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByTestId('icon-shield-check')).toBeTruthy();
  });

  it('renders badge for pending status', () => {
    render(<VerifiedBadge status="pending" testID="badge" />);

    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByTestId('icon-shield')).toBeTruthy();
  });

  it('renders nothing for unverified status', () => {
    const { toJSON } = render(<VerifiedBadge status="unverified" testID="badge" />);

    expect(toJSON()).toBeNull();
  });

  it('shows text label at md size', () => {
    render(<VerifiedBadge status="verified" size="md" testID="badge" />);

    expect(screen.getByTestId('badge')).toBeTruthy();
    // At md size, the label text is rendered via t(`verification.verified`)
    expect(screen.getByText('verification.verified')).toBeTruthy();
  });

  it('does not show text label at sm size', () => {
    render(<VerifiedBadge status="verified" size="sm" testID="badge" />);

    expect(screen.queryByText('verification.verified')).toBeFalsy();
  });
});
