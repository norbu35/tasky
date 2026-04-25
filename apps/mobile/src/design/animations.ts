import { Easing, withSpring } from 'react-native-reanimated';

import { motionTokens, nativeTokens } from '@tasky/design-tokens';

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

const toAnimationPreset = (
  preset: (typeof nativeTokens.animationPresets)[keyof typeof nativeTokens.animationPresets],
) => ({
  duration: preset.duration,
  easing: toEasing(preset.easing),
});

export const animationPresets = {
  cardExpand: toAnimationPreset(nativeTokens.animationPresets.cardExpand),
  pageEnter: toAnimationPreset(nativeTokens.animationPresets.pageEnter),
  pageExit: toAnimationPreset(nativeTokens.animationPresets.pageExit),
  fabAppear: toAnimationPreset(nativeTokens.animationPresets.fabAppear),
  fabDisappear: toAnimationPreset(nativeTokens.animationPresets.fabDisappear),
  badgePop: toAnimationPreset(nativeTokens.animationPresets.badgePop),
  toastSlideIn: toAnimationPreset(nativeTokens.animationPresets.toastSlideIn),
  toastSlideOut: toAnimationPreset(nativeTokens.animationPresets.toastSlideOut),
  pullToRefresh: toAnimationPreset(nativeTokens.animationPresets.pullToRefresh),
  press: { duration: durations.instant, easing: easings.standard },
  enter: toAnimationPreset(nativeTokens.animationPresets.pageEnter),
  sheetOpen: toAnimationPreset(nativeTokens.animationPresets.sheetOpen),
  sheetClose: toAnimationPreset(nativeTokens.animationPresets.sheetClose),
  fade: { duration: durations.fast, easing: easings.standard },
  skeleton: toAnimationPreset(nativeTokens.animationPresets.skeletonPulse),
  celebration: toAnimationPreset(nativeTokens.animationPresets.successCheckmark),
} as const;

export const interactiveStates = nativeTokens.interaction;

export const springs = motionTokens.spring;

export const withInteractiveSpring = (toValue: number) => withSpring(toValue, springs.interactive);

export const withFloatingSpring = (toValue: number) => withSpring(toValue, springs.floating);

export const withEmphasisSpring = (toValue: number) => withSpring(toValue, springs.emphasis);
