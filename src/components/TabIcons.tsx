import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

type Props = {
  focused?: boolean;
};

export function VideoTabIcon({ focused = false }: Props) {
  const theme = useTheme();
  const color = focused ? theme.colors.accent : theme.colors.textMuted;
  return (
    <View style={styles.videoWrap}>
      <View style={[styles.videoTop, { borderColor: color }]}>
        <View style={[styles.clap, { backgroundColor: color }]} />
        <View style={[styles.clap, { backgroundColor: color }]} />
        <View style={[styles.clap, { backgroundColor: color }]} />
      </View>
      <View style={[styles.videoBody, { borderColor: color }]}>
        <Text style={[styles.videoPlay, { color }]}>
          {String.fromCharCode(0x25b6)}
        </Text>
      </View>
    </View>
  );
}

export function AudioTabIcon({ focused = false }: Props) {
  const theme = useTheme();
  const color = focused ? theme.colors.accent : theme.colors.textMuted;
  return (
    <View style={styles.audioWrap}>
      <Text style={[styles.audioNote, { color }]}>
        {String.fromCharCode(0x266a)}
      </Text>
    </View>
  );
}

export function PlaylistTabIcon({ focused = false }: Props) {
  const theme = useTheme();
  const color = focused ? theme.colors.accent : theme.colors.textMuted;
  return (
    <View style={styles.playlistWrap}>
      <View style={[styles.playlistLine, { backgroundColor: color }]} />
      <View style={[styles.playlistLine, { backgroundColor: color }]} />
      <View style={[styles.playlistLine, { backgroundColor: color }]} />
      <Text style={[styles.playlistNote, { color }]}>
        {String.fromCharCode(0x266a)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  videoWrap: {
    width: 26,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  videoTop: {
    width: 22,
    height: 6,
    borderWidth: 2,
    borderRadius: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 2,
    transform: [{ skewX: "-15deg" }],
  },
  clap: {
    width: 3,
    height: 2,
    borderRadius: 1,
    alignSelf: "center",
  },
  videoBody: {
    width: 22,
    height: 14,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlay: {
    fontSize: 10,
    fontWeight: "800",
  },
  audioWrap: {
    width: 26,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  audioNote: {
    fontSize: 20,
    fontWeight: "700",
  },
  playlistWrap: {
    width: 26,
    height: 22,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 3,
  },
  playlistLine: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
  playlistNote: {
    position: "absolute",
    right: -2,
    bottom: -1,
    fontSize: 12,
    fontWeight: "700",
  },
});
