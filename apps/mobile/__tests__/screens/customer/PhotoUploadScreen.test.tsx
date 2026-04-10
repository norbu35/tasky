import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

import PhotoUploadScreen from '../../../src/app/(customer)/tasks/new/photos';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockParams = { categoryId: 'cat-123', description: 'Fix my sink' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
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
  setTestLanguage('en');
  Object.assign(mockParams, { categoryId: 'cat-123', description: 'Fix my sink' });
});

describe('PhotoUploadScreen (SCR-CUST-004)', () => {
  it('has a testID on the screen container', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByTestId('SCR-CUST-004')).toBeTruthy();
  });

  it('renders the PhotoGrid component', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByTestId('photo-upload-grid')).toBeTruthy();
  });

  it('renders the add photo button', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByText('Show your task workspace')).toBeTruthy();
    expect(screen.getByText('Add photos related to your task (up to 3)')).toBeTruthy();
    expect(screen.getAllByText('Add Photo')).toHaveLength(3);
  });

  it('can skip photos and navigate to location', () => {
    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-004-next'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/location',
      }),
    );
  });

  it('renders as step 3 of 7 wizard', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByLabelText('Step 3 of 7')).toBeTruthy();
  });

  it('back button returns to intake form', () => {
    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-004-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows optional helper copy', () => {
    render(<PhotoUploadScreen />);
    expect(screen.getByText('Photos are optional — you can skip')).toBeTruthy();
  });

  it('uses continue copy when uploaded photos already exist', () => {
    Object.assign(mockParams, {
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: JSON.stringify(['photo-key-1']),
    });

    render(<PhotoUploadScreen />);

    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('shows remove action for uploaded photos and updates params payload after removal', () => {
    Object.assign(mockParams, {
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: JSON.stringify(['photo-key-1', 'photo-key-2']),
    });

    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('photo-upload-remove-0'));
    fireEvent.press(screen.getByTestId('SCR-CUST-004-next'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/location',
        params: expect.objectContaining({
          photos: JSON.stringify(['photo-key-2']),
        }),
      }),
    );
  });

  it('TID-TASK-113-MOBILE-PHOTO-KEYS-PERSIST preserves existing uploaded photo keys when continuing', () => {
    Object.assign(mockParams, {
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: JSON.stringify(['photo-key-1', 'photo-key-2']),
    });

    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-004-next'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/location',
        params: expect.objectContaining({
          categoryId: 'cat-123',
          description: 'Fix my sink',
          photos: JSON.stringify(['photo-key-1', 'photo-key-2']),
        }),
      }),
    );
  });
});
