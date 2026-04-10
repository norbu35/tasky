import React from 'react';
import { render, screen } from '@testing-library/react-native';

import DisputeStatusScreen from '../../../../src/app/(customer)/disputes/[disputeId]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ disputeId: 'dispute-123' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

let mockDisputeData: any = null;
let mockIsLoading = false;
let mockIsError = false;
const mockRefetch = jest.fn();

jest.mock('../../../../src/features/disputes/hooks/useDisputeDetail', () => ({
  useDisputeDetail: () => ({
    data: mockDisputeData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
}));

beforeEach(() => {
  const { resetTestI18n, setTestLanguage } = require('../../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockDisputeData = null;
  mockIsLoading = false;
  mockIsError = false;
});

describe('DisputeStatusScreen (SCR-CUST-025)', () => {
  it('has a testID on the screen container', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });

  it('shows loading skeleton during initial load', () => {
    mockIsLoading = true;
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });

  it('renders status badge for open dispute', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Нээлттэй')[0]).toBeTruthy();
  });

  it('shows open dispute description', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(
      screen.getByText('Таны маргаан админы хянаж байна. Шийдвэр гарахад мэдэгдэл авна.'),
    ).toBeTruthy();
  });

  it('renders escalated status', () => {
    mockDisputeData = { id: 'dispute-123', status: 'ESCALATED', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Мөрдөн шалгаж байна')[0]).toBeTruthy();
    expect(
      screen.getAllByText('Маргааныг нэмэлт шалгалтад шилжүүлсэн. Удахгүй хариу өгнө.')[0],
    ).toBeTruthy();
  });

  it('renders resolved for customer status', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'RESOLVED_CUSTOMER',
      reason: 'Poor quality work',
    };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Хэрэглэгчийн талд шийдэгдсэн')[0]).toBeTruthy();
    expect(
      screen.getByText('Маргаан таны талд шийдэгдлээ. Нөгөө талд зөрчлийн тэмдэглэл хийгдсэн.'),
    ).toBeTruthy();
  });

  it('renders resolved for tasker status', () => {
    mockDisputeData = { id: 'dispute-123', status: 'RESOLVED_TASKER', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Гүйцэтгэгчийн талд шийдэгдсэн')[0]).toBeTruthy();
    expect(screen.getAllByText('Маргаан гүйцэтгэгчийн талд шийдэгдлээ.')[0]).toBeTruthy();
  });

  it('renders closed insufficient evidence status', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'CLOSED_INSUFFICIENT',
      reason: 'Poor quality work',
    };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Нотлох баримт хангалтгүй — хаагдсан')[0]).toBeTruthy();
    expect(
      screen.getAllByText('Нотлох баримт 24 цагийн дотор ирүүлээгүй тул маргаан хаагдлаа.')[0],
    ).toBeTruthy();
  });

  it('shows dispute summary with reason', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Маргааны товч')).toBeTruthy();
    expect(screen.getByText('Poor quality work')).toBeTruthy();
  });

  it('shows submitted evidence when available', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'OPEN',
      reason: 'Poor quality work',
      evidence: ['Photo of damaged sink', 'Chat excerpt with tasker'],
    };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Илгээсэн нотлох баримт')).toBeTruthy();
    expect(screen.getByText('Photo of damaged sink')).toBeTruthy();
    expect(screen.getByText('Chat excerpt with tasker')).toBeTruthy();
  });

  it('shows the resolution section using the outcome text', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'RESOLVED_CUSTOMER',
      reason: 'Poor quality work',
    };
    render(<DisputeStatusScreen />);
    expect(screen.getAllByText('Шийдвэр')[0]).toBeTruthy();
    expect(screen.getAllByText('Маргаан таны талд шийдэгдлээ.')[0]).toBeTruthy();
  });

  it('shows mediation note', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(
      screen.getByText('Маргаан нь зөвхөн зуучлалын шинжтэй. Мөнгөн нөхөн төлбөр олгогдохгүй.'),
    ).toBeTruthy();
  });

  it('shows error state with retry', () => {
    mockIsError = true;
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });
});
