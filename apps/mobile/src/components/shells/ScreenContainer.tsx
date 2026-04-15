import React from 'react';
import { type StyleProp, type ViewStyle, View } from 'react-native';
import { SafeAreaView, type Edge, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { cn } from '../../lib/cn';

type ScreenContainerProps = {
  children: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
  className?: string;
  padded?: boolean;
} & Pick<SafeAreaViewProps, 'mode'>;

export function ScreenContainer({
  children,
  testID,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  mode = 'padding',
  padded = true,
  className,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      style={style}
      className={cn('flex-1 bg-background', className)}
      edges={edges}
      mode={mode}
      testID={testID}
    >
      <View style={contentStyle} className={cn('flex-1 bg-background', padded && 'px-screen-x')}>
        {children}
      </View>
    </SafeAreaView>
  );
}
