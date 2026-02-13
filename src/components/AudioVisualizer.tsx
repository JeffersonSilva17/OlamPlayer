import React, { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

type Props = {
  active?: boolean;
};

const BAR_COUNT = 40;
const FLOAT_COUNT = 8;
const BAR_HEIGHT = 64;

export function AudioVisualizer({ active = true }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const barProfiles = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => {
        const seed = (Math.sin(index * 0.78) + 1) / 2;
        const alt = (Math.cos(index * 0.33) + 1) / 2;
        const spike = index % 7 === 0 ? 0.45 : 0;
        const max = Math.min(1.6, 0.55 + seed * 0.9 + spike);
        const min = Math.min(0.45, 0.08 + alt * 0.2);
        return {
          min,
          max,
          up: 180 + Math.round(alt * 180) + (index % 5) * 26,
          down: 220 + Math.round(seed * 220) + (index % 4) * 24,
          delay: (index % 6) * 24,
        };
      }),
    [],
  );
  const bars = useMemo(
    () => barProfiles.map((profile) => new Animated.Value(profile.min)),
    [barProfiles],
  );
  const floats = useMemo(
    () => Array.from({ length: FLOAT_COUNT }, () => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    if (!active) {
      bars.forEach((value, index) => value.setValue(barProfiles[index].min));
      floats.forEach((value) => value.setValue(0));
      return () => {};
    }

    const barLoops = bars.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(barProfiles[index].delay),
          Animated.timing(value, {
            toValue: barProfiles[index].max,
            duration: barProfiles[index].up,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: barProfiles[index].min,
            duration: barProfiles[index].down,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    const floatLoops = floats.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2400 + index * 180,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2400 + index * 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    barLoops.forEach((loop) => loop.start());
    floatLoops.forEach((loop) => loop.start());

    return () => {
      barLoops.forEach((loop) => loop.stop());
      floatLoops.forEach((loop) => loop.stop());
    };
  }, [active, bars, floats]);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <View style={styles.glowInner} />
      <View style={styles.waveRow}>
        {bars.map((value, index) => {
          const profile = barProfiles[index];
          const translateY = value.interpolate({
            inputRange: [profile.min, profile.max],
            outputRange: [
              ((1 - profile.min) * BAR_HEIGHT) / 2,
              ((1 - profile.max) * BAR_HEIGHT) / 2,
            ],
          });
          return (
          <View style={styles.barWrap} key={`bar-${index}`}>
            <Animated.View
              style={[
                styles.bar,
                {
                  transform: [{ translateY }, { scaleY: value }],
                },
              ]}
            />
          </View>
        )})}
      </View>
      <View style={styles.baseLine} />
      {floats.map((value, index) => {
        const translateY = value.interpolate({
          inputRange: [0, 1],
          outputRange: [10, -16],
        });
        const opacity = value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 0.75],
        });
        const scale = value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.05],
        });
        const left = 8 + (index * 11) % 80;
        const top = 10 + (index % 4) * 22;
        return (
          <Animated.View
            key={`float-${index}`}
            style={[
              styles.float,
              {
                left: `${left}%`,
                top: top,
                opacity,
                transform: [{ translateY }, { scale }, { rotate: "45deg" }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
      borderRadius: theme.radius.xl,
      overflow: "hidden",
    },
    glow: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.colors.brandDark,
      opacity: 0.35,
    },
    glowInner: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.surfaceAlt,
      opacity: 0.6,
    },
    waveRow: {
      position: "absolute",
      height: 70,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 3,
      bottom: 4,
    },
    barWrap: {
      height: BAR_HEIGHT,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    bar: {
      width: 4,
      height: BAR_HEIGHT,
      borderRadius: 2,
      backgroundColor: theme.colors.accent,
      opacity: 0.9,
    },
    baseLine: {
      position: "absolute",
      left: 28,
      right: 28,
      height: 2,
      borderRadius: 2,
      backgroundColor: theme.colors.accent,
      opacity: 0.2,
      bottom: 4,
    },
    float: {
      position: "absolute",
      width: 12,
      height: 12,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accent,
      opacity: 0.18,
    },
  });
