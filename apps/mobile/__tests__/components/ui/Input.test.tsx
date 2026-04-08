import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  it('renders with editable=true by default', () => {
    render(<Input testID="input" />);
    expect(screen.getByTestId('input').props.editable).toBe(true);
  });

  it('applies invalid state styles', () => {
    render(<Input testID="input" invalid />);
    const input = screen.getByTestId('input');
    expect(input.props.className).toContain('border-danger');
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
    expect(screen.getByTestId('input').props.className).toContain('px-4');
  });
});

