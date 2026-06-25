/**
 * Design tokens — single source of truth for the brand palette and scale.
 *
 * The runtime colors live as CSS variables in `globals.css` (so Tailwind
 * utilities like `bg-primary` resolve correctly). This file documents the
 * intent and exposes tokens to TS where we need them outside of CSS
 * (charts, canvas, emails, etc.). Retune the palette in BOTH places, or
 * generate one from the other.
 */
export const brand = {
  name: "Wanderlust",
  tagline: "Find where you're meant to go.",
} as const;

export const palette = {
  primary: "oklch(0.48 0.09 196)", // calm deep teal
  accent: "oklch(0.70 0.16 35)", // warm coral
  success: "oklch(0.62 0.14 155)",
  destructive: "oklch(0.58 0.21 27)",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.75rem",
  xl: "1rem",
} as const;

/** Stable accent hues used for destination category chips. */
export const vibeColors: Record<string, string> = {
  beach: "oklch(0.78 0.12 220)",
  city: "oklch(0.65 0.10 290)",
  culture: "oklch(0.70 0.13 60)",
  adventure: "oklch(0.62 0.15 145)",
  relax: "oklch(0.75 0.10 175)",
};
