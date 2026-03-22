import { Easing } from 'react-native-reanimated';

// Motion tokens from design-system-additions.yaml
export const durations = {
    instant: 80,
    fast: 150,
    normal: 250,
    slow: 400,
    skeleton: 1500,
} as const;

export const easings = {
    standard: Easing.bezier(0.4, 0, 0.2, 1),
    decelerate: Easing.bezier(0, 0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0, 1, 1),
    spring: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const animationPresets = {
    press: { duration: durations.instant, easing: easings.standard },
    enter: { duration: durations.normal, easing: easings.decelerate },
    sheetOpen: { duration: durations.slow, easing: easings.decelerate },
    sheetClose: { duration: durations.normal, easing: easings.accelerate },
    fade: { duration: durations.fast, easing: easings.standard },
    skeleton: { duration: durations.skeleton, easing: easings.standard },
    celebration: { duration: durations.slow, easing: easings.spring },
} as const;

// Interactive state values from design-system-additions.yaml
export const interactiveStates = {
    pressed: { opacity: 0.85, scale: 0.98 },
    disabled: { opacity: 0.4 },
    hover: { opacity: 0.92 },
} as const;
