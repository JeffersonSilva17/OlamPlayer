import React, { useMemo, useState } from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import type { MediaItem } from "../models/media";
import { MediaCard } from "./MediaCard";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

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
  playingUri?: string;
  isPlaying?: boolean;
  compact?: boolean;
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
  playingUri,
  isPlaying = false,
  compact = false,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const selectedSet = new Set(selectedIds);
  const [isScrolling, setIsScrolling] = useState(false);
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
      onScrollBeginDrag={() => setIsScrolling(true)}
      onScrollEndDrag={() => setIsScrolling(false)}
      onMomentumScrollBegin={() => setIsScrolling(true)}
      onMomentumScrollEnd={() => setIsScrolling(false)}
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
          isCurrent={playingUri ? item.uri === playingUri : false}
          isPlaying={isPlaying}
          isScrolling={isScrolling}
          compact={compact}
        />
      )}
    />
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    empty: {
      padding: 24,
      alignItems: "center",
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.body,
    },
    listContent: {
      paddingBottom: 140,
    },
  });
