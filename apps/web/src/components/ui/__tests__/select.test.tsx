import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

describe('Select', () => {
  it('renders the selected option through the trigger', () => {
    render(
      <Select defaultValue="cleaning">
        <SelectTrigger aria-label="Category">
          <SelectValue placeholder="Choose category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cleaning">Cleaning</SelectItem>
          <SelectItem value="moving">Moving</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).toHaveTextContent('Cleaning');
    expect(trigger).toHaveClass('h-12');
  });
});
