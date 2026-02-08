import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { MediaItem } from "../models/media";
import { theme } from "../theme/theme";

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
}: Props) {
  const highlightParts = buildHighlightParts(item.displayName, query);
  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => {
        if (selectionMode) {
          onToggleSelect?.(item);
        }
      }}
      onLongPress={() => onLongPressSelect?.(item)}
    >
      <View style={styles.info}>
        <Text style={styles.title}>
          {highlightParts.map((part, index) => (
            <Text
              key={`${item.id}-h-${index}`}
              style={part.highlight ? styles.titleHighlight : undefined}
            >
              {part.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.subtitle}>
          {item.mediaType.toUpperCase()} - {item.isAvailable ? "Disponivel" : "Indisponivel"}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.buttonPrimary} onPress={() => onPlay(item)}>
          <Text style={styles.buttonText}>Tocar</Text>
        </Pressable>
        <Pressable style={styles.buttonAccent} onPress={() => onShare(item)}>
          <Text style={styles.buttonText}>Compartilhar</Text>
        </Pressable>
        {onAddToPlaylist ? (
          <Pressable style={styles.buttonOutline} onPress={() => onAddToPlaylist(item)}>
            <Text style={styles.buttonTextOutline}>Playlist</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.buttonDanger} onPress={() => onRemove(item)}>
          <Text style={styles.buttonText}>Remover</Text>
        </Pressable>
        {!item.isAvailable && onReimport ? (
          <Pressable style={styles.buttonOutline} onPress={() => onReimport(item)}>
            <Text style={styles.buttonTextOutline}>Reimportar</Text>
          </Pressable>
        ) : null}
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
  cardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surfaceAlt,
  },
  info: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  buttonPrimary: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  buttonAccent: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },
  buttonOutline: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surface,
  },
  buttonDanger: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 11,
  },
  buttonTextOutline: {
    color: theme.colors.brand,
    fontSize: 11,
    fontWeight: "600",
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
