import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PriceTag } from '../../../src/components/ui/PriceTag';
import { InfoRow } from '../../../src/components/ui/InfoRow';
import { FilterBar } from '../../../src/components/ui/FilterBar';

describe('PriceTag', () => {
  it('renders formatted amount with tugrik symbol', () => {
    render(<PriceTag amount={50000} testID="price" />);

    const priceEl = screen.getByTestId('price');
    // \u20AE is the tugrik symbol
    expect(priceEl).toHaveTextContent('\u20AE50,000');
  });

  it('renders small amounts correctly', () => {
    render(<PriceTag amount={500} testID="price" />);

    expect(screen.getByTestId('price')).toHaveTextContent('\u20AE500');
  });

  it('renders large amounts with comma formatting', () => {
    render(<PriceTag amount={1500000} testID="price" />);

    expect(screen.getByTestId('price')).toHaveTextContent('\u20AE1,500,000');
  });

  it('has correct accessibility label', () => {
    render(<PriceTag amount={70000} testID="price" />);

    expect(screen.getByLabelText('70,000 tugrik')).toBeTruthy();
  });
});

describe('InfoRow', () => {
  it('renders label and string value', () => {
    render(<InfoRow label="Location" value="Sukhbaatar" testID="info-row" />);

    expect(screen.getByText('Location')).toBeTruthy();
    expect(screen.getByText('Sukhbaatar')).toBeTruthy();
  });

  it('has correct accessibility label for string values', () => {
    render(<InfoRow label="Status" value="Open" testID="info-row" />);

    expect(screen.getByLabelText('Status: Open')).toBeTruthy();
  });

  it('renders label with ReactNode value', () => {
    const { Text } = require('react-native');
    render(<InfoRow label="Price" value={<Text>Custom Value</Text>} testID="info-row" />);

    expect(screen.getByText('Price')).toBeTruthy();
    expect(screen.getByText('Custom Value')).toBeTruthy();
  });
});

describe('FilterBar', () => {
  const filters = [
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'repair', label: 'Repair' },
    { id: 'delivery', label: 'Delivery' },
  ];

  it('renders all filter chips', () => {
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={jest.fn()} testID="filter-bar" />,
    );

    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('Repair')).toBeTruthy();
    expect(screen.getByText('Delivery')).toBeTruthy();
  });

  it('calls onToggle with the correct filter id when pressed', () => {
    const onToggle = jest.fn();
    render(
      <FilterBar filters={filters} activeFilters={[]} onToggle={onToggle} testID="filter-bar" />,
    );

    fireEvent.press(screen.getByText('Repair'));
    expect(onToggle).toHaveBeenCalledWith('repair');
  });

  it('renders active filter chips with selected state', () => {
    render(
      <FilterBar
        filters={filters}
        activeFilters={['cleaning']}
        onToggle={jest.fn()}
        testID="filter-bar"
      />,
    );

    // The chip with 'Cleaning' should have accessibilityState selected=true
    const cleaningChip = screen.getByLabelText('Cleaning');
    expect(cleaningChip.props.accessibilityState).toEqual({ selected: true });

    const repairChip = screen.getByLabelText('Repair');
    expect(repairChip.props.accessibilityState).toEqual({ selected: false });
  });

  it('calls onToggle for already-active filters (toggle off)', () => {
    const onToggle = jest.fn();
    render(
      <FilterBar
        filters={filters}
        activeFilters={['cleaning']}
        onToggle={onToggle}
        testID="filter-bar"
      />,
    );

    fireEvent.press(screen.getByText('Cleaning'));
    expect(onToggle).toHaveBeenCalledWith('cleaning');
  });
});
