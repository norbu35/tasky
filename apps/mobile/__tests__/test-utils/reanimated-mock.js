/**
 * Lightweight react-native-reanimated mock for Jest.
 * Replaces the v4 `react-native-reanimated/mock` which now requires native
 * worklets initialization (incompatible with Jest environment).
 *
 * Mapped via jest.config.js moduleNameMapper:
 *   "react-native-reanimated/mock" -> this file
 */
const React = require('react');

const useSharedValue = jest.fn((initial) => ({ value: initial }));
const useAnimatedStyle = jest.fn((fn) => ({}));
const withTiming = jest.fn((value) => value);
const withSpring = jest.fn((value) => value);
const withRepeat = jest.fn((value) => value);
const withSequence = jest.fn((...args) => args[args.length - 1]);
const withDelay = jest.fn((_, value) => value);
const runOnJS = jest.fn((fn) => fn);
const cancelAnimation = jest.fn();
const interpolate = jest.fn((value) => value);
const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t,
  cubic: (t) => t,
  poly: () => (t) => t,
  sin: (t) => t,
  circle: (t) => t,
  exp: (t) => t,
  elastic: () => (t) => t,
  back: () => (t) => t,
  bounce: (t) => t,
  bezier: () => (t) => t,
  bezierFn: () => (t) => t,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

const createAnimatedComponent = jest.fn((Component) => {
  const AnimatedComponent = React.forwardRef((props, ref) => {
    return React.createElement(Component, { ...props, ref });
  });
  AnimatedComponent.displayName = `Animated.${Component.displayName || Component.name || 'Component'}`;
  return AnimatedComponent;
});

const Animated = {
  View: createAnimatedComponent(require('react-native').View),
  Text: createAnimatedComponent(require('react-native').Text),
  Image: createAnimatedComponent(require('react-native').Image),
  ScrollView: createAnimatedComponent(require('react-native').ScrollView),
  FlatList: createAnimatedComponent(require('react-native').FlatList),
  createAnimatedComponent,
};

// useEvent is used internally by react-native-gesture-handler via Reanimated.useEvent
const useEvent = jest.fn((handler) => handler);
const useHandler = jest.fn((handlers) => ({ context: {}, doDependenciesDiffer: false, useWeb: false }));

const Reanimated = {
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler: jest.fn(() => ({})),
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  cancelAnimation,
  interpolate,
  interpolateColor: jest.fn(() => '#000'),
  Extrapolation,
  Easing,
  createAnimatedComponent,
  useEvent,
  useHandler,
};

module.exports = {
  ...Reanimated,
  default: Reanimated,
  Reanimated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler: jest.fn(() => ({})),
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  cancelAnimation,
  interpolate,
  interpolateColor: jest.fn(() => '#000'),
  Extrapolation,
  Easing,
  createAnimatedComponent,
  useEvent,
  useHandler,
  FadeIn: {},
  FadeOut: {},
  SlideInLeft: {},
  SlideOutRight: {},
  Layout: {},
  ZoomIn: {},
  ZoomOut: {},
};
