import { vi } from 'vitest';
import { notifyManager } from '@tanstack/react-query';

// Force synchronous TanStack Query notifications to avoid act() warnings
notifyManager.setScheduler((cb) => cb());

// Set timezone for consistent date handling
process.env.TZ = 'Asia/Ulaanbaatar';

// Mock react-native-reanimated
vi.mock('react-native-reanimated', async () => {
  const { ReanimatedMock } = await import('@tasky/test-utils/mocks');
  return ReanimatedMock;
});

// Mock react-native-worklets
vi.mock('react-native-worklets', () => ({
  createWorklet: vi.fn(),
  useWorklet: vi.fn(),
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', async () => {
  const { SafeAreaContextMock } = await import('@tasky/test-utils/mocks');
  return SafeAreaContextMock;
});

// Mock @react-native-async-storage/async-storage
vi.mock('@react-native-async-storage/async-storage', async () => {
  const { AsyncStorageMock } = await import('@tasky/test-utils/mocks');
  return { default: AsyncStorageMock };
});

// Mock expo/virtual/env
vi.mock('expo/virtual/env', () => ({}));
