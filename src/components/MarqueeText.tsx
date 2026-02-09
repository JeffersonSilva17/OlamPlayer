import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  active?: boolean;
  text?: string;
  children: React.ReactNode;
  textStyle?: any;
  containerStyle?: any;
};

export function MarqueeText({
  active = true,
  text = "",
  children,
  textStyle,
  containerStyle,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const fontSize = useMemo(() => {
    const flattened = StyleSheet.flatten(textStyle) || {};
    return typeof flattened.fontSize === "number" ? flattened.fontSize : 15;
  }, [textStyle]);
  const estimatedWidth = useMemo(() => {
    if (!text) return 0;
    return text.length * fontSize * 0.7 + 12;
  }, [text, fontSize]);
  const lengthThreshold = 20;
  const shouldScroll = useMemo(() => {
    if (!active || !text) return false;
    if (text.length <= lengthThreshold) return false;
    return true;
  }, [active, text]);

  useEffect(() => {
    if (!shouldScroll) {
      translateX.stopAnimation();
      translateX.setValue(0);
      return;
    }
    const distance =
      estimatedWidth > containerWidth
        ? estimatedWidth - containerWidth + 12
        : Math.max(24, estimatedWidth * 0.35);
    const duration = Math.max(3200, distance * 24);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(translateX, {
          toValue: -distance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shouldScroll, containerWidth, estimatedWidth, translateX]);

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.animatedRow,
          {
            transform: [{ translateX }],
            width: estimatedWidth || undefined,
          },
        ]}
      >
        <Text
          style={[styles.text, textStyle]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {children}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flex: 1,
  },
  animatedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    alignSelf: "flex-start",
  },
});
