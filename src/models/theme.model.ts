/**
 * theme.model.ts — Types for visual theme selection.
 */

export const AVAILABLE_THEMES = ['auto', 'light', 'dark'] as const;

export type ThemeChoice = (typeof AVAILABLE_THEMES)[number];
