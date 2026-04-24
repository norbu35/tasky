// Reanimated mock for Vitest — replaces apps/mobile/__tests__/test-utils/reanimated-mock.js
type AnyFunction = (...args: unknown[]) => unknown;

export const withTiming = (value: number) => value;
export const withSpring = (value: number) => value;
export const withSequence = (...values: number[]) => values[values.length - 1];
export const withDelay = (_delay: number, value: number) => value;
export const useSharedValue = (initial: number) => ({ value: initial });
export const useAnimatedStyle = (fn: () => object) => fn();
export const useAnimatedScrollHandler = () => ({});
export const useDerivedValue = (fn: () => number) => ({ value: fn() });
export const useAnimatedGestureHandler = () => ({});
export const runOnJS = <T extends AnyFunction>(fn: T) => fn;
export const runOnUI = <T extends AnyFunction>(fn: T) => fn;
export const Easing = {
  linear: (x: number) => x,
  ease: (x: number) => x,
  bezier: () => (x: number) => x,
  in: <T extends AnyFunction>(fn: T) => fn,
  out: <T extends AnyFunction>(fn: T) => fn,
  inOut: <T extends AnyFunction>(fn: T) => fn,
};

export default {
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedGestureHandler,
  runOnJS,
  runOnUI,
  Easing,
  createAnimatedComponent: (component: unknown) => component,
};
