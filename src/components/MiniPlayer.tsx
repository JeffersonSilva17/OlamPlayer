import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import TrackPlayer, { Event } from "react-native-track-player";
import { usePlayerStore } from "../stores/playerStore";
import { useNavigation } from "@react-navigation/native";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import type { MediaItem } from "../models/media";
import { theme } from "../theme/theme";

type TrackInfo = {
  title?: string;
  url?: string;
};

export function MiniPlayer() {
  const navigation = useNavigation();
  const { state, play, pause, current, queueLabel } = usePlayerStore();
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [queueItems, setQueueItems] = useState<MediaItem[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const repositoryRef = React.useRef<MediaRepositorySqlite | null>(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new MediaRepositorySqlite();
  }

  const loadQueueItems = useCallback(async (): Promise<MediaItem[]> => {
    try {
      const tracks = await TrackPlayer.getQueue();
      if (!tracks || tracks.length === 0) return [];
      const items = await Promise.all(
        tracks.map(async (entry) => {
          const id = `${entry.id}`;
          return repositoryRef.current?.getMediaById(id) ?? null;
        }),
      );
      return items.filter((item): item is MediaItem => Boolean(item));
    } catch (error) {
      return [];
    }
  }, []);

  const refreshTrack = useCallback(async () => {
    try {
      const active = await TrackPlayer.getActiveTrack();
      if (active) {
        setTrack({ title: active.title, url: active.url });
      } else {
        setTrack(null);
      }
    } catch (error) {
      setTrack(null);
    }
  }, []);

  useEffect(() => {
    refreshTrack();
    const sub = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, refreshTrack);
    return () => sub.remove();
  }, [refreshTrack]);

  const onOpenQueue = async () => {
    const queueItems = await loadQueueItems();
    const active = await TrackPlayer.getActiveTrack();
    const activeId = active?.id ? `${active.id}` : undefined;
    const activeUrl = active?.url;
    const fallbackItem = current ?? queueItems[0];
    const currentItem =
      queueItems.find((entry) => entry.id === activeId) ??
      queueItems.find((entry) => entry.uri === activeUrl) ??
      fallbackItem;
    if (!currentItem) return;
    const queueToUse = queueItems.length > 0 ? queueItems : [currentItem];
    setQueueItems(queueToUse);
    setActiveId(currentItem.id);
    setShowQueue(true);
  };

  if (!track || (!track.title && !track.url)) return null;

  const onPrev = async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (error) {
      console.warn("Falha ao ir para anterior", error);
    }
  };

  const onNext = async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (error) {
      console.warn("Falha ao ir para seguinte", error);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.info} onPress={onOpenQueue}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {track.title ?? track.url ?? "Reproduzindo"}
        </Text>
      </Pressable>
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={onPrev}>
          <Text style={styles.controlText}>Prev</Text>
        </Pressable>
        <Pressable
          style={styles.controlButton}
          onPress={() => (state.isPlaying ? pause() : play())}
        >
          <Text style={styles.controlText}>{state.isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={onNext}>
          <Text style={styles.controlText}>Next</Text>
        </Pressable>
      </View>
      <Modal visible={showQueue} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {queueLabel ?? (queueItems.length > 1 ? "Fila atual" : "Reproducao atual")}
            </Text>
            <FlatList
              data={queueItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalRow}
                  onPress={async () => {
                    const index = queueItems.findIndex((entry) => entry.id === item.id);
                    if (index < 0) return;
                    try {
                      await TrackPlayer.skip(index);
                      await TrackPlayer.play();
                      setActiveId(item.id);
                    } catch (error) {
                      console.warn("Falha ao trocar faixa", error);
                    }
                  }}
                >
                  <Text
                    style={[styles.modalRowText, item.id === activeId && styles.modalRowActive]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.displayName}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.modalClose} onPress={() => setShowQueue(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 56,
    height: 64,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  info: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  controls: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  controlButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
  },
  controlText: {
    color: theme.colors.surface,
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
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  modalRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalRowText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  modalRowActive: {
    color: theme.colors.brand,
    fontWeight: "700",
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
});
