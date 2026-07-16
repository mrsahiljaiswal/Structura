/**
 * Purpose: Border Radius Design Tokens for Structura
 * Supports standard card roundings, badges, and avatars.
 */

export const radius = {
  // Primitives
  none: "0rem",
  sm: "calc(var(--radius) - 4px)",  // ~6px
  md: "calc(var(--radius) - 2px)",  // ~8px
  lg: "var(--radius)",              // ~10px
  xl: "calc(var(--radius) + 4px)",  // ~14px
  xxl: "calc(var(--radius) + 10px)", // ~20px (Rounded 2xl equivalent)
  xxxl: "calc(var(--radius) + 16px)", // ~26px (Rounded 3xl equivalent)
  full: "9999px",                   // Perfect circle

  // Semantic
  button: "calc(var(--radius) - 2px)", // Medium rounding for primary actions
  input: "calc(var(--radius) - 2px)",
  card: "calc(var(--radius) + 10px)",  // Rounded 2xl equivalent for glass cards
  avatar: "calc(var(--radius) - 4px)", // Sub-rounding for square-ish profile buttons
  badge: "9999px",                     // Pill rounding
};
