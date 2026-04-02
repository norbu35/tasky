import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LeadUnlockSheet } from '../../../../src/features/bookings/components/LeadUnlockSheet';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('LeadUnlockSheet (SCR-TASK-017)', () => {
  const baseProps = {
    isOpen: true,
    state: 'notification_received' as const,
    customerName: 'Нараа',
    taskTitle: 'Гал тогооны цэвэрлэгээ',
    creditCost: 2,
    balance: 3,
    onAccept: jest.fn(),
    onDecline: jest.fn(),
    onBuyCredits: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default lead unlock shell', () => {
    render(<LeadUnlockSheet {...baseProps} />);

    expect(screen.getByTestId('lead-unlock-sheet')).toBeTruthy();
    expect(screen.getByText('Захиалагч таныг сонголоо!')).toBeTruthy();
    expect(screen.getByText('Гал тогооны цэвэрлэгээ')).toBeTruthy();
    expect(screen.getByText('2 кредит')).toBeTruthy();
    expect(screen.getByText('Зөвшөөрч, кредит зарцуулах')).toBeTruthy();
    expect(screen.getByText('Татгалзах')).toBeTruthy();
    expect(screen.getByText('Захиалагч цуцалвал кредит буцаагдана')).toBeTruthy();
  });

  it('renders the insufficient credits state', () => {
    render(<LeadUnlockSheet {...baseProps} state="insufficient_credits" balance={0} />);

    expect(screen.getByText('Кредит хүрэлцэхгүй байна')).toBeTruthy();
    expect(screen.getByText('Кредит худалдаж авах')).toBeTruthy();
    expect(screen.getByText(/Үлдэгдэл: 0/)).toBeTruthy();
  });

  it('buy credits CTA triggers the callback', () => {
    const onBuyCredits = jest.fn();
    render(
      <LeadUnlockSheet
        {...baseProps}
        state="insufficient_credits"
        balance={0}
        onBuyCredits={onBuyCredits}
      />,
    );

    fireEvent.press(screen.getByTestId('lead-unlock-buy-credits'));
    expect(onBuyCredits).toHaveBeenCalledTimes(1);
  });

  it('renders the accepted state confirmation', () => {
    render(<LeadUnlockSheet {...baseProps} state="accepted_credits_deducted" />);

    expect(screen.getByText('Амжилттай!')).toBeTruthy();
    expect(screen.getByText('Захиалагчийн холбоо барих мэдээлэл нээгдлээ. 2 кредит зарцуулагдлаа.')).toBeTruthy();
    expect(screen.getByText('Ойлголоо')).toBeTruthy();
  });

  it('renders the expired state confirmation', () => {
    render(<LeadUnlockSheet {...baseProps} state="expired_15min" />);

    expect(screen.getByText('Хугацаа дууслаа')).toBeTruthy();
    expect(screen.getByText('15 минутын хугацаа дууссан тул автоматаар татгалзсан. Кредит зарцуулагдаагүй.')).toBeTruthy();
    expect(screen.getByText('Ойлголоо')).toBeTruthy();
  });
});
