import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PriceTag } from '../../../src/components/ui/PriceTag';
import { InfoRow } from '../../../src/components/ui/InfoRow';

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
