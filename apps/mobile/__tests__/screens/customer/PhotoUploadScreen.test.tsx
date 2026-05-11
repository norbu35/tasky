import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import PhotoUploadScreen from '../../../src/app/(customer)/tasks/new/photos';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();

const mockDraftStoreState: any = {
  'test-draft-id': {
    draftId: 'test-draft-id',
    categoryId: 'cat-123',
    description: 'Fix my sink',
    photos: [],
    currentStep: 1,
  },
};

const mockUpdateDraft = jest.fn();
jest.mock('../../../src/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({ drafts: mockDraftStoreState, updateDraft: mockUpdateDraft }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ draftId: 'test-draft-id' }),
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
  mockDraftStoreState['test-draft-id'] = {
    draftId: 'test-draft-id',
    categoryId: 'cat-123',
    description: 'Fix my sink',
    photos: [],
    currentStep: 1,
  };
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
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/location',
      params: { draftId: 'test-draft-id' },
    });
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
    mockDraftStoreState['test-draft-id'] = {
      draftId: 'test-draft-id',
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: ['photo-key-1'],
      currentStep: 1,
    };

    render(<PhotoUploadScreen />);

    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('shows remove action for uploaded photos and updates draft after removal', () => {
    mockDraftStoreState['test-draft-id'] = {
      draftId: 'test-draft-id',
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: ['photo-key-1', 'photo-key-2'],
      currentStep: 1,
    };

    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('photo-upload-remove-0'));
    fireEvent.press(screen.getByTestId('SCR-CUST-004-next'));

    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        photos: ['photo-key-2'],
        currentStep: 2,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/location',
      params: { draftId: 'test-draft-id' },
    });
  });

  it('TID-TASK-113-MOBILE-PHOTO-KEYS-PERSIST preserves existing uploaded photo keys when continuing', () => {
    mockDraftStoreState['test-draft-id'] = {
      draftId: 'test-draft-id',
      categoryId: 'cat-123',
      description: 'Fix my sink',
      photos: ['photo-key-1', 'photo-key-2'],
      currentStep: 1,
    };

    render(<PhotoUploadScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-004-next'));

    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        photos: ['photo-key-1', 'photo-key-2'],
        currentStep: 2,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/location',
      params: { draftId: 'test-draft-id' },
    });
  });
});
