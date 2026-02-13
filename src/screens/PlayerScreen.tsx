import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import Video from "react-native-video";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "../navigation/types";
import type { MediaItem } from "../models/media";
import { usePlayerStore } from "../stores/playerStore";
import { PlayerControls } from "../components/PlayerControls";
import { reactNativeShareAdapter } from "../infra/share/ReactNativeShareAdapter";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import { incrementPlaybackStats, updateMediaDuration } from "../domain/playerUseCases";
import { playQueue } from "../infra/player/playbackQueue";
import TrackPlayer, { Event, RepeatMode } from "react-native-track-player";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import { icons } from "../theme/icons";
import { AudioVisualizer } from "../components/AudioVisualizer";
import {
  RepeatIcon,
  RepeatOneIcon,
  ShareIcon,
  ShuffleIcon,
} from "../components/ActionIcons";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

type Props = NativeStackScreenProps<LibraryStackParamList, "Player">;

const repository = new MediaRepositorySqlite();

export function PlayerScreen({ route }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { item, queue } = route.params;
  const { init, controller, state, play, pause, seekTo, setCurrent, setQueue } =
    usePlayerStore();
  const videoRef = useRef<Video>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [videoPosition, setVideoPosition] = useState(0);
  const countedAudioIdsRef = useRef<Set<string>>(new Set());
  const countedVideoIdsRef = useRef<Set<string>>(new Set());
  const updatedDurationIdsRef = useRef<Set<string>>(new Set());
  const [videoQueue, setVideoQueue] = useState<MediaItem[] | undefined>(undefined);
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoItem, setVideoItem] = useState<MediaItem>(item);
  const baseAudioQueue = queue && queue.length > 0 ? queue : [item];
  const [repeatAll, setRepeatAll] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showQueueModal, setShowQueueModal] = useState(false);

  useEffect(() => {
    setCurrent(item);
  }, [item, setCurrent]);

  useEffect(() => {
    if (item.mediaType !== "video") return;
    if (queue && queue.length > 0) {
      const startIndex = Math.max(
        0,
        queue.findIndex((entry) => entry.id === item.id),
      );
      setVideoQueue(queue);
      setVideoIndex(startIndex);
      setVideoItem(queue[startIndex]);
    } else {
      setVideoQueue(undefined);
      setVideoIndex(0);
      setVideoItem(item);
    }
  }, [item, queue]);

  useEffect(() => {
    if (item.mediaType !== "video") return;
    setVideoDuration(undefined);
    setVideoPosition(0);
    setVideoPaused(false);
  }, [item.mediaType, videoItem.id]);

  useEffect(() => {
    if (item.mediaType !== "video") return;
    setCurrent(videoItem);
  }, [item.mediaType, videoItem, setCurrent]);

  useEffect(() => {
    const label =
      route.params.queueLabel ??
      (baseAudioQueue.length > 1 ? "Fila atual" : "Reproducao atual");
    setQueue(baseAudioQueue, label);
  }, [baseAudioQueue, route.params.queueLabel, setQueue]);

  const isSameQueue = (
    playerQueue: Array<{ id?: string | number; url?: string }>,
    targetQueue: MediaItem[],
  ) => {
    if (playerQueue.length !== targetQueue.length) return false;
    for (let i = 0; i < targetQueue.length; i += 1) {
      const playerItem = playerQueue[i];
      const targetItem = targetQueue[i];
      const sameId =
        playerItem.id != null && `${playerItem.id}` === `${targetItem.id}`;
      const sameUrl = playerItem.url && playerItem.url === targetItem.uri;
      if (!sameId && !sameUrl) return false;
    }
    return true;
  };

  useEffect(() => {
    if (item.mediaType !== "audio") return;
    let cancelled = false;
    init().then(async () => {
      try {
        const currentRepeat = await TrackPlayer.getRepeatMode?.();
        if (currentRepeat === RepeatMode.Queue) {
          setRepeatAll(true);
          setRepeatOne(false);
        } else if (currentRepeat === RepeatMode.Track) {
          setRepeatOne(true);
          setRepeatAll(false);
        } else {
          setRepeatAll(false);
          setRepeatOne(false);
        }

        const active = await TrackPlayer.getActiveTrack();
        const playerQueue = await TrackPlayer.getQueue();
        const sameQueue = isSameQueue(playerQueue ?? [], baseAudioQueue);
        if (active && sameQueue) {
          return;
        }

        if (baseAudioQueue && baseAudioQueue.length > 0) {
          await playQueue(
            baseAudioQueue,
            route.params.queueLabel ?? (baseAudioQueue.length > 1 ? "Fila atual" : "Reproducao"),
          );
        } else {
          await controller?.load(item.uri, item.mediaType);
          await play();
        }
      } catch (error) {
        if (cancelled) return;
        await repository.markUnavailable(item.id);
        Alert.alert("Erro", "Nao foi possivel tocar este arquivo. Marquei como indisponivel.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item, queue, init, controller, play, baseAudioQueue]);

  useEffect(() => {
    if (item.mediaType !== "audio") return;
    TrackPlayer.getVolume?.()
      .then((value) => {
        if (typeof value === "number") setVolume(value);
      })
      .catch(() => {});
  }, [item.mediaType]);

  useEffect(() => {
    if (item.mediaType !== "audio") return () => {};
    const subscription = TrackPlayer.addEventListener(Event.PlaybackError, async () => {
      const currentUri = state.currentUri ?? item.uri;
      const currentItem =
        baseAudioQueue.find((entry) => entry.uri === currentUri) ??
        item;
      await repository.markUnavailable(currentItem.id);
      Alert.alert("Erro", "Nao foi possivel tocar este arquivo. Marquei como indisponivel.");
    });
    return () => {
      subscription.remove();
    };
  }, [item, queue, state.currentUri, baseAudioQueue]);

  useEffect(() => {
    if (item.mediaType !== "audio") return;
    const currentUri = state.currentUri ?? item.uri;
    const currentItem =
      baseAudioQueue.find((entry) => entry.uri === currentUri) ??
      item;
    if (currentItem.id !== item.id) {
      setCurrent(currentItem);
    }
    if (countedAudioIdsRef.current.has(currentItem.id)) return;
    countedAudioIdsRef.current.add(currentItem.id);
    incrementPlaybackStats(repository, currentItem.id).catch(() => {});
  }, [item, queue, state.currentUri, setCurrent, baseAudioQueue]);

  useEffect(() => {
    if (item.mediaType !== "audio") return;
    const durationMs = state.durationMs;
    if (!durationMs || durationMs <= 0) return;
    const currentUri = state.currentUri ?? item.uri;
    const currentItem =
      baseAudioQueue.find((entry) => entry.uri === currentUri) ??
      item;
    if (!currentItem) return;
    if (updatedDurationIdsRef.current.has(currentItem.id)) return;
    updateMediaDuration(repository, currentItem.id, durationMs).then(() => {
      updatedDurationIdsRef.current.add(currentItem.id);
    });
  }, [item, state.durationMs, state.currentUri, baseAudioQueue]);

  const currentAudioUri = state.currentUri ?? item.uri;
  const currentAudioItem =
    baseAudioQueue.find((entry) => entry.uri === currentAudioUri) ??
    item;
  const currentAudioIndex = baseAudioQueue.findIndex(
    (entry) => entry.uri === currentAudioUri,
  );
  const canPrevAudio = isShuffle || repeatAll || currentAudioIndex > 0;
  const canNextAudio =
    isShuffle ||
    repeatAll ||
    (currentAudioIndex >= 0 && currentAudioIndex < baseAudioQueue.length - 1);

  const onPrevAudio = async () => {
    if (!canPrevAudio) return;
    try {
      if (repeatOne) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }
      if (isShuffle) {
        if (baseAudioQueue.length === 0) return;
        const nextIndex =
          baseAudioQueue.length === 1
            ? 0
            : Math.floor(Math.random() * baseAudioQueue.length);
        await TrackPlayer.skip(nextIndex);
      } else if (repeatAll && currentAudioIndex <= 0 && baseAudioQueue.length > 0) {
        await TrackPlayer.skip(baseAudioQueue.length - 1);
      } else {
        await TrackPlayer.skipToPrevious();
      }
      await TrackPlayer.play();
    } catch (error) {
      console.warn("Falha ao ir para anterior", error);
    }
  };

  const onNextAudio = async () => {
    if (!canNextAudio) return;
    try {
      if (repeatOne) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }
      if (isShuffle) {
        if (baseAudioQueue.length === 0) return;
        let nextIndex = 0;
        if (baseAudioQueue.length === 1) {
          nextIndex = 0;
        } else {
          do {
            nextIndex = Math.floor(Math.random() * baseAudioQueue.length);
          } while (baseAudioQueue[nextIndex].uri === currentAudioUri);
        }
        await TrackPlayer.skip(nextIndex);
      } else if (
        repeatAll &&
        currentAudioIndex >= baseAudioQueue.length - 1 &&
        baseAudioQueue.length > 0
      ) {
        await TrackPlayer.skip(0);
      } else {
        await TrackPlayer.skipToNext();
      }
      await TrackPlayer.play();
    } catch (error) {
      console.warn("Falha ao ir para seguinte", error);
    }
  };

  const onShare = async () => {
    try {
      await reactNativeShareAdapter.shareFile({
        uri: item.mediaType === "video" ? videoItem.uri : currentAudioItem.uri,
        mimeType: item.mediaType === "video" ? videoItem.mimeType : currentAudioItem.mimeType,
        title: item.mediaType === "video" ? videoItem.displayName : currentAudioItem.displayName,
      });
    } catch (error) {
      console.warn("Falha ao compartilhar", error);
    }
  };

  const onVolumeChange = async (value: number) => {
    setVolume(value);
    if (item.mediaType === "audio") {
      try {
        await TrackPlayer.setVolume(value);
      } catch (error) {
        console.warn("Falha ao ajustar volume", error);
      }
    }
  };

  const onToggleShuffle = async () => {
    if (baseAudioQueue.length <= 1) return;
    const next = !isShuffle;
    setIsShuffle(next);
    if (next && repeatOne) {
      setRepeatOne(false);
      await TrackPlayer.setRepeatMode(repeatAll ? RepeatMode.Queue : RepeatMode.Off);
    }
  };

  const onToggleRepeatCycle = async () => {
    if (!repeatOne && !repeatAll) {
      setRepeatOne(true);
      setRepeatAll(false);
      setIsShuffle(false);
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      return;
    }
    if (repeatOne) {
      setRepeatOne(false);
      setRepeatAll(true);
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      return;
    }
    setRepeatAll(false);
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  };

  const onOpenQueue = () => {
    if (baseAudioQueue.length === 0) return;
    setShowQueueModal(true);
  };

  const onPlayPauseAudio = async () => {
    if (state.isPlaying) {
      await pause();
      return;
    }
    const duration = state.durationMs ?? 0;
    const position = state.positionMs ?? 0;
    if (duration > 0 && position >= duration - 1000) {
      await seekTo(0);
    }
    await play();
  };

  const onPlayPauseVideo = () => {
    setVideoPaused((prev) => !prev);
  };

  if (item.mediaType === "video") {
    return (
      <View style={styles.container}>
        <ScreenBackdrop />
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {videoItem.displayName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {videoItem.mimeType ?? "formato desconhecido"} -{" "}
            {videoItem.sizeBytes
              ? `${Math.round(videoItem.sizeBytes / 1024 / 1024)} MB`
              : "tamanho n/d"}
          </Text>
        </View>
        <Video
          key={videoItem.id}
          ref={videoRef}
          source={{ uri: videoItem.uri }}
          style={styles.video}
          resizeMode="contain"
          paused={videoPaused}
          volume={volume}
          controls
          onLoad={(data) => {
            setVideoDuration(data.duration * 1000);
            if (!countedVideoIdsRef.current.has(videoItem.id)) {
              countedVideoIdsRef.current.add(videoItem.id);
              incrementPlaybackStats(repository, videoItem.id).catch(() => {});
            }
          }}
          onProgress={(data) => setVideoPosition(data.currentTime * 1000)}
          onEnd={() => {
            if (videoQueue && videoIndex < videoQueue.length - 1) {
              const nextIndex = videoIndex + 1;
              setVideoIndex(nextIndex);
              setVideoItem(videoQueue[nextIndex]);
              return;
            }
            setVideoPaused(true);
          }}
          onError={async () => {
            await repository.markUnavailable(videoItem.id);
            Alert.alert("Erro", "Nao foi possivel tocar este arquivo. Marquei como indisponivel.");
          }}
        />
        <PlayerControls
          isPlaying={!videoPaused}
          positionMs={videoPosition}
          durationMs={videoDuration}
          onPlayPause={onPlayPauseVideo}
          onSeek={(pos) => {
            videoRef.current?.seek(pos / 1000);
            setVideoPosition(pos);
          }}
        />
        <View style={styles.modeRow}>
          <Pressable style={styles.modeButton} onPress={onShare}>
            <ShareIcon color={theme.colors.bg} size={18} />
          </Pressable>
          <Pressable
            style={[styles.modeButton, showVolume && styles.modeButtonActive]}
            onPress={() => setShowVolume((prev) => !prev)}
          >
            <Text style={[styles.modeText, showVolume && styles.modeTextActive]}>
              {icons.volume}
            </Text>
          </Pressable>
        </View>
        {showVolume ? (
          <View style={styles.volumeRow}>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={onVolumeChange}
              minimumTrackTintColor={theme.colors.brand}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.accent}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <View style={styles.audioTopSpacer} />
      <AudioVisualizer active={state.isPlaying} />
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {currentAudioItem.displayName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
          {currentAudioItem.mimeType ?? "formato desconhecido"} -{" "}
          {currentAudioItem.sizeBytes
            ? `${Math.round(currentAudioItem.sizeBytes / 1024 / 1024)} MB`
            : "tamanho n/d"}
        </Text>
      </View>
      <PlayerControls
        isPlaying={state.isPlaying}
        positionMs={state.positionMs}
        durationMs={state.durationMs}
        onPlayPause={onPlayPauseAudio}
        onSeek={seekTo}
        onPrev={onPrevAudio}
        onNext={onNextAudio}
        canPrev={canPrevAudio}
        canNext={canNextAudio}
        showControls={false}
      />
      <View style={styles.audioBottomSpacer} />
      <View style={styles.audioControlsRow}>
        <Pressable
          style={[styles.audioControlButton, isShuffle && styles.audioControlActive]}
          onPress={onToggleShuffle}
        >
          <ShuffleIcon
            color={isShuffle ? theme.colors.surface : theme.colors.bg}
            size={32}
          />
        </Pressable>
        <Pressable
          style={[
            styles.audioControlButton,
            !canPrevAudio && styles.audioControlDisabled,
          ]}
          onPress={onPrevAudio}
          disabled={!canPrevAudio}
        >
          <Text style={styles.audioControlText}>{icons.prev}</Text>
        </Pressable>
        <Pressable style={styles.audioControlButton} onPress={onPlayPauseAudio}>
          <Text style={styles.audioControlText}>
            {state.isPlaying ? icons.pause : icons.play}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.audioControlButton,
            !canNextAudio && styles.audioControlDisabled,
          ]}
          onPress={onNextAudio}
          disabled={!canNextAudio}
        >
          <Text style={styles.audioControlText}>{icons.next}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.audioControlButton,
            (repeatAll || repeatOne) && styles.audioControlActive,
          ]}
          onPress={onToggleRepeatCycle}
        >
          {repeatOne ? (
            <RepeatOneIcon
              color={(repeatAll || repeatOne) ? theme.colors.surface : theme.colors.bg}
              size={38}
            />
          ) : (
            <RepeatIcon
              color={(repeatAll || repeatOne) ? theme.colors.surface : theme.colors.bg}
              size={38}
            />
          )}
        </Pressable>
      </View>
      {showVolume ? (
        <View style={styles.volumeRow}>
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={onVolumeChange}
            minimumTrackTintColor={theme.colors.brand}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.accent}
          />
        </View>
      ) : null}
      <View style={styles.fillSpacer} />
      <View style={styles.queuePeekRow}>
        <Pressable style={styles.queueSideButton} onPress={onShare}>
          <ShareIcon color={theme.colors.bg} size={18} />
        </Pressable>
        <Pressable style={styles.queuePeek} onPress={onOpenQueue}>
          <View style={styles.queuePeekHandle} />
          <Text style={styles.queuePeekText}>
            {route.params.queueLabel ??
              (baseAudioQueue.length > 1 ? "Fila atual" : "Reproducao atual")}
            {" \u00B7 "}
            {baseAudioQueue.length}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.queueSideButton, showVolume && styles.queueSideActive]}
          onPress={() => setShowVolume((prev) => !prev)}
        >
          <Text style={[styles.modeText, showVolume && styles.modeTextActive]}>
            {icons.volume}
          </Text>
        </Pressable>
      </View>
      <Modal visible={showQueueModal} transparent animationType="slide">
        <Pressable style={styles.queueBackdrop} onPress={() => setShowQueueModal(false)}>
          <Pressable style={styles.queueSheet} onPress={() => {}}>
            <View style={styles.queueHeader}>
              <View style={styles.queueHandle} />
              <Text style={styles.queueTitle}>
                {route.params.queueLabel ??
                  (baseAudioQueue.length > 1 ? "Fila atual" : "Reproducao atual")}
              </Text>
            </View>
            <FlatList
              data={baseAudioQueue}
              keyExtractor={(entry) => entry.id}
              contentContainerStyle={styles.queueList}
              renderItem={({ item: entry, index }) => {
                const isActive = entry.uri === currentAudioUri;
                return (
                  <Pressable
                    style={[styles.queueRowCard, isActive && styles.queueRowActive]}
                    onPress={async () => {
                      try {
                        await TrackPlayer.skip(index);
                        await TrackPlayer.play();
                        setShowQueueModal(false);
                      } catch (error) {
                        console.warn("Falha ao trocar faixa", error);
                      }
                    }}
                  >
                    <Text style={[styles.queueText, isActive && styles.queueTextActive]}>
                      {entry.displayName}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <Pressable
              style={styles.queueClose}
              onPress={() => setShowQueueModal(false)}
            >
              <Text style={styles.queueCloseText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 0,
    backgroundColor: theme.colors.bg,
  },
  audioTopSpacer: {
    height: theme.spacing.lg,
  },
  header: {
    minHeight: 56,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
  },
  video: {
    width: "100%",
    height: 220,
    backgroundColor: "#000000",
  },
  button: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.bg,
    fontWeight: "800",
    fontFamily: theme.fonts.body,
    fontSize: 18,
  },
  shareIcon: {
    fontSize: 20,
  },
  modeRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audioControlsRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  audioBottomSpacer: {
    flex: 1,
    maxHeight: 120,
  },
  audioControlButton: {
    backgroundColor: theme.colors.brand,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  audioControlActive: {
    backgroundColor: theme.colors.accent,
  },
  audioControlDisabled: {
    backgroundColor: "#9FB0C4",
  },
  audioControlText: {
    color: theme.colors.bg,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: theme.fonts.heading,
    letterSpacing: 0.4,
  },
  audioControlTextActive: {
    color: theme.colors.surface,
  },
  modeButton: {
    backgroundColor: theme.colors.brand,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  modeText: {
    color: theme.colors.bg,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: theme.fonts.body,
  },
  shuffleIcon: {
    fontSize: 22,
  },
  repeatIcon: {
    fontSize: 22,
    letterSpacing: 0.6,
  },
  modeTextActive: {
    color: theme.colors.surface,
  },
  queueSection: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    flex: 1,
  },
  queueTitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fonts.body,
  },
  queueRow: {
    paddingVertical: 6,
  },
  queueText: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  queueTextActive: {
    fontWeight: "700",
    color: theme.colors.brand,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: theme.colors.brand,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
  },
  volumeRow: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  volumeSlider: {
    width: "100%",
    height: 32,
  },
  fillSpacer: {
    height: 0,
  },
  queuePeekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  queueSideButton: {
    backgroundColor: theme.colors.brand,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  queueSideActive: {
    backgroundColor: theme.colors.accent,
  },
  queuePeek: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  queuePeekHandle: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: 4,
  },
  queuePeekText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  queueBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  queueSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.md,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  queueHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  queueHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  queueList: {
    paddingBottom: theme.spacing.lg,
  },
  queueRowCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  queueRowActive: {
    borderColor: theme.colors.brand,
  },
  queueText: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  queueTextActive: {
    fontWeight: "700",
    color: theme.colors.brand,
  },
  queueClose: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    alignItems: "center",
    paddingVertical: 10,
  },
  queueCloseText: {
    color: theme.colors.bg,
    fontWeight: "800",
    fontFamily: theme.fonts.body,
  },
  });


