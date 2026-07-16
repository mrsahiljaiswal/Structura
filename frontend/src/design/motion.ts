/**
 * Purpose: Motion and Animation Tokens for Structura
 * Controls duration, curves, and spring properties for Framer Motion.
 */

export const motion = {
  // Springs (Framer Motion syntax)
  springDefault: { type: "spring", stiffness: 300, damping: 30 },
  springStiff: { type: "spring", stiffness: 400, damping: 25 },
  springSoft: { type: "spring", stiffness: 200, damping: 35 },

  // Easings (CSS & Framer Motion transitions)
  easeOut: [0.16, 1, 0.3, 1], // Custom premium ease-out
  easeInOut: [0.65, 0, 0.35, 1], // Smooth premium ease-in-out

  // Durations (in seconds)
  durationFast: 0.15,
  durationNormal: 0.25,
  durationSlow: 0.4,
};
