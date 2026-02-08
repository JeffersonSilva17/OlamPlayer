import React, { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PlaylistsStackParamList } from "../navigation/types";
import { usePlaylistStore } from "../stores/playlistStore";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import type { MediaItem } from "../models/media";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/theme";

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

  const playAll = async () => {
    if (orderedItems.length === 0) return;
    navigation
      .getParent()
      ?.navigate(
        "Biblioteca" as never,
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
      <Text style={styles.title}>{playlistName}</Text>
      <Pressable style={styles.button} onPress={playAll}>
        <Text style={styles.buttonText}>Tocar playlist</Text>
      </Pressable>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "items" && styles.tabActive]}
          onPress={() => setActiveTab("items")}
        >
          <Text style={[styles.tabText, activeTab === "items" && styles.tabTextActive]}>
            Itens
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
                <Pressable
                  style={styles.orderButton}
                  onPress={() => moveItem(index, index - 1)}
                >
                  <Text style={styles.orderText}>Down</Text>
                </Pressable>
                <Pressable
                  style={styles.orderButton}
                  onPress={() => moveItem(index, index + 1)}
                >
                  <Text style={styles.orderText}>Down</Text>
                </Pressable>
                <Pressable onPress={() => removeFromPlaylist(playlistId, item.id)}>
                  <Text style={styles.remove}>Remover</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={libraryItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.displayName}</Text>
              <Pressable onPress={() => addToPlaylist(playlistId, item.id)}>
                <Text style={styles.add}>Adicionar</Text>
              </Pressable>
            </View>
          )}
        />
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
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  orderButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  orderText: {
    color: theme.colors.brand,
    fontWeight: "700",
  },
  remove: {
    color: theme.colors.danger,
  },
  add: {
    color: theme.colors.brand,
  },
});

