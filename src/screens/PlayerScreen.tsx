import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, FlatList } from "react-native";
import Video from "react-native-video";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "../navigation/types";
import type { MediaItem } from "../models/media";
import { usePlayerStore } from "../stores/playerStore";
import { PlayerControls } from "../components/PlayerControls";
import { reactNativeShareAdapter } from "../infra/share/ReactNativeShareAdapter";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import { incrementPlaybackStats } from "../domain/playerUseCases";
import { playQueue } from "../infra/player/playbackQueue";
import TrackPlayer, { Event, RepeatMode } from "react-native-track-player";
import { theme } from "../theme/theme";

type Props = NativeStackScreenProps<LibraryStackParamList, "Player">;

const repository = new MediaRepositorySqlite();

export function PlayerScreen({ route }: Props) {
  const { item, queue } = route.params;
  const { init, controller, state, play, pause, seekTo, setCurrent, setQueue } =
    usePlayerStore();
  const videoRef = useRef<Video>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [videoPosition, setVideoPosition] = useState(0);
  const countedAudioIdsRef = useRef<Set<string>>(new Set());
  const countedVideoIdsRef = useRef<Set<string>>(new Set());
  const [videoQueue, setVideoQueue] = useState<MediaItem[] | undefined>(undefined);
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoItem, setVideoItem] = useState<MediaItem>(item);
  const baseAudioQueue = queue && queue.length > 0 ? queue : [item];
  const [repeatAll, setRepeatAll] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

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

  useEffect(() => {
    if (item.mediaType !== "audio") return;
    init().then(async () => {
      try {
        if (baseAudioQueue && baseAudioQueue.length > 0) {
          await playQueue(baseAudioQueue);
        } else {
          await controller?.load(item.uri, item.mediaType);
          await play();
        }
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
      } catch (error) {
        await repository.markUnavailable(item.id);
        Alert.alert("Erro", "Nao foi possivel tocar este arquivo. Marquei como indisponivel.");
      }
    });
    return () => {};
  }, [item, queue, init, controller, play, baseAudioQueue]);

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

  const onPlayPauseVideo = () => {
    setVideoPaused((prev) => !prev);
  };

  const onFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer?.();
    videoRef.current?.setFullScreen?.(true);
  };

  if (item.mediaType === "video") {
    return (
      <View style={styles.container}>
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
        <Pressable style={styles.secondaryButton} onPress={onFullscreen}>
          <Text style={styles.secondaryButtonText}>Tela cheia</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onShare}>
          <Text style={styles.buttonText}>Compartilhar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        onPlayPause={() => (state.isPlaying ? pause() : play())}
        onSeek={seekTo}
        onPrev={onPrevAudio}
        onNext={onNextAudio}
        canPrev={canPrevAudio}
        canNext={canNextAudio}
      />
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeButton, isShuffle && styles.modeButtonActive]}
          onPress={onToggleShuffle}
        >
          <Text style={[styles.modeText, isShuffle && styles.modeTextActive]}>
            Shuffle
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            (repeatAll || repeatOne) && styles.modeButtonActive,
          ]}
          onPress={onToggleRepeatCycle}
        >
          <Text
            style={[
              styles.modeText,
              (repeatAll || repeatOne) && styles.modeTextActive,
            ]}
          >
            {repeatOne ? "Repeat 1" : repeatAll ? "Repeat All" : "Repeat"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.queueSection}>
        <Text style={styles.queueTitle}>
          {route.params.queueLabel ??
            (baseAudioQueue.length > 1 ? "Fila atual" : "Reproducao atual")}
        </Text>
        <FlatList
          data={baseAudioQueue}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item: entry }) => {
            const isActive = entry.uri === currentAudioUri;
            return (
              <View style={styles.queueRow}>
                <Text style={[styles.queueText, isActive && styles.queueTextActive]}>
                  {entry.displayName}
                </Text>
              </View>
            );
          }}
        />
      </View>
      <Pressable style={styles.button} onPress={onShare}>
        <Text style={styles.buttonText}>Compartilhar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
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
    color: theme.colors.surface,
    fontWeight: "600",
  },
  modeRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: theme.colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    minWidth: 44,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.brand,
  },
  modeText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "600",
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
  },
  queueRow: {
    paddingVertical: 6,
  },
  queueText: {
    fontSize: 13,
    color: theme.colors.text,
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
  },
});


