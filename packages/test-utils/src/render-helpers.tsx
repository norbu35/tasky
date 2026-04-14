import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { createTestQueryClient } from './query-client';

interface WrapperOptions {
  queryClient?: QueryClient;
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions & WrapperOptions) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}
