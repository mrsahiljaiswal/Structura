/**
 * Purpose: Typography Design Tokens for Structura
 * Controls type scale, weights, and character spacing.
 */

export const typography = {
  // Fonts
  fontSans: "var(--font-geist-sans), sans-serif",
  fontMono: "var(--font-geist-mono), monospace",

  // Font Sizes
  sizeH1: "2.5rem",      // 40px
  sizeH2: "2rem",        // 32px
  sizeH3: "1.5rem",      // 24px
  sizeBody: "1.0625rem", // 17px (custom technical book sizing)
  sizeCaption: "0.8125rem", // 13px
  sizeCode: "0.9375rem", // 15px

  // Font Weights
  weightRegular: "400",
  weightMedium: "500",
  weightSemibold: "600",
  weightBold: "700",

  // Letter Spacings
  trackingTight: "-0.02em",
  trackingNormal: "0em",
  trackingWide: "0.05em",
  trackingWidest: "0.4em", // Spaced title header

  // Line Heights
  leadingNone: "1",
  leadingTight: "1.25",
  leadingNormal: "1.5",
  leadingRelaxed: "1.6", // Standard for body paragraphs
};
