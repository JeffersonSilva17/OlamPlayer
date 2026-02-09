import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PlaylistsStackParamList } from "../navigation/types";
import { usePlaylistStore } from "../stores/playlistStore";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import type { MediaItem } from "../models/media";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import { icons } from "../theme/icons";
import { ShuffleIcon } from "../components/ActionIcons";

type Props = NativeStackScreenProps<PlaylistsStackParamList, "PlaylistDetail">;
const mediaRepository = new MediaRepositorySqlite();

export function PlaylistDetailScreen({ route }: Props) {
  const navigation = useNavigation();
  const { playlistId, playlistName, mediaType } = route.params;
  const {
    items,
    loadPlaylistItems,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylistItems,
  } = usePlaylistStore();
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "add">("items");
  const [orderedItems, setOrderedItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPlaylistItems(playlistId);
  }, [loadPlaylistItems, playlistId]);

  useEffect(() => {
    mediaRepository
      .listMedia({ mediaType, sort: "name", order: "asc" })
      .then(setLibraryItems);
  }, [mediaType]);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const filteredLibraryItems = useMemo(() => {
    if (!searchQuery.trim()) return libraryItems;
    const normalizedQuery = normalizeSearchText(searchQuery);
    return libraryItems.filter((item) =>
      normalizeSearchText(item.displayName).includes(normalizedQuery),
    );
  }, [libraryItems, searchQuery]);

  const playAll = async () => {
    if (orderedItems.length === 0) return;
    navigation
      .getParent()
      ?.navigate(
        (mediaType === "video" ? "Video" : "Audio") as never,
        {
          screen: "Player",
          params: {
            item: orderedItems[0],
            queue: orderedItems,
            queueLabel: playlistName,
          },
        } as never,
      );
  };

  const moveItem = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedItems.length) return;
    const next = [...orderedItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedItems(next);
    await reorderPlaylistItems(
      playlistId,
      next.map((entry) => entry.id),
    );
  };

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <Text style={styles.title}>{playlistName}</Text>
      <View style={styles.playRow}>
        <Pressable style={styles.iconButton} onPress={playAll}>
          <Text style={styles.iconText}>{icons.play}</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            if (orderedItems.length === 0) return;
            const shuffled = [...orderedItems].sort(() => Math.random() - 0.5);
            navigation
              .getParent()
              ?.navigate(
                (mediaType === "video" ? "Video" : "Audio") as never,
                {
                  screen: "Player",
                  params: {
                    item: shuffled[0],
                    queue: shuffled,
                    queueLabel: `${playlistName} (Aleatorio)`,
                  },
                } as never,
              );
          }}
        >
          <ShuffleIcon color={theme.colors.bg} size={20} />
        </Pressable>
      </View>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "items" && styles.tabActive]}
          onPress={() => setActiveTab("items")}
        >
          <Text style={[styles.tabText, activeTab === "items" && styles.tabTextActive]}>
            Faixas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "add" && styles.tabActive]}
          onPress={() => setActiveTab("add")}
        >
          <Text style={[styles.tabText, activeTab === "add" && styles.tabTextActive]}>
            Adicionar
          </Text>
        </Pressable>
      </View>
      {activeTab === "items" ? (
        <FlatList
          data={orderedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.displayName}</Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => removeFromPlaylist(playlistId, item.id)}>
                  <Text style={styles.remove}>Remover</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.addContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>{icons.search}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome"
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredLibraryItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.itemName}>{item.displayName}</Text>
                {(() => {
                  const isAdded = items.some((entry) => entry.id === item.id);
                  return (
                    <Pressable
                      style={[styles.addButton, isAdded && styles.addButtonActive]}
                      onPress={() => {
                        if (!isAdded) addToPlaylist(playlistId, item.id);
                      }}
                      disabled={isAdded}
                    >
                      <Text style={[styles.addText, isAdded && styles.addTextActive]}>
                        {isAdded ? "Adicionado" : "Adicionar"}
                      </Text>
                    </Pressable>
                  );
                })()}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  tabs: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  tabText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
  },
  tabTextActive: {
    color: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemName: {
    flex: 1,
    marginRight: 8,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  remove: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  addButtonActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  addText: {
    color: theme.colors.brand,
    fontFamily: theme.fonts.body,
  },
  addTextActive: {
    color: theme.colors.surface,
    fontWeight: "700",
  },
  playRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconButton: {
    backgroundColor: theme.colors.brand,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: theme.fonts.heading,
  },
  addContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginRight: theme.spacing.xs,
    fontFamily: theme.fonts.body,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
});

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

