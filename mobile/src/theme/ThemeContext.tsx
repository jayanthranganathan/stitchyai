import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { THEMES, type ThemeColors, type ThemeId } from './themes';

const STORAGE_KEY = '@stitchy/theme';
const DEFAULT_THEME: ThemeId = 'neon-bazaar';

type ThemeCtx = {
  themeId: ThemeId;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  themeId: DEFAULT_THEME,
  colors: THEMES[DEFAULT_THEME].colors,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && stored in THEMES) setThemeId(stored as ThemeId);
    });
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    void AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({ themeId, colors: THEMES[themeId].colors, setTheme }),
    [themeId, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Creates a StyleSheet inside the component that re-runs when the theme changes.
// Usage: const styles = useThemedStyles(c => StyleSheet.create({ title: { color: c.text } }))
export function useThemedStyles<T extends Record<string, unknown>>(
  factory: (colors: ThemeColors) => T
): T {
  const { colors } = useTheme();
  // Re-create styles only when colors identity changes (i.e. theme switched)
  const colorsRef = useRef(colors);
  const stylesRef = useRef<T>(factory(colors));
  if (colorsRef.current !== colors) {
    colorsRef.current = colors;
    stylesRef.current = factory(colors);
  }
  return stylesRef.current;
}
