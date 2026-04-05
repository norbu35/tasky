import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { InstantMatchTaskerSheet } from '../../../src/features/matching/components/InstantMatchTaskerSheet';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

describe('InstantMatchTaskerSheet (SCR-P3-005)', () => {
  it('renders the default instant match shell', () => {
    render(
      <InstantMatchTaskerSheet
        isOpen
        onClose={jest.fn()}
        taskTitle="Гал тогооны цэвэрлэгээ"
        budgetLabel="₮45,000"
        onAccept={jest.fn()}
        onDecline={jest.fn()}
      />,
    );

    expect(screen.getByTestId('instant-match-sheet')).toBeTruthy();
    expect(screen.getByText('New offer!')).toBeTruthy();
    expect(screen.getByText('Гал тогооны цэвэрлэгээ')).toBeTruthy();
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
  });

  it('accept triggers the callback', () => {
    const onAccept = jest.fn();
    render(
      <InstantMatchTaskerSheet
        isOpen
        onClose={jest.fn()}
        taskTitle="Гал тогооны цэвэрлэгээ"
        budgetLabel="₮45,000"
        onAccept={onAccept}
        onDecline={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('instant-match-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
