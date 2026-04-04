import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
const trackedEvents: { event_name: string; locale: string; actor_role: string }[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'mn' },
  }),
}));

jest.mock('../../../src/lib/clientAnalytics', () => ({
  createConsoleClientAnalyticsTracker: () => (event: any) => {
    trackedEvents.push(event);
  },
  resolveClientLocale: (locale?: string) => (locale ? `${locale}-MN` : 'mn-MN'),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

const mockMutate = jest.fn();
const mockPreviewMutate = jest.fn();
const mockUseMyProfile = jest.fn();
const mockUseUpdateProfile = jest.fn();
const mockUseProfilePolishPreview = jest.fn();

jest.mock('../../../src/features/profile/hooks/useProfile', () => ({
  useMyProfile: () => mockUseMyProfile(),
  useUpdateProfile: () => mockUseUpdateProfile(),
  useSignOut: () => jest.fn(),
}));

jest.mock('../../../src/features/profile/hooks/useProfilePolish', () => ({
  useProfilePolishPreview: () => mockUseProfilePolishPreview(),
}));

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ session: { accessToken: 'test-token' } }),
}));

const MOCK_PROFILE = {
  id: 'tasker-1',
  full_name: 'Болд',
  avatar_url: 'https://cdn.tasky.mn/avatars/tasker-1.jpg',
  bio: 'Би сантехник болон цахилгааны чиглэлээр 5 жил ажиллаж байна.',
  role: 'TASKER',
  status: 'VERIFIED',
  rating_avg: 4.8,
  completed_tasks: 25,
  is_pro: true,
  created_at: '2025-01-10T00:00:00Z',
};

function renderScreen() {
  const ProfilePolishScreen = require('../../../src/app/(tasker)/profile/polish').default;
  return render(<ProfilePolishScreen />);
}

function getEventNames() {
  return trackedEvents.map((event) => event.event_name);
}

beforeEach(() => {
  jest.clearAllMocks();
  trackedEvents.length = 0;

  mockUseMyProfile.mockReturnValue({
    data: MOCK_PROFILE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: false });
  mockUseProfilePolishPreview.mockReturnValue({ mutate: mockPreviewMutate, isPending: false });
});

