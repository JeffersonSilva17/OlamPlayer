import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "../navigation/types";
import type { MediaItem, MediaType } from "../models/media";
import { useMediaStore } from "../stores/mediaStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { reactNativeShareAdapter } from "../infra/share/ReactNativeShareAdapter";
import { MediaList } from "../components/MediaList";
import { theme } from "../theme/theme";

type Navigation = NativeStackNavigationProp<LibraryStackParamList, "Library">;

export function LibraryScreen() {
  const navigation = useNavigation<Navigation>();
  const [activeTab, setActiveTab] = useState<MediaType>("audio");
  const {
    items,
    loadMedia,
    query,
    setQuery,
    removeMedia,
    sort,
    setSort,
    reimportMedia,
  } = useMediaStore();
  const {
    playlists,
    loadPlaylists,
    addToPlaylist,
    addItemsToPlaylist,
    createPlaylistWithItems,
  } = usePlaylistStore();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistModalMode, setPlaylistModalMode] = useState<"single" | "multi">(
    "single",
  );

  useFocusEffect(
    useCallback(() => {
      loadMedia(activeTab);
      loadPlaylists();
    }, [activeTab, loadMedia, loadPlaylists]),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMedia(activeTab);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, activeTab, loadMedia, sort]);

  const onPlay = (item: MediaItem) =>
    navigation.navigate("Player", { item, queue: [item], queueLabel: item.displayName });
  const onRemove = (item: MediaItem) => removeMedia(item.id, item.mediaType);
  const onShare = async (item: MediaItem) => {
    try {
      await reactNativeShareAdapter.shareFile({
        uri: item.uri,
        mimeType: item.mimeType,
        title: item.displayName,
      });
    } catch (error) {
      console.warn("Falha ao compartilhar", error);
    }
  };
  const onReimport = (item: MediaItem) => {
    reimportMedia(item);
  };
  const openPlaylistPicker = (item: MediaItem) => {
    setSelectedItem(item);
    setPlaylistModalMode("single");
    setShowPlaylistModal(true);
  };
  const toggleSelection = (item: MediaItem) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) {
        const next = prev.filter((id) => id !== item.id);
        if (next.length === 0) {
          setSelectionMode(false);
        }
        return next;
      }
      return [...prev, item.id];
    });
  };
  const startSelection = (item: MediaItem) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
  };
  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };
  const selectedItems = useMemo(() => {
    const list = items[activeTab];
    return list.filter((entry) => selectedIds.includes(entry.id));
  }, [items, activeTab, selectedIds]);

  useEffect(() => {
    if (selectionMode) {
      setSelectedIds([]);
      setSelectionMode(false);
    }
  }, [activeTab]);
  const filteredPlaylists = useMemo(() => {
    if (playlistModalMode === "multi") {
      return playlists.filter((p) => p.mediaType === activeTab);
    }
    if (!selectedItem) return [];
    return playlists.filter((p) => p.mediaType === selectedItem.mediaType);
  }, [playlists, selectedItem, playlistModalMode, activeTab]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biblioteca</Text>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "audio" && styles.tabActive]}
          onPress={() => setActiveTab("audio")}
        >
          <Text style={[styles.tabText, activeTab === "audio" && styles.tabTextActive]}>
            Audios
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "video" && styles.tabActive]}
          onPress={() => setActiveTab("video")}
        >
          <Text style={[styles.tabText, activeTab === "video" && styles.tabTextActive]}>
            Videos
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Buscar por nome"
        placeholderTextColor={theme.colors.textMuted}
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.sortRow}>
        <Pressable
          style={[styles.sortButton, sort === "name" && styles.sortButtonActive]}
          onPress={() => setSort("name")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sort === "name" && styles.sortButtonTextActive,
            ]}
          >
            Nome
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sortButton, sort === "dateAdded" && styles.sortButtonActive]}
          onPress={() => setSort("dateAdded")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sort === "dateAdded" && styles.sortButtonTextActive,
            ]}
          >
            Recentes
          </Text>
        </Pressable>
      </View>
      {selectionMode ? (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.length} selecionadas</Text>
          <View style={styles.selectionActions}>
            <Pressable
              style={styles.selectionButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.selectionButtonText}>Criar playlist</Text>
            </Pressable>
            <Pressable
              style={styles.selectionButton}
              onPress={() => {
                setPlaylistModalMode("multi");
                setShowPlaylistModal(true);
              }}
            >
              <Text style={styles.selectionButtonText}>Adicionar a playlist</Text>
            </Pressable>
            <Pressable
              style={styles.selectionButton}
              onPress={() => {
                if (selectedItems.length === 0) return;
                navigation.navigate("Player", {
                  item: selectedItems[0],
                  queue: selectedItems,
                  queueLabel: "Selecionadas",
                });
                clearSelection();
              }}
            >
              <Text style={styles.selectionButtonText}>Reproduzir</Text>
            </Pressable>
            <Pressable style={styles.selectionCancel} onPress={clearSelection}>
              <Text style={styles.selectionCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <MediaList
        items={items[activeTab]}
        onPlay={onPlay}
        onRemove={onRemove}
        onShare={onShare}
        onAddToPlaylist={openPlaylistPicker}
        onReimport={onReimport}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelection}
        onLongPressSelect={startSelection}
        query={query}
      />
      <Modal visible={showPlaylistModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar a playlist</Text>
            {selectedItem ? (
              <Text style={styles.modalSubtitle}>{selectedItem.displayName}</Text>
            ) : null}
            {filteredPlaylists.length === 0 ? (
              <Text style={styles.modalEmpty}>
                Nenhuma playlist deste tipo. Crie em Playlists.
              </Text>
            ) : (
              <FlatList
                data={filteredPlaylists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalRow}
                    onPress={() => {
                      if (playlistModalMode === "single") {
                        if (!selectedItem) return;
                        addToPlaylist(item.id, selectedItem.id);
                      } else {
                        if (selectedIds.length === 0) return;
                        addItemsToPlaylist(item.id, selectedIds);
                        clearSelection();
                      }
                      setShowPlaylistModal(false);
                      setSelectedItem(null);
                    }}
                  >
                    <Text style={styles.modalRowText}>{item.name}</Text>
                    <Text style={styles.modalRowAction}>Adicionar</Text>
                  </Pressable>
                )}
              />
            )}
            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setShowPlaylistModal(false);
                setSelectedItem(null);
              }}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Criar playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da playlist"
              placeholderTextColor={theme.colors.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <Pressable
              style={styles.modalClose}
              onPress={async () => {
                if (!newPlaylistName.trim() || selectedIds.length === 0) return;
                await createPlaylistWithItems(
                  newPlaylistName.trim(),
                  activeTab,
                  selectedIds,
                );
                setNewPlaylistName("");
                setShowCreateModal(false);
                clearSelection();
              }}
            >
              <Text style={styles.modalCloseText}>Criar</Text>
            </Pressable>
            <Pressable
              style={styles.modalCancel}
              onPress={() => {
                setShowCreateModal(false);
                setNewPlaylistName("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  sortRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surface,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.brand,
  },
  sortButtonText: {
    color: theme.colors.brand,
    fontWeight: "600",
  },
  sortButtonTextActive: {
    color: theme.colors.surface,
  },
  selectionBar: {
    borderWidth: 1,
    borderColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: theme.colors.surfaceAlt,
    marginBottom: theme.spacing.sm,
  },
  selectionText: {
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  selectionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  selectionButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
  },
  selectionButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
  },
  selectionCancel: {
    borderWidth: 1,
    borderColor: theme.colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  selectionCancelText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  modalEmpty: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  modalRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalRowText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  modalRowAction: {
    color: theme.colors.brand,
    fontWeight: "600",
  },
  modalClose: {
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
  },
  modalCloseText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  modalCancelText: {
    color: theme.colors.brand,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
});
