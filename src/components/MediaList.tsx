import React from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import type { MediaItem } from "../models/media";
import { MediaCard } from "./MediaCard";
import { theme } from "../theme/theme";

type Props = {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onRemove: (item: MediaItem) => void;
  onShare: (item: MediaItem) => void;
  onAddToPlaylist?: (item: MediaItem) => void;
  onReimport?: (item: MediaItem) => void;
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (item: MediaItem) => void;
  onLongPressSelect?: (item: MediaItem) => void;
  query?: string;
};

export function MediaList({
  items,
  onPlay,
  onRemove,
  onShare,
  onAddToPlaylist,
  onReimport,
  selectionMode = false,
  selectedIds = [],
  onToggleSelect,
  onLongPressSelect,
  query,
}: Props) {
  const selectedSet = new Set(selectedIds);
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <MediaCard
          item={item}
          onPlay={onPlay}
          onRemove={onRemove}
          onShare={onShare}
          onAddToPlaylist={onAddToPlaylist}
          onReimport={onReimport}
          selectionMode={selectionMode}
          isSelected={selectedSet.has(item.id)}
          onToggleSelect={onToggleSelect}
          onLongPressSelect={onLongPressSelect}
          query={query}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingBottom: 140,
  },
});
