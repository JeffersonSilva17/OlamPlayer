import { Platform } from "react-native";

export const theme = {
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
    }),
    body: Platform.select({
      ios: "AvenirNext-Regular",
      android: "sans-serif",
      default: "System",
    }),
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
