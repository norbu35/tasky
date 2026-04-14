import type { ReactNode } from 'react';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 375, height: 812 };

export const SafeAreaProvider = ({ children }: { children: ReactNode }) => children;
export const SafeAreaView = ({ children }: { children: ReactNode }) => children;
export const useSafeAreaInsets = () => insets;
export const useSafeAreaFrame = () => frame;
export const SafeAreaInsetsContext = {
  Consumer: ({ children }: { children: (value: typeof insets) => ReactNode }) => children(insets),
};
