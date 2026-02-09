import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "../navigation/types";
import type { MediaItem, MediaType } from "../models/media";
import { useMediaStore } from "../stores/mediaStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { useSettingsStore } from "../stores/settingsStore";
import { reactNativeShareAdapter } from "../infra/share/ReactNativeShareAdapter";
import { MediaList } from "../components/MediaList";
import { theme } from "../theme/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import { icons } from "../theme/icons";
import { usePlayerStore } from "../stores/playerStore";
import { playQueue } from "../infra/player/playbackQueue";
import { DurationProbe } from "../components/DurationProbe";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import { updateMediaDuration } from "../domain/playerUseCases";
import { StackedNoteIcon } from "../components/StackedNoteIcon";
import { ShareIcon } from "../components/ActionIcons";

type Navigation = NativeStackNavigationProp<LibraryStackParamList, "Library">;
type Props = NativeStackScreenProps<LibraryStackParamList, "Library">;

export function LibraryScreen({ route }: Props) {
  const navigation = useNavigation<Navigation>();
  const isFocused = useIsFocused();
  const forcedType = route.params?.mediaType;
  const hideTabs = route.params?.hideTabs;
  const showAddButton = route.params?.showAddButton;
  const [activeTab, setActiveTab] = useState<MediaType>(forcedType ?? "audio");
  const {
    items,
    loadMedia,
    query,
    setQuery,
    removeMedia,
    sort,
    order,
    setSort,
    reimportMedia,
    addFiles,
    addFolder,
    indexing,
    indexStatus,
  } = useMediaStore();
  const {
    playlists,
    loadPlaylists,
    addToPlaylist,
    addItemsToPlaylist,
    createPlaylistWithItems,
    createPlaylist,
  } = usePlaylistStore();
  const {
    autoPlayEnabled,
    loadAutoPlaySettings,
    setAutoPlayEnabled,
    autoPlayMinMs,
    autoPlayMaxMs,
  } = useSettingsStore();
  const { state: playerState, setQueue, setCurrent } = usePlayerStore();
  const playingUri =
    playerState.mediaType === "audio" || playerState.mediaType === "video"
      ? playerState.currentUri
      : undefined;
  const durationRepoRef = React.useRef<MediaRepositorySqlite | null>(null);
  if (!durationRepoRef.current) {
    durationRepoRef.current = new MediaRepositorySqlite();
  }
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistModalMode, setPlaylistModalMode] = useState<"single" | "multi">(
    "single",
  );
  const [createMode, setCreateMode] = useState<"single" | "multi">("multi");
  const [showAddModal, setShowAddModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMedia(activeTab);
      loadPlaylists();
    }, [activeTab, loadMedia, loadPlaylists]),
  );

  useEffect(() => {
    if (forcedType) {
      setActiveTab(forcedType);
    }
  }, [forcedType]);

  useEffect(() => {
    loadAutoPlaySettings();
  }, [loadAutoPlaySettings]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMedia(activeTab);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, activeTab, loadMedia, sort, order]);

  const matchesAutoPlayRule = useCallback(
    (item: MediaItem): boolean => {
      const duration = item.durationMs ?? 0;
      if (duration === 0) {
        return autoPlayMinMs === 0;
      }
      return duration >= autoPlayMinMs && duration <= autoPlayMaxMs;
    },
    [autoPlayMinMs, autoPlayMaxMs],
  );

  const maybeAutoPlay = useCallback(async () => {
    if (activeTab !== "audio") return;
    if (!autoPlayEnabled) return;
    if (playerState.isPlaying) return;
    const list = items[activeTab];
    if (!list || list.length === 0) return;
    const candidate = list.find(matchesAutoPlayRule);
    if (!candidate) return;
    setCurrent(candidate);
    setQueue([candidate], "Reprodução automática");
    await playQueue([candidate], "Reprodução automática");
  }, [
    activeTab,
    autoPlayEnabled,
    playerState.isPlaying,
    items,
    matchesAutoPlayRule,
    setCurrent,
    setQueue,
  ]);

  const itemsToProbe = useMemo(() => {
    if (activeTab !== "audio") return [];
    if (!autoPlayEnabled) return [];
    if (playerState.isPlaying) return [];
    return items[activeTab]
      .filter((entry) => entry.mediaType === "audio" && (!entry.durationMs || entry.durationMs <= 0))
      .slice(0, 6);
  }, [items, activeTab, autoPlayEnabled, playerState.isPlaying]);

  useFocusEffect(
    useCallback(() => {
      maybeAutoPlay();
    }, [maybeAutoPlay]),
  );

  useEffect(() => {
    if (!isFocused) return;
    maybeAutoPlay();
  }, [isFocused, autoPlayEnabled, autoPlayMinMs, autoPlayMaxMs, items, maybeAutoPlay]);

  const onPlay = (item: MediaItem) =>
    navigation.navigate("Player", { item, queue: [item], queueLabel: item.displayName });
  const onPlayAll = () => {
    const list = items[activeTab];
    if (!list || list.length === 0) return;
    navigation.navigate("Player", {
      item: list[0],
      queue: list,
      queueLabel: "Audios",
    });
  };
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

  const openPlaylistPickerForSelection = () => {
    if (selectedItems.length === 0) return;
    if (selectedItems.length === 1) {
      setSelectedItem(selectedItems[0]);
      setPlaylistModalMode("single");
    } else {
      setSelectedItem(null);
      setPlaylistModalMode("multi");
    }
    setShowPlaylistModal(true);
  };

  const playSelection = () => {
    if (selectedItems.length === 0) return;
    navigation.navigate("Player", {
      item: selectedItems[0],
      queue: selectedItems,
      queueLabel: "Selecionadas",
    });
    clearSelection();
  };

  const shareSelection = async () => {
    if (selectedItems.length === 0) return;
    if (selectedItems.length > 1) {
      Alert.alert("Compartilhar", "Selecione apenas 1 faixa para compartilhar.");
      return;
    }
    const item = selectedItems[0];
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

  const deleteSelection = () => {
    if (selectedItems.length === 0) return;
    selectedItems.forEach((entry) => removeMedia(entry.id, entry.mediaType));
    clearSelection();
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

  const createTargets =
    createMode === "single" && selectedItem ? [selectedItem.id] : selectedIds;
  const createMediaType =
    createMode === "single" && selectedItem ? selectedItem.mediaType : activeTab;

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      {!hideTabs ? (
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
      ) : null}
      {activeTab === "audio" ? (
        <View style={styles.autoPlayRow}>
          <Text style={styles.autoPlayLabel}>Reprodução automática</Text>
          <Pressable
            style={styles.autoPlayHint}
            onPress={() =>
              Alert.alert(
                "Reprodução automática",
                "O limite de tempo pode ser ajustado em Configurações. Se a duração não estiver disponível, o arquivo pode ser incluído.",
              )
            }
          >
            <Text style={styles.autoPlayHintText}>?</Text>
          </Pressable>
          <Switch
            value={autoPlayEnabled}
            onValueChange={(value) => setAutoPlayEnabled(value)}
            thumbColor={autoPlayEnabled ? theme.colors.accent : theme.colors.border}
            trackColor={{
              true: theme.colors.brand,
              false: theme.colors.border,
            }}
          />
        </View>
      ) : null}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>{icons.search}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {showAddButton ? (
          <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sortRow}>
        <Pressable
          style={[styles.sortButton, sort === "name" && styles.sortButtonActive]}
          onPress={() => {
            if (sort !== "name") {
              setSort("name", "asc");
              return;
            }
            const nextOrder = order === "asc" ? "desc" : "asc";
            setSort("name", nextOrder);
          }}
        >
          <Text
            style={[
              styles.sortButtonText,
              sort === "name" && styles.sortButtonTextActive,
            ]}
          >
            Nome {sort === "name" && order === "desc" ? "Z-A" : "A-Z"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sortButton, sort === "dateAdded" && styles.sortButtonActive]}
          onPress={() => setSort("dateAdded", "desc")}
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
        {activeTab === "audio" ? (
          <Pressable style={styles.sortButton} onPress={onPlayAll}>
            <Text style={styles.sortButtonText}>Tocar tudo</Text>
          </Pressable>
        ) : null}
      </View>
      {selectionMode ? (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedIds.length} selecionada{selectedIds.length === 1 ? "" : "(s)"}
          </Text>
          <View style={styles.selectionActions}>
            <Pressable style={styles.selectionIconButton} onPress={playSelection}>
              <Text style={styles.selectionIcon}>{icons.play}</Text>
            </Pressable>
            <Pressable style={styles.selectionIconButton} onPress={shareSelection}>
              <ShareIcon color={theme.colors.bg} size={16} />
            </Pressable>
            <Pressable style={styles.selectionIconButton} onPress={openPlaylistPickerForSelection}>
              <View style={styles.selectionPlaylist}>
                <StackedNoteIcon color={theme.colors.bg} size={10} />
                <Text style={styles.selectionPlus}>+</Text>
              </View>
            </Pressable>
            <Pressable style={styles.selectionIconDanger} onPress={deleteSelection}>
              <Text style={styles.selectionIcon}>{icons.trash}</Text>
            </Pressable>
            <Pressable style={styles.selectionIconOutline} onPress={clearSelection}>
              <Text style={styles.selectionIconDark}>X</Text>
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
        playingUri={playingUri}
        isPlaying={playerState.isPlaying}
        compact={activeTab === "audio"}
      />
      <DurationProbe
        items={itemsToProbe}
        enabled={itemsToProbe.length > 0}
        onDuration={(item, durationMs) => {
          if (!durationRepoRef.current) return;
          updateMediaDuration(durationRepoRef.current, item.id, durationMs).catch(() => {});
        }}
        onDone={() => {
          loadMedia("audio");
        }}
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
              style={styles.modalCreate}
              onPress={() => {
                setCreateMode(playlistModalMode);
                setShowPlaylistModal(false);
                setShowCreateModal(true);
              }}
            >
              <Text style={styles.modalCreateText}>Criar nova playlist</Text>
            </Pressable>
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
                const trimmed = newPlaylistName.trim();
                if (!trimmed) {
                  Alert.alert("Nome da playlist", "Digite um nome para criar a playlist.");
                  return;
                }
                if (createTargets.length === 0) {
                  await createPlaylist(trimmed, createMediaType);
                } else {
                  await createPlaylistWithItems(trimmed, createMediaType, createTargets);
                }
                setNewPlaylistName("");
                setShowCreateModal(false);
                clearSelection();
                setSelectedItem(null);
              }}
            >
              <Text style={styles.modalCloseText}>Criar</Text>
            </Pressable>
            <Pressable
              style={styles.modalCancel}
              onPress={() => {
                setShowCreateModal(false);
                setNewPlaylistName("");
                setCreateMode("multi");
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar midia</Text>
            <Pressable
              style={styles.modalClose}
              onPress={async () => {
                const added = await addFiles(["audio", "video"]);
                if (added > 0) {
                  setShowAddModal(false);
                }
              }}
            >
              <Text style={styles.modalCloseText}>Adicionar arquivos</Text>
            </Pressable>
            {Platform.OS === "android" ? (
              <Pressable
                style={styles.modalCreate}
                onPress={async () => {
                  await addFolder();
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.modalCreateText}>Adicionar pasta</Text>
              </Pressable>
            ) : null}
            {indexing ? (
              <Text style={styles.statusText}>Indexando pasta...</Text>
            ) : null}
            {indexStatus ? (
              <Text style={styles.statusText}>
                Encontrados: {indexStatus.filesFound} - Adicionados:{" "}
                {indexStatus.filesAdded}
                {indexStatus.filesSkipped ? ` - Ignorados: ${indexStatus.filesSkipped}` : ""}
              </Text>
            ) : null}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Fechar</Text>
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
    fontFamily: theme.fonts.body,
  },
  tabTextActive: {
    color: theme.colors.surface,
  },
  searchHeader: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  autoPlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  autoPlayLabel: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontWeight: "600",
  },
  autoPlayHint: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  autoPlayHintText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontFamily: theme.fonts.body,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
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
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  addButtonText: {
    color: theme.colors.surface,
    fontWeight: "700",
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.body,
  },
  selectionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  selectionIconButton: {
    backgroundColor: theme.colors.brand,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionIconDanger: {
    backgroundColor: theme.colors.danger,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionIconOutline: {
    borderWidth: 1,
    borderColor: theme.colors.brand,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  selectionIcon: {
    color: theme.colors.bg,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: theme.fonts.heading,
  },
  selectionIconDark: {
    color: theme.colors.brand,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: theme.fonts.heading,
  },
  selectionPlaylist: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  selectionPlus: {
    color: theme.colors.bg,
    fontWeight: "800",
    fontSize: 12,
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.heading,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.body,
  },
  modalEmpty: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.body,
  },
  modalRowAction: {
    color: theme.colors.brand,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.body,
  },
  modalCreate: {
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  modalCreateText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontFamily: theme.fonts.body,
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
    fontFamily: theme.fonts.body,
  },
  statusText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
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


