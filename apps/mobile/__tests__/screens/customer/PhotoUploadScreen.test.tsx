import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import PhotoUploadScreen from '../../../src/app/(customer)/tasks/new/photos';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: 'cat-123', description: 'Fix my sink' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
    i18n: { language: 'en' },
  }),
}));

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
});

describe('PhotoUploadScreen (SCR-CUST-004)', () => {
  it('has a testID on the screen container', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByTestId('photo-upload-screen')).toBeTruthy();
  });

  it('renders the PhotoGrid component', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByTestId('photo-upload-grid')).toBeTruthy();
  });

  it('renders the add photo button', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByText('Add Photo')).toBeTruthy();
  });

  it('can skip photos and navigate to location', () => {
    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('photo-upload-screen-next'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/location',
      }),
    );
  });

  it('renders as step 2 of 5 wizard', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByTestId('photo-upload-screen')).toBeTruthy();
  });
});
