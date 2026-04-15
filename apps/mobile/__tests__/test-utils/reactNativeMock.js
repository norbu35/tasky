const React = require('react');

function proxyComponent(name) {
  const fn = (props) => React.createElement(name, props);
  fn.displayName = name;
  return fn;
}

module.exports = {
  // Primitives
  View: proxyComponent('View'),
  Text: proxyComponent('Text'),
  Image: proxyComponent('Image'),
  TextInput: proxyComponent('TextInput'),
  ScrollView: proxyComponent('ScrollView'),
  FlatList: proxyComponent('FlatList'),
  ActivityIndicator: proxyComponent('ActivityIndicator'),
  Pressable: proxyComponent('Pressable'),
  RefreshControl: proxyComponent('RefreshControl'),
  Modal: proxyComponent('Modal'),
  SafeAreaView: proxyComponent('SafeAreaView'),
  KeyboardAvoidingView: proxyComponent('KeyboardAvoidingView'),
  TouchableHighlight: proxyComponent('TouchableHighlight'),
  TouchableOpacity: proxyComponent('TouchableOpacity'),
  TouchableWithoutFeedback: proxyComponent('TouchableWithoutFeedback'),

  // APIs
  Alert: { alert: () => {} },
  Platform: { OS: 'ios', select: (obj) => obj && obj.ios },
  Dimensions: {
    get: () => ({ width: 390, height: 844 }),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  },
  Linking: { openURL: () => {}, addEventListener: () => {} },
  LogBox: { ignoreLogs: () => {}, ignoreAllLogs: () => {} },
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  LayoutAnimation: {
    configureNext: () => {},
    create: () => ({}),
    Types: { easeInEaseOut: 0 },
    Properties: { opacity: 1 },
  },
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    bezier: () => ((t) => t),
  },
  Animated: {
    Value: class {
      interpolate = () => {};
      setValue = () => {};
    },
    View: proxyComponent('AnimatedView'),
    ScrollView: proxyComponent('AnimatedScrollView'),
    timing: () => ({ start: () => {} }),
    spring: () => ({ start: () => {} }),
    parallel: () => ({ start: () => {} }),
    sequence: () => ({ start: () => {} }),
  },
  I18nManager: { isRTL: false, allowRTL: () => {}, forceRTL: () => {} },
  Appearance: {
    getColorScheme: () => 'light',
    addChangeListener: () => {},
  },
  StatusBar: { currentHeight: 44, pushStackEntry: () => {}, popStackEntry: () => {} },
  Keyboard: { dismiss: () => {}, addListener: () => {}, removeListener: () => {} },
  AppState: { currentState: 'active', addEventListener: () => {} },
  PixelRatio: { get: () => 2, getPixelSizeForLayoutSize: () => 0 },
  NativeModules: {},
  requireNativeComponent: (name) => proxyComponent(name),
  DeviceEventEmitter: { addListener: () => {}, removeListener: () => {} },
  BackHandler: { addEventListener: () => {}, removeEventListener: () => {} },
  findNodeHandle: () => null,
};
