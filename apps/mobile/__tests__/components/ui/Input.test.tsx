import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Input } from '../../../src/components/ui/Input';
import { mobileTheme } from '../../../src/design/tokenAdapter';

describe('Input', () => {
  it('renders with editable=true by default', () => {
    render(<Input testID="input" />);
    expect(screen.getByTestId('input').props.editable).toBe(true);
  });

  it('applies invalid state styles', () => {
    render(<Input testID="input" invalid />);
    const style = StyleSheet.flatten(screen.getByTestId('input').props.style);
    expect(style.borderColor).toBe(mobileTheme.colors.danger);
  });

  it('applies read-only state by disabling editing', () => {
    render(<Input testID="input" readOnly />);
    expect(screen.getByTestId('input').props.editable).toBe(false);
  });

  it('respects explicit editable=false', () => {
    render(<Input testID="input" editable={false} />);
    expect(screen.getByTestId('input').props.editable).toBe(false);
  });

  it('passes nativewind className through', () => {
    render(<Input testID="input" className="px-4" />);
    expect(screen.getByTestId('input').props.className).toBe('px-4');
  });
});

