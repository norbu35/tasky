import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import { FeedListTemplate } from '../../../src/components/templates/FeedListTemplate';

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      View: RN.View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withTiming: (v: number) => v,
    withRepeat: (v: number) => v,
    Easing: { bezier: () => (t: number) => t },
  };
});

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('lucide-react-native', () => {
  const RN = require('react-native');
  return {
    AlertTriangle: (props: any) => <RN.Text>{props.testID || 'AlertTriangle'}</RN.Text>,
  };
});

interface TestItem {
  id: string;
  name: string;
}

const testData: TestItem[] = [
  { id: '1', name: 'Item One' },
  { id: '2', name: 'Item Two' },
  { id: '3', name: 'Item Three' },
];

const defaultProps = {
  data: testData,
  renderItem: (item: TestItem) => <Text key={item.id}>{item.name}</Text>,
  keyExtractor: (item: TestItem) => item.id,
  testID: 'feed-list',
};

describe('FeedListTemplate', () => {
  beforeEach(() => {
    resetTestI18n();
    setTestLanguage('mn');
  });

  it('renders data items via renderItem', () => {
    render(<FeedListTemplate {...defaultProps} />);

    expect(screen.getByText('Item One')).toBeTruthy();
    expect(screen.getByText('Item Two')).toBeTruthy();
    expect(screen.getByText('Item Three')).toBeTruthy();
  });

  it('shows loading skeleton when isLoading=true', () => {
    render(<FeedListTemplate {...defaultProps} isLoading />);

    // Skeleton cards are rendered, actual items are not
    expect(screen.queryByText('Item One')).toBeFalsy();
    expect(screen.getByTestId('feed-list')).toBeTruthy();
  });

  it('shows empty state with title when isEmpty=true', () => {
    render(
      <FeedListTemplate
        {...defaultProps}
        data={[]}
        isEmpty
        emptyTitle="No tasks available"
        emptyCtaLabel="Post a task"
        emptyCtaOnPress={jest.fn()}
      />,
    );

    expect(screen.getByText('No tasks available')).toBeTruthy();
    expect(screen.getByText('Post a task')).toBeTruthy();
  });

  it('shows default empty title when no emptyTitle prop', () => {
    render(<FeedListTemplate {...defaultProps} data={[]} isEmpty />);

    expect(screen.getByText('Одоохондоо энд юу ч алга')).toBeTruthy();
  });

  it('shows error state with retry button when isError=true', () => {
    const onRetry = jest.fn();
    render(
      <FeedListTemplate {...defaultProps} isError onRetry={onRetry} errorMessage="Network error" />,
    );

    expect(screen.getByText('Network error')).toBeTruthy();
    expect(screen.getByText('Дахин оролдох')).toBeTruthy();
  });

  it('calls onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    render(<FeedListTemplate {...defaultProps} isError onRetry={onRetry} />);

    expect(screen.getByText('Агуулгыг ачаалж чадсангүй')).toBeTruthy();
    fireEvent.press(screen.getByText('Дахин оролдох'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('supports pull-to-refresh via onRefresh', () => {
    const onRefresh = jest.fn();
    render(<FeedListTemplate {...defaultProps} onRefresh={onRefresh} />);

    // The FlatList should be rendered with a RefreshControl
    // We verify the component renders without crashing when onRefresh is provided
    expect(screen.getByTestId('feed-list')).toBeTruthy();
  });

  it('does not use hard-coded template bottom padding values', () => {
    const { UNSAFE_getByType } = render(<FeedListTemplate {...defaultProps} />);
    const list = UNSAFE_getByType(FlatList);
    const contentStyle = StyleSheet.flatten(list.props.contentContainerStyle);
    expect(contentStyle?.paddingBottom).not.toBe(120);
  });

  it('shows empty state when data array is empty even without isEmpty flag', () => {
    render(<FeedListTemplate {...defaultProps} data={[]} />);

    expect(screen.getByText('Одоохондоо энд юу ч алга')).toBeTruthy();
  });
});
