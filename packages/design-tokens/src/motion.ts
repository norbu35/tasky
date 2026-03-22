// Motion tokens — durations in ms, easing as CSS cubic-bezier strings
// Critical: skeleton duration tuned for Mongolia's ~20 Mbps mobile average
export const motionTokens = {
    duration: {
        instant: 80,      // micro-feedback (button press ripple)
        fast: 150,        // hover states, badge pop
        normal: 250,      // panel slides, card expand
        slow: 400,        // page transitions, modal open
        skeleton: 1500,   // skeleton pulse loop
    },
    easing: {
        standard:   'cubic-bezier(0.4, 0, 0.2, 1)',   // default UI motion
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',      // elements entering the screen
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',      // elements leaving the screen
        spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)', // playful bounce (FAB, badge pop)
    },
} as const;

export type MotionTokens = typeof motionTokens;
