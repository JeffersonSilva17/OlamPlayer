import React, { createContext, useContext, useEffect, useMemo } from "react";
import { createTheme, darkTheme, type AppTheme } from "./theme";
import { useSettingsStore } from "../stores/settingsStore";

const ThemeContext = createContext<AppTheme>(darkTheme);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeMode, loadThemeMode } = useSettingsStore();

  useEffect(() => {
    loadThemeMode();
  }, [loadThemeMode]);

  const theme = useMemo(() => createTheme(themeMode), [themeMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
