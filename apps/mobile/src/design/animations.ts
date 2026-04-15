import { Easing } from 'react-native-reanimated';

import { motionTokens } from '@tasky/design-tokens';

const motionCurvePattern = /^cubic-bezier\(([^)]+)\)$/;

const toEasing = (curve: string) => {
  const match = motionCurvePattern.exec(curve);

  if (!match) {
    throw new Error(`Unsupported motion curve token: ${curve}`);
  }

  const [x1, y1, x2, y2] = match[1].split(',').map((value) => Number.parseFloat(value.trim()));
  return Easing.bezier(x1, y1, x2, y2);
};

export const durations = motionTokens.duration;

export const easings = {
  standard: toEasing(motionTokens.easing.standard),
  decelerate: toEasing(motionTokens.easing.decelerate),
  accelerate: toEasing(motionTokens.easing.accelerate),
  spring: toEasing(motionTokens.easing.spring),
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
