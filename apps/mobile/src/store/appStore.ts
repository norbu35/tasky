import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasSeenOnboarding: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void; // for debugging
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            resetOnboarding: () => set({ hasSeenOnboarding: false }),
        }),
        {
            name: 'tasky-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
