import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { interactiveStates } from '../../design/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableCardProps {
    children: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    testID?: string;
}

export function PressableCard({ children, onPress, style, testID }: PressableCardProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(interactiveStates.pressed.scale, { damping: 15, stiffness: 300 });
        opacity.value = withSpring(interactiveStates.pressed.opacity, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, animatedStyle]}
            testID={testID}
            accessibilityRole="button"
        >
            {children}
        </AnimatedPressable>
    );
}
