import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

export function ScreenBackdrop() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    blobOne: {
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: theme.colors.brand,
      opacity: 0.12,
      top: -80,
      right: -60,
    },
    blobTwo: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.colors.accent,
      opacity: 0.1,
      bottom: -70,
      left: -50,
    },
  });
