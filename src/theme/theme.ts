import { Platform } from "react-native";

export type ThemeMode = "dark" | "light";

export type AppTheme = {
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    brand: string;
    brandDark: string;
    accent: string;
    border: string;
    success: string;
    danger: string;
    highlight: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fonts: {
    heading: string;
    body: string;
  };
  shadow: {
    card: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
};

const baseTheme = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  fonts: {
    heading: Platform.select({
      ios: "AvenirNext-Bold",
      android: "sans-serif-condensed",
      default: "System",
    }) as string,
    body: Platform.select({
      ios: "AvenirNext-Regular",
      android: "sans-serif",
      default: "System",
    }) as string,
  },
  shadow: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
  },
};

export const darkTheme: AppTheme = {
  colors: {
    bg: "#0B1020",
    surface: "#121826",
    surfaceAlt: "#1A2234",
    text: "#E6EDF6",
    textMuted: "#A7B2C6",
    brand: "#4A7CFF",
    brandDark: "#2B57D6",
    accent: "#22C0FF",
    border: "#273045",
    success: "#2ED573",
    danger: "#F97373",
    highlight: "#2C3E72",
  },
  ...baseTheme,
};

export const lightTheme: AppTheme = {
  colors: {
    bg: "#F6F8FC",
    surface: "#FFFFFF",
    surfaceAlt: "#EEF2F8",
    text: "#0D1A2B",
    textMuted: "#5A6A82",
    brand: "#2B57D6",
    brandDark: "#1D3E9F",
    accent: "#1DA9E6",
    border: "#D6DCE7",
    success: "#1EBE6A",
    danger: "#E25A5A",
    highlight: "#DDE7FF",
  },
  shadow: {
    card: {
      shadowColor: "#0B1020",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
  radius: baseTheme.radius,
  spacing: baseTheme.spacing,
  fonts: baseTheme.fonts,
};

export function createTheme(mode: ThemeMode): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}
