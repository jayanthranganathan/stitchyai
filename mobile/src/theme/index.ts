// Re-export everything so imports from '@/theme' continue to work
export { ThemeProvider, useTheme, useThemedStyles } from './ThemeContext';
export { THEMES, THEME_ORDER } from './themes';
export type { ThemeColors, ThemeId, ThemeDef } from './themes';

// Static tokens — these do NOT change with theme (layout, spacing, radii, typography sizes)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// color is intentionally omitted from caption — each component sets it via useThemedStyles
export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;
