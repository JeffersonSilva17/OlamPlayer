import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

type Props = {
  color?: string;
  size?: number;
};

export function StackedNoteIcon({ color, size = 12 }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.brand;
  const offset = Math.max(2, Math.round(size * 0.2));
  const noteSymbol = String.fromCharCode(0x266a);
  return (
    <View style={[styles.container, { width: size + offset * 2, height: size + offset * 2 }]}>
      <Text
        style={[
          styles.note,
          {
            color: resolvedColor,
            fontSize: size,
            top: offset * 2,
            left: offset * 2,
            opacity: 0.3,
          },
        ]}
      >
        {noteSymbol}
      </Text>
      <Text
        style={[
          styles.note,
          {
            color: resolvedColor,
            fontSize: size,
            top: offset,
            left: offset,
            opacity: 0.6,
          },
        ]}
      >
        {noteSymbol}
      </Text>
      <Text
        style={[
          styles.note,
          {
            color: resolvedColor,
            fontSize: size,
            top: 0,
            left: 0,
            opacity: 1,
          },
        ]}
      >
        {noteSymbol}
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    note: {
      position: "absolute",
      fontFamily: theme.fonts.heading,
    },
  });
