import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import '@testing-library/jest-dom/vitest';
import i18n from '../lib/i18n';

// Force i18n to use English in all tests to avoid failures due to default Mongolian fallback
i18n.changeLanguage('en');
