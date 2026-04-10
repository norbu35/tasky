import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
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

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('ApplicationSentSuccess (SCR-TASK-011)', () => {
  it('renders success headline', () => {
    const {
      ApplicationSentSuccess,
    } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
    render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={jest.fn()} />);

    expect(screen.getByText('Өргөдөл илгээгдлээ!')).toBeTruthy();
  });

  it('renders next steps text', () => {
    const {
      ApplicationSentSuccess,
    } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
    render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={jest.fn()} />);

    expect(screen.getByTestId('application-sent')).toBeTruthy();
    expect(screen.getByText('Захиалагч анкетуудыг хянаж, сонголт хийнэ')).toBeTruthy();
    expect(screen.getByText('Таныг сонговол мэдэгдэл авна')).toBeTruthy();
    expect(screen.getByText('Бусад даалгавруудад ч анкет илгээх боломжтой')).toBeTruthy();
  });

  it('CTA "Бусад даалгавар үзэх" calls onBrowseMore', () => {
    const onBrowse = jest.fn();
    const {
      ApplicationSentSuccess,
    } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
    render(<ApplicationSentSuccess onBrowseMore={onBrowse} onViewTask={jest.fn()} />);

    fireEvent.press(screen.getByTestId('application-sent-cta'));
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it('secondary CTA "Даалгавар харах" calls onViewTask', () => {
    const onView = jest.fn();
    const {
      ApplicationSentSuccess,
    } = require('../../../src/features/tasks/components/ApplicationSentSuccess');
    render(<ApplicationSentSuccess onBrowseMore={jest.fn()} onViewTask={onView} />);

    fireEvent.press(screen.getByTestId('application-sent-secondary-cta'));
    expect(onView).toHaveBeenCalledTimes(1);
  });
});
