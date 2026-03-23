import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import CategorySelectionScreen from '../../../src/app/(customer)/tasks/new/category';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
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

const mockUseCategories = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCategories', () => ({
  useCategories: () => mockUseCategories(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CategorySelectionScreen (SCR-CUST-002)', () => {
  it('has a testID on the screen container', () => {
    mockUseCategories.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('category-selection-screen')).toBeTruthy();
  });

  it('renders the screen title', () => {
    mockUseCategories.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<CategorySelectionScreen />);
    expect(screen.getByText('What do you need help with?')).toBeTruthy();
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
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('Handyman')).toBeTruthy();
    expect(screen.getByText('Moving')).toBeTruthy();
  });

  it('selecting a category navigates to intake form with categoryId', () => {
    mockUseCategories.mockReturnValue({
      data: {
        data: [{ id: 'cat-1', name: 'Cleaning' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<CategorySelectionScreen />);
    fireEvent.press(screen.getByText('Cleaning'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/intake',
      params: { categoryId: 'cat-1' },
    });
  });

  it('shows loading state', () => {
    mockUseCategories.mockReturnValue({ data: null, isLoading: true, isError: false });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('category-selection-screen')).toBeTruthy();
  });

  it('shows error state when API fails', () => {
    mockUseCategories.mockReturnValue({ data: null, isLoading: false, isError: true });
    render(<CategorySelectionScreen />);
    expect(screen.getByTestId('category-selection-screen')).toBeTruthy();
  });
});
