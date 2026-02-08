import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme/theme";
import { icons } from "../theme/icons";

type Props = {
  color?: string;
  size?: number;
};

export function StackedNoteIcon({ color = theme.colors.brand, size = 12 }: Props) {
  const offset = Math.max(2, Math.round(size * 0.2));
  return (
    <View style={[styles.container, { width: size + offset * 2, height: size + offset * 2 }]}>
      <Text
        style={[
          styles.note,
          {
            color,
            fontSize: size,
            top: offset * 2,
            left: offset * 2,
            opacity: 0.3,
          },
        ]}
      >
        {icons.playlist}
      </Text>
      <Text
        style={[
          styles.note,
          {
            color,
            fontSize: size,
            top: offset,
            left: offset,
            opacity: 0.6,
          },
        ]}
      >
        {icons.playlist}
      </Text>
      <Text
        style={[
          styles.note,
          {
            color,
            fontSize: size,
            top: 0,
            left: 0,
            opacity: 1,
          },
        ]}
      >
        {icons.playlist}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
