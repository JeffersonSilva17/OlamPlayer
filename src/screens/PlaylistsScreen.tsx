import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PlaylistsStackParamList } from "../navigation/types";
import { usePlaylistStore } from "../stores/playlistStore";
import type { MediaType } from "../models/media";
import { PlaylistRepositorySqlite } from "../data/repositories/PlaylistRepositorySqlite";
import { theme } from "../theme/theme";

type Navigation = NativeStackNavigationProp<PlaylistsStackParamList, "Playlists">;

const repository = new PlaylistRepositorySqlite();

export function PlaylistsScreen() {
  const navigation = useNavigation<Navigation>();
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const [name, setName] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("audio");

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playlists</Text>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mediaType === "audio" && styles.tabActive]}
          onPress={() => setMediaType("audio")}
        >
          <Text style={[styles.tabText, mediaType === "audio" && styles.tabTextActive]}>
            Audio
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mediaType === "video" && styles.tabActive]}
          onPress={() => setMediaType("video")}
        >
          <Text style={[styles.tabText, mediaType === "video" && styles.tabTextActive]}>
            Video
          </Text>
        </Pressable>
      </View>
      <View style={styles.inline}>
        <TextInput
          style={styles.input}
          placeholder="Nome da playlist"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <Pressable
          style={styles.smallButton}
          onPress={() => {
            if (!name.trim()) return;
            createPlaylist(name, mediaType);
            setName("");
          }}
        >
          <Text style={styles.smallButtonText}>Criar</Text>
        </Pressable>
      </View>
      <FlatList
        data={playlists.filter((p) => p.mediaType === mediaType)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              onPress={() =>
                navigation.navigate("PlaylistDetail", {
                  playlistId: item.id,
                  playlistName: item.name,
                  mediaType: item.mediaType,
                })
              }
            >
              <Text style={styles.playlistName}>{item.name}</Text>
            </Pressable>
            <View style={styles.actions}>
                <Pressable
                  onPress={async () => {
                    const items = await repository.listPlaylistItems(item.id);
                    if (items.length === 0) return;
                    (navigation as any).navigate("Biblioteca", {
                      screen: "Player",
                      params: { item: items[0], queue: items, queueLabel: item.name },
                    });
                  }}
                >
                <Text style={styles.play}>Reproduzir</Text>
              </Pressable>
              <Pressable onPress={() => deletePlaylist(item.id)}>
                <Text style={styles.remove}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
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
  inline: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  smallButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  smallButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playlistName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  play: {
    color: theme.colors.brand,
    fontWeight: "600",
  },
  remove: {
    color: theme.colors.danger,
  },
});
