// Motion tokens — durations in ms, easing as CSS cubic-bezier strings
// Critical: skeleton duration tuned for Mongolia's ~20 Mbps mobile average
export const motionTokens = {
  duration: {
    instant: 80,
    fast: 150,
    normal: 250,
    slow: 400,
    skeleton: 1500,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  spring: {
    interactive: {
      damping: 15,
      stiffness: 300,
    },
    floating: {
      damping: 18,
      stiffness: 220,
    },
    emphasis: {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    },
  },
} as const;

export type MotionTokens = typeof motionTokens;
