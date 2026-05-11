import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { StatusBadge } from '../../../src/components/ui/StatusBadge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('StatusBadge', () => {
  it('renders translated status text', () => {
    render(<StatusBadge status="open" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('status.open')).toBeTruthy();
  });

  it('accepts className prop', () => {
    render(<StatusBadge status="open" className="mt-sm" testID="badge" />);
    const el = screen.getByTestId('badge');
    expect(el.props.className).toContain('mt-sm');
  });

  it('applies base wrapper cva classes', () => {
    render(<StatusBadge status="open" testID="badge" />);
    const el = screen.getByTestId('badge');
    expect(el.props.className).toContain('rounded-full');
  });

  it('renders all status variants without throwing', () => {
    const statuses = ['open', 'assigned', 'completed', 'cancelled', 'no_show'] as const;
    for (const status of statuses) {
      const { unmount } = render(<StatusBadge status={status} testID="badge" />);
      expect(screen.getByTestId('badge')).toBeTruthy();
      unmount();
    }
  });

  it('applies text cva classes to text element', () => {
    render(<StatusBadge status="open" testID="badge" />);
    const text = screen.getByText('status.open');
    expect(text.props.className).toContain('uppercase');
  });
});
