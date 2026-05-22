import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, Colors } from './colors';
import { Typography } from './typography';
import { Spacing, Radius, Shadow } from './spacing';

export { LightColors, DarkColors, Typography, Spacing, Radius, Shadow };
export type { Colors };

interface Theme {
  colors: Colors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadow: typeof Shadow;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({
  colors: LightColors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,
  isDark: false,
});

export function ThemeProvider({
  children,
  override,
}: {
  children: React.ReactNode;
  override?: 'light' | 'dark' | 'system';
}) {
  const systemScheme = useColorScheme();
  const [themeMode] = useState<'light' | 'dark' | 'system'>(override ?? 'system');

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const theme: Theme = {
    colors: isDark ? DarkColors : LightColors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadow: Shadow,
    isDark,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
