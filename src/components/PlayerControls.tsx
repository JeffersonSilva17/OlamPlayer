import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { theme } from "../theme/theme";

type Props = {
  isPlaying: boolean;
  positionMs: number;
  durationMs?: number;
  onPlayPause: () => void;
  onSeek: (positionMs: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
};

function formatTime(ms?: number): string {
  if (!ms && ms !== 0) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PlayerControls({
  isPlaying,
  positionMs,
  durationMs,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
}: Props) {
  const showSkip = Boolean(onPrev || onNext);
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={durationMs ?? 1}
        value={Math.min(positionMs, durationMs ?? positionMs)}
        onSlidingComplete={onSeek}
        minimumTrackTintColor={theme.colors.brand}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.brand}
      />
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(positionMs)}</Text>
        <Text style={styles.time}>{formatTime(durationMs)}</Text>
      </View>
      {showSkip ? (
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.smallButton, !canPrev && styles.buttonDisabled]}
            onPress={onPrev}
            disabled={!canPrev}
          >
            <Text style={styles.iconText}>{"<<"}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onPlayPause}>
            <Text style={styles.iconText}>{isPlaying ? "Pause" : "Play"}</Text>
          </Pressable>
          <Pressable
            style={[styles.smallButton, !canNext && styles.buttonDisabled]}
            onPress={onNext}
            disabled={!canNext}
          >
            <Text style={styles.iconText}>{">>"}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={onPlayPause}>
            <Text style={styles.iconText}>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.xs,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  time: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  button: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    flex: 1,
  },
  smallButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radius.lg,
  },
  iconText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#9FB0C4",
  },
});
