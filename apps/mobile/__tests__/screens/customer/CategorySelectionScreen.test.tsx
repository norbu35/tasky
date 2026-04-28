import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

import CategorySelectionScreen from '../../../src/app/(customer)/tasks/new/category';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({}),
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

const mockUseCategories = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCategories', () => ({
  useCategories: () => mockUseCategories(),
}));

const mockCreateDraft = jest.fn().mockReturnValue('test-draft-id');
const mockUpdateDraft = jest.fn();
jest.mock('../../../src/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({
      createDraft: mockCreateDraft,
      updateDraft: mockUpdateDraft,
      drafts: {},
    }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('CategorySelectionScreen (SCR-CUST-002)', () => {
  it('has a testID on the screen container', () => {
    mockUseCategories.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('SCR-CUST-002')).toBeTruthy();
  });

  it('renders the editorial intro and featured guidance copy', () => {
    mockUseCategories.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<CategorySelectionScreen />);
    expect(
      screen.getByText(
        'Select the area where you need help. We will suggest professional taskers for you.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Professional Advice')).toBeTruthy();
  });

  it('close button returns to the tabs shell', () => {
    mockUseCategories.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<CategorySelectionScreen />);
    fireEvent.press(screen.getByTestId('wizard-close'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('shows categories when loaded', () => {
    mockUseCategories.mockReturnValue({
      data: {
        data: [
          { id: 'cat-1', name: 'Cleaning' },
          { id: 'cat-2', name: 'Handyman' },
          { id: 'cat-3', name: 'Moving' },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('category-selection-grid')).toBeTruthy();
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('Handyman')).toBeTruthy();
    expect(screen.getByText('Moving')).toBeTruthy();
  });

  it('uses localized category names and removes duplicate category cards', () => {
    setTestLanguage('mn');
    mockUseCategories.mockReturnValue({
      data: {
        data: [
          { id: 'cat-1', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
          { id: 'cat-duplicate', name: 'Cleaning', name_mn: 'Цэвэрлэгээ' },
          { id: 'cat-2', name: 'Handyman', name_mn: 'Гар ажил' },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<CategorySelectionScreen />);

    expect(screen.getByText('Цэвэрлэгээ')).toBeTruthy();
    expect(screen.getByText('Гар ажил')).toBeTruthy();
    expect(screen.queryByTestId('category-item-cat-duplicate')).toBeNull();
  });

  it('selecting a category creates a draft and navigates to intake with draftId', () => {
    mockUseCategories.mockReturnValue({
      data: {
        data: [{ id: 'cat-1', name: 'Cleaning', intake_enabled: true, intake_schema_version: 2 }],
      },
      isLoading: false,
      isError: false,
    });
    render(<CategorySelectionScreen />);
    fireEvent.press(screen.getByTestId('category-item-cat-1'));
    expect(mockCreateDraft).toHaveBeenCalledTimes(1);
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        categoryId: 'cat-1',
        categoryName: 'Cleaning',
        intakeEnabled: true,
        intakeSchemaVersion: 2,
        currentStep: 0,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/intake',
      params: { draftId: 'test-draft-id' },
    });
  });

  it('shows loading state', () => {
    mockUseCategories.mockReturnValue({ data: null, isLoading: true, isError: false });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('SCR-CUST-002')).toBeTruthy();
  });

  it('shows error state when API fails', () => {
    mockUseCategories.mockReturnValue({ data: null, isLoading: false, isError: true });
    render(<CategorySelectionScreen />);
    expect(screen.getByText('Failed to load categories')).toBeTruthy();
    expect(screen.getByTestId('category-selection-retry')).toBeTruthy();
  });
});
