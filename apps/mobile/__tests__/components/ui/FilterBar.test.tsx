import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { FilterBar } from '../../../src/components/ui/FilterBar';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'cooking', label: 'Cooking' },
];

describe('FilterBar', () => {
  it('renders all filter labels', () => {
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={jest.fn()} testID="filterbar" />,
    );
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('Cooking')).toBeTruthy();
  });

  it('calls onToggle with filter id when pressed', () => {
    const onToggle = jest.fn();
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={onToggle} testID="filterbar" />,
    );
    fireEvent.press(screen.getByText('Cleaning'));
    expect(onToggle).toHaveBeenCalledWith('cleaning');
  });

  it('marks active filter chip with active cva classes', () => {
    render(
      <FilterBar
        filters={filters}
        activeFilters={['cleaning']}
        onToggle={jest.fn()}
        testID="filterbar"
      />,
    );
    const cleaningBtn = screen.getByLabelText('Cleaning');
    expect(cleaningBtn.props.className).toContain('bg-primary');
  });

  it('marks inactive filter chip with inactive cva classes', () => {
    render(
      <FilterBar
        filters={filters}
        activeFilters={['cleaning']}
        onToggle={jest.fn()}
        testID="filterbar"
      />,
    );
    const allBtn = screen.getByLabelText('All');
    expect(allBtn.props.className).toContain('bg-muted');
  });

  it('sets accessibilityState selected on active filters', () => {
    render(
      <FilterBar
        filters={filters}
        activeFilters={['all']}
        onToggle={jest.fn()}
        testID="filterbar"
      />,
    );
    const allBtn = screen.getByLabelText('All');
    expect(allBtn.props.accessibilityState?.selected).toBe(true);
  });

  it('sets accessibilityState not selected on inactive filters', () => {
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={jest.fn()} testID="filterbar" />,
    );
    const allBtn = screen.getByLabelText('All');
    expect(allBtn.props.accessibilityState?.selected).toBe(false);
  });

  it('applies rounded-full to chips', () => {
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={jest.fn()} testID="filterbar" />,
    );
    const allBtn = screen.getByLabelText('All');
    expect(allBtn.props.className).toContain('rounded-full');
  });
});
