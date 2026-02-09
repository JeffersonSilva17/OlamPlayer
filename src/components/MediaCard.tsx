import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { MediaItem } from "../models/media";
import { theme } from "../theme/theme";
import { icons } from "../theme/icons";
import { MiniEqualizer } from "./MiniEqualizer";
import { MarqueeText } from "./MarqueeText";

type Props = {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onRemove: (item: MediaItem) => void;
  onShare: (item: MediaItem) => void;
  onAddToPlaylist?: (item: MediaItem) => void;
  onReimport?: (item: MediaItem) => void;
  onToggleSelect?: (item: MediaItem) => void;
  onLongPressSelect?: (item: MediaItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  query?: string;
  isCurrent?: boolean;
  isPlaying?: boolean;
  isScrolling?: boolean;
  compact?: boolean;
};

export function MediaCard({
  item,
  onPlay,
  onRemove,
  onShare,
  onAddToPlaylist,
  onReimport,
  onToggleSelect,
  onLongPressSelect,
  selectionMode = false,
  isSelected = false,
  query,
  isCurrent = false,
  isPlaying = false,
  isScrolling = false,
  compact = false,
}: Props) {
  const highlightParts = buildHighlightParts(item.displayName, query);
  const titleParts = highlightParts.map((part, index) => (
    <Text
      key={`${item.id}-h-${index}`}
      style={part.highlight ? styles.titleHighlight : undefined}
    >
      {part.text}
    </Text>
  ));
  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.cardCompact,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => {
        if (selectionMode) {
          onToggleSelect?.(item);
          return;
        }
        onPlay(item);
      }}
      onLongPress={() => onLongPressSelect?.(item)}
    >
      <View style={styles.info}>
        <View style={styles.titleRow}>
          {isCurrent && isPlaying ? (
            <MiniEqualizer active />
          ) : (
            <View style={styles.trebleBadge}>
              <Text style={styles.trebleIcon}>{icons.treble}</Text>
            </View>
          )}
          <MarqueeText
            active
            text={item.displayName}
            textStyle={styles.title}
          >
            {titleParts}
          </MarqueeText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  cardCompact: {
    marginBottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surfaceAlt,
  },
  info: {
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trebleBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trebleIcon: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: theme.fonts.body,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  titleHighlight: {
    backgroundColor: theme.colors.highlight,
  },
});

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type HighlightPart = { text: string; highlight: boolean };

function buildHighlightParts(text: string, query?: string): HighlightPart[] {
  if (!query || !query.trim()) {
    return [{ text, highlight: false }];
  }
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) {
    return [{ text, highlight: false }];
  }

  let normalized = "";
  const indexMap: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const normalizedChar = normalizeSearchText(text[i]);
    if (!normalizedChar) continue;
    for (let j = 0; j < normalizedChar.length; j += 1) {
      normalized += normalizedChar[j];
      indexMap.push(i);
    }
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let idx = 0;
  while ((idx = normalized.indexOf(normalizedQuery, idx)) !== -1) {
    const start = indexMap[idx] ?? 0;
    const end = (indexMap[idx + normalizedQuery.length - 1] ?? start) + 1;
    ranges.push({ start, end });
    idx += normalizedQuery.length;
  }
  if (ranges.length === 0) {
    return [{ text, highlight: false }];
  }

  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start), highlight: false });
    }
    parts.push({ text: text.slice(range.start, range.end), highlight: true });
    cursor = range.end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }
  return parts;
}
