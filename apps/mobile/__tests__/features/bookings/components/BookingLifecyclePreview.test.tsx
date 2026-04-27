import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { BookingLifecyclePreview } from '../../../../src/features/bookings/components/BookingLifecyclePreview';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('BookingLifecyclePreview', () => {
  it('renders the Phase 1 booking lifecycle with translated labels and address note', () => {
    render(
      <BookingLifecyclePreview
        status="ASSIGNED"
        createdAt="2026-04-24T02:00:00Z"
        scheduledAt="2026-04-25T04:30:00Z"
      />,
    );

    expect(screen.getByText('Booking timeline')).toBeTruthy();
    expect(screen.getByTestId('booking-lifecycle-preview').props.accessibilityRole).toBe('list');
    expect(screen.getByText('Task posted')).toBeTruthy();
    expect(screen.getByText('Booking confirmed')).toBeTruthy();
    expect(screen.getByText('Scheduled work')).toBeTruthy();
    expect(
      screen.getByText('Exact address is shown only after the booking is confirmed.'),
    ).toBeTruthy();
  });

  it('keeps confirmed booking active until terminal work states', () => {
    render(<BookingLifecyclePreview status="ASSIGNED" />);

    expect(screen.getByText('Booking confirmed').props.className).toContain('font-sans-bold');
    expect(screen.getAllByText('Pending')).toHaveLength(2);
  });

  it('moves the active lifecycle step to scheduled work for completion states', () => {
    render(<BookingLifecyclePreview status="COMPLETED" scheduledAt="2026-04-25T04:30:00Z" />);

    expect(screen.getByText('Scheduled work').props.className).toContain('font-sans-bold');
    expect(screen.getByText('Booking confirmed').props.className).not.toContain('font-sans-bold');
  });
});
