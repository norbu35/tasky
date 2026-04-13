import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../test/mocks';

describe('Component Usage Compliance', () => {
  it('TID-TASK-070-WEB-COMPONENT-USAGE-COMPLIANCE renders intake screen with shadcn components', async () => {
    const apiClient = createMockApiClient();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeInTheDocument();
    expect(screen.queryByText('Developer Bypass')).not.toBeInTheDocument();
  });
});
