/**
 * Purpose: Elevation and Shadows Design Tokens for Structura
 * Controls layering, shadows, and focus glows.
 */

export const elevation = {
  // Shadow depth
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",

  // Premium glow/halos for SaaS cards
  soft: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  glowIndigo: "0 0 40px 0px rgba(99, 102, 241, 0.05)",
  glowViolet: "0 0 40px 0px rgba(139, 92, 246, 0.05)",
  focusRing: "0 0 0 3px rgba(99, 102, 241, 0.2)",
  focusRingDestructive: "0 0 0 3px rgba(239, 68, 68, 0.2)",
};
