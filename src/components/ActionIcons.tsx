import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

type IconProps = {
  size?: number;
  color?: string;
};

export function ShuffleIcon({ size = 20, color }: IconProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.bg;
  const lineHeight = Math.max(2, Math.round(size * 0.12));
  const lineWidthTop = Math.round(size * 0.68);
  const lineWidthBottom = Math.round(size * 0.68);
  const arrowSize = Math.max(8, Math.round(size * 0.3));
  return (
    <View style={[styles.shuffleWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.shuffleLine,
          {
            width: lineWidthTop,
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.08,
            top: size * 0.22,
          },
        ]}
      />
      <View
        style={[
          styles.shuffleLine,
          {
            width: lineWidthBottom,
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.24,
            top: size * 0.66,
          },
        ]}
      />
      <View
        style={[
          styles.shuffleArrow,
          {
            borderLeftColor: resolvedColor,
            borderLeftWidth: arrowSize,
            borderTopWidth: arrowSize * 0.45,
            borderBottomWidth: arrowSize * 0.45,
            left: size * 0.74,
            top: size * 0.16,
          },
        ]}
      />
      <View
        style={[
          styles.shuffleArrowLeft,
          {
            borderRightColor: resolvedColor,
            borderRightWidth: arrowSize,
            borderTopWidth: arrowSize * 0.45,
            borderBottomWidth: arrowSize * 0.45,
            left: size * 0.06,
            top: size * 0.58,
          },
        ]}
      />
      <View
        style={[
          styles.shuffleLine,
          {
            width: Math.round(size * 0.22),
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.42,
            top: size * 0.44,
            transform: [{ rotate: "35deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.shuffleLine,
          {
            width: Math.round(size * 0.22),
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.38,
            top: size * 0.44,
            transform: [{ rotate: "-35deg" }],
          },
        ]}
      />
    </View>
  );
}

export function RepeatIcon({ size = 40, color }: IconProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.bg;
  return (
    <View style={[styles.repeatWrap, { width: size, height: size }]}>
      <Text
        style={[styles.iconBold, { fontSize: size, lineHeight: size, color: resolvedColor }]}
      >
        {String.fromCharCode(0x27f3)}
      </Text>
      <Text
        style={[
          styles.iconBold,
          styles.repeatShadow,
          { fontSize: size, lineHeight: size, color: resolvedColor },
        ]}
      >
        {String.fromCharCode(0x27f3)}
      </Text>
    </View>
  );
}

export function RepeatOneIcon({ size = 20, color }: IconProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.bg;
  const badgeInset = Math.max(1, Math.round(size * 0.08));
  const badgeFont = Math.max(10, Math.round(size * 0.36));
  const lift = Math.max(2, Math.round(size * 0.18));
  return (
    <View style={[styles.repeatOneWrap, { width: size, height: size }]}>
      <Text
        style={[
          styles.iconBold,
          {
            fontSize: size,
            lineHeight: size,
            color: resolvedColor,
            transform: [{ translateY: -lift }],
          },
        ]}
      >
        {String.fromCharCode(0x27f3)}
      </Text>
      <Text
        style={[
          styles.iconBold,
          styles.repeatShadow,
          {
            fontSize: size,
            lineHeight: size,
            color: resolvedColor,
            transform: [{ translateY: -lift }],
          },
        ]}
      >
        {String.fromCharCode(0x27f3)}
      </Text>
      <Text
        style={[
          styles.repeatOneText,
          {
            color: resolvedColor,
            fontSize: badgeFont,
            right: badgeInset,
            bottom: badgeInset,
          },
        ]}
      >
        1
      </Text>
    </View>
  );
}

export function ShareIcon({ size = 20, color }: IconProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.bg;
  const dotSize = Math.max(5, Math.round(size * 0.28));
  const lineHeight = Math.max(2, Math.round(size * 0.12));
  const lineWidth = Math.round(size * 0.55);
  return (
    <View style={[styles.shareWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.shareDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: resolvedColor,
            left: size * 0.08,
            top: size * 0.46,
          },
        ]}
      />
      <View
        style={[
          styles.shareDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: resolvedColor,
            left: size * 0.72,
            top: size * 0.14,
          },
        ]}
      />
      <View
        style={[
          styles.shareDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: resolvedColor,
            left: size * 0.72,
            top: size * 0.74,
          },
        ]}
      />
      <View
        style={[
          styles.shareLine,
          {
            width: lineWidth,
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.22,
            top: size * 0.34,
            transform: [{ rotate: "-35deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.shareLine,
          {
            width: lineWidth,
            height: lineHeight,
            backgroundColor: resolvedColor,
            left: size * 0.22,
            top: size * 0.58,
            transform: [{ rotate: "35deg" }],
          },
        ]}
      />
    </View>
  );
}

export function TrashIcon({ size = 20, color }: IconProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.bg;
  const stroke = Math.max(2, Math.round(size * 0.12));
  const width = Math.round(size * 0.7);
  const height = Math.round(size * 0.65);
  const handleWidth = Math.round(size * 0.35);
  return (
    <View style={[styles.trashWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.trashHandle,
          {
            width: handleWidth,
            height: stroke,
            backgroundColor: resolvedColor,
          },
        ]}
      />
      <View
        style={[
          styles.trashBody,
          {
            width,
            height,
            borderWidth: stroke,
            borderColor: resolvedColor,
          },
        ]}
      >
        <View style={[styles.trashLine, { backgroundColor: resolvedColor }]} />
        <View style={[styles.trashLine, { backgroundColor: resolvedColor }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    icon: {
      fontFamily: theme.fonts.heading,
      fontWeight: "900",
      textAlign: "center",
    },
    iconBold: {
      fontFamily: theme.fonts.heading,
      fontWeight: "900",
      textAlign: "center",
      transform: [{ scaleX: 1.1 }, { scaleY: 1.05 }],
    },
    repeatOneWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    repeatWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    repeatShadow: {
      position: "absolute",
      left: 0.5,
      top: 0.5,
      opacity: 0.9,
    },
    repeatOneText: {
      position: "absolute",
      fontWeight: "900",
      textAlign: "center",
      zIndex: 2,
    },
    shareWrap: {
      position: "relative",
    },
    shareDot: {
      position: "absolute",
    },
    shareLine: {
      position: "absolute",
      borderRadius: 2,
    },
    trashWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    trashHandle: {
      borderRadius: 2,
      marginBottom: 2,
    },
    trashBody: {
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "space-evenly",
      paddingVertical: 2,
    },
    trashLine: {
      width: 3,
      height: "55%",
      borderRadius: 2,
    },
    shuffleWrap: {
      position: "relative",
    },
    shuffleLine: {
      position: "absolute",
      borderRadius: 3,
    },
    shuffleArrow: {
      position: "absolute",
      width: 0,
      height: 0,
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    shuffleArrowLeft: {
      position: "absolute",
      width: 0,
      height: 0,
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
  });
