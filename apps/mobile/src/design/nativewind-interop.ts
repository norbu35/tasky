import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

// NativeWind v4 requires cssInterop() for third-party components.
// Without this, className on Animated.View/Text/ScrollView is silently ignored.

cssInterop(Animated.View, { className: 'style' });
cssInterop(Animated.Text, { className: 'style' });
cssInterop(Animated.ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
