import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasSeenOnboarding: boolean;
    hasSeenTour: boolean;
    completeOnboarding: () => void;
    completeTour: () => void;
    resetOnboarding: () => void; // for debugging
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,
            hasSeenTour: false,
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            completeTour: () => set({ hasSeenTour: true }),
            resetOnboarding: () => set({ hasSeenOnboarding: false, hasSeenTour: false }),
        }),
        {
            name: 'tasky-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
