import { Platform } from "react-native";

export const theme = {
  colors: {
    bg: "#F5F1E9",
    surface: "#FFFFFF",
    surfaceAlt: "#F0E9DD",
    text: "#1F2A35",
    textMuted: "#5C6670",
    brand: "#1B4D6B",
    brandDark: "#14374E",
    accent: "#E09F3E",
    border: "#E2DACC",
    success: "#2F855A",
    danger: "#B42318",
    highlight: "#FFE08A",
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
      ios: "AvenirNext-DemiBold",
      android: "sans-serif-medium",
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