describe('ProfilePolishScreen (SCR-TASK-019)', () => {
  it('renders the loading-first state and tracks the view event', () => {
    mockUseMyProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    renderScreen();

    expect(screen.getByTestId('profile-polish-screen')).toBeTruthy();
    expect(screen.queryByText('Одоогийн тайлбар')).toBeNull();
    expect(screen.queryByText('Санал болгох')).toBeNull();
    expect(getEventNames()).toContain('profile_polish_viewed');
  });

  it('enforces the exact manual-edit copy and a 300-character bio limit', () => {
    renderScreen();

    expect(screen.getByText('Гараар засах')).toBeTruthy();

    const input = screen.getByDisplayValue(MOCK_PROFILE.bio);
    fireEvent.changeText(input, 'а'.repeat(340));

    expect(screen.getByDisplayValue('а'.repeat(300))).toBeTruthy();
    expect(screen.queryByDisplayValue('а'.repeat(340))).toBeNull();
    expect(screen.getByText('300/300')).toBeTruthy();
  });

  it('requests a preview, shows loading, and renders the returned suggestion', async () => {
    let succeedPreview: ((payload: { suggested_bio: string }) => void) | undefined;

    mockPreviewMutate.mockImplementation((_payload, options) => {
      succeedPreview = (payload) => options?.onSuccess?.(payload);
    });

    renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));

    expect(screen.getByTestId('profile-polish-suggestion-loading')).toBeTruthy();
    await act(async () => {
      succeedPreview?.({
        suggested_bio: 'Би 5 жилийн туршлагатай, найдвартай үйлчилгээ үзүүлдэг мэргэжлийн tasker.',
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('profile-polish-suggestion-card')).toBeTruthy();
    });

    expect(mockPreviewMutate).toHaveBeenCalledWith(
      {
        bio: MOCK_PROFILE.bio,
        tone: 'professional',
      },
      expect.anything(),
    );
    expect(screen.getByText('Энэ хувилбарыг хэрэглэх')).toBeTruthy();
    expect(screen.getByText('Би 5 жилийн туршлагатай, найдвартай үйлчилгээ үзүүлдэг мэргэжлийн tasker.')).toBeTruthy();
    expect(getEventNames()).toContain('profile_polish_requested');
  });

  it('shows a network toast when preview generation fails', async () => {
    mockPreviewMutate.mockImplementation((_payload, options) => {
      options?.onError?.(new Error('network'));
    });

    renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));

    await waitFor(() => {
      expect(screen.getByText('Сүлжээний алдаа гарлаа')).toBeTruthy();
    });
    expect(screen.getByText('Гараар засах')).toBeTruthy();
  });

  it('ignores stale preview responses if the draft changes while generation is in flight', async () => {
    let succeedPreview: ((payload: { suggested_bio: string }) => void) | undefined;

    mockPreviewMutate.mockImplementation((_payload, options) => {
      succeedPreview = (payload) => options?.onSuccess?.(payload);
    });

    renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));
    fireEvent.changeText(
      screen.getByDisplayValue(MOCK_PROFILE.bio),
      'Шинэ засварын текст орууллаа.',
    );

    succeedPreview?.({ suggested_bio: 'Хуучин хүсэлтийн санал' });

    await waitFor(() => {
      expect(screen.queryByText('Хуучин хүсэлтийн санал')).toBeNull();
    });
    expect(screen.getByText('AI санал энд харагдана. Эхлээд тайлбараа сайжруулах хүсэлт илгээнэ үү.')).toBeTruthy();
  });

  it('applies the suggested bio and tracks the apply event', async () => {
    mockPreviewMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        suggested_bio: 'Би 5 жилийн туршлагатай, захиалгыг найдвартай гүйцэтгэдэг.',
      });
    });
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });

    renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));
    await waitFor(() => {
      expect(screen.getByText('Энэ хувилбарыг хэрэглэх')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));

    expect(mockMutate).toHaveBeenCalledWith(
      { bio: 'Би 5 жилийн туршлагатай, захиалгыг найдвартай гүйцэтгэдэг.' },
      expect.anything(),
    );
    expect(screen.getByText('Санал болгосон текст хадгалагдлаа')).toBeTruthy();
    expect(getEventNames()).toContain('profile_polish_applied');
  });

  it('does not overwrite a local draft when the profile query refetches', () => {
    let profileResult = {
      data: MOCK_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };

    mockUseMyProfile.mockImplementation(() => profileResult);

    const view = renderScreen();

    fireEvent.changeText(screen.getByDisplayValue(MOCK_PROFILE.bio), 'Миний дотоод ноорог');

    profileResult = {
      ...profileResult,
      data: {
        ...MOCK_PROFILE,
        bio: 'Серверээс дахин ирсэн текст',
      },
    };

    view.rerender(React.createElement(require('../../../src/app/(tasker)/profile/polish').default));

    expect(screen.getByDisplayValue('Миний дотоод ноорог')).toBeTruthy();
    expect(screen.queryByDisplayValue('Серверээс дахин ирсэн текст')).toBeNull();
  });

  it('treats a blank preview payload as a network-style error instead of entering apply mode', async () => {
    mockPreviewMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({ suggested_bio: '   ' });
    });

    renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));

    await waitFor(() => {
      expect(screen.getByText('Сүлжээний алдаа гарлаа')).toBeTruthy();
    });
    expect(screen.queryByText('Энэ хувилбарыг хэрэглэх')).toBeNull();
    expect(screen.getByText('Санал болгох')).toBeTruthy();
  });

  it('tracks a rejected event when leaving with an unapplied suggestion', async () => {
    mockPreviewMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        suggested_bio: 'Би 5 жилийн туршлагатай, захиалгыг найдвартай гүйцэтгэдэг.',
      });
    });

    const view = renderScreen();

    fireEvent.press(screen.getByTestId('profile-polish-screen-cta'));
    await waitFor(() => {
      expect(screen.getByText('Энэ хувилбарыг хэрэглэх')).toBeTruthy();
    });

    view.unmount();

    expect(getEventNames()).toContain('profile_polish_rejected');
  });

  it('tracks analytics payload metadata with Mongolian locale and tasker role', () => {
    renderScreen();

    expect(trackedEvents[0]).toMatchObject({
      event_name: 'profile_polish_viewed',
      platform: 'MOBILE',
      locale: 'mn-MN',
      actor_role: 'TASKER',
    });
  });
});
