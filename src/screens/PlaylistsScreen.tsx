import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PlaylistsStackParamList } from "../navigation/types";
import { usePlaylistStore } from "../stores/playlistStore";
import type { MediaType } from "../models/media";
import { PlaylistRepositorySqlite } from "../data/repositories/PlaylistRepositorySqlite";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import { icons } from "../theme/icons";
import { ShuffleIcon } from "../components/ActionIcons";
import { AudioTabIcon, PlaylistTabIcon, VideoTabIcon } from "../components/TabIcons";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

type Navigation = NativeStackNavigationProp<PlaylistsStackParamList, "Playlists">;

const repository = new PlaylistRepositorySqlite();

export function PlaylistsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<Navigation>();
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const [name, setName] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("audio");

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const playPlaylist = async (playlistId: string, playlistName: string, shuffle = false) => {
    const items = await repository.listPlaylistItems(playlistId);
    if (items.length === 0) return;
    const queue = shuffle
      ? [...items].sort(() => Math.random() - 0.5)
      : items;
    const targetTab = items[0].mediaType === "video" ? "Video" : "Audio";
    (navigation as any).navigate(targetTab, {
      screen: "Player",
      params: {
        item: queue[0],
        queue,
        queueLabel: shuffle ? `${playlistName} (Aleatorio)` : playlistName,
      },
    });
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Nome da playlist", "Digite um nome para criar a playlist.");
      return;
    }
    await createPlaylist(trimmed, mediaType);
    setName("");
  };

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <Text style={styles.title}>Playlists</Text>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mediaType === "audio" && styles.tabActive]}
          onPress={() => setMediaType("audio")}
        >
          <AudioTabIcon focused={mediaType === "audio"} />
        </Pressable>
        <Pressable
          style={[styles.tab, mediaType === "video" && styles.tabActive]}
          onPress={() => setMediaType("video")}
        >
          <VideoTabIcon focused={mediaType === "video"} />
        </Pressable>
      </View>
      <View style={styles.inline}>
        <TextInput
          style={styles.input}
          placeholder="Nome da playlist"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleCreate}
        />
        <Pressable
          style={styles.createButton}
          onPress={handleCreate}
        >
          <View style={styles.createIconWrap}>
            <PlaylistTabIcon focused />
            <Text style={styles.createPlus}>+</Text>
          </View>
        </Pressable>
      </View>
      <FlatList
        data={playlists.filter((p) => p.mediaType === mediaType)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowCard}>
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
                style={styles.iconButton}
                onPress={() => playPlaylist(item.id, item.name, true)}
              >
                <ShuffleIcon color={theme.colors.bg} size={18} />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() => playPlaylist(item.id, item.name, false)}
              >
                <Text style={styles.iconText}>{icons.play}</Text>
              </Pressable>
              <Pressable style={styles.iconButtonDanger} onPress={() => deletePlaylist(item.id)}>
                <Text style={styles.iconText}>{icons.trash}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    textAlign: "center",
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
  tabIcon: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontFamily: theme.fonts.body,
    fontSize: 16,
  },
  tabIconActive: {
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
    fontFamily: theme.fonts.body,
  },
  createButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingHorizontal: 12,
    justifyContent: "center",
    minWidth: 56,
  },
  createIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createPlus: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  rowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  playlistName: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: theme.colors.brand,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDanger: {
    backgroundColor: theme.colors.danger,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: theme.colors.bg,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: theme.fonts.heading,
  },
  shuffleIcon: {
    fontSize: 22,
  },
  });
