import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasSeenOnboarding: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void; // for debugging
    currentRole: 'customer' | 'tasker';
    setRole: (role: 'customer' | 'tasker') => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            resetOnboarding: () => set({ hasSeenOnboarding: false }),
            currentRole: 'customer',
            setRole: (role) => set({ currentRole: role }),
        }),
        {
            name: 'tasky-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
