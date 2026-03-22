import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { animationPresets } from '../../design/animations';

const { colors } = mobileTheme;

interface HandDrawnCheckProps {
    size?: number;
    color?: string;
    animated?: boolean;
    testID?: string;
}

export function HandDrawnCheck({
    size = 48,
    color = colors.verified,
    animated = true,
    testID,
}: HandDrawnCheckProps) {
    const scale = useSharedValue(animated ? 0 : 1);

    useEffect(() => {
        if (animated) {
            scale.value = withTiming(1, {
                duration: animationPresets.celebration.duration,
                easing: animationPresets.celebration.easing,
            });
        }
    }, [animated, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            style={animatedStyle}
            testID={testID}
            accessibilityLabel="Success"
            accessibilityRole="image"
        >
            <CheckCircle size={size} color={color} />
        </Animated.View>
    );
}
