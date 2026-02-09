import React, { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  active?: boolean;
};

const BAR_COUNT = 5;
const BAR_HEIGHT = 18;

export function MiniEqualizer({ active = true }: Props) {
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3)),
    [],
  );

  useEffect(() => {
    if (!active) {
      bars.forEach((value) => value.setValue(0.3));
      return () => {};
    }
    const loops = bars.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1.2,
            duration: 220 + index * 60,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.2,
            duration: 260 + index * 70,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, bars]);

  return (
    <View style={styles.container}>
      {bars.map((value, index) => (
        <View key={`mini-${index}`} style={styles.barWrap}>
          <Animated.View
            style={[
              styles.bar,
              {
                transform: [{ scaleY: value }],
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 22,
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
    marginRight: 8,
  },
  barWrap: {
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: 3,
    height: BAR_HEIGHT,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
});
