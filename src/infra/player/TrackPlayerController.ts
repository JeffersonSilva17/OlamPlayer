import TrackPlayer, {
  Event,
  State,
  Capability,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import type { PlayerController, PlayerState } from "../../domain/contracts";
import type { MediaType } from "../../models/media";

let initialized = false;

export async function initTrackPlayer(): Promise<void> {
  if (initialized) return;
  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    progressUpdateEventInterval: 1,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
  });
  initialized = true;
}

export class TrackPlayerController implements PlayerController {
  private listeners = new Set<(s: PlayerState) => void>();
  private state: PlayerState = {
    isPlaying: false,
    positionMs: 0,
    durationMs: undefined,
    speed: 1,
    mediaType: "audio",
  };

  private emit() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  constructor() {
    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
      this.state.isPlaying = event.state === State.Playing;
      this.emit();
    });
    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
      const nextUri = event.track?.url;
      if (nextUri && nextUri !== this.state.currentUri) {
        this.state.currentUri = nextUri;
        this.emit();
      }
    });
    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
      this.state.positionMs = Math.floor(event.position * 1000);
      this.state.durationMs = Math.floor(event.duration * 1000);
      this.emit();
    });
  }

  async load(uri: string, mediaType: MediaType): Promise<void> {
    this.state.mediaType = mediaType;
    this.state.currentUri = uri;
    this.state.positionMs = 0;
    this.state.durationMs = undefined;
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: uri,
      url: uri,
      title: uri,
    });
    this.emit();
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async seekTo(positionMs: number): Promise<void> {
    await TrackPlayer.seekTo(positionMs / 1000);
  }

  async setSpeed(speed: number): Promise<void> {
    this.state.speed = speed;
    await TrackPlayer.setRate(speed);
    this.emit();
  }

  async getState(): Promise<PlayerState> {
    const state = await TrackPlayer.getState();
    this.state.isPlaying = state === State.Playing;
    this.state.positionMs = Math.floor((await TrackPlayer.getPosition()) * 1000);
    this.state.durationMs = Math.floor((await TrackPlayer.getDuration()) * 1000);
    return { ...this.state };
  }

  onStateChanged(listener: (s: PlayerState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }
}
