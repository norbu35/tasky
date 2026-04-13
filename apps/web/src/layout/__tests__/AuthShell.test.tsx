import '../../lib/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { createMockApiClient } from '../../test/mocks';

describe('Auth Shell', () => {
  it('TID-TASK-000-WEB-UNIT renders the auth shell with SDK wiring baseline', () => {
    const apiClient = createMockApiClient();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText(/SDK Binding:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeInTheDocument();
  });
});
