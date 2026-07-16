/**
 * Purpose: Gradients Design Tokens for Structura
 * Controls dynamic background layers and card overlays.
 */

export const gradients = {
  // Accent gradient strings
  primary: "linear-gradient(to right, oklch(0.60 0.22 280), oklch(0.50 0.22 310))", // Indigo to Violet
  primaryHover: "linear-gradient(to right, oklch(0.63 0.22 280), oklch(0.53 0.22 310))",
  
  // Surface meshes
  glassCard: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))",
  glassCardHover: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",

  // Background grids
  darkGrid: "radial-gradient(ellipse at top, oklch(0.12 0.03 260 / 0.15) 0%, transparent 70%)",
  
  // Status indicator glowing pulses
  glowGreen: "radial-gradient(circle, oklch(0.68 0.16 142 / 0.2) 0%, transparent 70%)",
  glowRed: "radial-gradient(circle, oklch(0.62 0.20 28 / 0.2) 0%, transparent 70%)",
};
